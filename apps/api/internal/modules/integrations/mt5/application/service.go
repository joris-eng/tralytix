package application

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/joris-eng/tralytix/apps/api/internal/modules/integrations/mt5/domain"
	"github.com/joris-eng/tralytix/apps/api/internal/modules/integrations/mt5/ports"
)

var (
	ErrInvalidCSV      = errors.New("invalid csv")
	ErrTooManyRows     = errors.New("too many rows in import")
	ErrInvalidAccount  = errors.New("invalid account id")
	ErrImportNoTrades  = errors.New("no trade rows found")
	ErrInvalidEAToken  = errors.New("invalid ea token")
)

// LiveSyncEvent is the payload sent by the MT5 Expert Advisor on each deal.
type LiveSyncEvent struct {
	Event      string  `json:"event"`       // "trade_opened" | "trade_closed" | "trade_modified"
	Ticket     string  `json:"ticket"`
	PositionID string  `json:"position_id"`
	Symbol     string  `json:"symbol"`
	Side       string  `json:"side"`        // "BUY" | "SELL"
	Volume     float64 `json:"volume"`
	OpenPrice  float64 `json:"open_price"`
	ClosePrice float64 `json:"close_price"` // 0 if not closed yet
	OpenedAt   string  `json:"opened_at"`   // RFC3339
	ClosedAt   string  `json:"closed_at"`   // RFC3339, empty if still open
	Profit     float64 `json:"profit"`
	Commission float64 `json:"commission"`
	Swap       float64 `json:"swap"`
	Comment    string  `json:"comment"`
}

type ImportResult struct {
	AccountID            string     `json:"account_id"`
	TotalRows            int        `json:"total_rows"`
	ValidRows            int        `json:"valid_rows"`
	InsertedRows         int        `json:"inserted_rows"`
	SkippedInvalidRows   int        `json:"skipped_invalid_rows"`
	SkippedDuplicateRows int        `json:"skipped_duplicate_rows"`
	ImportedAt           time.Time  `json:"imported_at"`
	LastError            *string    `json:"last_error,omitempty"`
}

type TradesResponse struct {
	Trades []domain.Trade `json:"trades"`
	Total  int            `json:"total"`
}

type Service struct {
	repo    ports.TradeRepository
	importer ports.Importer
	clock   ports.Clock
	maxRows int
}

func NewService(repo ports.TradeRepository, importer ports.Importer, clock ports.Clock, maxRows int) *Service {
	return &Service{
		repo:     repo,
		importer: importer,
		clock:    clock,
		maxRows:  maxRows,
	}
}

func (s *Service) ImportCSV(ctx context.Context, accountID string, rawCSV []byte) (ImportResult, error) {
	accountID = strings.TrimSpace(accountID)
	if accountID == "" {
		return ImportResult{}, ErrInvalidAccount
	}
	if len(rawCSV) == 0 {
		return ImportResult{}, ErrInvalidCSV
	}

	parsed, err := s.importer.ImportCSV(ctx, rawCSV)
	if err != nil {
		return ImportResult{}, fmt.Errorf("import csv: %w", err)
	}
	if len(parsed) == 0 {
		return ImportResult{}, ErrImportNoTrades
	}
	if s.maxRows > 0 && len(parsed) > s.maxRows {
		return ImportResult{}, ErrTooManyRows
	}

	importedAt := s.clock.Now().UTC()
	seen := make(map[string]struct{}, len(parsed))
	toSave := make([]domain.Trade, 0, len(parsed))
	result := ImportResult{
		AccountID:  accountID,
		TotalRows:  len(parsed),
		ImportedAt: importedAt,
	}

	for _, trade := range parsed {
		norm := normalizeTrade(trade, accountID, importedAt)
		norm.SourceHash = computeSourceHash(norm)

		if err := norm.Validate(); err != nil {
			result.SkippedInvalidRows++
			continue
		}
		if _, exists := seen[norm.SourceHash]; exists {
			result.SkippedDuplicateRows++
			continue
		}
		seen[norm.SourceHash] = struct{}{}
		toSave = append(toSave, norm)
	}

	if len(toSave) == 0 {
		return result, nil
	}

	inserted, err := s.repo.SaveImportedTrades(ctx, toSave)
	if err != nil {
		return ImportResult{}, fmt.Errorf("save imported trades: %w", err)
	}

	result.ValidRows = len(toSave)
	result.InsertedRows = inserted
	result.SkippedDuplicateRows += len(toSave) - inserted
	return result, nil
}

func (s *Service) Status(ctx context.Context, accountID string) (domain.AccountSnapshot, error) {
	accountID = strings.TrimSpace(accountID)
	if accountID == "" {
		return domain.AccountSnapshot{}, ErrInvalidAccount
	}
	snapshot, err := s.repo.GetAccountSnapshot(ctx, accountID)
	if err != nil {
		return domain.AccountSnapshot{}, fmt.Errorf("get account snapshot: %w", err)
	}
	if snapshot.LastImportStatus == "" {
		if snapshot.TotalTrades == 0 {
			snapshot.LastImportStatus = "idle"
		} else {
			snapshot.LastImportStatus = "ok"
		}
	}
	return snapshot, nil
}

func (s *Service) ListTrades(ctx context.Context, accountID string, limit, offset int) (TradesResponse, error) {
	accountID = strings.TrimSpace(accountID)
	if accountID == "" {
		return TradesResponse{}, ErrInvalidAccount
	}
	if limit <= 0 {
		limit = 50
	}
	if limit > 200 {
		limit = 200
	}
	if offset < 0 {
		offset = 0
	}

	trades, err := s.repo.ListTrades(ctx, accountID, limit, offset)
	if err != nil {
		return TradesResponse{}, fmt.Errorf("list trades: %w", err)
	}
	return TradesResponse{
		Trades: trades,
		Total:  len(trades),
	}, nil
}

// GetOrCreateEAToken returns the user's EA token, creating one if needed.
func (s *Service) GetOrCreateEAToken(ctx context.Context, userID string) (string, error) {
	userID = strings.TrimSpace(userID)
	if userID == "" {
		return "", ErrInvalidAccount
	}
	return s.repo.GetOrCreateEAToken(ctx, userID)
}

// LiveSync authenticates an EA push by token and upserts the trade.
func (s *Service) LiveSync(ctx context.Context, eaToken string, ev LiveSyncEvent) error {
	eaToken = strings.TrimSpace(eaToken)
	if eaToken == "" {
		return ErrInvalidEAToken
	}

	userID, err := s.repo.GetUserByEAToken(ctx, eaToken)
	if err != nil {
		return ErrInvalidEAToken
	}

	openedAt, err := time.Parse(time.RFC3339, ev.OpenedAt)
	if err != nil {
		return fmt.Errorf("parse opened_at: %w", err)
	}

	var closedAt *time.Time
	var closePrice *float64
	if ev.ClosedAt != "" {
		t, err := time.Parse(time.RFC3339, ev.ClosedAt)
		if err == nil {
			closedAt = &t
		}
	}
	if ev.ClosePrice > 0 {
		closePrice = &ev.ClosePrice
	}

	side := strings.ToUpper(ev.Side)
	switch side {
	case "BUY":
		side = "LONG"
	case "SELL":
		side = "SHORT"
	}

	var comment *string
	if c := strings.TrimSpace(ev.Comment); c != "" {
		comment = &c
	}

	importedAt := s.clock.Now().UTC()
	trade := domain.Trade{
		AccountID:  userID,
		Ticket:     strings.TrimSpace(ev.Ticket),
		Symbol:     strings.ToUpper(strings.TrimSpace(ev.Symbol)),
		Side:       side,
		Volume:     ev.Volume,
		OpenPrice:  ev.OpenPrice,
		ClosePrice: closePrice,
		OpenedAt:   openedAt.UTC(),
		ClosedAt:   closedAt,
		Commission: ev.Commission,
		Swap:       ev.Swap,
		Profit:     ev.Profit,
		Comment:    comment,
		ImportedAt: importedAt,
	}
	trade.SourceHash = computeSourceHash(trade)

	if err := trade.Validate(); err != nil {
		return fmt.Errorf("invalid trade: %w", err)
	}

	_, err = s.repo.SaveImportedTrades(ctx, []domain.Trade{trade})
	return err
}

func normalizeTrade(t domain.Trade, accountID string, importedAt time.Time) domain.Trade {
	t.AccountID = accountID
	t.Ticket = strings.TrimSpace(t.Ticket)
	t.Symbol = strings.ToUpper(strings.TrimSpace(t.Symbol))
	side := strings.ToUpper(strings.TrimSpace(t.Side))
	switch side {
	case "BUY":
		t.Side = "LONG"
	case "SELL":
		t.Side = "SHORT"
	default:
		t.Side = side
	}
	t.ImportedAt = importedAt
	if t.Comment != nil {
		c := strings.TrimSpace(*t.Comment)
		if c == "" {
			t.Comment = nil
		} else {
			t.Comment = &c
		}
	}
	return t
}

func computeSourceHash(t domain.Trade) string {
	payload := fmt.Sprintf(
		"%s|%s|%s|%s|%.8f|%.8f|%s",
		t.AccountID,
		t.Ticket,
		t.Symbol,
		t.Side,
		t.Volume,
		t.OpenPrice,
		t.OpenedAt.UTC().Format(time.RFC3339Nano),
	)
	sum := sha256.Sum256([]byte(payload))
	return hex.EncodeToString(sum[:])
}

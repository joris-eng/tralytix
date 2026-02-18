package application

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/yourname/trading-saas/apps/api/internal/modules/integrations/mt5/domain"
	"github.com/yourname/trading-saas/apps/api/internal/modules/integrations/mt5/ports"
)

var (
	ErrInvalidCSV      = errors.New("invalid csv")
	ErrTooManyRows     = errors.New("too many rows in import")
	ErrInvalidAccount  = errors.New("invalid account id")
	ErrImportNoTrades  = errors.New("no trade rows found")
)

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

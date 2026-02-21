package usecase

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/joris-eng/tralytix/apps/api/internal/modules/trading/domain"
	platformtime "github.com/joris-eng/tralytix/apps/api/internal/platform/time"
)

var (
	ErrInvalidSide       = errors.New("invalid side")
	ErrInvalidQty        = errors.New("invalid qty")
	ErrInvalidEntryPrice = errors.New("invalid entry price")
	ErrInvalidInstrument = errors.New("invalid instrument_id")
)

type TradeRepository interface {
	Create(ctx context.Context, trade domain.Trade) (domain.Trade, error)
	ListByUser(ctx context.Context, userID string, limit, offset int32) ([]domain.Trade, error)
}

type UseCase struct {
	repo  TradeRepository
	clock platformtime.Clock
}

func NewUseCase(repo TradeRepository, clock platformtime.Clock) *UseCase {
	return &UseCase{
		repo:  repo,
		clock: clock,
	}
}

type CreateTradeInput struct {
	UserID       string
	InstrumentID string
	Side         string
	Qty          float64
	EntryPrice   float64
	Fees         float64
	Notes        *string
}

func (uc *UseCase) CreateTrade(ctx context.Context, in CreateTradeInput) (domain.Trade, error) {
	side := strings.ToUpper(strings.TrimSpace(in.Side))
	if side != "LONG" && side != "SHORT" {
		return domain.Trade{}, ErrInvalidSide
	}
	if in.Qty <= 0 {
		return domain.Trade{}, ErrInvalidQty
	}
	if in.EntryPrice <= 0 {
		return domain.Trade{}, ErrInvalidEntryPrice
	}
	if strings.TrimSpace(in.InstrumentID) == "" {
		return domain.Trade{}, ErrInvalidInstrument
	}

	trade := domain.Trade{
		UserID:       in.UserID,
		InstrumentID: strings.TrimSpace(in.InstrumentID),
		Side:         side,
		Qty:          in.Qty,
		EntryPrice:   in.EntryPrice,
		OpenedAt:     uc.clock.Now().UTC(),
		Fees:         in.Fees,
		Notes:        in.Notes,
	}

	created, err := uc.repo.Create(ctx, trade)
	if err != nil {
		return domain.Trade{}, fmt.Errorf("create trade: %w", err)
	}
	return created, nil
}

func (uc *UseCase) ListTradesByUser(ctx context.Context, userID string, limit, offset int32) ([]domain.Trade, error) {
	if limit <= 0 || limit > 200 {
		limit = 50
	}
	if offset < 0 {
		offset = 0
	}

	out, err := uc.repo.ListByUser(ctx, userID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("list trades by user: %w", err)
	}
	return out, nil
}

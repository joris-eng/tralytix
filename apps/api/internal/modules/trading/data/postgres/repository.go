package postgres

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/yourname/trading-saas/apps/api/internal/modules/trading/domain"
	"github.com/yourname/trading-saas/apps/api/internal/platform/db"
)

type Repository struct {
	q *db.Queries
}

func NewRepository(q *db.Queries) *Repository {
	return &Repository{q: q}
}

func (r *Repository) Create(ctx context.Context, trade domain.Trade) (domain.Trade, error) {
	fees := trade.Fees
	row, err := r.q.CreateTrade(ctx, db.CreateTradeParams{
		ID:           uuid.NewString(),
		UserID:       trade.UserID,
		InstrumentID: trade.InstrumentID,
		Side:         trade.Side,
		Qty:          trade.Qty,
		EntryPrice:   trade.EntryPrice,
		ExitPrice:    trade.ExitPrice,
		OpenedAt:     trade.OpenedAt,
		ClosedAt:     trade.ClosedAt,
		Fees:         &fees,
		Notes:        trade.Notes,
	})
	if err != nil {
		return domain.Trade{}, fmt.Errorf("insert trade: %w", err)
	}
	return mapTrade(row), nil
}

func (r *Repository) ListByUser(ctx context.Context, userID string, limit, offset int32) ([]domain.Trade, error) {
	rows, err := r.q.ListTradesByUser(ctx, db.ListTradesByUserParams{
		UserID: userID,
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		return nil, fmt.Errorf("query trades by user: %w", err)
	}
	out := make([]domain.Trade, 0, len(rows))
	for _, t := range rows {
		out = append(out, mapTrade(t))
	}
	return out, nil
}

func mapTrade(row db.Trade) domain.Trade {
	return domain.Trade{
		ID:           row.ID,
		UserID:       row.UserID,
		InstrumentID: row.InstrumentID,
		Side:         row.Side,
		Qty:          row.Qty,
		EntryPrice:   row.EntryPrice,
		ExitPrice:    row.ExitPrice,
		OpenedAt:     row.OpenedAt,
		ClosedAt:     row.ClosedAt,
		Fees:         row.Fees,
		Notes:        row.Notes,
	}
}

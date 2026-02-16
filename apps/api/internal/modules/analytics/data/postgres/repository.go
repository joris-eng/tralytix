package postgres

import (
	"context"
	"fmt"

	tradingdomain "github.com/yourname/trading-saas/apps/api/internal/modules/trading/domain"
	"github.com/yourname/trading-saas/apps/api/internal/platform/db"
)

type Repository struct {
	q *db.Queries
}

func NewRepository(q *db.Queries) *Repository {
	return &Repository{q: q}
}

func (r *Repository) ListByUser(ctx context.Context, userID string, limit, offset int32) ([]tradingdomain.Trade, error) {
	rows, err := r.q.ListTradesByUser(ctx, db.ListTradesByUserParams{
		UserID: userID,
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		return nil, fmt.Errorf("query trades by user: %w", err)
	}

	out := make([]tradingdomain.Trade, 0, len(rows))
	for _, t := range rows {
		out = append(out, tradingdomain.Trade{
			ID:           t.ID,
			UserID:       t.UserID,
			InstrumentID: t.InstrumentID,
			Side:         t.Side,
			Qty:          t.Qty,
			EntryPrice:   t.EntryPrice,
			ExitPrice:    t.ExitPrice,
			OpenedAt:     t.OpenedAt,
			ClosedAt:     t.ClosedAt,
			Fees:         t.Fees,
			Notes:        t.Notes,
		})
	}

	return out, nil
}

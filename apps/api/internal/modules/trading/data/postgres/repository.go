package postgres

import (
	"context"
	"fmt"
	"math/big"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
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
	userID, err := uuid.Parse(trade.UserID)
	if err != nil {
		return domain.Trade{}, fmt.Errorf("parse user id: %w", err)
	}
	instrumentID, err := uuid.Parse(trade.InstrumentID)
	if err != nil {
		return domain.Trade{}, fmt.Errorf("parse instrument id: %w", err)
	}

	params := db.CreateTradeParams{
		ID:           uuid.New(),
		UserID:       userID,
		InstrumentID: instrumentID,
		Side:         trade.Side,
		Qty:          float64ToNumeric(trade.Qty),
		EntryPrice:   float64ToNumeric(trade.EntryPrice),
		ExitPrice:    float64PtrToNumeric(trade.ExitPrice),
		OpenedAt:     trade.OpenedAt,
		ClosedAt:     timePtrToTimestamptz(trade.ClosedAt),
		Column10:     trade.Fees,
		Notes:        stringPtrToText(trade.Notes),
	}

	row, err := r.q.CreateTrade(ctx, params)
	if err != nil {
		return domain.Trade{}, fmt.Errorf("insert trade: %w", err)
	}

	return mapTrade(row), nil
}

func (r *Repository) ListByUser(ctx context.Context, userID string, limit, offset int32) ([]domain.Trade, error) {
	uid, err := uuid.Parse(userID)
	if err != nil {
		return nil, fmt.Errorf("parse user id: %w", err)
	}

	rows, err := r.q.ListTradesByUser(ctx, db.ListTradesByUserParams{
		UserID: uid,
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
		ID:           row.ID.String(),
		UserID:       row.UserID.String(),
		InstrumentID: row.InstrumentID.String(),
		Side:         row.Side,
		Qty:          numericToFloat64(row.Qty),
		EntryPrice:   numericToFloat64(row.EntryPrice),
		ExitPrice:    numericToFloat64Ptr(row.ExitPrice),
		OpenedAt:     row.OpenedAt,
		ClosedAt:     timestamptzToTimePtr(row.ClosedAt),
		Fees:         numericToFloat64(row.Fees),
		Notes:        textToStringPtr(row.Notes),
	}
}

func float64ToNumeric(v float64) pgtype.Numeric {
	return pgtype.Numeric{Int: big.NewInt(int64(v * 1000000)), Exp: -6, Valid: true}
}

func float64PtrToNumeric(v *float64) pgtype.Numeric {
	if v == nil {
		return pgtype.Numeric{}
	}
	return float64ToNumeric(*v)
}

func numericToFloat64(n pgtype.Numeric) float64 {
	if !n.Valid {
		return 0
	}
	f, err := n.Float64Value()
	if err != nil || !f.Valid {
		return 0
	}
	return f.Float64
}

func numericToFloat64Ptr(n pgtype.Numeric) *float64 {
	if !n.Valid {
		return nil
	}
	f, err := n.Float64Value()
	if err != nil || !f.Valid {
		return nil
	}
	out := f.Float64
	return &out
}

func timePtrToTimestamptz(v *time.Time) pgtype.Timestamptz {
	if v == nil {
		return pgtype.Timestamptz{}
	}
	return pgtype.Timestamptz{Time: *v, Valid: true}
}

func timestamptzToTimePtr(v pgtype.Timestamptz) *time.Time {
	if !v.Valid {
		return nil
	}
	out := v.Time
	return &out
}

func stringPtrToText(v *string) pgtype.Text {
	if v == nil {
		return pgtype.Text{}
	}
	return pgtype.Text{String: *v, Valid: true}
}

func textToStringPtr(v pgtype.Text) *string {
	if !v.Valid {
		return nil
	}
	out := v.String
	return &out
}

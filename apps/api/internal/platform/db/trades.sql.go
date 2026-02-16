package db

import (
	"context"
	"time"
)

type CreateTradeParams struct {
	ID           string
	UserID       string
	InstrumentID string
	Side         string
	Qty          float64
	EntryPrice   float64
	ExitPrice    *float64
	OpenedAt     time.Time
	ClosedAt     *time.Time
	Fees         *float64
	Notes        *string
}

const createTrade = `-- name: CreateTrade :one
INSERT INTO trades (
    id, user_id, instrument_id, side, qty, entry_price, exit_price, opened_at, closed_at, fees, notes
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, COALESCE($10, 0), $11)
RETURNING id, user_id, instrument_id, side, qty, entry_price, exit_price, opened_at, closed_at, fees, notes
`

func (q *Queries) CreateTrade(ctx context.Context, arg CreateTradeParams) (Trade, error) {
	row := q.db.QueryRow(
		ctx,
		createTrade,
		arg.ID,
		arg.UserID,
		arg.InstrumentID,
		arg.Side,
		arg.Qty,
		arg.EntryPrice,
		arg.ExitPrice,
		arg.OpenedAt,
		arg.ClosedAt,
		arg.Fees,
		arg.Notes,
	)

	var t Trade
	err := row.Scan(&t.ID, &t.UserID, &t.InstrumentID, &t.Side, &t.Qty, &t.EntryPrice, &t.ExitPrice, &t.OpenedAt, &t.ClosedAt, &t.Fees, &t.Notes)
	return t, err
}

type ListTradesByUserParams struct {
	UserID string
	Limit  int32
	Offset int32
}

const listTradesByUser = `-- name: ListTradesByUser :many
SELECT id, user_id, instrument_id, side, qty, entry_price, exit_price, opened_at, closed_at, fees, notes
FROM trades
WHERE user_id = $1
ORDER BY opened_at DESC
LIMIT $2 OFFSET $3
`

func (q *Queries) ListTradesByUser(ctx context.Context, arg ListTradesByUserParams) ([]Trade, error) {
	rows, err := q.db.Query(ctx, listTradesByUser, arg.UserID, arg.Limit, arg.Offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]Trade, 0)
	for rows.Next() {
		var t Trade
		if err := rows.Scan(&t.ID, &t.UserID, &t.InstrumentID, &t.Side, &t.Qty, &t.EntryPrice, &t.ExitPrice, &t.OpenedAt, &t.ClosedAt, &t.Fees, &t.Notes); err != nil {
			return nil, err
		}
		items = append(items, t)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

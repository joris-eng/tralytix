package db

import "context"

type UpsertInstrumentParams struct {
	ID         string
	Symbol     string
	AssetClass string
	Exchange   *string
	Currency   string
}

const upsertInstrument = `-- name: UpsertInstrument :one
INSERT INTO instruments (id, symbol, asset_class, exchange, currency)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (symbol, exchange, asset_class)
DO UPDATE SET currency = EXCLUDED.currency
RETURNING id, symbol, asset_class, exchange, currency, created_at
`

func (q *Queries) UpsertInstrument(ctx context.Context, arg UpsertInstrumentParams) (Instrument, error) {
	row := q.db.QueryRow(ctx, upsertInstrument, arg.ID, arg.Symbol, arg.AssetClass, arg.Exchange, arg.Currency)
	var i Instrument
	err := row.Scan(&i.ID, &i.Symbol, &i.AssetClass, &i.Exchange, &i.Currency, &i.CreatedAt)
	return i, err
}

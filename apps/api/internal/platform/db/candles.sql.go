package db

import (
	"context"
	"time"
)

type InsertCandleParams struct {
	InstrumentID string
	Timeframe    string
	TS           time.Time
	Open         float64
	High         float64
	Low          float64
	Close        float64
	Volume       *float64
	Provider     string
}

const insertCandle = `-- name: InsertCandle :one
INSERT INTO candles (instrument_id, timeframe, ts, open, high, low, close, volume, provider)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
ON CONFLICT (instrument_id, timeframe, ts)
DO UPDATE SET
    open = EXCLUDED.open,
    high = EXCLUDED.high,
    low = EXCLUDED.low,
    close = EXCLUDED.close,
    volume = EXCLUDED.volume,
    provider = EXCLUDED.provider
RETURNING instrument_id, timeframe, ts, open, high, low, close, volume, provider
`

func (q *Queries) InsertCandle(ctx context.Context, arg InsertCandleParams) (Candle, error) {
	row := q.db.QueryRow(
		ctx,
		insertCandle,
		arg.InstrumentID,
		arg.Timeframe,
		arg.TS,
		arg.Open,
		arg.High,
		arg.Low,
		arg.Close,
		arg.Volume,
		arg.Provider,
	)

	var c Candle
	err := row.Scan(&c.InstrumentID, &c.Timeframe, &c.TS, &c.Open, &c.High, &c.Low, &c.Close, &c.Volume, &c.Provider)
	return c, err
}

type GetCandlesParams struct {
	InstrumentID string
	Timeframe    string
	FromTS       time.Time
	ToTS         time.Time
	LimitRows    int32
}

const getCandles = `-- name: GetCandles :many
SELECT instrument_id, timeframe, ts, open, high, low, close, volume, provider
FROM candles
WHERE instrument_id = $1
  AND timeframe = $2
  AND ts >= $3
  AND ts <= $4
ORDER BY ts DESC
LIMIT $5
`

func (q *Queries) GetCandles(ctx context.Context, arg GetCandlesParams) ([]Candle, error) {
	rows, err := q.db.Query(ctx, getCandles, arg.InstrumentID, arg.Timeframe, arg.FromTS, arg.ToTS, arg.LimitRows)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]Candle, 0)
	for rows.Next() {
		var c Candle
		if err := rows.Scan(&c.InstrumentID, &c.Timeframe, &c.TS, &c.Open, &c.High, &c.Low, &c.Close, &c.Volume, &c.Provider); err != nil {
			return nil, err
		}
		items = append(items, c)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return items, nil
}

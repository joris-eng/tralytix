-- name: InsertCandle :one
INSERT INTO candles (
    instrument_id,
    timeframe,
    ts,
    open,
    high,
    low,
    close,
    volume,
    provider
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
ON CONFLICT (instrument_id, timeframe, ts)
DO UPDATE SET
    open = EXCLUDED.open,
    high = EXCLUDED.high,
    low = EXCLUDED.low,
    close = EXCLUDED.close,
    volume = EXCLUDED.volume,
    provider = EXCLUDED.provider
RETURNING instrument_id, timeframe, ts, open, high, low, close, volume, provider;

-- name: GetCandles :many
SELECT instrument_id, timeframe, ts, open, high, low, close, volume, provider
FROM candles
WHERE instrument_id = $1
  AND timeframe = $2
  AND ts >= $3
  AND ts <= $4
ORDER BY ts DESC
LIMIT $5;

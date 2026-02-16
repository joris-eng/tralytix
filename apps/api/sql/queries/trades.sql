-- name: CreateTrade :one
INSERT INTO trades (
    id,
    user_id,
    instrument_id,
    side,
    qty,
    entry_price,
    exit_price,
    opened_at,
    closed_at,
    fees,
    notes
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, COALESCE($10, 0), $11)
RETURNING id, user_id, instrument_id, side, qty, entry_price, exit_price, opened_at, closed_at, fees, notes;

-- name: ListTradesByUser :many
SELECT id, user_id, instrument_id, side, qty, entry_price, exit_price, opened_at, closed_at, fees, notes
FROM trades
WHERE user_id = $1
ORDER BY opened_at DESC
LIMIT $2 OFFSET $3;

-- name: InsertMT5Trade :execrows
INSERT INTO mt5_trades (
    account_id,
    ticket,
    symbol,
    side,
    volume,
    open_price,
    close_price,
    opened_at,
    closed_at,
    commission,
    swap,
    profit,
    comment,
    source_hash,
    imported_at
)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
ON CONFLICT (account_id, source_hash) DO NOTHING;

-- name: GetMT5AccountSnapshot :one
SELECT
    COUNT(*)::bigint AS total_trades,
    MAX(imported_at) AS last_imported_at
FROM mt5_trades
WHERE account_id = $1;

-- name: GetMT5Summary :one
SELECT
    COUNT(*)::bigint AS total_trades,
    COALESCE(SUM(profit), 0)::numeric AS total_profit,
    COALESCE(AVG(profit), 0)::numeric AS avg_profit,
    COALESCE(SUM(CASE WHEN profit > 0 THEN 1 ELSE 0 END), 0)::bigint AS winners,
    COALESCE(SUM(CASE WHEN profit < 0 THEN 1 ELSE 0 END), 0)::bigint AS losers,
    COALESCE(
        SUM(CASE WHEN profit > 0 THEN 1 ELSE 0 END)::numeric
        / NULLIF(COUNT(*)::numeric, 0),
        0
    )::numeric AS win_rate,
    (
        SUM(CASE WHEN profit > 0 THEN profit ELSE 0 END)
        / NULLIF(ABS(SUM(CASE WHEN profit < 0 THEN profit ELSE 0 END)), 0)
    )::numeric AS profit_factor,
    COALESCE(MAX(profit), 0)::numeric AS max_profit,
    COALESCE(MIN(profit), 0)::numeric AS min_profit
FROM mt5_trades
WHERE account_id = $1;

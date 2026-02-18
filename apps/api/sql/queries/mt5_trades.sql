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

-- name: GetMT5EquityFromDaily :many
SELECT
    day,
    SUM(total_profit) OVER (ORDER BY day)::numeric AS equity
FROM mt5_analytics_daily
WHERE account_id = $1
ORDER BY day;

-- name: GetMT5EquityFallback :many
SELECT
    day,
    SUM(day_profit) OVER (ORDER BY day)::numeric AS equity
FROM (
    SELECT DATE(opened_at) AS day, COALESCE(SUM(profit), 0)::numeric AS day_profit
    FROM mt5_trades
    WHERE account_id = $1
    GROUP BY DATE(opened_at)
) x
ORDER BY day;

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

-- name: RecomputeMT5AnalyticsDaily :execrows
WITH daily AS (
    SELECT
        DATE(opened_at) AS day,
        COUNT(*)::int AS total_trades,
        COALESCE(SUM(CASE WHEN profit > 0 THEN 1 ELSE 0 END), 0)::int AS winners,
        COALESCE(SUM(CASE WHEN profit < 0 THEN 1 ELSE 0 END), 0)::int AS losers,
        COALESCE(SUM(profit), 0)::numeric AS total_profit,
        COALESCE(AVG(profit), 0)::numeric AS avg_profit,
        COALESCE(MAX(profit), 0)::numeric AS max_profit,
        COALESCE(MIN(profit), 0)::numeric AS min_profit,
        (
            SUM(CASE WHEN profit > 0 THEN profit ELSE 0 END)
            / NULLIF(ABS(SUM(CASE WHEN profit < 0 THEN profit ELSE 0 END)), 0)
        )::numeric AS profit_factor,
        COALESCE(
            SUM(CASE WHEN profit > 0 THEN 1 ELSE 0 END)::numeric
            / NULLIF(COUNT(*)::numeric, 0),
            0
        )::numeric AS win_rate
    FROM mt5_trades
    WHERE account_id = $1
    GROUP BY DATE(opened_at)
)
INSERT INTO mt5_analytics_daily (
    id,
    account_id,
    day,
    total_trades,
    winners,
    losers,
    total_profit,
    avg_profit,
    max_profit,
    min_profit,
    profit_factor,
    win_rate,
    created_at,
    updated_at
)
SELECT
    (
        substr(md5($1::text || ':' || day::text), 1, 8) || '-' ||
        substr(md5($1::text || ':' || day::text), 9, 4) || '-' ||
        substr(md5($1::text || ':' || day::text), 13, 4) || '-' ||
        substr(md5($1::text || ':' || day::text), 17, 4) || '-' ||
        substr(md5($1::text || ':' || day::text), 21, 12)
    )::uuid,
    $1,
    day,
    total_trades,
    winners,
    losers,
    total_profit,
    avg_profit,
    max_profit,
    min_profit,
    profit_factor,
    win_rate,
    NOW(),
    NOW()
FROM daily
ON CONFLICT (account_id, day) DO UPDATE SET
    total_trades = EXCLUDED.total_trades,
    winners = EXCLUDED.winners,
    losers = EXCLUDED.losers,
    total_profit = EXCLUDED.total_profit,
    avg_profit = EXCLUDED.avg_profit,
    max_profit = EXCLUDED.max_profit,
    min_profit = EXCLUDED.min_profit,
    profit_factor = EXCLUDED.profit_factor,
    win_rate = EXCLUDED.win_rate,
    updated_at = NOW();

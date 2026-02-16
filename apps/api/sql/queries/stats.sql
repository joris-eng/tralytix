-- name: StatsSummaryByUser :one
WITH user_trades AS (
    SELECT
        t.id,
        t.side,
        t.qty,
        t.entry_price,
        t.exit_price,
        t.fees,
        t.closed_at
    FROM trades t
    WHERE t.user_id = $1
),
closed_trades AS (
    SELECT
        id,
        CASE
            WHEN side = 'LONG' THEN ((exit_price - entry_price) * qty) - fees
            WHEN side = 'SHORT' THEN ((entry_price - exit_price) * qty) - fees
            ELSE 0
        END AS pnl
    FROM user_trades
    WHERE closed_at IS NOT NULL
      AND exit_price IS NOT NULL
),
closed_agg AS (
    SELECT
        COUNT(*)::bigint AS closed_count,
        COALESCE(AVG(pnl), 0)::numeric AS avg_pnl,
        COALESCE(SUM(CASE WHEN pnl > 0 THEN pnl ELSE 0 END), 0)::numeric AS gross_profit,
        COALESCE(SUM(CASE WHEN pnl < 0 THEN pnl ELSE 0 END), 0)::numeric AS gross_loss,
        COALESCE(SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END), 0)::bigint AS wins
    FROM closed_trades
)
SELECT
    (SELECT COUNT(*)::bigint FROM user_trades) AS trades_count,
    CASE
        WHEN closed_agg.closed_count = 0 THEN 0::numeric
        ELSE (closed_agg.wins::numeric / closed_agg.closed_count::numeric)
    END AS winrate,
    closed_agg.avg_pnl AS avg_pnl,
    CASE
        WHEN closed_agg.gross_loss = 0 THEN NULL::numeric
        ELSE (closed_agg.gross_profit / ABS(closed_agg.gross_loss))
    END AS profit_factor
FROM closed_agg;

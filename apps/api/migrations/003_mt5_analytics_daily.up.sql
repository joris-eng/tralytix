CREATE TABLE mt5_analytics_daily (
    id UUID PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day DATE NOT NULL,
    total_trades INT NOT NULL DEFAULT 0,
    winners INT NOT NULL DEFAULT 0,
    losers INT NOT NULL DEFAULT 0,
    total_profit NUMERIC NOT NULL DEFAULT 0,
    avg_profit NUMERIC NOT NULL DEFAULT 0,
    max_profit NUMERIC NOT NULL DEFAULT 0,
    min_profit NUMERIC NOT NULL DEFAULT 0,
    profit_factor NUMERIC NULL,
    win_rate NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX mt5_analytics_daily_account_day_uq_idx ON mt5_analytics_daily(account_id, day);

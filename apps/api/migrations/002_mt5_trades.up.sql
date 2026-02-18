CREATE TABLE mt5_trades (
    id BIGSERIAL PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ticket TEXT NOT NULL,
    symbol TEXT NOT NULL,
    side TEXT NOT NULL CHECK (side IN ('LONG', 'SHORT')),
    volume NUMERIC NOT NULL CHECK (volume > 0),
    open_price NUMERIC NOT NULL CHECK (open_price > 0),
    close_price NUMERIC NULL CHECK (close_price > 0),
    opened_at TIMESTAMPTZ NOT NULL,
    closed_at TIMESTAMPTZ NULL,
    commission NUMERIC NOT NULL DEFAULT 0,
    swap NUMERIC NOT NULL DEFAULT 0,
    profit NUMERIC NOT NULL DEFAULT 0,
    comment TEXT NULL,
    source_hash TEXT NOT NULL,
    imported_at TIMESTAMPTZ NOT NULL
);

CREATE UNIQUE INDEX mt5_trades_account_source_uq_idx ON mt5_trades(account_id, source_hash);
CREATE INDEX mt5_trades_account_opened_at_idx ON mt5_trades(account_id, opened_at DESC);
CREATE INDEX mt5_trades_account_imported_at_idx ON mt5_trades(account_id, imported_at DESC);

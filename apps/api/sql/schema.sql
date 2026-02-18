CREATE TABLE users (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sessions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX sessions_token_hash_uq_idx ON sessions(token_hash);
CREATE INDEX sessions_user_id_idx ON sessions(user_id);
CREATE INDEX sessions_expires_at_idx ON sessions(expires_at);

CREATE TABLE instruments (
    id UUID PRIMARY KEY,
    symbol TEXT NOT NULL,
    asset_class TEXT NOT NULL CHECK (asset_class IN ('STOCK', 'FX')),
    exchange TEXT NULL,
    currency TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (symbol, exchange, asset_class)
);

CREATE TABLE candles (
    instrument_id UUID NOT NULL REFERENCES instruments(id) ON DELETE CASCADE,
    timeframe TEXT NOT NULL,
    ts TIMESTAMPTZ NOT NULL,
    open NUMERIC NOT NULL,
    high NUMERIC NOT NULL,
    low NUMERIC NOT NULL,
    close NUMERIC NOT NULL,
    volume NUMERIC NULL,
    provider TEXT NOT NULL,
    PRIMARY KEY (instrument_id, timeframe, ts)
);

CREATE INDEX candles_instrument_tf_ts_idx ON candles(instrument_id, timeframe, ts DESC);

CREATE TABLE trades (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    instrument_id UUID NOT NULL REFERENCES instruments(id),
    side TEXT NOT NULL CHECK (side IN ('LONG', 'SHORT')),
    qty NUMERIC NOT NULL CHECK (qty > 0),
    entry_price NUMERIC NOT NULL CHECK (entry_price > 0),
    exit_price NUMERIC NULL CHECK (exit_price > 0),
    opened_at TIMESTAMPTZ NOT NULL,
    closed_at TIMESTAMPTZ NULL,
    fees NUMERIC NOT NULL DEFAULT 0,
    notes TEXT NULL
);

CREATE INDEX trades_user_opened_at_idx ON trades(user_id, opened_at DESC);
CREATE INDEX trades_user_closed_at_idx ON trades(user_id, closed_at DESC);

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

CREATE TABLE tags (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    UNIQUE (user_id, name)
);

CREATE TABLE trade_tags (
    trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (trade_id, tag_id)
);

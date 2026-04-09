CREATE TABLE IF NOT EXISTS trade_journal_entries (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symbol         VARCHAR(20)  NOT NULL,
    side           VARCHAR(10)  NOT NULL CHECK (side IN ('LONG', 'SHORT')),
    timeframe      VARCHAR(10)  NOT NULL DEFAULT '',
    entry_price    NUMERIC(18,5) NOT NULL DEFAULT 0,
    close_price    NUMERIC(18,5) NOT NULL DEFAULT 0,
    profit         NUMERIC(18,2) NOT NULL DEFAULT 0,
    opened_at      DATE         NOT NULL,
    setup          TEXT         NOT NULL DEFAULT '',
    emotions       TEXT[]       NOT NULL DEFAULT '{}',
    notes          TEXT         NOT NULL DEFAULT '',
    lessons        TEXT         NOT NULL DEFAULT '',
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS trade_journal_user_idx ON trade_journal_entries (user_id, opened_at DESC);

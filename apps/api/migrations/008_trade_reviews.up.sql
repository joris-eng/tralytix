CREATE TABLE IF NOT EXISTS trade_reviews (
    id             UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    trade_id       BIGINT  NOT NULL,
    rating         SMALLINT NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    setup_tag      TEXT    NOT NULL DEFAULT '',
    notes          TEXT    NOT NULL DEFAULT '',
    key_learnings  TEXT[]  NOT NULL DEFAULT '{}',
    reviewed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, trade_id)
);

CREATE INDEX IF NOT EXISTS trade_reviews_user_idx ON trade_reviews (user_id, reviewed_at DESC);

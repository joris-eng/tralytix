ALTER TABLE users ADD COLUMN IF NOT EXISTS ea_token VARCHAR(64);
CREATE UNIQUE INDEX IF NOT EXISTS users_ea_token_idx ON users (ea_token) WHERE ea_token IS NOT NULL;

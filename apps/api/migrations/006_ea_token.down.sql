DROP INDEX IF EXISTS users_ea_token_idx;
ALTER TABLE users DROP COLUMN IF EXISTS ea_token;

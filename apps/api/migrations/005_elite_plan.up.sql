-- Drop constraint if it already exists (idempotent)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_plan_check;

-- Allow free, pro, and elite plan values
ALTER TABLE users
  ADD CONSTRAINT users_plan_check
  CHECK (plan IN ('free', 'pro', 'elite'));

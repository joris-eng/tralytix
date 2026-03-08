-- Downgrade: reset all elite users to free before removing the constraint
UPDATE users SET plan = 'free' WHERE plan = 'elite';

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_plan_check;

-- Re-add the previous constraint (free + pro only)
ALTER TABLE users
  ADD CONSTRAINT users_plan_check
  CHECK (plan IN ('free', 'pro'));

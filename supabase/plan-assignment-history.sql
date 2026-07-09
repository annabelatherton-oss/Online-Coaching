-- Run in Supabase SQL Editor
-- Records when each meal plan assignment ended

ALTER TABLE client_plan_assignments
  ADD COLUMN IF NOT EXISTS ended_at timestamptz DEFAULT NULL;

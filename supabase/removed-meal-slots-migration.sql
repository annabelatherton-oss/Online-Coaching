-- Lets the coach permanently remove a meal slot for a client (e.g. "no
-- evening snack, ever") from the check-in delivery panel — the removal now
-- persists onto the assignment so it stays out of every future week's
-- meal plan instead of reappearing the next time a plan is delivered.
-- Run once in Supabase SQL Editor.

ALTER TABLE client_plan_assignments ADD COLUMN IF NOT EXISTS removed_meal_slots text[] NOT NULL DEFAULT '{}';

-- Splits the single "adherence" check-in rating into two separate scores —
-- one for food/nutrition adherence, one for gym/training adherence — so
-- coaches can track them independently instead of one blended number.
-- The old `adherence` column is left in place (unused going forward) rather
-- than dropped, in case any historical data needs to be referenced.
-- Run once in Supabase SQL Editor.

ALTER TABLE client_checkins
  ADD COLUMN IF NOT EXISTS food_adherence int,
  ADD COLUMN IF NOT EXISTS gym_adherence int;

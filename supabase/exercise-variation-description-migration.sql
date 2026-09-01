-- Adds a per-variation description to the Exercise Library, so each
-- equipment variation of an exercise can carry its own overview text
-- (separate from coaching cues/instructions), visible to clients.
-- Run once in Supabase SQL Editor.

ALTER TABLE exercise_variations
  ADD COLUMN IF NOT EXISTS description text;

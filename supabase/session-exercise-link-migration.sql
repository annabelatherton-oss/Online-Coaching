-- Adds a real link from training-block exercises back to the Exercise Library,
-- mirroring workout_exercises.exercise_id. session_exercises previously had no
-- such link at all — it was pure text — so training blocks could never be
-- checked against the library the way workouts already are.
-- Run once in Supabase SQL Editor.

ALTER TABLE session_exercises
  ADD COLUMN IF NOT EXISTS exercise_id uuid REFERENCES exercises(id) ON DELETE SET NULL;

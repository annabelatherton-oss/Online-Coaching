-- Syncs the displayed name of already-linked training block exercises to
-- match their linked library exercise's exact name, for links made before
-- the auto-linker started keeping names in sync.
-- Run once in Supabase SQL Editor.

UPDATE session_exercises se
SET name = ex.name
FROM exercises ex
WHERE se.exercise_id = ex.id
  AND se.name != ex.name;

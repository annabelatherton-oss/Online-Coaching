-- The client weekly plan editor's exercise name field didn't actually record
-- exercise_id when a name was picked from the library dropdown (only the
-- Workout Library editor did). This backfills the link for any existing
-- workout_exercises row whose text exactly matches a library exercise name,
-- so the "is this used anywhere" check in the Exercise Library reflects
-- exercises you already picked before this fix.
-- Run once in Supabase SQL Editor.

UPDATE workout_exercises we
SET exercise_id = ex.id
FROM exercises ex
WHERE we.exercise_id IS NULL
  AND lower(we.name) = lower(ex.name);

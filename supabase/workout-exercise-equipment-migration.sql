-- Add a separate "equipment" field to workout_exercises (Workout Library and
-- client weekly plans) so the machine/object used can be set per use, without
-- being fixed on the linked Exercise Library entry. Mirrors the same change
-- already made to session_exercises for training programme blocks.
-- Run once in Supabase SQL Editor.

ALTER TABLE workout_exercises
  ADD COLUMN IF NOT EXISTS equipment text;

-- Backfill from whatever equipment each linked library exercise currently has.
UPDATE workout_exercises we
SET equipment = ex.equipment
FROM exercises ex
WHERE we.exercise_id = ex.id
  AND we.equipment IS NULL
  AND ex.equipment IS NOT NULL;

-- ── Fix: "Shoulder Press" duplicate ───────────────────────────────────────────
-- The Exercise Library already had a "Shoulder Press" entry (imported from a
-- training programme) before "Barbell Overhead Press" was renamed to the same
-- name during consolidation, leaving two rows with an identical name.
UPDATE workout_exercises SET exercise_id = (
  SELECT id FROM exercises WHERE name = 'Shoulder Press' ORDER BY created_at ASC LIMIT 1
)
WHERE exercise_id IN (
  SELECT id FROM exercises WHERE name = 'Shoulder Press'
  ORDER BY created_at ASC
  OFFSET 1
);

DELETE FROM exercises
WHERE id IN (
  SELECT id FROM exercises WHERE name = 'Shoulder Press'
  ORDER BY created_at ASC
  OFFSET 1
);

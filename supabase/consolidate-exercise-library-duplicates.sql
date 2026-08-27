-- Consolidates equipment-only duplicate entries in the Exercise Library into
-- a single exercise per movement (equipment is then chosen via the Equipment
-- field on that one entry, instead of having a separate exercise per variant).
-- Bench Press and Back Squat style families are intentionally left untouched.
-- Run once in Supabase SQL Editor.

-- ── Shoulder Press: Barbell Overhead Press + Dumbbell Shoulder Press + Machine Shoulder Press ──
WITH keep AS (
  SELECT id FROM exercises WHERE name = 'Barbell Overhead Press' LIMIT 1
), dupes AS (
  SELECT id FROM exercises WHERE name IN ('Dumbbell Shoulder Press', 'Machine Shoulder Press')
)
UPDATE workout_exercises SET exercise_id = (SELECT id FROM keep) WHERE exercise_id IN (SELECT id FROM dupes);
DELETE FROM exercises WHERE id IN (SELECT id FROM dupes);
UPDATE exercises SET name = 'Shoulder Press', equipment = NULL WHERE name = 'Barbell Overhead Press';

-- ── Lateral Raise: Lateral Raise + Cable Lateral Raise ───────────────────────
WITH keep AS (
  SELECT id FROM exercises WHERE name = 'Lateral Raise' LIMIT 1
), dupes AS (
  SELECT id FROM exercises WHERE name = 'Cable Lateral Raise'
)
UPDATE workout_exercises SET exercise_id = (SELECT id FROM keep) WHERE exercise_id IN (SELECT id FROM dupes);
DELETE FROM exercises WHERE id IN (SELECT id FROM dupes);
UPDATE exercises SET equipment = NULL WHERE name = 'Lateral Raise';

-- ── Rear Delt Fly: Rear Delt Fly + Cable Rear Delt Fly ───────────────────────
WITH keep AS (
  SELECT id FROM exercises WHERE name = 'Rear Delt Fly' LIMIT 1
), dupes AS (
  SELECT id FROM exercises WHERE name = 'Cable Rear Delt Fly'
)
UPDATE workout_exercises SET exercise_id = (SELECT id FROM keep) WHERE exercise_id IN (SELECT id FROM dupes);
DELETE FROM exercises WHERE id IN (SELECT id FROM dupes);
UPDATE exercises SET equipment = NULL WHERE name = 'Rear Delt Fly';

-- ── Hip Thrust: Hip Thrust + Smith Machine Hip Thrust + Banded Hip Thrust ────
WITH keep AS (
  SELECT id FROM exercises WHERE name = 'Hip Thrust' LIMIT 1
), dupes AS (
  SELECT id FROM exercises WHERE name IN ('Smith Machine Hip Thrust', 'Banded Hip Thrust')
)
UPDATE workout_exercises SET exercise_id = (SELECT id FROM keep) WHERE exercise_id IN (SELECT id FROM dupes);
DELETE FROM exercises WHERE id IN (SELECT id FROM dupes);
UPDATE exercises SET equipment = NULL WHERE name = 'Hip Thrust';

-- ── Hip Abduction Machine + Abduction Machine (literal duplicate) ───────────
WITH keep AS (
  SELECT id FROM exercises WHERE name = 'Hip Abduction Machine' LIMIT 1
), dupes AS (
  SELECT id FROM exercises WHERE name = 'Abduction Machine'
)
UPDATE workout_exercises SET exercise_id = (SELECT id FROM keep) WHERE exercise_id IN (SELECT id FROM dupes);
DELETE FROM exercises WHERE id IN (SELECT id FROM dupes);

-- ── Barbell Curl + EZ Bar Curl ───────────────────────────────────────────────
WITH keep AS (
  SELECT id FROM exercises WHERE name = 'Barbell Curl' LIMIT 1
), dupes AS (
  SELECT id FROM exercises WHERE name = 'EZ Bar Curl'
)
UPDATE workout_exercises SET exercise_id = (SELECT id FROM keep) WHERE exercise_id IN (SELECT id FROM dupes);
DELETE FROM exercises WHERE id IN (SELECT id FROM dupes);
UPDATE exercises SET equipment = NULL WHERE name = 'Barbell Curl';

-- ── Overhead Tricep Extension + Overhead Cable Extension ─────────────────────
WITH keep AS (
  SELECT id FROM exercises WHERE name = 'Overhead Tricep Extension' LIMIT 1
), dupes AS (
  SELECT id FROM exercises WHERE name = 'Overhead Cable Extension'
)
UPDATE workout_exercises SET exercise_id = (SELECT id FROM keep) WHERE exercise_id IN (SELECT id FROM dupes);
DELETE FROM exercises WHERE id IN (SELECT id FROM dupes);
UPDATE exercises SET equipment = NULL WHERE name = 'Overhead Tricep Extension';

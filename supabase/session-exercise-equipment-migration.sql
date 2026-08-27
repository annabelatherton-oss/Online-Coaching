-- Add a separate "equipment" field to session_exercises so the machine/object
-- used can be shown without touching the exercise name or reps.
-- Run once in Supabase SQL Editor.

ALTER TABLE session_exercises
  ADD COLUMN IF NOT EXISTS equipment text;

-- ── Backfill known equipment for existing rows (matched by exercise name) ────

UPDATE session_exercises SET equipment = 'Dumbbell'      WHERE name = 'Straight Leg RDL';
UPDATE session_exercises SET equipment = 'Barbell'        WHERE name = 'Hip Thrusts';
UPDATE session_exercises SET equipment = 'Barbell'        WHERE name = 'Hip Thrust';
UPDATE session_exercises SET equipment = 'Barbell'        WHERE name = 'Hip Thrust - Hold';
UPDATE session_exercises SET equipment = 'Dumbbell'      WHERE name = 'Shoulder Press';
UPDATE session_exercises SET equipment = 'Dumbbell'      WHERE name = 'Lateral Raise';
UPDATE session_exercises SET equipment = 'Cable'          WHERE name = 'Lat Raises';
UPDATE session_exercises SET equipment = 'Dumbbell'      WHERE name = 'Seated Lateral Raise';
UPDATE session_exercises SET equipment = 'Pec Deck'       WHERE name = 'Chest Fly';
UPDATE session_exercises SET equipment = 'Dumbbell'      WHERE name = 'Chest Flys';
UPDATE session_exercises SET equipment = 'Cable'          WHERE name = 'Tricep Extensions';
UPDATE session_exercises SET equipment = 'Dumbbell'      WHERE name = 'Glute Focussed RDLs';
UPDATE session_exercises SET equipment = 'Dumbbell'      WHERE name = 'Deep Goblet Squats';
UPDATE session_exercises SET equipment = 'Dumbbell'      WHERE name = 'Goblet Squats';
UPDATE session_exercises SET equipment = 'Smith Machine' WHERE name = 'Step Ups';
UPDATE session_exercises SET equipment = 'Dumbbell'      WHERE name = 'Hammer Curl';
UPDATE session_exercises SET equipment = 'Machine'        WHERE name = 'Preacher Curl';
UPDATE session_exercises SET equipment = 'Barbell'        WHERE name = 'Deadlift';
UPDATE session_exercises SET equipment = 'Barbell'        WHERE name = 'Back Squat';
UPDATE session_exercises SET equipment = 'Barbell'        WHERE name = 'Squat';
UPDATE session_exercises SET equipment = 'Dumbbell'      WHERE name = 'Glute Bulgarian Split Squats';
UPDATE session_exercises SET equipment = 'Dumbbell'      WHERE name = 'Bulgarian Split Squats (Glutes)';
UPDATE session_exercises SET equipment = 'Dumbbell'      WHERE name = 'Quad Bulgarian Split Squat';
UPDATE session_exercises SET equipment = 'Machine'        WHERE name = 'Glute Focussed Bulgarians';
UPDATE session_exercises SET equipment = 'Smith Machine' WHERE name = 'Good Mornings';
UPDATE session_exercises SET equipment = 'Barbell'        WHERE name = 'Military Press';
UPDATE session_exercises SET equipment = 'Smith Machine' WHERE name = 'Reverse Lunges (Glute Focussed)';
UPDATE session_exercises SET equipment = 'Machine'        WHERE name = 'Tricep Dips';
UPDATE session_exercises SET equipment = 'Machine'        WHERE name = 'Incline Chest Press';
UPDATE session_exercises SET equipment = 'Pec Deck'       WHERE name IN ('Rear Dealt Flies', 'Rear Delt Flies');
UPDATE session_exercises SET equipment = 'Cable'          WHERE name = 'Rear Delt Face Pulls';
UPDATE session_exercises SET equipment = 'Machine'        WHERE name = 'Chest Supported Row';
UPDATE session_exercises SET equipment = 'Cable'          WHERE name = 'Cable Kickbacks';
UPDATE session_exercises SET equipment = 'Cable'          WHERE name = 'Cable Lateral Raise';
UPDATE session_exercises SET equipment = 'Cable'          WHERE name IN ('Rear Delt Cable Flies', 'Rear Delt Cable Flys');
UPDATE session_exercises SET equipment = 'Cable'          WHERE name = 'Seated Cable Row';
UPDATE session_exercises SET equipment = 'Smith Machine' WHERE name = 'Smith Machine Squat';
UPDATE session_exercises SET equipment = 'EZ Bar'         WHERE name = 'EZ Bar Curl';

-- ── Bench Press — Barbell in Block 2, Smith Machine in Block 3 ───────────────

UPDATE session_exercises se
SET equipment = 'Barbell'
FROM training_sessions ts
JOIN training_programs tp ON ts.program_id = tp.id
WHERE se.session_id = ts.id
  AND se.name = 'Bench Press'
  AND tp.name LIKE '%Block 2%';

UPDATE session_exercises se
SET equipment = 'Smith Machine'
FROM training_sessions ts
JOIN training_programs tp ON ts.program_id = tp.id
WHERE se.session_id = ts.id
  AND se.name = 'Bench Press'
  AND tp.name LIKE '%Block 3%';

-- ── Seated Row (Lats) — Cable in Block 1, Machine in Block 2 ─────────────────

UPDATE session_exercises se
SET equipment = 'Cable'
FROM training_sessions ts
JOIN training_programs tp ON ts.program_id = tp.id
WHERE se.session_id = ts.id
  AND se.name = 'Seated Row (Lats)'
  AND tp.name LIKE '%Block 1%';

UPDATE session_exercises se
SET equipment = 'Machine'
FROM training_sessions ts
JOIN training_programs tp ON ts.program_id = tp.id
WHERE se.session_id = ts.id
  AND se.name = 'Seated Row (Lats)'
  AND tp.name LIKE '%Block 2%';

-- ── Remaining equipment, confirmed by coach ──────────────────────────────────

UPDATE session_exercises SET equipment = 'Machine'      WHERE name = 'Hack Squat';
UPDATE session_exercises SET equipment = 'Machine'      WHERE name = 'Hyperextensions';
UPDATE session_exercises SET equipment = 'Cable'        WHERE name = 'Lat Pull Down';
UPDATE session_exercises SET equipment = 'Machine'      WHERE name IN ('Leg Extension', 'Leg Extensions');
UPDATE session_exercises SET equipment = 'Machine'      WHERE name IN ('Leg Press', 'Leg Press (Quad Focus)');
UPDATE session_exercises SET equipment = 'Machine'      WHERE name = 'Low Row';
UPDATE session_exercises SET equipment = 'Machine'      WHERE name IN ('Lying Hamstring Curl', 'Lying Hamstring Curls');
UPDATE session_exercises SET equipment = 'Machine'      WHERE name = 'Seated Hamstring Curl';
UPDATE session_exercises SET equipment = 'Straight Bar' WHERE name = 'Straight Bar Lat Raises';
UPDATE session_exercises SET equipment = 'Machine'      WHERE name = 'T-Bar Row';
UPDATE session_exercises SET equipment = 'Machine'      WHERE name = 'Viking Press';

-- Add equipment/variation detail to exercise names across all training programmes.
-- Run once in Supabase SQL Editor.

-- ── Global updates (same equipment in every programme) ────────────────────────

UPDATE session_exercises SET name = 'Straight Leg RDL (Dumbbell)'               WHERE name = 'Straight Leg RDL';
UPDATE session_exercises SET name = 'Hip Thrusts (Barbell)'                      WHERE name = 'Hip Thrusts';
UPDATE session_exercises SET name = 'Hip Thrust (Barbell)'                       WHERE name = 'Hip Thrust';
UPDATE session_exercises SET name = 'Hip Thrust - Hold (Barbell)'                WHERE name = 'Hip Thrust - Hold';
UPDATE session_exercises SET name = 'Shoulder Press (Dumbbell)'                  WHERE name = 'Shoulder Press';
UPDATE session_exercises SET name = 'Lateral Raise (Dumbbell)'                   WHERE name = 'Lateral Raise';
UPDATE session_exercises SET name = 'Lat Raises (Cable)'                         WHERE name = 'Lat Raises';
UPDATE session_exercises SET name = 'Seated Lateral Raise (Dumbbell)'            WHERE name = 'Seated Lateral Raise';
UPDATE session_exercises SET name = 'Chest Fly (Pec Deck)'                       WHERE name = 'Chest Fly';
UPDATE session_exercises SET name = 'Chest Flys (Dumbbell)'                      WHERE name = 'Chest Flys';
UPDATE session_exercises SET name = 'Tricep Extensions (Cable)'                  WHERE name = 'Tricep Extensions';
UPDATE session_exercises SET name = 'Glute Focussed RDLs (Dumbbell)'             WHERE name = 'Glute Focussed RDLs';
UPDATE session_exercises SET name = 'Deep Goblet Squats (Dumbbell)'              WHERE name = 'Deep Goblet Squats';
UPDATE session_exercises SET name = 'Goblet Squats (Dumbbell)'                   WHERE name = 'Goblet Squats';
UPDATE session_exercises SET name = 'Step Ups (Smith Machine)'                   WHERE name = 'Step Ups';
UPDATE session_exercises SET name = 'Hammer Curl (Dumbbell)'                     WHERE name = 'Hammer Curl';
UPDATE session_exercises SET name = 'Preacher Curl (Machine)'                    WHERE name = 'Preacher Curl';
UPDATE session_exercises SET name = 'Deadlift (Barbell)'                         WHERE name = 'Deadlift';
UPDATE session_exercises SET name = 'Back Squat (Barbell)'                       WHERE name = 'Back Squat';
UPDATE session_exercises SET name = 'Squat (Barbell)'                            WHERE name = 'Squat';
UPDATE session_exercises SET name = 'Glute Bulgarian Split Squats (Dumbbell)'    WHERE name = 'Glute Bulgarian Split Squats';
UPDATE session_exercises SET name = 'Bulgarian Split Squats (Glutes) (Dumbbell)' WHERE name = 'Bulgarian Split Squats (Glutes)';
UPDATE session_exercises SET name = 'Quad Bulgarian Split Squat (Dumbbell)'      WHERE name = 'Quad Bulgarian Split Squat';
UPDATE session_exercises SET name = 'Glute Focussed Bulgarians (Machine)'        WHERE name = 'Glute Focussed Bulgarians';
UPDATE session_exercises SET name = 'Good Mornings (Smith Machine)'              WHERE name = 'Good Mornings';
UPDATE session_exercises SET name = 'Military Press (Barbell)'                   WHERE name = 'Military Press';
UPDATE session_exercises SET name = 'Reverse Lunges (Glute Focussed) (Smith Machine)' WHERE name = 'Reverse Lunges (Glute Focussed)';
UPDATE session_exercises SET name = 'Tricep Dips (Machine)'                      WHERE name = 'Tricep Dips';
UPDATE session_exercises SET name = 'Incline Chest Press (Machine)'              WHERE name = 'Incline Chest Press';
-- Fix Block 2 typo "Rear Dealt" → "Rear Delt" and add Pec Deck
UPDATE session_exercises SET name = 'Rear Delt Flies (Pec Deck)'                 WHERE name IN ('Rear Dealt Flies', 'Rear Delt Flies');
UPDATE session_exercises SET name = 'Rear Delt Face Pulls (Cable)'               WHERE name = 'Rear Delt Face Pulls';
UPDATE session_exercises SET name = 'Chest Supported Row (Machine)'              WHERE name = 'Chest Supported Row';

-- ── Bench Press — Barbell in Block 2, Smith Machine in Block 3 ───────────────

UPDATE session_exercises se
SET name = 'Bench Press (Barbell)'
FROM training_sessions ts
JOIN training_programs tp ON ts.program_id = tp.id
WHERE se.session_id = ts.id
  AND se.name = 'Bench Press'
  AND tp.name LIKE '%Block 2%';

UPDATE session_exercises se
SET name = 'Bench Press (Smith Machine)'
FROM training_sessions ts
JOIN training_programs tp ON ts.program_id = tp.id
WHERE se.session_id = ts.id
  AND se.name = 'Bench Press'
  AND tp.name LIKE '%Block 3%';

-- ── Seated Row (Lats) — Cable in Block 1, Machine in Block 2 ─────────────────

UPDATE session_exercises se
SET name = 'Seated Row (Lats) (Cable)'
FROM training_sessions ts
JOIN training_programs tp ON ts.program_id = tp.id
WHERE se.session_id = ts.id
  AND se.name = 'Seated Row (Lats)'
  AND tp.name LIKE '%Block 1%';

UPDATE session_exercises se
SET name = 'Seated Row (Lats) (Machine)'
FROM training_sessions ts
JOIN training_programs tp ON ts.program_id = tp.id
WHERE se.session_id = ts.id
  AND se.name = 'Seated Row (Lats)'
  AND tp.name LIKE '%Block 2%';

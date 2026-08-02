-- Training programme seed data
-- Run this in Supabase SQL Editor

DO $$
DECLARE
  coach_id uuid;
  prog_id  uuid;
  sess_id  uuid;
BEGIN
  SELECT id INTO coach_id FROM profiles WHERE email = 'annabelatherton@gmail.com';
  IF coach_id IS NULL THEN
    RAISE EXCEPTION 'Coach profile not found';
  END IF;

  -- ══ 5 Day — Block 1 (Hypertrophy) ══
  INSERT INTO training_programs (coach_id, name, weeks_total, current_week, top_lifts)
    VALUES (coach_id, '5 Day — Block 1 (Hypertrophy)', 12, 1, '[]'::jsonb) 
    RETURNING id INTO prog_id;

  INSERT INTO training_sessions (program_id, week_number, order_index, name)
    VALUES (prog_id, 1, 0, 'Monday — Quads and Hamstrings')
    RETURNING id INTO sess_id;
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 0, 'Hack Squat', '4'::int, '6-10', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 1, 'Leg Press (Quad Focus)', '3'::int, '8-12', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 2, 'Leg Extension', '4'::int, '12-15', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 3, 'Straight Leg RDL (Dumbbell)', '3'::int, '8-10', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 4, 'Seated Hamstring Curl', '3'::int, '10-12', NULL);

  INSERT INTO training_sessions (program_id, week_number, order_index, name)
    VALUES (prog_id, 1, 1, 'Friday — Pull')
    RETURNING id INTO sess_id;
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 0, 'T-Bar Row', '4'::int, '8-10', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 1, 'Lat Pull Down', '3'::int, '8-12', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 2, 'Seated Row (Lats) (Cable)', '3'::int, '8-12', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 3, 'Rear Delt Face Pulls (Cable)', '3'::int, '12-15', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 4, 'Hammer Curl (Dumbbell)', '3'::int, '8-12', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 5, 'Preacher Curl (Machine)', '3'::int, '8-12', NULL);

  INSERT INTO training_sessions (program_id, week_number, order_index, name)
    VALUES (prog_id, 1, 2, 'Tuesday — Push')
    RETURNING id INTO sess_id;
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 0, 'Incline Chest Press (Machine)', '3'::int, '6-10', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 1, 'Shoulder Press (Dumbbell)', '3'::int, '6-10', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 2, 'Lateral Raise (Dumbbell)', '4'::int, '12-15', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 3, 'Chest Fly (Pec Deck)', '3'::int, '10-15', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 4, 'Tricep Extensions (Cable)', '3'::int, '10-12', NULL);

  INSERT INTO training_sessions (program_id, week_number, order_index, name)
    VALUES (prog_id, 1, 3, 'Saturday — Glutes and Shoulders')
    RETURNING id INTO sess_id;
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 0, 'Step Ups (Smith Machine)', '3'::int, '8-10', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 1, 'Leg Press', '3'::int, '8-10', 'Glute Focussed');
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 2, 'Hyperextensions', '3'::int, '12-15', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 3, 'Viking Press', '3'::int, '6-11', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 4, 'Lat Raises (Cable)', '3'::int, '12-15', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 5, 'Rear Delt Cable Flies', '3'::int, '12-15', NULL);

  INSERT INTO training_sessions (program_id, week_number, order_index, name)
    VALUES (prog_id, 1, 4, 'Wednesday — Glutes and Hamstrings')
    RETURNING id INTO sess_id;
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 0, 'Hip Thrusts (Barbell)', '4'::int, '6-10', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 1, 'Cable Kickbacks', '3'::int, '12-15', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 2, 'Deep Goblet Squats (Dumbbell)', '3'::int, '8-10', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 3, 'Glute Focussed RDLs (Dumbbell)', '3'::int, '8-10', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 4, 'Lying Hamstring Curls', '3'::int, '10-12', NULL);

  -- ══ 4 Day — Block 1 (Hypertrophy) ══
  INSERT INTO training_programs (coach_id, name, weeks_total, current_week, top_lifts)
    VALUES (coach_id, '4 Day — Block 1 (Hypertrophy)', 12, 1, '[]'::jsonb) 
    RETURNING id INTO prog_id;

  INSERT INTO training_sessions (program_id, week_number, order_index, name)
    VALUES (prog_id, 1, 0, 'Monday — Glutes and Hamstrings')
    RETURNING id INTO sess_id;
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 0, 'Hip Thrusts (Barbell)', '4'::int, '6-10', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 1, 'Cable Kickbacks', '3'::int, '12-15', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 2, 'Deep Goblet Squats (Dumbbell)', '3'::int, '8-10', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 3, 'Glute Focussed RDLs (Dumbbell)', '3'::int, '8-10', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 4, 'Lying Hamstring Curls', '3'::int, '10-12', NULL);

  INSERT INTO training_sessions (program_id, week_number, order_index, name)
    VALUES (prog_id, 1, 1, 'Friday — Active Rest')
    RETURNING id INTO sess_id;
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 0, 'Active Rest / Cardio', NULL::int, NULL, 'Stairmaster 30 min or 15k steps');

  INSERT INTO training_sessions (program_id, week_number, order_index, name)
    VALUES (prog_id, 1, 2, 'Tuesday — Push')
    RETURNING id INTO sess_id;
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 0, 'Incline Chest Press (Machine)', '3'::int, '6-10', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 1, 'Shoulder Press (Dumbbell)', '3'::int, '6-10', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 2, 'Lateral Raise (Dumbbell)', '4'::int, '12-15', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 3, 'Chest Fly (Pec Deck)', '3'::int, '10-15', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 4, 'Tricep Extensions (Cable)', '3'::int, '10-12', NULL);

  INSERT INTO training_sessions (program_id, week_number, order_index, name)
    VALUES (prog_id, 1, 3, 'Saturday — Pull')
    RETURNING id INTO sess_id;
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 0, 'T-Bar Row', '4'::int, '8-10', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 1, 'Lat Pull Down', '3'::int, '8-12', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 2, 'Seated Row (Lats) (Cable)', '3'::int, '8-12', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 3, 'Rear Delt Face Pulls (Cable)', '3'::int, '12-15', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 4, 'Hammer Curl (Dumbbell)', '3'::int, '8-12', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 5, 'Preacher Curl (Machine)', '3'::int, '8-12', NULL);

  INSERT INTO training_sessions (program_id, week_number, order_index, name)
    VALUES (prog_id, 1, 4, 'Thursday — Quads and Hamstrings')
    RETURNING id INTO sess_id;
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 0, 'Hack Squat', '4'::int, '6-10', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 1, 'Leg Press (Quad Focus)', '3'::int, '8-12', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 2, 'Leg Extension', '4'::int, '12-15', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 3, 'Straight Leg RDL (Dumbbell)', '3'::int, '8-10', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 4, 'Seated Hamstring Curl', '3'::int, '10-12', NULL);

  -- ══ 3 Day — Block 1 (Hypertrophy) ══
  INSERT INTO training_programs (coach_id, name, weeks_total, current_week, top_lifts)
    VALUES (coach_id, '3 Day — Block 1 (Hypertrophy)', 12, 1, '[]'::jsonb) 
    RETURNING id INTO prog_id;

  INSERT INTO training_sessions (program_id, week_number, order_index, name)
    VALUES (prog_id, 1, 0, 'Monday — Full Legs')
    RETURNING id INTO sess_id;
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 0, 'Hip Thrust (Barbell)', '4'::int, '6-10', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 1, 'Cable Kickbacks', '3'::int, '10-12', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 2, 'Hack Squat', '3'::int, '6-10', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 3, 'Leg Extension', '3'::int, '12-15', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 4, 'Straight Leg RDL (Dumbbell)', '3'::int, '8-10', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 5, 'Seated Hamstring Curl', '3'::int, '8-12', NULL);

  INSERT INTO training_sessions (program_id, week_number, order_index, name)
    VALUES (prog_id, 1, 1, 'Saturday — Pull')
    RETURNING id INTO sess_id;
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 0, 'T-Bar Row', '4'::int, '8-10', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 1, 'Lat Pull Down', '3'::int, '8-12', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 2, 'Seated Row (Lats) (Cable)', '3'::int, '8-12', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 3, 'Rear Delt Face Pulls (Cable)', '3'::int, '12-15', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 4, 'Hammer Curl (Dumbbell)', '3'::int, '8-12', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 5, 'Preacher Curl (Machine)', '3'::int, '8-12', NULL);

  INSERT INTO training_sessions (program_id, week_number, order_index, name)
    VALUES (prog_id, 1, 2, 'Wednesday — Push')
    RETURNING id INTO sess_id;
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 0, 'Incline Chest Press (Machine)', '3'::int, '6-10', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 1, 'Shoulder Press (Dumbbell)', '3'::int, '6-10', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 2, 'Lateral Raise (Dumbbell)', '4'::int, '12-15', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 3, 'Chest Fly (Pec Deck)', '3'::int, '10-15', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 4, 'Tricep Extensions (Cable)', '3'::int, '10-12', NULL);

  INSERT INTO training_sessions (program_id, week_number, order_index, name)
    VALUES (prog_id, 1, 3, 'Thursday — Active Rest')
    RETURNING id INTO sess_id;
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 0, 'Active Rest / Cardio', NULL::int, NULL, 'Stairmaster 30 min or 15k steps');

  -- ══ 5 Day — Block 2 (Strength) ══
  INSERT INTO training_programs (coach_id, name, weeks_total, current_week, top_lifts)
    VALUES (coach_id, '5 Day — Block 2 (Strength)', 12, 1, '[]'::jsonb) 
    RETURNING id INTO prog_id;

  INSERT INTO training_sessions (program_id, week_number, order_index, name)
    VALUES (prog_id, 1, 0, 'Monday — Quads and Hamstrings')
    RETURNING id INTO sess_id;
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 0, 'Back Squat (Barbell)', '4'::int, '4-6', 'As heavy as possible');
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 1, 'Leg Press', '3'::int, '8-10', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 2, 'Leg Extensions', '3'::int, '12-15', 'Last set = drop set');
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 3, 'Straight Leg RDL (Dumbbell)', '3'::int, '8-10', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 4, 'Seated Hamstring Curl', '3'::int, '10-12', NULL);

  INSERT INTO training_sessions (program_id, week_number, order_index, name)
    VALUES (prog_id, 1, 1, 'Friday — Pull')
    RETURNING id INTO sess_id;
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 0, 'Deadlift (Barbell)', '4'::int, '4-6', 'Heavy as possible');
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 1, 'Chest Supported Row (Machine)', '3'::int, '8-10', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 2, 'Lat Pull Down', '3'::int, '8-10', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 3, 'Seated Row (Lats) (Machine)', '3'::int, '8-12', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 4, 'Rear Delt Flies (Pec Deck)', '3'::int, '12-15', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 5, 'Hammer Curl (Dumbbell)', '3'::int, '10-12', 'Drop Set');

  INSERT INTO training_sessions (program_id, week_number, order_index, name)
    VALUES (prog_id, 1, 2, 'Tuesday — Push')
    RETURNING id INTO sess_id;
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 0, 'Bench Press (Barbell)', '4'::int, '4-6', 'Heavy');
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 1, 'Shoulder Press (Dumbbell)', '3'::int, '6-8', 'Heavy');
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 2, 'Seated Lateral Raise (Dumbbell)', '4'::int, '12-15', 'And then drop set');
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 3, 'Chest Fly (Pec Deck)', '3'::int, '10-15', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 4, 'Tricep Extensions (Cable)', '3'::int, '10-15', NULL);

  INSERT INTO training_sessions (program_id, week_number, order_index, name)
    VALUES (prog_id, 1, 3, 'Saturday — Glutes and Shoulders')
    RETURNING id INTO sess_id;
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 0, 'Step Ups (Smith Machine)', '3'::int, '8-10', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 1, 'Leg Press', '3'::int, '10-12', 'Glute Focussed - Feet high and wide');
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 2, 'Hyperextensions', '3'::int, '12-15', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 3, 'Cable Lateral Raise', '3'::int, '12-15', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 4, 'Lateral Raise (Dumbbell)', '4'::int, '12-15', '3s hold at the top - control down');

  INSERT INTO training_sessions (program_id, week_number, order_index, name)
    VALUES (prog_id, 1, 4, 'Wednesday — Glutes and Hamstrings')
    RETURNING id INTO sess_id;
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 0, 'Hip Thrusts (Barbell)', '4'::int, '6-8', 'HEAVY');
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 1, 'Good Mornings (Smith Machine)', '3'::int, '8-10', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 2, 'Glute Bulgarian Split Squats (Dumbbell)', '3'::int, '8-10', 'Sit into hips (not knee over toe)');
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 3, 'Cable Kickbacks', '3'::int, '12-15', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 4, 'Lying Hamstring Curls', '3'::int, '10-12', NULL);

  -- ══ 4 Day — Block 2 (Strength) ══
  INSERT INTO training_programs (coach_id, name, weeks_total, current_week, top_lifts)
    VALUES (coach_id, '4 Day — Block 2 (Strength)', 12, 1, '[]'::jsonb) 
    RETURNING id INTO prog_id;

  INSERT INTO training_sessions (program_id, week_number, order_index, name)
    VALUES (prog_id, 1, 0, 'Monday — Quads and Hamstrings')
    RETURNING id INTO sess_id;
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 0, 'Back Squat (Barbell)', '4'::int, '4-6', 'As heavy as possible');
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 1, 'Leg Press', '3'::int, '8-10', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 2, 'Leg Extensions', '3'::int, '12-15', 'Last set = drop set');
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 3, 'Straight Leg RDL (Dumbbell)', '3'::int, '8-10', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 4, 'Seated Hamstring Curl', '3'::int, '10-12', NULL);

  INSERT INTO training_sessions (program_id, week_number, order_index, name)
    VALUES (prog_id, 1, 1, 'Friday — Active Rest')
    RETURNING id INTO sess_id;
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 0, 'Active Rest / Cardio', NULL::int, NULL, 'Stairmaster 30 min or 15k steps');

  INSERT INTO training_sessions (program_id, week_number, order_index, name)
    VALUES (prog_id, 1, 2, 'Tuesday — Push')
    RETURNING id INTO sess_id;
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 0, 'Bench Press (Barbell)', '4'::int, '4-6', 'Heavy');
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 1, 'Shoulder Press (Dumbbell)', '3'::int, '6-8', 'Heavy');
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 2, 'Seated Lateral Raise (Dumbbell)', '4'::int, '12-15', 'And then drop set');
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 3, 'Chest Fly (Pec Deck)', '3'::int, '10-15', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 4, 'Tricep Extensions (Cable)', '3'::int, '10-15', NULL);

  INSERT INTO training_sessions (program_id, week_number, order_index, name)
    VALUES (prog_id, 1, 3, 'Saturday — Pull')
    RETURNING id INTO sess_id;
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 0, 'Deadlift (Barbell)', '4'::int, '4-6', 'Heavy as possible');
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 1, 'Chest Supported Row (Machine)', '3'::int, '8-10', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 2, 'Lat Pull Down', '3'::int, '8-10', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 3, 'Seated Row (Lats) (Machine)', '3'::int, '8-12', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 4, 'Rear Delt Flies (Pec Deck)', '3'::int, '12-15', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 5, 'Hammer Curl (Dumbbell)', '3'::int, '10-12', 'Drop Set');

  INSERT INTO training_sessions (program_id, week_number, order_index, name)
    VALUES (prog_id, 1, 4, 'Wednesday — Glutes and Hamstrings')
    RETURNING id INTO sess_id;
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 0, 'Hip Thrusts (Barbell)', '4'::int, '6-8', 'HEAVY');
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 1, 'Good Mornings (Smith Machine)', '3'::int, '8-10', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 2, 'Glute Bulgarian Split Squats (Dumbbell)', '3'::int, '8-10', 'Sit into hips (not knee over toe)');
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 3, 'Cable Kickbacks', '3'::int, '12-15', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 4, 'Lying Hamstring Curls', '3'::int, '10-12', NULL);

  -- ══ 3 Day — Block 2 (Strength) ══
  INSERT INTO training_programs (coach_id, name, weeks_total, current_week, top_lifts)
    VALUES (coach_id, '3 Day — Block 2 (Strength)', 12, 1, '[]'::jsonb) 
    RETURNING id INTO prog_id;

  INSERT INTO training_sessions (program_id, week_number, order_index, name)
    VALUES (prog_id, 1, 0, 'Monday — Full Legs')
    RETURNING id INTO sess_id;
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 0, 'Squat (Barbell)', '4'::int, '4-6', 'Heavy');
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 1, 'Hip Thrust (Barbell)', '3'::int, '6-8', 'Heavy');
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 2, 'Straight Leg RDL (Dumbbell)', '3'::int, '8-10', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 3, 'Glute Focussed Bulgarians (Machine)', '3'::int, '8-10', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 4, 'Leg Extension', '3'::int, '12-15', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 5, 'Seated Hamstring Curl', '3'::int, '10-12', NULL);

  INSERT INTO training_sessions (program_id, week_number, order_index, name)
    VALUES (prog_id, 1, 1, 'Saturday — Pull')
    RETURNING id INTO sess_id;
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 0, 'Deadlift (Barbell)', '4'::int, '4-6', 'Heavy as possible');
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 1, 'Chest Supported Row (Machine)', '3'::int, '8-10', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 2, 'Lat Pull Down', '3'::int, '8-10', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 3, 'Seated Row (Lats) (Machine)', '3'::int, '8-12', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 4, 'Rear Delt Flies (Pec Deck)', '3'::int, '12-15', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 5, 'Hammer Curl (Dumbbell)', '3'::int, '10-12', 'Drop Set');

  INSERT INTO training_sessions (program_id, week_number, order_index, name)
    VALUES (prog_id, 1, 2, 'Wednesday — Push')
    RETURNING id INTO sess_id;
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 0, 'Bench Press (Barbell)', '4'::int, '4-6', 'Heavy');
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 1, 'Shoulder Press (Dumbbell)', '3'::int, '6-8', 'Heavy');
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 2, 'Seated Lateral Raise (Dumbbell)', '4'::int, '12-15', 'And then drop set');
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 3, 'Cable Lateral Raise', '3'::int, '12-15', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 4, 'Chest Fly (Pec Deck)', '3'::int, '10-15', NULL);

  INSERT INTO training_sessions (program_id, week_number, order_index, name)
    VALUES (prog_id, 1, 3, 'Thursday — Active Rest')
    RETURNING id INTO sess_id;
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 0, 'Active Rest / Cardio', NULL::int, NULL, 'Stairmaster 30 min or 15k steps');

  -- ══ 5 Day — Block 3 (Block 3) ══
  INSERT INTO training_programs (coach_id, name, weeks_total, current_week, top_lifts)
    VALUES (coach_id, '5 Day — Block 3 (Block 3)', 12, 1, '[]'::jsonb) 
    RETURNING id INTO prog_id;

  INSERT INTO training_sessions (program_id, week_number, order_index, name)
    VALUES (prog_id, 1, 0, 'Monday — Quads and Hamstrings')
    RETURNING id INTO sess_id;
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 0, 'Smith Machine Squat', '4'::int, '6-8', 'Heels Elevated, Chest Up (Vertical)');
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 1, 'Quad Bulgarian Split Squat (Dumbbell)', '3'::int, '8-12', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 2, 'Leg Extensions', '3'::int, '12-15', 'Last set = drop set');
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 3, 'Straight Leg RDL (Dumbbell)', '3'::int, '8-12', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 4, 'Seated Hamstring Curl', '3'::int, '10-15', NULL);

  INSERT INTO training_sessions (program_id, week_number, order_index, name)
    VALUES (prog_id, 1, 1, 'Friday — Pull')
    RETURNING id INTO sess_id;
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 0, 'Deadlift (Barbell)', '3'::int, '4-6', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 1, 'Seated Cable Row', '3'::int, '8-12', 'Upper Back focussed');
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 2, 'Lat Pull Down', '3'::int, '8-12', 'Lat Focussed - Underhand grip');
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 3, 'Low Row', '3'::int, '10-12', 'Lat Focussed');
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 4, 'Rear Delt Cable Flys', '3'::int, '12-15', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 5, 'EZ Bar Curl', '3'::int, '8-12', 'Drop Set');

  INSERT INTO training_sessions (program_id, week_number, order_index, name)
    VALUES (prog_id, 1, 2, 'Tuesday — Push')
    RETURNING id INTO sess_id;
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 0, 'Bench Press (Smith Machine)', '4'::int, '6-8', 'Heavy');
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 1, 'Military Press (Barbell)', '3'::int, '6-10', 'Heavy');
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 2, 'Cable Lateral Raise', '4'::int, '12-15', 'And then drop set');
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 3, 'Chest Flys (Dumbbell)', '3'::int, '10-15', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 4, 'Rear Delt Cable Flies', '3'::int, '12-15', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 5, 'Tricep Dips (Machine)', '3'::int, '8-12', 'Chest Up');

  INSERT INTO training_sessions (program_id, week_number, order_index, name)
    VALUES (prog_id, 1, 3, 'Saturday — Glutes and Shoulders')
    RETURNING id INTO sess_id;
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 0, 'Hip Thrust - Hold (Barbell)', '4'::int, '8-10', 'Hold for 4 seconds');
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 1, 'Leg Press', '3'::int, '10-12', 'Glute Focussed - Feet high and wide');
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 2, 'Hyperextensions', '3'::int, '12-15', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 3, 'Straight Bar Lat Raises', '3'::int, '12-15', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 4, 'Lateral Raise (Dumbbell)', '4'::int, '10-15', '5s hold at the top - control down');

  INSERT INTO training_sessions (program_id, week_number, order_index, name)
    VALUES (prog_id, 1, 4, 'Wednesday — Glutes and Hamstrings')
    RETURNING id INTO sess_id;
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 0, 'Reverse Lunges (Glute Focussed) (Smith Machine)', '3'::int, '8-10', 'Long Stride');
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 1, 'Glute Focussed RDLs (Dumbbell)', '3'::int, '8-12', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 2, 'Goblet Squats (Dumbbell)', '3'::int, '10-12', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 3, 'Good Mornings (Smith Machine)', '3'::int, '10-12', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 4, 'Lying Hamstring Curls', '3'::int, '10-12', NULL);

  -- ══ 4 Day — Block 3 (Block 3) ══
  INSERT INTO training_programs (coach_id, name, weeks_total, current_week, top_lifts)
    VALUES (coach_id, '4 Day — Block 3 (Block 3)', 12, 1, '[]'::jsonb) 
    RETURNING id INTO prog_id;

  INSERT INTO training_sessions (program_id, week_number, order_index, name)
    VALUES (prog_id, 1, 0, 'Monday — Quads and Hamstrings')
    RETURNING id INTO sess_id;
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 0, 'Smith Machine Squat', '4'::int, '6-8', 'Heels Elevated, Chest Up (Vertical)');
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 1, 'Quad Bulgarian Split Squat (Dumbbell)', '3'::int, '8-12', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 2, 'Leg Extensions', '3'::int, '12-15', 'Last set = drop set');
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 3, 'Straight Leg RDL (Dumbbell)', '3'::int, '8-12', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 4, 'Seated Hamstring Curl', '3'::int, '10-15', NULL);

  INSERT INTO training_sessions (program_id, week_number, order_index, name)
    VALUES (prog_id, 1, 1, 'Friday — Active Rest')
    RETURNING id INTO sess_id;
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 0, 'Active Rest / Cardio', NULL::int, NULL, 'Stairmaster 30 min or 15k steps');

  INSERT INTO training_sessions (program_id, week_number, order_index, name)
    VALUES (prog_id, 1, 2, 'Tuesday — Push')
    RETURNING id INTO sess_id;
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 0, 'Bench Press (Smith Machine)', '4'::int, '6-8', 'Heavy');
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 1, 'Military Press (Barbell)', '3'::int, '6-10', 'Heavy');
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 2, 'Cable Lateral Raise', '4'::int, '12-15', 'And then drop set');
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 3, 'Chest Flys (Dumbbell)', '3'::int, '10-15', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 4, 'Rear Delt Cable Flies', '3'::int, '12-15', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 5, 'Tricep Dips (Machine)', '3'::int, '8-12', 'Chest Up');

  INSERT INTO training_sessions (program_id, week_number, order_index, name)
    VALUES (prog_id, 1, 3, 'Saturday — Pull')
    RETURNING id INTO sess_id;
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 0, 'Deadlift (Barbell)', '3'::int, '4-6', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 1, 'Seated Cable Row', '3'::int, '8-12', 'Upper Back focussed');
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 2, 'Lat Pull Down', '3'::int, '8-12', 'Lat Focussed - Underhand grip');
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 3, 'Low Row', '3'::int, '10-12', 'Lat Focussed');
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 4, 'Rear Delt Cable Flys', '3'::int, '12-15', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 5, 'EZ Bar Curl', '3'::int, '8-12', 'Drop Set');

  INSERT INTO training_sessions (program_id, week_number, order_index, name)
    VALUES (prog_id, 1, 4, 'Wednesday — Glutes and Hamstrings')
    RETURNING id INTO sess_id;
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 0, 'Reverse Lunges (Glute Focussed) (Smith Machine)', '3'::int, '8-10', 'Long Stride');
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 1, 'Glute Focussed RDLs (Dumbbell)', '3'::int, '8-12', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 2, 'Goblet Squats (Dumbbell)', '3'::int, '10-12', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 3, 'Hyperextensions', '3'::int, '12-15', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 4, 'Lying Hamstring Curls', '3'::int, '10-12', NULL);

  -- ══ 3 Day — Block 3 (Block 3) ══
  INSERT INTO training_programs (coach_id, name, weeks_total, current_week, top_lifts)
    VALUES (coach_id, '3 Day — Block 3 (Block 3)', 12, 1, '[]'::jsonb) 
    RETURNING id INTO prog_id;

  INSERT INTO training_sessions (program_id, week_number, order_index, name)
    VALUES (prog_id, 1, 0, 'Monday — Full Legs')
    RETURNING id INTO sess_id;
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 0, 'Smith Machine Squat', '4'::int, '6-8', 'Heels Elevated');
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 1, 'Hip Thrusts (Barbell)', '3'::int, '8-10', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 2, 'Bulgarian Split Squats (Glutes) (Dumbbell)', '3'::int, '8-10', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 3, 'Straight Leg RDL (Dumbbell)', '3'::int, '8-12', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 4, 'Lying Hamstring Curl', '3'::int, '10-12', NULL);

  INSERT INTO training_sessions (program_id, week_number, order_index, name)
    VALUES (prog_id, 1, 1, 'Saturday — Pull')
    RETURNING id INTO sess_id;
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 0, 'Deadlift (Barbell)', '3'::int, '4-6', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 1, 'Seated Cable Row', '3'::int, '8-12', 'Upper Back focussed');
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 2, 'Lat Pull Down', '3'::int, '8-12', 'Lat Focussed - Underhand grip');
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 3, 'Low Row', '3'::int, '10-12', 'Lat Focussed');
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 4, 'Rear Delt Cable Flys', '3'::int, '12-15', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 5, 'EZ Bar Curl', '3'::int, '8-12', 'Drop Set');

  INSERT INTO training_sessions (program_id, week_number, order_index, name)
    VALUES (prog_id, 1, 2, 'Wednesday — Push')
    RETURNING id INTO sess_id;
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 0, 'Bench Press (Smith Machine)', '4'::int, '6-8', 'Heavy');
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 1, 'Military Press (Barbell)', '3'::int, '6-10', 'Heavy');
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 2, 'Cable Lateral Raise', '4'::int, '12-15', 'And then drop set');
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 3, 'Chest Flys (Dumbbell)', '3'::int, '10-15', NULL);
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 4, 'Rear Delt Cable Flies', '3'::int, '12-15', NULL);

  INSERT INTO training_sessions (program_id, week_number, order_index, name)
    VALUES (prog_id, 1, 3, 'Thursday — Active Rest')
    RETURNING id INTO sess_id;
  INSERT INTO session_exercises (session_id, order_index, name, sets, reps, notes)
    VALUES (sess_id, 0, 'Active Rest / Cardio', NULL::int, NULL, 'Stairmaster 30 min or 15k steps');

  RAISE NOTICE 'Seed complete — % programmes inserted', 9;
END $$;
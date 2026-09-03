-- Splits the old generic "Back" muscle group into more specific ones —
-- Lats (vertical pulling), Upper Back (rows/rear delt work), and Lower Back
-- (deadlift-pattern hinges) — matching the new options in the Exercise
-- Library editor. No schema change needed (primary_muscle/secondary_muscles
-- are plain text/text[], not enums) — this just relabels existing rows.
-- Run once in Supabase SQL Editor.

UPDATE exercises SET primary_muscle = 'Lats'
WHERE primary_muscle = 'Back'
  AND name IN ('Lat Pulldown', 'Lat Pullover', 'Straight Arm Pulldown', 'Pull Up', 'Seated Row (Lats)', 'Single Arm Row (Lats)');

UPDATE exercises SET primary_muscle = 'Upper Back'
WHERE primary_muscle = 'Back'
  AND name IN ('Bent Over Row', 'Chest Supported Row', 'Low Row', 'T-Bar Row', 'Face Pull');

UPDATE exercises SET primary_muscle = 'Lower Back'
WHERE primary_muscle = 'Back'
  AND name IN ('Deadlift', 'Trap Bar Deadlift');

-- Catch-all: any other exercise still tagged plain "Back" (a custom one not
-- in the lists above) defaults to Upper Back, the closest general match —
-- reclassify it to Lats or Lower Back from the Exercise Library editor if
-- that's more accurate for that particular movement.
UPDATE exercises SET primary_muscle = 'Upper Back' WHERE primary_muscle = 'Back';

-- Same relabel wherever "Back" appears as a secondary muscle.
UPDATE exercises SET secondary_muscles = array_replace(secondary_muscles, 'Back', 'Upper Back')
WHERE 'Back' = ANY(secondary_muscles);

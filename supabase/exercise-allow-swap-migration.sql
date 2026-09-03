-- Lets a coach turn off the swap option entirely for specific exercises —
-- e.g. tested main lifts like Back Squat, Bench Press, Deadlift, where you
-- always want the client attempting the programmed lift rather than a
-- substitute. Defaults to true (swappable) for every existing exercise, so
-- nothing changes for the rest of the library.
-- Run once in Supabase SQL Editor.

ALTER TABLE exercises ADD COLUMN IF NOT EXISTS allow_swap boolean NOT NULL DEFAULT true;

-- Turn off swaps for the three lifts you named. Case-insensitive exact match
-- so it catches the exercise regardless of how it was capitalised.
UPDATE exercises SET allow_swap = false WHERE lower(name) IN ('back squat', 'bench press', 'deadlift');

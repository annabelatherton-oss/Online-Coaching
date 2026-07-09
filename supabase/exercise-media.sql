-- Add illustration and video URL columns to session_exercises.
-- Run once in Supabase SQL Editor.
ALTER TABLE session_exercises
  ADD COLUMN IF NOT EXISTS illustration_url text,
  ADD COLUMN IF NOT EXISTS video_url        text;

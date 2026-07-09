-- Add illustration and video URL columns to session_exercises.
-- Run once in Supabase SQL Editor.
ALTER TABLE session_exercises
  ADD COLUMN IF NOT EXISTS illustration_url text,
  ADD COLUMN IF NOT EXISTS video_url        text;

-- Storage bucket for exercise illustration images.
-- Create this manually in Supabase Dashboard → Storage → New bucket:
--   Name: exercise-media
--   Public: true  (so illustration_url public URLs resolve without auth)
--
-- Or run via the Supabase Management API / CLI:
--   supabase storage create exercise-media --public

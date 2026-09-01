-- Cardio duration moves from being fixed on the library card to being set
-- per assignment (like equipment/variation is for exercises) — a client_schedule_items
-- row now carries its own duration_minutes, chosen when the coach assigns
-- that cardio session to a client's day.
-- Also lets clients read the cardio_sessions their own schedule references,
-- so the client app can show a detail card the same way exercises do.
-- Run once in Supabase SQL Editor.

ALTER TABLE client_schedule_items
  ADD COLUMN IF NOT EXISTS duration_minutes int;

DROP POLICY IF EXISTS "cardio_sessions_client_read" ON cardio_sessions;
CREATE POLICY "cardio_sessions_client_read" ON cardio_sessions
  FOR SELECT USING (
    id IN (
      SELECT cardio_session_id FROM client_schedule_items
      WHERE cardio_session_id IS NOT NULL AND client_id = auth.uid()
    )
  );

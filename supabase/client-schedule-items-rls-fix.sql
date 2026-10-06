-- Fixes a pre-existing bug in client_schedule_items' read policy: it compared client_id
-- (a clients.id value) directly against auth.uid() (the logged-in user's own auth/profile id) —
-- two different UUIDs that never match, since a client's auth identity lives on
-- clients.profile_id, not clients.id itself. This meant no client has ever actually been able to
-- read their own schedule items (workouts, cardio, HIIT, rest days) via RLS — any place in the
-- app reading this table as the client (not through a SECURITY DEFINER RPC) got zero rows,
-- silently. The same mistake was copied into cardio_sessions' client-read policy. hiit_circuits
-- never had a client-read policy at all. Run this once in the Supabase SQL Editor.

DROP POLICY IF EXISTS "client_read" ON client_schedule_items;
CREATE POLICY "client_read" ON client_schedule_items
  FOR SELECT USING (
    client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid())
  );

DROP POLICY IF EXISTS "cardio_sessions_client_read" ON cardio_sessions;
CREATE POLICY "cardio_sessions_client_read" ON cardio_sessions
  FOR SELECT USING (
    id IN (
      SELECT csi.cardio_session_id FROM client_schedule_items csi
      JOIN clients c ON c.id = csi.client_id
      WHERE csi.cardio_session_id IS NOT NULL AND c.profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "hiit_circuits_client_read" ON hiit_circuits;
CREATE POLICY "hiit_circuits_client_read" ON hiit_circuits
  FOR SELECT USING (
    id IN (
      SELECT csi.hiit_circuit_id FROM client_schedule_items csi
      JOIN clients c ON c.id = csi.client_id
      WHERE csi.hiit_circuit_id IS NOT NULL AND c.profile_id = auth.uid()
    )
  );

-- Replace the complex nested-subquery client read policy for training_programs
-- with a simpler coach_id bridge.  The nested approach (via client_training_assignments)
-- can silently return no rows due to RLS evaluation order.
-- Clients may read any program that belongs to their coach — this is safe and simpler.
DROP POLICY IF EXISTS "training_programs_client_read" ON training_programs;
CREATE POLICY "training_programs_client_read"
  ON training_programs FOR SELECT
  USING (
    coach_id IN (
      SELECT coach_id FROM clients WHERE profile_id = auth.uid()
    )
  );

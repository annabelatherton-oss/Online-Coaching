-- Fix 1: blocks were seeded with weeks_total = 1 — update all to 12
UPDATE training_programs
SET weeks_total = 12
WHERE weeks_total = 1;

-- Fix 2: allow clients to read training programs they are assigned to,
-- so the check-in page can fetch the program's top_lifts for the lifts section
CREATE POLICY "training_programs_client_read"
  ON training_programs FOR SELECT
  USING (
    id IN (
      SELECT program_id
      FROM client_training_assignments
      WHERE active = true
        AND client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid())
    )
  );

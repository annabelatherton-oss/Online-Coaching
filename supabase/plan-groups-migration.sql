-- Tracks the shared current week — all clients on a plan follow this simultaneously

CREATE TABLE IF NOT EXISTS plan_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid REFERENCES profiles(id),
  name text NOT NULL,
  current_week integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE plan_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coach manages own plan groups"
  ON plan_groups FOR ALL
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "clients view plan group for their assignment"
  ON plan_groups FOR SELECT
  USING (
    id IN (
      SELECT plan_group_id FROM client_plan_assignments
      WHERE client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid())
    )
  );

-- week_override: null = follow plan's current_week, integer = this client is on a specific week
ALTER TABLE client_plan_assignments ADD COLUMN IF NOT EXISTS week_override integer DEFAULT NULL;

-- start_date is now optional (just records when client was assigned)
ALTER TABLE client_plan_assignments ALTER COLUMN start_date DROP NOT NULL;
ALTER TABLE client_plan_assignments ALTER COLUMN start_date SET DEFAULT NULL;

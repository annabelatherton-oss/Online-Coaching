-- Groups 20 generated weeks into a named plan set, and tracks which plan is assigned to which client

ALTER TABLE weekly_templates ADD COLUMN IF NOT EXISTS plan_group_id uuid DEFAULT NULL;
ALTER TABLE weekly_templates ADD COLUMN IF NOT EXISTS plan_group_name text DEFAULT NULL;

CREATE TABLE IF NOT EXISTS client_plan_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  coach_id uuid REFERENCES profiles(id),
  plan_group_id uuid NOT NULL,
  plan_group_name text,
  calorie_target integer,
  start_date date NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE client_plan_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coach manages own client plan assignments"
  ON client_plan_assignments FOR ALL
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "clients view own plan assignment"
  ON client_plan_assignments FOR SELECT
  USING (
    client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid())
  );

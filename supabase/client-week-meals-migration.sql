-- Stores per-client meal selections per week (includes any coach overrides/special meals)

CREATE TABLE IF NOT EXISTS client_week_meals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  coach_id uuid REFERENCES profiles(id),
  assignment_id uuid REFERENCES client_plan_assignments(id) ON DELETE CASCADE,
  week_number integer NOT NULL,
  slots jsonb NOT NULL DEFAULT '{}',  -- { breakfast1: meal_id, lunch1: meal_id, ... }
  created_at timestamptz DEFAULT now(),
  CONSTRAINT client_week_meals_assignment_week_unique UNIQUE (assignment_id, week_number)
);

ALTER TABLE client_week_meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coach manages client week meals"
  ON client_week_meals FOR ALL
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "clients view own week meals"
  ON client_week_meals FOR SELECT
  USING (client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid()));

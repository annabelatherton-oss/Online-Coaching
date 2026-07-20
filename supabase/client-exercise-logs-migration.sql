-- Client workout logging: actual weights and reps per exercise per week
CREATE TABLE IF NOT EXISTS client_exercise_logs (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id           uuid        NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  session_exercise_id uuid        NOT NULL REFERENCES session_exercises(id) ON DELETE CASCADE,
  week_number         int         NOT NULL,
  weight_kg           numeric,
  reps_completed      text,
  notes               text,
  logged_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, session_exercise_id, week_number)
);

ALTER TABLE client_exercise_logs ENABLE ROW LEVEL SECURITY;

-- Clients can read and write their own logs
CREATE POLICY "client_exercise_logs_client" ON client_exercise_logs
  FOR ALL
  USING  (client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid()))
  WITH CHECK (client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid()));

-- Coaches can read logs for their clients
CREATE POLICY "client_exercise_logs_coach" ON client_exercise_logs
  FOR SELECT
  USING (client_id IN (SELECT id FROM clients WHERE coach_id = auth.uid()));

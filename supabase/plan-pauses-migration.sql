-- Holiday pause requests: clients request, coach must approve before the pause is active.
-- Coach can approve retrospectively (no date restriction on their side).
CREATE TABLE plan_pauses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  return_date date NOT NULL,
  first_checkin_date date NOT NULL,
  weeks_paused int NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'completed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE plan_pauses ENABLE ROW LEVEL SECURITY;

-- Clients manage their own pause requests
CREATE POLICY "clients_manage_own_pauses" ON plan_pauses
  FOR ALL USING (
    client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid())
  );

-- Coaches can read pauses for their clients
CREATE POLICY "coach_read_client_pauses" ON plan_pauses
  FOR SELECT USING (
    client_id IN (SELECT id FROM clients WHERE coach_id = auth.uid())
  );

-- Coaches can approve, reject, or mark completed
CREATE POLICY "coach_update_client_pauses" ON plan_pauses
  FOR UPDATE USING (
    client_id IN (SELECT id FROM clients WHERE coach_id = auth.uid())
  );

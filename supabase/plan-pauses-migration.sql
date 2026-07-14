-- Holiday pause requests: clients can request a plan pause when going on holiday.
-- Weeks paused is auto-calculated based on when their first available check-in is
-- (check-ins happen Fri–Sun; returning Mon–Thu = that week's Fri; Thu–Sun = following Fri).
CREATE TABLE plan_pauses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  return_date date NOT NULL,
  first_checkin_date date NOT NULL,
  weeks_paused int NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
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

-- Coaches can update status (mark completed/cancelled)
CREATE POLICY "coach_update_client_pauses" ON plan_pauses
  FOR UPDATE USING (
    client_id IN (SELECT id FROM clients WHERE coach_id = auth.uid())
  );

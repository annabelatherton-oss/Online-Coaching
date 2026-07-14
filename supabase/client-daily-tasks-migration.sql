-- Daily task tracker for clients
-- task_type: 'system' (macros/water/sleep/steps/training/cardio) | 'custom' (client-added)
-- task_key: identifies system tasks; null for custom tasks
-- is_private: custom tasks can be hidden from coach

CREATE TABLE IF NOT EXISTS client_daily_tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  task_date date NOT NULL,
  task_type text NOT NULL CHECK (task_type IN ('system', 'custom')),
  task_key text,
  label text,
  completed boolean NOT NULL DEFAULT false,
  notes text,
  is_private boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- One row per system task per client per date
CREATE UNIQUE INDEX IF NOT EXISTS client_daily_tasks_system_uniq
  ON client_daily_tasks (client_id, task_date, task_key)
  WHERE task_type = 'system' AND task_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS client_daily_tasks_date_idx
  ON client_daily_tasks (client_id, task_date);

ALTER TABLE client_daily_tasks ENABLE ROW LEVEL SECURITY;

-- Clients can manage all their own tasks
CREATE POLICY "client_manage_own_tasks" ON client_daily_tasks
  FOR ALL
  USING (client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid()))
  WITH CHECK (client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid()));

-- Coaches can only view non-private tasks for their clients
CREATE POLICY "coach_view_public_tasks" ON client_daily_tasks
  FOR SELECT
  USING (
    is_private = false
    AND client_id IN (SELECT id FROM clients WHERE coach_id = auth.uid())
  );

-- Client weekly schedule items: workouts, HIIT, and cardio per day
-- Run this in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS client_schedule_items (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  coach_id uuid NOT NULL,
  day_of_week text NOT NULL CHECK (day_of_week IN ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')),
  item_type text NOT NULL CHECK (item_type IN ('workout', 'hiit', 'cardio')),
  workout_id uuid REFERENCES workouts(id) ON DELETE SET NULL,
  hiit_circuit_id uuid REFERENCES hiit_circuits(id) ON DELETE SET NULL,
  cardio_session_id uuid REFERENCES cardio_sessions(id) ON DELETE SET NULL,
  custom_label text,
  notes text,
  order_index int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE client_schedule_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coach_full_access" ON client_schedule_items
  FOR ALL USING (coach_id = auth.uid()) WITH CHECK (coach_id = auth.uid());

CREATE POLICY "client_read" ON client_schedule_items
  FOR SELECT USING (client_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_client_schedule_client ON client_schedule_items (client_id, day_of_week, item_type);

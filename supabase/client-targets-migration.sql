-- Per-client daily habit targets (shown on client's My Daily Plan page)
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS steps_target int DEFAULT 10000,
  ADD COLUMN IF NOT EXISTS water_target_litres numeric(4,1) DEFAULT 2.5,
  ADD COLUMN IF NOT EXISTS sleep_target_hours numeric(3,1) DEFAULT 8.0;

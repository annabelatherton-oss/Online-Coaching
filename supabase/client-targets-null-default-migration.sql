-- Make habit targets opt-in: NULL = not assigned = won't appear on client's daily plan
-- Change column defaults to NULL
ALTER TABLE clients
  ALTER COLUMN steps_target SET DEFAULT NULL,
  ALTER COLUMN water_target_litres SET DEFAULT NULL,
  ALTER COLUMN sleep_target_hours SET DEFAULT NULL;

-- Clear values set automatically by the previous migration's defaults
-- (coaches haven't had time to set these yet, so reset all to NULL)
UPDATE clients SET
  steps_target = NULL,
  water_target_litres = NULL,
  sleep_target_hours = NULL;

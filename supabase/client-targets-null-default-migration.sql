-- Restore default habit targets for all clients
-- Steps/water/sleep always appear on the daily plan; coaches can customise per client
ALTER TABLE clients
  ALTER COLUMN steps_target SET DEFAULT 10000,
  ALTER COLUMN water_target_litres SET DEFAULT 2.5,
  ALTER COLUMN sleep_target_hours SET DEFAULT 8.0;

-- Set defaults for any clients that were previously cleared to NULL
UPDATE clients SET steps_target = 10000 WHERE steps_target IS NULL;
UPDATE clients SET water_target_litres = 2.5 WHERE water_target_litres IS NULL;
UPDATE clients SET sleep_target_hours = 8.0 WHERE sleep_target_hours IS NULL;

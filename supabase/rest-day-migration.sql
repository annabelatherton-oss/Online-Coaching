-- Allow 'rest' as a valid item_type for rest days and active rest days
-- custom_label stores 'Rest Day' or 'Active Rest Day'
ALTER TABLE client_schedule_items
  DROP CONSTRAINT IF EXISTS client_schedule_items_item_type_check;

ALTER TABLE client_schedule_items
  ADD CONSTRAINT client_schedule_items_item_type_check
  CHECK (item_type IN ('workout', 'hiit', 'cardio', 'rest'));

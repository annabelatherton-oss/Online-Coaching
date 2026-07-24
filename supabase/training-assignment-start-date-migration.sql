-- Allow the coach to set a custom start date for a training block.
-- Without this, the block week is calculated from created_at, which can't be edited.
ALTER TABLE client_training_assignments
  ADD COLUMN IF NOT EXISTS start_date date;

-- Backfill existing rows to preserve current behaviour
UPDATE client_training_assignments
  SET start_date = created_at::date
  WHERE start_date IS NULL;

-- Allow a coach to open the check-in window early for a specific client.
-- The flag is read by the client's check-in page and cleared automatically
-- once the client submits.
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS checkin_early_access boolean DEFAULT false;

-- Lets a coach prepare a client's NEXT meal plan / training block in advance, to start
-- automatically on a chosen future Monday, without touching whatever's currently active for that
-- client until then — see the Meal Plan / Training tabs' assign forms ("Start now" vs "Schedule a
-- future Monday"), and the activate-scheduled-assignments function/cron job below, which is what
-- actually flips a scheduled row live on the morning it's due.
--
-- scheduled_start distinguishes a row inserted this way (never yet been the active one) from an
-- ordinary already-replaced assignment, which also ends up active=false — start_date alone can't
-- tell them apart, since a replaced row's start_date is always in the past too by the time it's
-- inactive. Only a scheduled_start=true row should ever be picked up and activated by the cron job.
ALTER TABLE client_plan_assignments ADD COLUMN IF NOT EXISTS scheduled_start boolean NOT NULL DEFAULT false;
ALTER TABLE client_training_assignments ADD COLUMN IF NOT EXISTS scheduled_start boolean NOT NULL DEFAULT false;

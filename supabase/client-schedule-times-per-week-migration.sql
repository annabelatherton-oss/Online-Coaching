-- How many times a week a flexible ("Any day") cardio item needs completing. Day-specific items
-- just leave this at the default of 1 (they already have their own fixed day).
ALTER TABLE client_schedule_items ADD COLUMN IF NOT EXISTS times_per_week integer NOT NULL DEFAULT 1;

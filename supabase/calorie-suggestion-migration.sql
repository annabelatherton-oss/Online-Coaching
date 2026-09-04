-- Adds the client attributes needed to suggest a calorie target: sex and age
-- (age already derivable from date_of_birth) feed the BMR estimate, activity
-- level feeds the TDEE multiplier, and goal_type is what the coach sets on the
-- client's Overview tab ("cutting" / "maintaining" / "bulking") to say what
-- the suggestion should be aiming for.

alter table clients add column if not exists sex text check (sex in ('male', 'female'));
alter table clients add column if not exists activity_level text check (activity_level in ('sedentary', 'light', 'moderate', 'very_active', 'extra_active'));
alter table clients add column if not exists goal_type text check (goal_type in ('cut', 'maintain', 'bulk'));

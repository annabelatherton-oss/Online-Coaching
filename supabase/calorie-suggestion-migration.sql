-- Adds the client attributes needed to suggest a calorie target: sex and age
-- (age already derivable from date_of_birth) feed the BMR estimate, activity
-- level feeds the TDEE multiplier, and goal_type is what the coach sets on the
-- client's Overview tab ("cutting" / "maintaining" / "bulking") to say what
-- the suggestion should be aiming for.

alter table clients add column if not exists sex text check (sex in ('male', 'female'));
alter table clients add column if not exists activity_level text check (activity_level in ('sedentary', 'light', 'moderate', 'very_active', 'extra_active'));
alter table clients add column if not exists goal_type text check (goal_type in ('cut', 'maintain', 'bulk'));

-- New clients default to 12 weeks of access instead of 4 — the app already sends this
-- explicitly on every insert, so this is just keeping the column's own default in sync.
alter table clients alter column access_weeks set default 12;

-- New clients now default to "moderate" activity level (app sends this explicitly on every
-- insert going forward). Optional one-time backfill for existing clients with none set yet —
-- safe to run even if you'd rather leave some blank, since it only touches null rows.
update clients set activity_level = 'moderate' where activity_level is null;

-- Per-phase macro split overrides (cut/maintain/bulk), editable in Settings — e.g.
-- { "cut": { "carbs": 40, "protein": 40, "fat": 20 }, "bulk": { ... }, "maintain": { ... } }.
-- Null/missing phases fall back to the app's hardcoded defaults.
alter table profiles add column if not exists goal_macro_splits jsonb;

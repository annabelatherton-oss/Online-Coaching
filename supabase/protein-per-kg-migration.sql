-- Coach-editable standard for the bodyweight-based protein target shown on meal-plan/ingredient
-- screens (replaces treating protein as a % of calories, which doesn't scale correctly with how
-- much muscle a client is actually carrying). Defaults to the widely-used 2g per kg bodyweight;
-- editable in Settings alongside the existing goal-phase carbs/fat splits.
alter table profiles
  add column if not exists protein_g_per_kg numeric(4,2) not null default 2;

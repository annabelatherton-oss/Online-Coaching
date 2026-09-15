-- Lets a plan group's default pre-workout / evening-snack meal be set independently per calorie
-- tier, instead of one value shared by the Standard template and every tier. The Standard scope
-- keeps using the existing default_preworkout_meal_id / default_evening_snack_meal_id columns;
-- these new jsonb columns hold the per-tier overrides, keyed by tier (e.g. {"1800": "<meal_id>"}).
alter table plan_groups add column if not exists default_preworkout_by_tier jsonb not null default '{}'::jsonb;
alter table plan_groups add column if not exists default_evening_snack_by_tier jsonb not null default '{}'::jsonb;

-- Per-client override for how "Auto" portion sizing splits the calories remaining (after
-- pre-workout & evening snack) across breakfast/lunch/dinner. Null = use the app's standard split.
ALTER TABLE client_plan_assignments ADD COLUMN IF NOT EXISTS calorie_split jsonb DEFAULT NULL;

-- Pre-workout and evening snack now keep one fixed, coach-set size each instead of being resized
-- by Auto mode's search — the app treats a null value here as 'Medium'.
ALTER TABLE client_plan_assignments ADD COLUMN IF NOT EXISTS preworkout_variant text CHECK (preworkout_variant IN ('XS', 'Small', 'Medium', 'Large', 'XL'));
ALTER TABLE client_plan_assignments ADD COLUMN IF NOT EXISTS evening_snack_variant text CHECK (evening_snack_variant IN ('XS', 'Small', 'Medium', 'Large', 'XL'));

ALTER TABLE client_plan_assignments ADD COLUMN IF NOT EXISTS preworkout_meal_id uuid REFERENCES meals(id);
ALTER TABLE client_plan_assignments ADD COLUMN IF NOT EXISTS evening_snack_meal_id uuid REFERENCES meals(id);
ALTER TABLE client_plan_assignments ADD COLUMN IF NOT EXISTS static_ingredient_overrides jsonb DEFAULT '{}';

ALTER TABLE client_week_meals ADD COLUMN IF NOT EXISTS ingredient_overrides jsonb DEFAULT '{}';

-- Pre-workout and evening-snack now come from the plan template by default (same meal every
-- week, scaled to the client's calorie tier). These flags let a coach override just one client
-- onto a fixed meal (stored in the existing preworkout_meal_id/evening_snack_meal_id columns)
-- without affecting the shared template or having to re-set it every week.
ALTER TABLE client_plan_assignments ADD COLUMN IF NOT EXISTS preworkout_static boolean DEFAULT false;
ALTER TABLE client_plan_assignments ADD COLUMN IF NOT EXISTS evening_snack_static boolean DEFAULT false;

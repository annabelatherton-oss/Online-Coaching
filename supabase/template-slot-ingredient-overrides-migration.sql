-- Lets the coach adjust ingredient quantities for one specific week's occurrence of a meal in
-- the 50-week rotation, without changing the meal's shared default recipe used by every other
-- week that shows the same meal. Mirrors the same override pattern already used for a client's
-- own per-week meal-plan adjustments (client_week_meals.ingredient_overrides).
alter table template_meal_slots
  add column if not exists ingredient_overrides jsonb;

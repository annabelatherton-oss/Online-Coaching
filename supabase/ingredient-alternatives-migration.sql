-- Each meal ingredient can have one or more interchangeable alternatives from the library.
-- When generating calorie-tier versions the solver tries every combination and picks whichever
-- swap gets the meal closest to that tier's calorie sub-target.

CREATE TABLE IF NOT EXISTS meal_ingredient_alternatives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_ingredient_id uuid NOT NULL REFERENCES meal_ingredients(id) ON DELETE CASCADE,
  ingredient_id uuid NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meal_ingredient_alternatives_meal_ingredient_id
  ON meal_ingredient_alternatives(meal_ingredient_id);

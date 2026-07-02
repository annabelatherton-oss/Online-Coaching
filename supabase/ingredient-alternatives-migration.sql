-- Store alternative ingredient IDs directly on meal_ingredients as a simple array.
-- This avoids a separate join table and loads with the ingredient in one query.
-- The meal_ingredient_alternatives table approach is replaced by this simpler column.

ALTER TABLE meal_ingredients
  ADD COLUMN IF NOT EXISTS alternative_ingredient_ids uuid[] DEFAULT '{}';

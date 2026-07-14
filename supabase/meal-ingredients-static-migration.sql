-- Add is_static column to meal_ingredients and meal_tier_ingredients.
-- A static ingredient cannot be edited or removed from any view; its quantity
-- is fixed across all clients and applies to every calorie-tier version.
ALTER TABLE meal_ingredients
  ADD COLUMN IF NOT EXISTS is_static boolean NOT NULL DEFAULT false;

ALTER TABLE meal_tier_ingredients
  ADD COLUMN IF NOT EXISTS is_static boolean NOT NULL DEFAULT false;

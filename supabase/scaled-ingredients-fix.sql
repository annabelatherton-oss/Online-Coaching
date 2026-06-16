-- Add missing name column to meal_scaled_ingredients
ALTER TABLE meal_scaled_ingredients ADD COLUMN IF NOT EXISTS name text;

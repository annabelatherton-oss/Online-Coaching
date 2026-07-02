-- Allow 'optional' as a third scaling_type value alongside 'flexible' and 'fixed'.
-- Optional ingredients scale like flexible but can be fully removed (quantity → 0)
-- when the solver would reduce them below one serving step.

ALTER TABLE meal_ingredients
  DROP CONSTRAINT IF EXISTS meal_ingredients_scaling_type_check;

ALTER TABLE meal_ingredients
  ADD CONSTRAINT meal_ingredients_scaling_type_check
  CHECK (scaling_type IN ('flexible', 'fixed', 'optional'));

ALTER TABLE meal_tier_ingredients
  DROP CONSTRAINT IF EXISTS meal_tier_ingredients_scaling_type_check;

ALTER TABLE meal_tier_ingredients
  ADD CONSTRAINT meal_tier_ingredients_scaling_type_check
  CHECK (scaling_type IN ('flexible', 'fixed', 'optional'));

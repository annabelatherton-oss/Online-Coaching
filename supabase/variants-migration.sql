-- Add description and active status to meals
ALTER TABLE meals
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;

-- Add unit and scaling_type to meal_ingredients
-- scaling_type: 'flexible' = scales with variant, 'fixed' = stays same (veggies, spices, sauces)
ALTER TABLE meal_ingredients
  ADD COLUMN IF NOT EXISTS unit text DEFAULT 'g',
  ADD COLUMN IF NOT EXISTS scaling_type text DEFAULT 'flexible' CHECK (scaling_type IN ('flexible', 'fixed'));

-- Meal size variants (XS / Small / Medium / Large / XL)
CREATE TABLE IF NOT EXISTS meal_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id uuid NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
  variant_name text NOT NULL CHECK (variant_name IN ('XS', 'Small', 'Medium', 'Large', 'XL')),
  calories numeric DEFAULT 0,
  protein_g numeric DEFAULT 0,
  carbs_g numeric DEFAULT 0,
  fat_g numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(meal_id, variant_name)
);

-- Ingredients per variant
CREATE TABLE IF NOT EXISTS meal_variant_ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id uuid NOT NULL REFERENCES meal_variants(id) ON DELETE CASCADE,
  ingredient_id uuid REFERENCES ingredients(id),
  name text NOT NULL,
  quantity_g numeric DEFAULT 0,
  unit text DEFAULT 'g',
  calories numeric DEFAULT 0,
  protein_g numeric DEFAULT 0,
  carbs_g numeric DEFAULT 0,
  fat_g numeric DEFAULT 0,
  scaling_type text DEFAULT 'flexible' CHECK (scaling_type IN ('flexible', 'fixed')),
  created_at timestamptz DEFAULT now()
);

-- Store the auto-selected or coach-overridden variant per client assignment
ALTER TABLE client_plan_assignments
  ADD COLUMN IF NOT EXISTS assigned_variant text CHECK (assigned_variant IN ('XS', 'Small', 'Medium', 'Large', 'XL'));

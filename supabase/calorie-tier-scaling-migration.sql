-- Replaces the discrete XS/Small/Medium/Large/XL meal-size system with continuous, calorie-tier-driven
-- ingredient scaling. Every meal gets one auto-generated (and coach-editable) ingredient set per
-- calorie tier (1500-2000) that's shared by every client assigned that exact tier — a portion tweak
-- only has to be made once instead of per client. The old meal_variants/meal_variant_ingredients
-- tables and the assigned_variant/preworkout_variant/evening_snack_variant/calorie_split columns are
-- left in place but are no longer read or written by the app.

CREATE TABLE IF NOT EXISTS meal_tier_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id uuid NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
  calorie_tier integer NOT NULL,
  calories numeric DEFAULT 0,
  protein_g numeric DEFAULT 0,
  carbs_g numeric DEFAULT 0,
  fat_g numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(meal_id, calorie_tier)
);

CREATE TABLE IF NOT EXISTS meal_tier_ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_version_id uuid NOT NULL REFERENCES meal_tier_versions(id) ON DELETE CASCADE,
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

ALTER TABLE meal_tier_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_tier_ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coach can manage tier versions"
  ON meal_tier_versions FOR ALL
  USING (EXISTS (SELECT 1 FROM meals m WHERE m.id = meal_tier_versions.meal_id AND m.coach_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM meals m WHERE m.id = meal_tier_versions.meal_id AND m.coach_id = auth.uid()));

CREATE POLICY "Client can read tier versions"
  ON meal_tier_versions FOR SELECT
  USING (EXISTS (SELECT 1 FROM meals m WHERE m.id = meal_tier_versions.meal_id AND m.coach_id = current_client_coach_id()));

CREATE POLICY "Coach can manage tier ingredients"
  ON meal_tier_ingredients FOR ALL
  USING (EXISTS (
    SELECT 1 FROM meal_tier_versions tv
    JOIN meals m ON m.id = tv.meal_id
    WHERE tv.id = meal_tier_ingredients.tier_version_id AND m.coach_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM meal_tier_versions tv
    JOIN meals m ON m.id = tv.meal_id
    WHERE tv.id = meal_tier_ingredients.tier_version_id AND m.coach_id = auth.uid()
  ));

CREATE POLICY "Client can read tier ingredients"
  ON meal_tier_ingredients FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM meal_tier_versions tv
    JOIN meals m ON m.id = tv.meal_id
    WHERE tv.id = meal_tier_ingredients.tier_version_id AND m.coach_id = current_client_coach_id()
  ));

-- Coach-wide standard % split across all 5 meal categories (must sum to 100) — replaces the
-- hardcoded breakfast/lunch/dinner-only DEFAULT_CALORIE_SPLIT and the per-client calorie_split
-- column, since one tier's generated ingredients now have to serve every client on that tier.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS meal_split jsonb
  DEFAULT '{"pre_workout":10,"breakfast":25,"lunch":30,"dinner":25,"evening_snack":10}'::jsonb;

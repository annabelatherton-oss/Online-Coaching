-- Rename "tin of beans" → "baked beans" everywhere
-- Run in Supabase SQL Editor

-- 1. Ingredient library entry
UPDATE ingredients
SET name = 'Baked Beans'
WHERE lower(name) IN ('tin of beans', 'beans', 'tin beans');

-- 2. Base meal ingredient rows (name is stored independently)
UPDATE meal_ingredients
SET name = 'Baked Beans'
WHERE lower(name) IN ('tin of beans', 'beans', 'tin beans');

-- 3. Calorie-tier scaled ingredient rows
UPDATE meal_tier_ingredients
SET name = 'Baked Beans'
WHERE lower(name) IN ('tin of beans', 'beans', 'tin beans');

-- Check what was updated (run the SELECT after to verify)
SELECT 'ingredients' AS tbl, id, name FROM ingredients WHERE lower(name) = 'baked beans'
UNION ALL
SELECT 'meal_ingredients', id::text, name FROM meal_ingredients WHERE lower(name) = 'baked beans'
UNION ALL
SELECT 'meal_tier_ingredients', id::text, name FROM meal_tier_ingredients WHERE lower(name) = 'baked beans';

-- Part 2 of 2 — run ingredient-realistic-min-max-migration-part1.sql first.
-- Same rules as part 1: COALESCE only fills currently-NULL values, and won't touch anything
-- you've set by hand.

-- ── Fats / oils / spreads ────────────────────────────────────────────────────
UPDATE ingredients SET
  min_amount = COALESCE(min_amount, 5), max_amount = COALESCE(max_amount, 20)
WHERE serving_unit IN ('g','ml') AND (name ILIKE '%oil%' OR name ILIKE '%butter%' OR name ILIKE '%margarine%' OR name ILIKE '%mayonnaise%' OR name ILIKE '%mayo%') AND name NOT ILIKE '%peanut butter%' AND name NOT ILIKE '%almond butter%' AND name NOT ILIKE '%cashew butter%' AND name NOT ILIKE '%nut butter%';

UPDATE ingredients SET
  min_amount = COALESCE(min_amount, 10), max_amount = COALESCE(max_amount, 30)
WHERE serving_unit IN ('g','ml') AND (name ILIKE '%peanut butter%' OR name ILIKE '%almond butter%' OR name ILIKE '%cashew butter%' OR name ILIKE '%nut butter%');

-- ── Nuts / seeds ─────────────────────────────────────────────────────────────
UPDATE ingredients SET
  min_amount = COALESCE(min_amount, 15), max_amount = COALESCE(max_amount, 40)
WHERE serving_unit IN ('g','ml') AND (
  name ILIKE '%almond%' OR name ILIKE '%walnut%' OR name ILIKE '%cashew%' OR name ILIKE '%peanut%' OR
  name ILIKE '%pistachio%' OR name ILIKE '%pecan%' OR name ILIKE '%hazelnut%' OR name ILIKE '%mixed nut%' OR name ILIKE '%macadamia%'
) AND name NOT ILIKE '%butter%' AND name NOT ILIKE '%milk%';

UPDATE ingredients SET
  min_amount = COALESCE(min_amount, 5), max_amount = COALESCE(max_amount, 20)
WHERE serving_unit IN ('g','ml') AND (name ILIKE '%chia seed%' OR name ILIKE '%flax seed%' OR name ILIKE '%linseed%' OR name ILIKE '%sunflower seed%' OR name ILIKE '%pumpkin seed%' OR name ILIKE '%sesame seed%');

-- ── Fruit ────────────────────────────────────────────────────────────────────
UPDATE ingredients SET
  min_amount = COALESCE(min_amount, 1), max_amount = COALESCE(max_amount, 2)
WHERE serving_unit NOT IN ('g','ml') AND (name ILIKE '%banana%' OR name ILIKE '%apple%' OR name ILIKE '%orange%' OR name ILIKE '%pear%' OR name ILIKE '%avocado%');

UPDATE ingredients SET
  min_amount = COALESCE(min_amount, 50), max_amount = COALESCE(max_amount, 150)
WHERE serving_unit IN ('g','ml') AND (
  name ILIKE '%banana%' OR name ILIKE '%apple%' OR name ILIKE '%orange%' OR name ILIKE '%pear%' OR name ILIKE '%avocado%' OR
  name ILIKE '%strawberr%' OR name ILIKE '%blueberr%' OR name ILIKE '%raspberr%' OR name ILIKE '%blackberr%' OR
  name ILIKE '%grape%' OR name ILIKE '%mango%' OR name ILIKE '%pineapple%' OR name ILIKE '%kiwi%' OR name ILIKE '%melon%' OR name ILIKE '%berries%'
);

-- ── Vegetables ───────────────────────────────────────────────────────────────
UPDATE ingredients SET
  min_amount = COALESCE(min_amount, 30), max_amount = COALESCE(max_amount, 150)
WHERE serving_unit IN ('g','ml') AND (name ILIKE '%spinach%' OR name ILIKE '%kale%' OR name ILIKE '%lettuce%' OR name ILIKE '%rocket%' OR name ILIKE '%salad leaves%' OR name ILIKE '%salad leaf%');

UPDATE ingredients SET
  min_amount = COALESCE(min_amount, 40), max_amount = COALESCE(max_amount, 150)
WHERE serving_unit IN ('g','ml') AND (name ILIKE '%sweetcorn%' OR name ILIKE '%peas%');

UPDATE ingredients SET
  min_amount = COALESCE(min_amount, 50), max_amount = COALESCE(max_amount, 250)
WHERE serving_unit IN ('g','ml') AND (
  name ILIKE '%broccoli%' OR name ILIKE '%cauliflower%' OR name ILIKE '%pepper%' OR name ILIKE '%carrot%' OR
  name ILIKE '%courgette%' OR name ILIKE '%zucchini%' OR name ILIKE '%mushroom%' OR name ILIKE '%onion%' OR
  name ILIKE '%tomato%' OR name ILIKE '%cucumber%' OR name ILIKE '%asparagus%' OR name ILIKE '%cabbage%' OR
  name ILIKE '%green bean%' OR name ILIKE '%aubergine%' OR name ILIKE '%squash%' OR name ILIKE '%leek%'
);

-- ── Legumes ──────────────────────────────────────────────────────────────────
UPDATE ingredients SET
  min_amount = COALESCE(min_amount, 50), max_amount = COALESCE(max_amount, 200)
WHERE serving_unit IN ('g','ml') AND (name ILIKE '%chickpea%' OR name ILIKE '%lentil%' OR name ILIKE '%kidney bean%' OR name ILIKE '%black bean%' OR name ILIKE '%butter bean%' OR name ILIKE '%baked bean%' OR name ILIKE '%bean%');

-- ── Condiments / sauces / sweeteners ─────────────────────────────────────────
UPDATE ingredients SET
  min_amount = COALESCE(min_amount, 5), max_amount = COALESCE(max_amount, 30)
WHERE serving_unit IN ('g','ml') AND (
  name ILIKE '%ketchup%' OR name ILIKE '%bbq sauce%' OR name ILIKE '%soy sauce%' OR name ILIKE '%sriracha%' OR
  name ILIKE '%mustard%' OR name ILIKE '%vinegar%' OR name ILIKE '%honey%' OR name ILIKE '%maple syrup%' OR
  name ILIKE '%agave%' OR name ILIKE '%jam%' OR name ILIKE '%salsa%' OR name ILIKE '%pesto%'
);

-- ── Protein powder / shakes — scoops ─────────────────────────────────────────
UPDATE ingredients SET
  min_amount = COALESCE(min_amount, 1), max_amount = COALESCE(max_amount, 2)
WHERE (name ILIKE '%protein powder%' OR name ILIKE '%whey%' OR name ILIKE '%casein%') AND serving_unit NOT IN ('g','ml');

UPDATE ingredients SET
  min_amount = COALESCE(min_amount, 20), max_amount = COALESCE(max_amount, 60)
WHERE serving_unit IN ('g','ml') AND (name ILIKE '%protein powder%' OR name ILIKE '%whey%' OR name ILIKE '%casein%');

-- ── Catch-all fallback — anything still unset, scaled off its own serving_size ──
-- Rough approximation only (0.4x-2.5x its listed serving, or 1-3 units for discrete items) —
-- review these individually afterward, they were never matched to a real-world category above.
UPDATE ingredients SET
  min_amount = COALESCE(min_amount, CASE WHEN serving_unit IN ('g','ml') THEN GREATEST(5, ROUND((serving_size * 0.4)::numeric, 0)) ELSE 1 END),
  max_amount = COALESCE(max_amount, CASE WHEN serving_unit IN ('g','ml') THEN ROUND((serving_size * 2.5)::numeric, 0) ELSE 3 END)
WHERE min_amount IS NULL OR max_amount IS NULL;

-- ── Review everything afterward ──────────────────────────────────────────────
-- SELECT name, serving_size, serving_unit, min_amount, max_amount
-- FROM ingredients
-- ORDER BY name;

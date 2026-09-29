-- Populates min_amount/max_amount with realistic single-meal serving bounds, so the automated
-- calorie-tier scaling (snapToConstraints in src/lib/calorieTierScaling.js) can never push an
-- ingredient to an unrealistic amount (e.g. 20g of uncooked rice, or 400g of peanut butter) while
-- it's stretching/shrinking a meal to hit a tier's calorie target.
--
-- Matching is by ingredient NAME keyword, since there's no food-group column to key off. This is
-- necessarily a best-effort pass — it can't see your exact ingredient list, so after running it,
-- skim the "review everything" query at the very bottom and hand-adjust anything that looks off
-- in the Ingredients Library. Every UPDATE below only fills in a value that's currently NULL
-- (via COALESCE) — it never overwrites a min/max you've already set by hand.
--
-- More specific patterns run first (e.g. "cooked rice" before "rice") so the generic version's
-- COALESCE finds the value already set and leaves it alone.

-- ── Grains / starches — dry weight ──────────────────────────────────────────
UPDATE ingredients SET
  min_amount = COALESCE(min_amount, 100), max_amount = COALESCE(max_amount, 250)
WHERE serving_unit IN ('g','ml') AND (name ILIKE '%cooked rice%' OR name ILIKE '%rice (cooked)%' OR name ILIKE '%cooked pasta%' OR name ILIKE '%cooked noodle%');

UPDATE ingredients SET
  min_amount = COALESCE(min_amount, 40), max_amount = COALESCE(max_amount, 90)
WHERE serving_unit IN ('g','ml') AND (
  name ILIKE '%rice%' OR name ILIKE '%quinoa%' OR name ILIKE '%couscous%' OR name ILIKE '%bulgur%' OR name ILIKE '%barley%' OR name ILIKE '%freekeh%'
) AND name NOT ILIKE '%cake%' AND name NOT ILIKE '%pudding%' AND name NOT ILIKE '%milk%';

UPDATE ingredients SET
  min_amount = COALESCE(min_amount, 50), max_amount = COALESCE(max_amount, 100)
WHERE serving_unit IN ('g','ml') AND (name ILIKE '%pasta%' OR name ILIKE '%noodle%' OR name ILIKE '%spaghetti%' OR name ILIKE '%penne%' OR name ILIKE '%fusilli%' OR name ILIKE '%macaroni%');

UPDATE ingredients SET
  min_amount = COALESCE(min_amount, 30), max_amount = COALESCE(max_amount, 80)
WHERE serving_unit IN ('g','ml') AND (name ILIKE '%oat%' OR name ILIKE '%porridge%' OR name ILIKE '%muesli%' OR name ILIKE '%granola%');

UPDATE ingredients SET
  min_amount = COALESCE(min_amount, 100), max_amount = COALESCE(max_amount, 350)
WHERE serving_unit IN ('g','ml') AND (name ILIKE '%potato%' OR name ILIKE '%yam%' OR name ILIKE '%plantain%') AND name NOT ILIKE '%crisp%' AND name NOT ILIKE '%chip%';

-- ── Bread / baked goods — discrete units ────────────────────────────────────
UPDATE ingredients SET
  min_amount = COALESCE(min_amount, 1), max_amount = COALESCE(max_amount, 4)
WHERE serving_unit NOT IN ('g','ml') AND (name ILIKE '%bread%' OR name ILIKE '%toast%' OR name ILIKE '%crumpet%' OR name ILIKE '%rice cake%' OR name ILIKE '%cracker%' OR name ILIKE '%crispbread%');

UPDATE ingredients SET
  min_amount = COALESCE(min_amount, 1), max_amount = COALESCE(max_amount, 2)
WHERE serving_unit NOT IN ('g','ml') AND (name ILIKE '%bagel%' OR name ILIKE '%wrap%' OR name ILIKE '%tortilla%' OR name ILIKE '%pitta%' OR name ILIKE '%pita%' OR name ILIKE '%roll%' OR name ILIKE '%bun%' OR name ILIKE '%muffin%');

-- ── Proteins — raw/base weight ───────────────────────────────────────────────
UPDATE ingredients SET
  min_amount = COALESCE(min_amount, 100), max_amount = COALESCE(max_amount, 250)
WHERE serving_unit IN ('g','ml') AND (
  name ILIKE '%chicken%' OR name ILIKE '%turkey%' OR name ILIKE '%beef%' OR name ILIKE '%steak%' OR name ILIKE '%mince%' OR
  name ILIKE '%pork%' OR name ILIKE '%lamb%' OR name ILIKE '%gammon%' OR name ILIKE '%ham%' OR name ILIKE '%bacon%' OR
  name ILIKE '%sausage%' OR name ILIKE '%venison%' OR name ILIKE '%duck%'
);

UPDATE ingredients SET
  min_amount = COALESCE(min_amount, 100), max_amount = COALESCE(max_amount, 200)
WHERE serving_unit IN ('g','ml') AND (
  name ILIKE '%salmon%' OR name ILIKE '%cod%' OR name ILIKE '%tuna%' OR name ILIKE '%haddock%' OR name ILIKE '%prawn%' OR
  name ILIKE '%shrimp%' OR name ILIKE '%tilapia%' OR name ILIKE '%mackerel%' OR name ILIKE '%trout%' OR name ILIKE '%white fish%'
) AND name NOT ILIKE '%oil%';

UPDATE ingredients SET
  min_amount = COALESCE(min_amount, 75), max_amount = COALESCE(max_amount, 250)
WHERE serving_unit IN ('g','ml') AND (name ILIKE '%tofu%' OR name ILIKE '%tempeh%' OR name ILIKE '%quorn%' OR name ILIKE '%seitan%');

UPDATE ingredients SET
  min_amount = COALESCE(min_amount, 1), max_amount = COALESCE(max_amount, 4)
WHERE name ILIKE '%egg%' AND name NOT ILIKE '%eggplant%';

-- ── Dairy ────────────────────────────────────────────────────────────────────
UPDATE ingredients SET
  min_amount = COALESCE(min_amount, 100), max_amount = COALESCE(max_amount, 400)
WHERE serving_unit IN ('g','ml') AND name ILIKE '%milk%' AND name NOT ILIKE '%coconut milk%' AND name NOT ILIKE '%milk chocolate%';

UPDATE ingredients SET
  min_amount = COALESCE(min_amount, 100), max_amount = COALESCE(max_amount, 300)
WHERE serving_unit IN ('g','ml') AND (name ILIKE '%yogurt%' OR name ILIKE '%yoghurt%' OR name ILIKE '%cottage cheese%' OR name ILIKE '%quark%' OR name ILIKE '%fromage frais%');

UPDATE ingredients SET
  min_amount = COALESCE(min_amount, 20), max_amount = COALESCE(max_amount, 60)
WHERE serving_unit IN ('g','ml') AND (name ILIKE '%cheddar%' OR name ILIKE '%mozzarella%' OR name ILIKE '%feta%' OR name ILIKE '%parmesan%' OR name ILIKE '%halloumi%' OR (name ILIKE '%cheese%' AND name NOT ILIKE '%cottage%' AND name NOT ILIKE '%cream cheese%'));

UPDATE ingredients SET
  min_amount = COALESCE(min_amount, 10), max_amount = COALESCE(max_amount, 40)
WHERE serving_unit IN ('g','ml') AND name ILIKE '%cream cheese%';

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

-- Part 1 of 2 — run this one first, then ingredient-realistic-min-max-migration-part2.sql.
-- Split in two because of a 100-line limit in the SQL editor; each half is a complete,
-- independent set of statements — running part 1 alone is safe even before part 2 exists.
--
-- Populates min_amount/max_amount with realistic single-meal serving bounds, so the automated
-- calorie-tier scaling (snapToConstraints in src/lib/calorieTierScaling.js) can never push an
-- ingredient to an unrealistic amount (e.g. 20g of uncooked rice, or 400g of peanut butter) while
-- it's stretching/shrinking a meal to hit a tier's calorie target.
--
-- Matching is by ingredient NAME keyword, since there's no food-group column to key off. Every
-- UPDATE below only fills in a value that's currently NULL (via COALESCE) — it never overwrites a
-- min/max you've already set by hand. More specific patterns run first (e.g. "cooked rice" before
-- "rice") so the generic version's COALESCE finds the value already set and leaves it alone.

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

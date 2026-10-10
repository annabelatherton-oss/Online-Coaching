-- "Baked Beans" was set up in the ingredients library with unit = 'tin' (a whole ~400g tin as
-- one serving). That's fine for meals written as "1 tin" or "0.5 tin" — but in at least one meal
-- ("Sausages, Beans and Toast") the quantity was edited to 210, which only makes sense as 210
-- GRAMS (the kcal/macros shown, ~179 kcal, are exactly right for 210g of beans) — not 210 tins.
-- The unit label just never got switched from 'tin' to 'g' when the quantity was changed.
--
-- Run the SELECT first and eyeball the rows — anything with unit = 'tin' and a quantity above
-- ~5 is almost certainly meant to be grams (nobody means "210 tins"). Only then run the UPDATEs.

-- 1) Preview: every "Baked Beans" row, anywhere, that looks like this mix-up.
select 'meal_ingredients' as tbl, mi.id, m.name as meal_name, mi.quantity_g, mi.unit, mi.calories
from meal_ingredients mi
join meals m on m.id = mi.meal_id
where lower(trim(mi.name)) = 'baked beans' and mi.unit = 'tin' and mi.quantity_g > 5
union all
select 'meal_tier_ingredients', mti.id, m.name, mti.quantity_g, mti.unit, mti.calories
from meal_tier_ingredients mti
join meal_tier_versions mtv on mtv.id = mti.meal_tier_version_id
join meals m on m.id = mtv.meal_id
where lower(trim(mti.name)) = 'baked beans' and mti.unit = 'tin' and mti.quantity_g > 5
order by meal_name;

-- 2) Fix: flip just those mislabeled rows from 'tin' to 'g' (the stored quantity/calories are
--    already correct — only the unit label is wrong).
update meal_ingredients
set unit = 'g'
where lower(trim(name)) = 'baked beans' and unit = 'tin' and quantity_g > 5;

update meal_tier_ingredients
set unit = 'g'
where lower(trim(name)) = 'baked beans' and unit = 'tin' and quantity_g > 5;

-- 3) Optional: if the ingredients LIBRARY entry itself (Coach Dashboard → Ingredients) also shows
--    "tin" as its unit while its calories/macros are actually per-gram values, fix it there too so
--    the next meal you build with it defaults to the right unit. Check what it currently holds first:
select id, name, serving_size, serving_unit, calories_per_serving, protein_per_serving, carbs_per_serving, fat_per_serving
from ingredients
where lower(trim(name)) = 'baked beans';
-- If serving_unit = 'tin' but the calories/macros look like per-gram values (roughly 80-90 kcal
-- per "serving"), uncomment and run:
-- update ingredients set serving_unit = 'g' where lower(trim(name)) = 'baked beans';

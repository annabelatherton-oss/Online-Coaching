-- Confirmed from check-beans-unit-still-tin.sql's results: every "Baked Beans" row still set to
-- unit = 'tin' has quantity_g = 210 and calories = 178.5 — exactly right for 210g, not "210 tins".
-- The ingredients library entry (100g standard, 85 kcal/100g) and "Beans on Toast" are already
-- correct (unit = 'g'); only "Baked Beans & Sweet Potato Jacket", "Jacket Potato, Beans and
-- Cheese" and "Sausages, Beans and Toast" — base recipe plus every one of their calorie-tier
-- versions — are still mislabeled. The earlier fix-baked-beans-tin-unit.sql apparently never
-- actually got run against the live database; this replaces it with the exact same logic, now
-- confirmed safe by the real data.

update meal_ingredients
set unit = 'g'
where lower(trim(name)) = 'baked beans' and unit = 'tin';

update meal_tier_ingredients
set unit = 'g'
where lower(trim(name)) = 'baked beans' and unit = 'tin';

-- Verify: this should return zero rows.
select 'meal_ingredients' as tbl, mi.id, m.name as meal_name, mi.quantity_g, mi.unit
from meal_ingredients mi
join meals m on m.id = mi.meal_id
where lower(trim(mi.name)) = 'baked beans' and mi.unit = 'tin'
union all
select 'meal_tier_ingredients', mti.id, m.name, mti.quantity_g, mti.unit
from meal_tier_ingredients mti
join meal_tier_versions mtv on mtv.id = mti.tier_version_id
join meals m on m.id = mtv.meal_id
where lower(trim(mti.name)) = 'baked beans' and mti.unit = 'tin';

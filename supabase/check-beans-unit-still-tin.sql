-- The last pass (fix-baked-beans-tin-unit.sql) only flipped rows where quantity_g was already
-- above 5 — on the assumption anything that high could only mean grams, not tins. Beans are still
-- showing as "tin" somewhere, which means either: that script never actually got run, or there are
-- more "Baked Beans" rows (small quantities too, or the library entry itself) still set to unit =
-- 'tin'. Run this SELECT and send back every row — that's enough to write the exact fix, rather
-- than guessing at another cutoff and missing cases again.

select 'ingredients (library)' as tbl, id::text, null as meal_name, serving_size as quantity_g, serving_unit as unit,
       calories_per_serving as calories
from ingredients
where lower(trim(name)) = 'baked beans'

union all

select 'meal_ingredients', mi.id::text, m.name, mi.quantity_g, mi.unit, mi.calories
from meal_ingredients mi
join meals m on m.id = mi.meal_id
where lower(trim(mi.name)) = 'baked beans'

union all

select 'meal_tier_ingredients', mti.id::text, m.name || ' (' || mtv.calorie_tier || ' kcal)', mti.quantity_g, mti.unit, mti.calories
from meal_tier_ingredients mti
join meal_tier_versions mtv on mtv.id = mti.tier_version_id
join meals m on m.id = mtv.meal_id
where lower(trim(mti.name)) = 'baked beans'

order by tbl, meal_name;

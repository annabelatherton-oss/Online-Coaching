-- Add unit column to meal_ingredients (mirrors the one on meal_tier_ingredients)
alter table meal_ingredients
  add column if not exists unit text default 'g';

-- Backfill from the linked ingredients library where a link exists
update meal_ingredients mi
set unit = i.serving_unit
from ingredients i
where mi.ingredient_id = i.id
  and i.serving_unit is not null
  and i.serving_unit <> '';

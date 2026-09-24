-- Deleting a library ingredient that's used anywhere was silently failing (or taking ages first):
-- meal_tier_ingredients.ingredient_id and meal_variant_ingredients.ingredient_id both reference
-- ingredients(id) with no ON DELETE action (the Postgres default, effectively RESTRICT) and no
-- index on the column — so deleting a widely-used ingredient forced a full sequential scan of
-- meal_tier_ingredients just to check for referencing rows (the "lagging for ages" part), then
-- failed with a foreign-key violation once it found one (the "won't delete" part, silently
-- swallowed by the app's own delete handler, which never checked for an error).
--
-- meal_ingredients.ingredient_id already uses ON DELETE SET NULL (see ingredients-migration.sql)
-- so a meal keeps its saved name/quantity/macros after its library ingredient is deleted — exactly
-- what the coach app's own delete confirmation promises ("Meals that already use it will keep
-- their saved values"). This brings the other two ingredient_id columns in line with that, and
-- adds the missing indexes so the check itself is fast regardless.

alter table meal_tier_ingredients drop constraint if exists meal_tier_ingredients_ingredient_id_fkey;
alter table meal_tier_ingredients add constraint meal_tier_ingredients_ingredient_id_fkey
  foreign key (ingredient_id) references ingredients(id) on delete set null;
create index if not exists meal_tier_ingredients_ingredient_id_idx on meal_tier_ingredients(ingredient_id);

-- meal_variant_ingredients is dead (the old XS/Small/.../XL size system, replaced by the
-- calorie-tier system above) but was left in place rather than dropped, so any old rows in it can
-- still block a delete today the same way.
alter table meal_variant_ingredients drop constraint if exists meal_variant_ingredients_ingredient_id_fkey;
alter table meal_variant_ingredients add constraint meal_variant_ingredients_ingredient_id_fkey
  foreign key (ingredient_id) references ingredients(id) on delete set null;
create index if not exists meal_variant_ingredients_ingredient_id_idx on meal_variant_ingredients(ingredient_id);

-- Already ON DELETE SET NULL, just missing the index — same slow-scan risk on a big library.
create index if not exists meal_ingredients_ingredient_id_idx on meal_ingredients(ingredient_id);

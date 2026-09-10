-- One-off cleanup: "Aspagargus" was a misspelled duplicate of "Asparagus". This repoints every
-- meal that used Aspagargus over to Asparagus instead (base recipes AND already-generated
-- calorie-tier versions), and updates the Ingredient Library's interchangeable-swap links too, so
-- Aspagargus ends up completely unused and safe to delete from the Ingredient Library afterwards.
--
-- Assumes both ingredients share the same serving unit (both plain grams, as is normal for
-- asparagus) — quantities are recomputed against Asparagus's own calories/protein/carbs/fat per
-- serving, in case the two entries' numbers ever differed slightly.
--
-- Safe to re-run: if Aspagargus has already been merged (or was never there), it does nothing.

do $$
declare
  v_coach_id uuid := (select id from profiles where email = 'annabelatherton@gmail.com');
  v_old_id uuid;
  v_new ingredients%rowtype;
  v_meal_ing_count int;
begin
  select id into v_old_id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Aspagargus'));
  select * into v_new from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Asparagus'));

  if v_old_id is null then
    raise notice 'No ingredient named "Aspagargus" found — nothing to merge.';
    return;
  end if;
  if v_new.id is null then
    raise notice 'No ingredient named "Asparagus" found — check the spelling and try again.';
    return;
  end if;

  -- Base recipe ingredients: repoint to Asparagus and recompute macros at the same quantity.
  update meal_ingredients mi
  set ingredient_id = v_new.id,
      name = v_new.name,
      calories  = round((mi.quantity_g / v_new.serving_size) * v_new.calories_per_serving, 1),
      protein_g = round((mi.quantity_g / v_new.serving_size) * v_new.protein_per_serving, 1),
      carbs_g   = round((mi.quantity_g / v_new.serving_size) * v_new.carbs_per_serving, 1),
      fat_g     = round((mi.quantity_g / v_new.serving_size) * v_new.fat_per_serving, 1)
  where mi.ingredient_id = v_old_id;
  get diagnostics v_meal_ing_count = row_count;

  -- Any recipe with Aspagargus set as a manual swap alternative now points at Asparagus instead.
  update meal_ingredients
  set alternative_ingredient_ids = array_replace(alternative_ingredient_ids, v_old_id, v_new.id)
  where v_old_id = any(alternative_ingredient_ids);

  -- Same for every already-generated calorie-tier version, then roll the corrected totals back
  -- up into meal_tier_versions so nothing goes stale.
  with updated as (
    update meal_tier_ingredients ti
    set ingredient_id = v_new.id,
        name = v_new.name,
        calories  = round((ti.quantity_g / v_new.serving_size) * v_new.calories_per_serving, 1),
        protein_g = round((ti.quantity_g / v_new.serving_size) * v_new.protein_per_serving, 1),
        carbs_g   = round((ti.quantity_g / v_new.serving_size) * v_new.carbs_per_serving, 1),
        fat_g     = round((ti.quantity_g / v_new.serving_size) * v_new.fat_per_serving, 1)
    where ti.ingredient_id = v_old_id
    returning tier_version_id
  )
  update meal_tier_versions v
  set calories  = t.calories,
      protein_g = t.protein_g,
      carbs_g   = t.carbs_g,
      fat_g     = t.fat_g
  from (
    select mti.tier_version_id,
           sum(mti.calories) calories, sum(mti.protein_g) protein_g,
           sum(mti.carbs_g) carbs_g, sum(mti.fat_g) fat_g
    from meal_tier_ingredients mti
    where mti.tier_version_id in (select tier_version_id from updated)
    group by mti.tier_version_id
  ) t
  where v.id = t.tier_version_id;

  -- Ingredient-level interchangeable swaps (Ingredient Library): drop anything that would become
  -- a duplicate or self-referencing pair once repointed (only possible if Aspagargus and
  -- Asparagus were already both linked to the same ingredient, or to each other), then repoint
  -- the rest.
  delete from ingredient_swaps a
  where a.ingredient_id = v_old_id
    and exists (select 1 from ingredient_swaps b where b.ingredient_id = v_new.id and b.alternative_ingredient_id = a.alternative_ingredient_id);
  delete from ingredient_swaps a
  where a.alternative_ingredient_id = v_old_id
    and exists (select 1 from ingredient_swaps b where b.alternative_ingredient_id = v_new.id and b.ingredient_id = a.ingredient_id);
  update ingredient_swaps set ingredient_id = v_new.id where ingredient_id = v_old_id;
  update ingredient_swaps set alternative_ingredient_id = v_new.id where alternative_ingredient_id = v_old_id;
  delete from ingredient_swaps where ingredient_id = alternative_ingredient_id;

  raise notice 'Merged Aspagargus into Asparagus: % base recipe rows repointed and recomputed (plus their calorie-tier versions). Aspagargus is now unused — safe to delete it from the Ingredient Library.', v_meal_ing_count;
end $$;

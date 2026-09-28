-- Part 3 of 3 — Digestive Biscuits & Peanut Butter, Kiwi & Cottage Cheese,
-- Chia Seed & Raspberry Pudding.
-- Idempotent: safe to re-run.

do $$
declare
  v_coach_id uuid := (select id from profiles where email = 'annabelatherton@gmail.com');
  v_meal_id uuid;
begin

  -- Digestive Biscuits & Peanut Butter (snack)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'snack' and lower(trim(name)) = lower(trim('Digestive Biscuits & Peanut Butter'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Digestive Biscuits & Peanut Butter', 'snack', 'Spread the peanut butter over the biscuits.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Spread the peanut butter over the biscuits.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Digestive Biscuit', 2.0, 'unit', 142.0, 18.0, 2.0, 6.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Digestive Biscuit'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Peanut Butter', 15, 'g', 96.0, 3.6, 3.6, 7.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Peanut Butter'))));

  -- Kiwi & Cottage Cheese (snack)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'snack' and lower(trim(name)) = lower(trim('Kiwi & Cottage Cheese'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Kiwi & Cottage Cheese', 'snack', 'Peel and slice the kiwi, then stir through the cottage cheese.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Peel and slice the kiwi, then stir through the cottage cheese.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Kiwi', 2.0, 'unit', 90.0, 22.0, 2.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Kiwi'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cottage Cheese', 100, 'g', 105.0, 4.0, 10.0, 6.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cottage Cheese'))));

  -- Chia Seed & Raspberry Pudding (evening_snack)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'evening_snack' and lower(trim(name)) = lower(trim('Chia Seed & Raspberry Pudding'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Chia Seed & Raspberry Pudding', 'evening_snack', 'Stir the chia seeds and honey into the milk and refrigerate for at least 3 hours (or overnight) until it sets into a pudding. Top with raspberries before eating.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Stir the chia seeds and honey into the milk and refrigerate for at least 3 hours (or overnight) until it sets into a pudding. Top with raspberries before eating.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chia Seeds', 20, 'g', 88.0, 1.3, 4.0, 6.7, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chia Seeds'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Semi-Skimmed Milk', 150, 'ml', 73.5, 7.5, 6.0, 3.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Semi-Skimmed Milk'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Raspberries', 80, 'g', 27.2, 4.0, 0.8, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Raspberries'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Honey', 10, 'g', 30.0, 8.0, 0.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Honey'))));

end $$;

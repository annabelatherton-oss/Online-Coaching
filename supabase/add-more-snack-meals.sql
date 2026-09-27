-- Adds 10 more snack meals with a range of flavours and formats (sweet, salty,
-- savoury, fruity, high-protein, and one pudding-style evening snack), built
-- entirely from ingredients already in the coach's library so the macros
-- line up exactly with what's already used elsewhere.
-- Idempotent: if a meal with the same name/category already exists, its
-- instructions and ingredients are refreshed rather than duplicated, so this
-- is safe to re-run.

do $$
declare
  v_coach_id uuid := (select id from profiles where email = 'annabelatherton@gmail.com');
  v_meal_id uuid;
begin

  -- Salted Rice Cakes & Peanut Butter (snack)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'snack' and lower(trim(name)) = lower(trim('Salted Rice Cakes & Peanut Butter'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Salted Rice Cakes & Peanut Butter', 'snack', 'Spread the peanut butter over the rice cakes.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Spread the peanut butter over the rice cakes.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Salted Rice Cakes', 3.0, 'unit', 81.0, 18.0, 3.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Salted Rice Cakes'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Peanut Butter', 15, 'g', 96.0, 3.6, 3.6, 7.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Peanut Butter'))));

  -- Chocolate Rice Cakes & Walnuts (snack)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'snack' and lower(trim(name)) = lower(trim('Chocolate Rice Cakes & Walnuts'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Chocolate Rice Cakes & Walnuts', 'snack', null)
    returning id into v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chocolate Rice Cake', 3.0, 'unit', 174.0, 33.0, 3.0, 3.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chocolate Rice Cake'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Walnuts', 15, 'g', 105.0, 0.5, 2.0, 10.5, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Walnuts'))));

  -- Cottage Cheese & Grapes (snack)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'snack' and lower(trim(name)) = lower(trim('Cottage Cheese & Grapes'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Cottage Cheese & Grapes', 'snack', null)
    returning id into v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cottage Cheese', 150, 'g', 157.5, 6.0, 15.0, 9.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cottage Cheese'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Grapes', 100, 'g', 73.0, 17.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Grapes'))));

  -- Greek Yogurt, Granola & Honey (snack)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'snack' and lower(trim(name)) = lower(trim('Greek Yogurt, Granola & Honey'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Greek Yogurt, Granola & Honey', 'snack', 'Spoon the yogurt into a bowl, top with the granola and drizzle over the honey.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Spoon the yogurt into a bowl, top with the granola and drizzle over the honey.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, '0% Greek Yogurt', 150, 'g', 81.0, 4.5, 15.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('0% Greek Yogurt'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Granola', 30, 'g', 125.4, 20.1, 3.0, 3.3, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Granola'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Honey', 10, 'g', 30.0, 8.0, 0.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Honey'))));

  -- Protein Mousse & Strawberries (snack)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'snack' and lower(trim(name)) = lower(trim('Protein Mousse & Strawberries'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Protein Mousse & Strawberries', 'snack', 'Top the mousse with sliced strawberries.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Top the mousse with sliced strawberries.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Protein Mousse', 1.0, 'unit', 153.0, 10.0, 20.0, 3.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Protein Mousse'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Strawberries', 100, 'g', 30.0, 6.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Strawberries'))));

  -- Ham & Cheese Rice Cakes (snack)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'snack' and lower(trim(name)) = lower(trim('Ham & Cheese Rice Cakes'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Ham & Cheese Rice Cakes', 'snack', 'Layer the ham and cheese on top of the rice cakes.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Layer the ham and cheese on top of the rice cakes.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Wafer Thin Honey Roast Ham', 4.0, 'slice', 56.0, 0.0, 8.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Wafer Thin Honey Roast Ham'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cheese (50% Lighter)', 25, 'g', 68.0, 2.0, 7.0, 4.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cheese (50% Lighter)'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Salted Rice Cakes', 2.0, 'unit', 54.0, 12.0, 2.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Salted Rice Cakes'))));

  -- Tuna & Cucumber Rice Cakes (snack)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'snack' and lower(trim(name)) = lower(trim('Tuna & Cucumber Rice Cakes'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Tuna & Cucumber Rice Cakes', 'snack', 'Flake the tuna over the rice cakes and top with sliced cucumber.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Flake the tuna over the rice cakes and top with sliced cucumber.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Tuna', 1.0, 'tin', 110.0, 0.0, 25.0, 1.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Tuna'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cucumber', 80, 'g', 12.8, 0.8, 0.8, 0.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cucumber'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Salted Rice Cakes', 2.0, 'unit', 54.0, 12.0, 2.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Salted Rice Cakes'))));

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

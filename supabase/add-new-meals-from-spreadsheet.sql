-- Imports new meals (with their ingredients) from the coach's updated Meal Variations
-- spreadsheet. Idempotent: each meal is only inserted if a meal with that exact name
-- doesn't already exist for this coach IN THE SAME CATEGORY (a handful of meal names
-- are reused across categories on purpose, e.g. a smaller "Jam Bagel" for breakfast vs
-- pre-workout, so the guard checks category too). Meals you already added by hand under
-- the same name/category are left completely untouched -- only genuinely new meals get
-- created. Two placeholder rows with no ingredients listed in the sheet ("Chicken Smash
-- Burgers" under Teas, "Granola" under Evening Snacks) are skipped -- there was nothing
-- to import for them.

do $$
declare
  v_coach_id uuid := (select id from profiles where email = 'annabelatherton@gmail.com');
  v_meal_id uuid;
begin
  -- Overnight Oats (Breakfasts)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('Overnight Oats'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Overnight Oats', 'breakfast', '(Overnight Oats) Maybe bulk prep these for the week and keep them in the fridge
I personally prefer vanilla protein powder in this meal but use whichever you like:)')
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Oats', 40.0, 'g', 148.0, 26.0, 4.8, 2.08, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Oats'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, '0% Greek Yogurt', 100.0, 'g', 54.0, 3.0, 10.3, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('0% Greek Yogurt'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Isolate Protein Powder', 20.0, 'g', 72.8, 0.48, 17.6, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Isolate Protein Powder'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Raspberries', 100.0, 'g', 34.0, 5.1, 0.8, 0.3, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Raspberries'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Semi-Skimmed Milk', 100.0, 'ml', 49.0, 4.8, 3.6, 1.7, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Semi-Skimmed Milk'))));
  end if;

  -- Breakfast Bagel (Breakfasts)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('Breakfast Bagel'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Breakfast Bagel', 'breakfast', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken Chipolata Sausages', 2.0, 'unit', 86.0, 4.4, 8.8, 3.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken Chipolata Sausages'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Bagel Thin', 1.0, 'unit', 130.0, 25.0, 5.0, 0.7, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Bagel Thin'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Eggs', 1.0, 'large', 79.0, 0.5, 7.6, 5.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Eggs'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Bacon Medallions', 2.0, 'unit', 54.0, 0.4, 10.4, 1.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Bacon Medallions'))));
  end if;

  -- PB&J Bagel (Breakfasts)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('PB&J Bagel'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'PB&J Bagel', 'breakfast', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Bagel', 1.0, 'unit', 225.0, 44.3, 7.9, 1.3, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Bagel'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Jam', 15.0, 'g', 37.2, 9.12, 0.48, 0.48, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Jam'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Isolate Protein Powder', 25.0, 'g', 91.0, 0.6, 22.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Isolate Protein Powder'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Peanut Butter', 15.0, 'g', 80.0, 2.8, 2.8, 6.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Peanut Butter'))));
  end if;

  -- Porridge (Breakfasts)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('Porridge'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Porridge', 'breakfast', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Oats', 50.0, 'g', 185.0, 32.5, 6.0, 2.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Oats'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Semi-Skimmed Milk', 200.0, 'ml', 98.0, 9.6, 7.2, 3.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Semi-Skimmed Milk'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Honey', 25.0, 'g', 75.0, 20.0, 0.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Honey'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Isolate Protein Powder', 20.0, 'g', 72.8, 0.48, 17.6, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Isolate Protein Powder'))));
  end if;

  -- Eggs (Breakfasts)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('Eggs'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Eggs', 'breakfast', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Eggs', 3.0, 'large', 237.0, 1.5, 22.8, 16.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Eggs'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Bagel Thin', 1.0, 'unit', 130.0, 25.0, 5.0, 0.7, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Bagel Thin'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Strawberries', 100.0, 'g', 30.0, 6.0, 0.8, 0.1, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Strawberries'))));
  end if;

  -- Yogurt (Breakfasts)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('Yogurt'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Yogurt', 'breakfast', 'If you’re prepping this meal, don’t put the granola in until you go to eat it or it''ll go soggy…')
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, '0% Greek Yogurt', 250.0, 'g', 135.0, 7.5, 25.75, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('0% Greek Yogurt'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Breakfast Topper', 60.0, 'g', 27.0, 5.28, 0.42, 0.18, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Breakfast Topper'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Honey', 15.0, 'g', 45.0, 12.0, 0.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Honey'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Granola', 15.0, 'g', 62.7, 10.035, 1.425, 1.71, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Granola'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, '85% Dark Chocolate (12.5g)', 1.0, 'Square', 75.0, 2.3, 1.5, 6.5, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('85% Dark Chocolate (12.5g)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chia Seeds', 15.0, 'g', 66.0, 1.2, 2.5, 4.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chia Seeds'))));
  end if;

  -- Overnight Weetabix (Breakfasts)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('Overnight Weetabix'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Overnight Weetabix', 'breakfast', '(Overnight Weetabix) Maybe bulk prep these for the week and keep them in the fridge
I personally prefer vanilla protein powder in this meal but use whichever you like:)')
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Weetabix', 2.0, 'unit', 136.0, 29.6, 4.4, 0.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Weetabix'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, '0% Greek Yogurt', 100.0, 'g', 54.0, 3.0, 10.3, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('0% Greek Yogurt'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Isolate Protein Powder', 20.0, 'g', 72.8, 0.48, 17.6, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Isolate Protein Powder'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Raspberries', 60.0, 'g', 20.4, 3.06, 0.48, 0.18, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Raspberries'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Semi-Skimmed Milk', 100.0, 'ml', 49.0, 4.8, 3.6, 1.7, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Semi-Skimmed Milk'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Flaxseeds', 15.0, 'g', 76.0, 0.75, 3.6, 5.7, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Flaxseeds'))));
  end if;

  -- Avacado on Toast (Breakfasts)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('Avacado on Toast'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Avacado on Toast', 'breakfast', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Avacado', 0.5, 'unit', 120.0, 6.4, 1.5, 11.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Avacado'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Bagel', 1.0, 'unit', 225.0, 44.3, 7.9, 1.3, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Bagel'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Isolate Protein Powder', 25.0, 'g', 91.0, 0.6, 22.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Isolate Protein Powder'))));
  end if;

  -- Breafkast Wrap (Breakfasts)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('Breafkast Wrap'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Breafkast Wrap', 'breakfast', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Tortilla Wrap', 1.0, 'unit', 181.0, 36.8, 4.5, 2.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Tortilla Wrap'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Bacon Medallions', 2.0, 'unit', 54.0, 0.4, 10.4, 1.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Bacon Medallions'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken Chipolata Sausages', 4.0, 'unit', 172.0, 8.8, 17.6, 6.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken Chipolata Sausages'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Eggs', 1.0, 'large', 79.0, 0.5, 7.6, 5.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Eggs'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cheese (50% Lighter)', 15.0, 'g', 40.8, 1.02, 4.44, 2.1, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cheese (50% Lighter)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'BBQ Sauce', 15.0, 'g', 15.0, 3.7, 0.1, 0.1, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('BBQ Sauce'))));
  end if;

  -- Protein Pancakes (Breakfasts)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('Protein Pancakes'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Protein Pancakes', 'breakfast', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Self-Raising Flour', 35.0, 'g', 123.2, 25.55, 3.43, 0.56, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Self-Raising Flour'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Isolate Protein Powder', 20.0, 'g', 72.8, 0.48, 17.6, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Isolate Protein Powder'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Baking Powder', 1.0, 'tsp', 8.0, 1.7, 0.2, 0.1, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Baking Powder'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Eggs', 1.0, 'large', 79.0, 0.5, 7.6, 5.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Eggs'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Semi-Skimmed Milk', 30.0, 'ml', 14.7, 1.44, 1.08, 0.51, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Semi-Skimmed Milk'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, '70% Dark Chocolate', 1.0, 'square', 72.0, 5.6, 1.2, 5.5, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('70% Dark Chocolate'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, '0% Greek Yogurt', 100.0, 'g', 54.0, 3.0, 10.3, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('0% Greek Yogurt'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Honey', 25.0, 'g', 75.0, 20.0, 0.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Honey'))));
  end if;

  -- Chia Pudding (Breakfasts)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('Chia Pudding'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Chia Pudding', 'breakfast', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Oats', 50.0, 'g', 185.0, 32.5, 6.0, 2.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Oats'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, '0% Greek Yogurt', 150.0, 'g', 81.0, 4.5, 15.45, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('0% Greek Yogurt'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chia Seeds', 15.0, 'g', 66.0, 1.2, 2.5, 4.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chia Seeds'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Berries', 60.0, 'g', 20.4, 2.76, 0.42, 0.36, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Berries'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Isolate Protein Powder', 15.0, 'g', 54.6, 0.36, 13.2, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Isolate Protein Powder'))));
  end if;

  -- Chicken Sausage Bagel (Breakfasts)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('Chicken Sausage Bagel'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Chicken Sausage Bagel', 'breakfast', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Bagel', 1.0, 'unit', 225.0, 44.3, 7.9, 1.3, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Bagel'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken Chipolata Sausages', 4.0, 'unit', 172.0, 8.8, 17.6, 6.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken Chipolata Sausages'))));
  end if;

  -- Honey Bagel (Breakfasts)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('Honey Bagel'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Honey Bagel', 'breakfast', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Bagel', 1.0, 'unit', 225.0, 44.3, 7.9, 1.3, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Bagel'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Honey', 25.0, 'g', 75.0, 20.0, 0.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Honey'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Isolate Protein Powder', 25.0, 'g', 91.0, 0.6, 22.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Isolate Protein Powder'))));
  end if;

  -- Avacado and Egg (Breakfasts)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('Avacado and Egg'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Avacado and Egg', 'breakfast', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Wholemeal Sourdough', 1.0, 'slice', 150.0, 29.0, 6.0, 0.7, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Wholemeal Sourdough'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Avacado', 0.5, 'unit', 120.0, 6.4, 1.5, 11.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Avacado'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Eggs', 2.0, 'large', 158.0, 1.0, 15.2, 10.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Eggs'))));
  end if;

  -- Oats and Water (Breakfasts)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('Oats and Water'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Oats and Water', 'breakfast', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Oats', 60.0, 'g', 222.0, 39.0, 7.2, 3.12, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Oats'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Isolate Protein Powder', 25.0, 'g', 91.0, 0.6, 22.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Isolate Protein Powder'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Berries', 100.0, 'g', 34.0, 4.6, 0.7, 0.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Berries'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chia Seeds', 15.0, 'g', 66.0, 1.2, 2.5, 4.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chia Seeds'))));
  end if;

  -- Sticky Toffee Baked Oats (Breakfasts)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('Sticky Toffee Baked Oats'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Sticky Toffee Baked Oats', 'breakfast', 'Use Baking Powder, Vanilla Extract, Cinnamon Powder and Salt')
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Medjool Dates', 25.0, 'g', 69.6, 15.92, 0.56, 0.08, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Medjool Dates'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Banana', 0.5, 'unit', 35.5, 9.15, 0.45, 0.15, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Banana'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Oats', 60.0, 'g', 222.0, 39.0, 7.2, 3.12, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Oats'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Semi-Skimmed Milk', 100.0, 'ml', 49.0, 4.8, 3.6, 1.7, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Semi-Skimmed Milk'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Isolate Protein Powder', 20.0, 'g', 72.8, 0.48, 17.6, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Isolate Protein Powder'))));
  end if;

  -- Carrot Cake Baked Oats (Breakfasts)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('Carrot Cake Baked Oats'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Carrot Cake Baked Oats', 'breakfast', 'Carrot Cake Baked Oats
Include Cinnamon + Baking Powder
Yog and Light Cream Cheese for the topping')
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Oats', 50.0, 'g', 185.0, 32.5, 6.0, 2.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Oats'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Carrot', 0.25, 'unit', 8.0, 1.55, 0.1, 0.075, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Carrot'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Isolate Protein Powder', 15.0, 'g', 54.6, 0.36, 13.2, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Isolate Protein Powder'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Oat Milk', 50.0, 'ml', 20.0, 2.8, 0.1, 0.75, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Oat Milk'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Walnuts', 10.0, 'g', 52.5, 0.25, 1.1, 5.15, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Walnuts'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Banana', 0.5, 'unit', 35.5, 9.15, 0.45, 0.15, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Banana'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Honey', 10.0, 'g', 30.0, 8.0, 0.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Honey'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, '0% Greek Yogurt', 100.0, 'g', 54.0, 3.0, 10.3, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('0% Greek Yogurt'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Light Cream Cheese', 30.0, 'g', 44.0, 1.5, 2.2, 3.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Light Cream Cheese'))));
  end if;

  -- Flavoured Hot Cross Bun (Breakfasts)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('Flavoured Hot Cross Bun'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Flavoured Hot Cross Bun', 'breakfast', 'Hot Cross Bun (Easter Plan Edition) <3
Try to aim for one that''s not over around 210 calories but have fun with this!')
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Hot Cross Bun - Flavoured', 1.0, 'unit', 209.0, 35.0, 5.0, 5.1, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Hot Cross Bun - Flavoured'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Isolate Protein Powder', 25.0, 'g', 91.0, 0.6, 22.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Isolate Protein Powder'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Butter', 15.0, 'g', 101.85, 0.09, 0.075, 11.25, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Butter'))));
  end if;

  -- Apple Crumble Baked Oats (Breakfasts)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('Apple Crumble Baked Oats'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Apple Crumble Baked Oats', 'breakfast', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Oats', 40.0, 'g', 148.0, 26.0, 4.8, 2.08, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Oats'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Apple', 1.0, 'unit', 104.0, 27.6, 0.5, 0.3, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Apple'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Baking Powder', 1.0, 'tsp', 8.0, 1.7, 0.2, 0.1, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Baking Powder'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Eggs', 1.0, 'large', 79.0, 0.5, 7.6, 5.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Eggs'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Semi-Skimmed Milk', 100.0, 'ml', 49.0, 4.8, 3.6, 1.7, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Semi-Skimmed Milk'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Isolate Protein Powder', 15.0, 'g', 54.6, 0.36, 13.2, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Isolate Protein Powder'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Honey', 15.0, 'g', 45.0, 12.0, 0.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Honey'))));
  end if;

  -- Jam Crumpets (Breakfasts)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('Jam Crumpets'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Jam Crumpets', 'breakfast', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Crumpet Thin', 4.0, 'unit', 244.0, 49.2, 8.0, 1.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Crumpet Thin'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Jam', 25.0, 'g', 62.0, 15.2, 0.8, 0.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Jam'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Isolate Protein Powder', 25.0, 'g', 91.0, 0.6, 22.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Isolate Protein Powder'))));
  end if;

  -- Sausages, Beans and Toast (Breakfasts)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('Sausages, Beans and Toast'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Sausages, Beans and Toast', 'breakfast', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken Chipolata Sausages', 3.0, 'unit', 129.0, 6.6, 13.2, 5.1, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken Chipolata Sausages'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Baked Beans', 0.5, 'tin', 169.0, 32.45, 10.05, 0.75, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Baked Beans'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Jason''s No.9 Wholemeal Sourdough', 1.0, 'slice', 105.0, 17.9, 5.6, 0.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Jason''s No.9 Wholemeal Sourdough'))));
  end if;

  -- Biscoff Overnight Oats (Breakfasts)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('Biscoff Overnight Oats'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Biscoff Overnight Oats', 'breakfast', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Oats', 50.0, 'g', 185.0, 32.5, 6.0, 2.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Oats'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, '0% Greek Yogurt', 100.0, 'g', 54.0, 3.0, 10.3, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('0% Greek Yogurt'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Isolate Protein Powder', 20.0, 'g', 72.8, 0.48, 17.6, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Isolate Protein Powder'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Biscoff Spread', 10.0, 'g', 59.0, 5.3, 0.3, 4.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Biscoff Spread'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Semi-Skimmed Milk', 100.0, 'ml', 49.0, 4.8, 3.6, 1.7, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Semi-Skimmed Milk'))));
  end if;

  -- Strawberry Cheesecake Overnight Oats (Breakfasts)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('Strawberry Cheesecake Overnight Oats'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Strawberry Cheesecake Overnight Oats', 'breakfast', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Oats', 40.0, 'g', 148.0, 26.0, 4.8, 2.08, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Oats'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Isolate Protein Powder', 20.0, 'g', 72.8, 0.48, 17.6, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Isolate Protein Powder'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, '0% Strawberry Skyr', 100.0, 'g', 69.0, 7.4, 8.8, 0.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('0% Strawberry Skyr'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Honey', 5.0, 'g', 15.0, 4.0, 0.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Honey'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Strawberries', 60.0, 'g', 18.0, 3.6, 0.48, 0.06, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Strawberries'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Digestive Biscuit', 1.0, 'unit', 71.0, 9.3, 1.0, 3.1, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Digestive Biscuit'))));
  end if;

  -- Jam Bagel (Breakfasts)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('Jam Bagel'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Jam Bagel', 'breakfast', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Bagel', 1.0, 'unit', 225.0, 44.3, 7.9, 1.3, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Bagel'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Jam', 25.0, 'g', 62.0, 15.2, 0.8, 0.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Jam'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Isolate Protein Powder', 25.0, 'g', 91.0, 0.6, 22.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Isolate Protein Powder'))));
  end if;

  -- Sweet Chilli Chicken Wrap (Lunches)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Sweet Chilli Chicken Wrap'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Sweet Chilli Chicken Wrap', 'lunch', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Tortilla Wrap', 1.0, 'unit', 181.0, 36.8, 4.5, 2.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Tortilla Wrap'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken (Raw)', 150.0, 'g', 180.0, 0.0, 33.75, 3.9, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken (Raw)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Lettuce', 75.0, 'g', 15.0, 2.775, 0.675, 0.075, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Lettuce'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Reduced Sweet Chilli Sauce', 25.0, 'g', 34.0, 8.4, 0.1, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Reduced Sweet Chilli Sauce'))));
  end if;

  -- Chicken Sausage Bagel (Lunches)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Chicken Sausage Bagel'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Chicken Sausage Bagel', 'lunch', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken Chipolata Sausages', 4.0, 'unit', 172.0, 8.8, 17.6, 6.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken Chipolata Sausages'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Bagel Thin', 1.0, 'unit', 130.0, 25.0, 5.0, 0.7, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Bagel Thin'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Eggs', 1.0, 'large', 79.0, 0.5, 7.6, 5.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Eggs'))));
  end if;

  -- Avacado and Egg on Sourdough (Lunches)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Avacado and Egg on Sourdough'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Avacado and Egg on Sourdough', 'lunch', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Jason''s No.9 Wholemeal Sourdough', 1.0, 'slice', 105.0, 17.9, 5.6, 0.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Jason''s No.9 Wholemeal Sourdough'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Eggs', 2.0, 'large', 158.0, 1.0, 15.2, 10.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Eggs'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Avacado', 0.5, 'unit', 120.0, 6.4, 1.5, 11.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Avacado'))));
  end if;

  -- Chicken and Rice (Lunches)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Chicken and Rice'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Chicken and Rice', 'lunch', 'You can use any veg substitution')
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken (Raw)', 130.0, 'g', 156.0, 0.0, 29.25, 3.38, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken (Raw)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Rice (uncooked)', 50.0, 'g', 182.5, 41.4, 4.2, 0.45, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Rice (uncooked)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Broccoli', 100.0, 'g', 39.0, 6.3, 0.3, 2.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Broccoli'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Olive Oil', 5.0, 'g', 45.0, 0.0, 0.0, 5.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Olive Oil'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Reduced Sweet Chilli Sauce', 25.0, 'g', 34.0, 8.4, 0.1, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Reduced Sweet Chilli Sauce'))));
  end if;

  -- Tuna Pasta (Lunches)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Tuna Pasta'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Tuna Pasta', 'lunch', 'Vag can be swapped/use different variations')
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Penne Pasta (uncooked)', 60.0, 'g', 210.0, 44.4, 7.5, 0.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Penne Pasta (uncooked)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Tuna', 1.0, 'tin', 110.0, 0.0, 25.4, 1.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Tuna'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Onion', 0.5, 'small', 14.0, 3.25, 0.4, 0.05, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Onion'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Sweetcorn', 30.0, 'g', 25.6, 3.72, 0.88, 0.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Sweetcorn'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Light Mayo', 25.0, 'g', 64.0, 2.4, 0.16, 6.08, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Light Mayo'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cucumber', 50.0, 'g', 8.0, 0.55, 0.45, 0.25, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cucumber'))));
  end if;

  -- Chicken and Sweet Potato (Lunches)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Chicken and Sweet Potato'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Chicken and Sweet Potato', 'lunch', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken (Raw)', 130.0, 'g', 156.0, 0.0, 29.25, 3.38, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken (Raw)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Sweet Potato (Raw)', 150.0, 'g', 135.0, 31.5, 3.0, 0.3, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Sweet Potato (Raw)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Lettuce', 100.0, 'g', 20.0, 3.7, 0.9, 0.1, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Lettuce'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Light Soy Sauce', 7.0, 'tbsp', 63.0, 12.6, 2.1, 0.7, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Light Soy Sauce'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Olive Oil', 5.0, 'g', 45.0, 0.0, 0.0, 5.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Olive Oil'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Broccoli', 50.0, 'g', 19.5, 3.15, 0.15, 1.3, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Broccoli'))));
  end if;

  -- Beans on Toast (Lunches)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Beans on Toast'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Beans on Toast', 'lunch', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Hovis Medium Wholemeal', 2.0, 'unit', 128.0, 22.0, 5.8, 1.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Hovis Medium Wholemeal'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Tin of Beans', 210.0, 'g', 177.0, 29.0, 9.5, 0.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Tin of Beans'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cheese (50% Lighter)', 20.0, 'g', 54.4, 1.36, 5.92, 2.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cheese (50% Lighter)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Spreadable Butter (Lighter)', 10.0, 'g', 51.6, 0.04, 0.03, 5.7, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Spreadable Butter (Lighter)'))));
  end if;

  -- Tuna Bun (Lunches)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Tuna Bun'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Tuna Bun', 'lunch', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Tuna', 1.0, 'tin', 110.0, 0.0, 25.4, 1.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Tuna'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Wholemeal Bap', 1.0, 'unit', 123.0, 19.0, 6.5, 1.7, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Wholemeal Bap'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Onion', 1.0, 'small', 28.0, 6.5, 0.8, 0.1, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Onion'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Caramel Rice Cake', 2.0, 'unit', 102.0, 22.6, 0.0, 0.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Caramel Rice Cake'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Lighter than Light Mayo', 15.0, 'g', 15.0, 1.4, 0.5, 0.9, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Lighter than Light Mayo'))));
  end if;

  -- Tuna Pita (Lunches)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Tuna Pita'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Tuna Pita', 'lunch', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Tuna', 1.0, 'tin', 110.0, 0.0, 25.4, 1.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Tuna'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Pita Bread', 1.0, 'unit', 145.0, 28.8, 5.4, 0.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Pita Bread'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Onion', 1.0, 'small', 28.0, 6.5, 0.8, 0.1, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Onion'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Lighter than Light Mayo', 15.0, 'g', 15.0, 1.4, 0.5, 0.9, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Lighter than Light Mayo'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Caramel Rice Cake', 1.0, 'unit', 51.0, 11.3, 0.0, 0.3, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Caramel Rice Cake'))));
  end if;

  -- Avacado Bagel (Lunches)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Avacado Bagel'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Avacado Bagel', 'lunch', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Bagel', 1.0, 'unit', 225.0, 44.3, 7.9, 1.3, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Bagel'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Avacado', 0.5, 'unit', 120.0, 6.4, 1.5, 11.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Avacado'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Eggs', 2.0, 'large', 158.0, 1.0, 15.2, 10.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Eggs'))));
  end if;

  -- Tuna Bagel (Lunches)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Tuna Bagel'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Tuna Bagel', 'lunch', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Tuna', 1.0, 'tin', 110.0, 0.0, 25.4, 1.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Tuna'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Bagel Thin', 1.0, 'unit', 130.0, 25.0, 5.0, 0.7, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Bagel Thin'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cheese (50% Lighter)', 25.0, 'g', 68.0, 1.7, 7.4, 3.5, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cheese (50% Lighter)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Onion', 1.0, 'small', 28.0, 6.5, 0.8, 0.1, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Onion'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Lighter than Light Mayo', 15.0, 'g', 15.0, 1.4, 0.5, 0.9, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Lighter than Light Mayo'))));
  end if;

  -- Chicken and Egg Fried Rice (Lunches)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Chicken and Egg Fried Rice'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Chicken and Egg Fried Rice', 'lunch', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Rice (uncooked)', 50.0, 'g', 182.5, 41.4, 4.2, 0.45, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Rice (uncooked)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken (raw)', 110.0, 'g', 132.0, 0.0, 24.75, 2.86, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken (raw)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Eggs', 1.0, 'large', 79.0, 0.5, 7.6, 5.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Eggs'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Light Soy Sauce', 5.0, 'tbsp', 45.0, 9.0, 1.5, 0.5, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Light Soy Sauce'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Garden Peas (cooked)', 80.0, 'g', 59.0, 7.0, 4.0, 0.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Garden Peas (cooked)'))));
  end if;

  -- BBQ Chicken Wrap (Lunches)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('BBQ Chicken Wrap'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'BBQ Chicken Wrap', 'lunch', 'Garlic, Smoked Paprika, Salt')
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Ready Cooked Chicken', 100.0, 'g', 115.0, 1.5, 23.3, 1.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Ready Cooked Chicken'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Tortilla Wrap', 1.0, 'unit', 181.0, 36.8, 4.5, 2.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Tortilla Wrap'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Pepper', 0.5, 'unit', 15.5, 7.4, 0.6, 0.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Pepper'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Onion', 0.5, 'small', 14.0, 3.25, 0.4, 0.05, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Onion'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'BBQ Sauce', 25.0, 'g', 22.5, 5.55, 0.15, 0.15, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('BBQ Sauce'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Lighter than Light Mayo', 15.0, 'g', 15.0, 1.4, 0.5, 0.9, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Lighter than Light Mayo'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Lettuce', 40.0, 'g', 8.0, 1.48, 0.36, 0.04, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Lettuce'))));
  end if;

  -- Jerk Chicken Cheese Burger (Lunches)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Jerk Chicken Cheese Burger'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Jerk Chicken Cheese Burger', 'lunch', 'Chicken Seasoning, Smoked Paprika, Salt')
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken (Raw)', 120.0, 'g', 144.0, 0.0, 27.0, 3.12, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken (Raw)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'White Bap', 1.0, 'unit', 125.0, 22.7, 5.0, 1.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('White Bap'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Reggae Reggae Sauce', 20.0, 'g', 27.4, 6.4, 0.2, 0.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Reggae Reggae Sauce'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cheese (50% Lighter)', 15.0, 'g', 40.8, 1.02, 4.44, 2.1, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cheese (50% Lighter)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Lettuce', 30.0, 'g', 6.0, 1.11, 0.27, 0.03, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Lettuce'))));
  end if;

  -- Club Sandwich (Lunches)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Club Sandwich'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Club Sandwich', 'lunch', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Warbutons NAS Wholemeal', 2.0, 'unit', 110.0, 18.0, 5.0, 1.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Warbutons NAS Wholemeal'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cooked Chicken', 70.0, 'g', 87.5, 0.35, 18.2, 1.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cooked Chicken'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Bacon Medallions', 2.0, 'unit', 54.0, 0.4, 10.4, 1.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Bacon Medallions'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Lettuce', 30.0, 'g', 6.0, 1.11, 0.27, 0.03, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Lettuce'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Tomato', 1.0, 'unit', 14.0, 2.4, 0.4, 0.1, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Tomato'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Light Mayo', 10.0, 'g', 26.0, 0.975, 0.065, 2.47, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Light Mayo'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Butter', 10.0, 'g', 67.9, 0.06, 0.05, 7.5, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Butter'))));
  end if;

  -- Cheesy Chicken and Chorizo Wrap (Lunches)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Cheesy Chicken and Chorizo Wrap'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Cheesy Chicken and Chorizo Wrap', 'lunch', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Tortilla Wrap', 1.0, 'unit', 181.0, 36.8, 4.5, 2.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Tortilla Wrap'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cooked Chicken', 100.0, 'g', 125.0, 0.5, 26.0, 2.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cooked Chicken'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chorizo', 15.0, 'g', 62.7, 0.21, 3.03, 5.43, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chorizo'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Onion', 0.5, 'small', 14.0, 3.25, 0.4, 0.05, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Onion'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Tomato Puree', 15.0, 'g', 13.0, 2.8, 0.6, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Tomato Puree'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cheese (50% Lighter)', 20.0, 'g', 54.4, 1.36, 5.92, 2.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cheese (50% Lighter)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Lightest Philadelphia', 30.0, 'g', 26.0, 1.5, 3.2, 0.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Lightest Philadelphia'))));
  end if;

  -- Cheese Burger Wrap (Lunches)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Cheese Burger Wrap'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Cheese Burger Wrap', 'lunch', 'Salt, Pepper, Paprika, Onion Salt')
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Tortilla Wrap', 1.0, 'unit', 181.0, 36.8, 4.5, 2.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Tortilla Wrap'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, '5% Fat Mince (uncooked)', 120.0, 'g', 154.8, 2.16, 24.36, 5.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('5% Fat Mince (uncooked)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Onion', 0.5, 'small', 14.0, 3.25, 0.4, 0.05, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Onion'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Tomato Puree', 15.0, 'g', 13.0, 2.8, 0.6, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Tomato Puree'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cheese (50% Lighter)', 20.0, 'g', 54.4, 1.36, 5.92, 2.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cheese (50% Lighter)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Burger Sauce', 15.0, 'g', 56.0, 1.8, 0.1, 5.3, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Burger Sauce'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Lettuce', 50.0, 'g', 10.0, 1.85, 0.45, 0.05, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Lettuce'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Reduced Ketchup', 15.0, 'g', 7.0, 1.4, 0.2, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Reduced Ketchup'))));
  end if;

  -- Nandos Chicken Cibatta (Lunches)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Nandos Chicken Cibatta'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Nandos Chicken Cibatta', 'lunch', 'Nandos Chicken Cibatta')
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cibatta Roll', 1.0, 'Roll', 239.0, 44.0, 9.5, 2.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cibatta Roll'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken (Raw)', 120.0, 'g', 144.0, 0.0, 27.0, 3.12, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken (Raw)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Pepper', 0.5, 'unit', 15.5, 7.4, 0.6, 0.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Pepper'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Onion', 0.5, 'small', 14.0, 3.25, 0.4, 0.05, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Onion'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Nandos Peri Peri Sauce', 15.0, 'g', 7.2, 0.08, 0.08, 0.56, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Nandos Peri Peri Sauce'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cheese (50% Lighter)', 10.0, 'g', 27.2, 0.68, 2.96, 1.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cheese (50% Lighter)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Nandos Sweet Chilli Jam', 15.0, 'g', 21.0, 4.8, 0.1, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Nandos Sweet Chilli Jam'))));
  end if;

  -- Scrambled Egg Bagel (Lunches)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Scrambled Egg Bagel'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Scrambled Egg Bagel', 'lunch', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Eggs', 3.0, 'large', 237.0, 1.5, 22.8, 16.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Eggs'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Bagel Thin', 1.0, 'unit', 130.0, 25.0, 5.0, 0.7, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Bagel Thin'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Strawberries', 100.0, 'g', 30.0, 6.0, 0.8, 0.1, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Strawberries'))));
  end if;

  -- Roasted Tomato Pepper and Feta Soup (Lunches)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Roasted Tomato Pepper and Feta Soup'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Roasted Tomato Pepper and Feta Soup', 'lunch', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Tomato', 1.0, 'unit', 14.0, 2.4, 0.4, 0.1, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Tomato'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Pepper', 0.5, 'unit', 15.5, 7.4, 0.6, 0.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Pepper'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Onion', 0.5, 'small', 14.0, 3.25, 0.4, 0.05, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Onion'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Garlic', 0.5, 'clove', 2.5, 0.5, 0.1, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Garlic'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Feta Cheese', 10.0, 'g', 25.2, 0.09, 1.53, 2.07, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Feta Cheese'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken Stock Cube', 0.25, 'unit', 7.0, 0.5, 0.3, 0.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken Stock Cube'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cottage Cheese', 20.0, 'g', 21.0, 0.84, 1.9, 1.12, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cottage Cheese'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Tomato Puree', 10.0, 'g', 6.5, 1.4, 0.3, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Tomato Puree'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chickpeas', 0.75, 'tin', 226.5, 28.2, 14.1, 4.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chickpeas'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Warbutons NAS Wholemeal', 2.0, 'unit', 110.0, 18.0, 5.0, 1.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Warbutons NAS Wholemeal'))));
  end if;

  -- Chicken and Veg Soup (Lunches)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Chicken and Veg Soup'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Chicken and Veg Soup', 'lunch', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken (Raw)', 100.0, 'g', 120.0, 0.0, 22.5, 2.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken (Raw)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Baking Potato', 50.0, 'g', 38.5, 8.75, 1.0, 0.05, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Baking Potato'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Swede', 50.0, 'g', 14.5, 2.5, 0.35, 0.15, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Swede'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Parsnip', 50.0, 'g', 38.0, 6.25, 0.9, 0.55, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Parsnip'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Carrot', 1.0, 'unit', 32.0, 6.2, 0.4, 0.3, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Carrot'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Leeks', 1.0, 'unit', 27.0, 2.9, 1.6, 0.5, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Leeks'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken Stock Cube', 0.25, 'unit', 7.0, 0.5, 0.3, 0.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken Stock Cube'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Warbutons NAS Wholemeal', 2.0, 'unit', 110.0, 18.0, 5.0, 1.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Warbutons NAS Wholemeal'))));
  end if;

  -- Chicken Salad (Lunches)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Chicken Salad'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Chicken Salad', 'lunch', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken (Raw)', 130.0, 'g', 156.0, 0.0, 29.25, 3.38, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken (Raw)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Lettuce', 100.0, 'g', 20.0, 3.7, 0.9, 0.1, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Lettuce'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Pepper', 0.5, 'unit', 15.5, 7.4, 0.6, 0.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Pepper'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cucumber', 50.0, 'g', 8.0, 0.55, 0.45, 0.25, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cucumber'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cherry Tomatoes', 40.0, 'g', 10.5, 1.45, 0.45, 0.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cherry Tomatoes'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cottage Cheese', 50.0, 'g', 52.5, 2.1, 4.75, 2.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cottage Cheese'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Penne Pasta (uncooked)', 40.0, 'g', 140.0, 29.6, 5.0, 0.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Penne Pasta (uncooked)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Olive Oil', 5.0, 'g', 45.0, 0.0, 0.0, 5.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Olive Oil'))));
  end if;

  -- Crispy Chilli Chicken Wrap (Lunches)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Crispy Chilli Chicken Wrap'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Crispy Chilli Chicken Wrap', 'lunch', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken (Raw)', 120.0, 'g', 144.0, 0.0, 27.0, 3.12, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken (Raw)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Tortilla Wrap', 1.0, 'unit', 181.0, 36.8, 4.5, 2.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Tortilla Wrap'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Egg White', 1.0, 'egg', 20.0, 0.2, 4.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Egg White'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Panko Breadcrumbs', 10.0, 'g', 38.0, 7.6, 0.96, 0.32, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Panko Breadcrumbs'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Lettuce', 60.0, 'g', 12.0, 2.22, 0.54, 0.06, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Lettuce'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Reduced Sweet Chilli Sauce', 15.0, 'g', 20.4, 5.04, 0.06, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Reduced Sweet Chilli Sauce'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Light Soy Sauce', 2.0, 'tbsp', 18.0, 3.6, 0.6, 0.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Light Soy Sauce'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Honey', 5.0, 'g', 15.0, 4.0, 0.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Honey'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Light Mayo', 10.0, 'g', 24.0, 0.9, 0.06, 2.28, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Light Mayo'))));
  end if;

  -- BBQ Chicken Pita (Lunches)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('BBQ Chicken Pita'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'BBQ Chicken Pita', 'lunch', 'Mix chicken, pepper, onion, spinach, BBQ sauce and cottage cheese in a pan
Toast pita, open up and place in lettuce, then stuff with mix from pan')
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Pita Bread', 1.0, 'unit', 145.0, 28.8, 5.4, 0.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Pita Bread'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cooked Chicken', 100.0, 'g', 125.0, 0.5, 26.0, 2.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cooked Chicken'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Pepper', 0.5, 'unit', 15.5, 7.4, 0.6, 0.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Pepper'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Onion', 0.5, 'small', 14.0, 3.25, 0.4, 0.05, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Onion'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Lettuce', 30.0, 'g', 6.0, 1.11, 0.27, 0.03, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Lettuce'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Spinach', 50.0, 'g', 9.5, 0.1, 1.3, 0.3, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Spinach'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'BBQ Sauce', 15.0, 'g', 15.0, 3.7, 0.1, 0.1, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('BBQ Sauce'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cottage Cheese', 50.0, 'g', 52.5, 2.1, 4.75, 2.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cottage Cheese'))));
  end if;

  -- Pesto Chicken Cibatta (Lunches)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Pesto Chicken Cibatta'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Pesto Chicken Cibatta', 'lunch', 'Mixing chicken with pesto makes this so much easier
Add paprika')
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cibatta Roll', 1.0, 'Roll', 239.0, 44.0, 9.5, 2.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cibatta Roll'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cooked Chicken', 80.0, 'g', 100.0, 0.4, 20.8, 1.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cooked Chicken'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Reduced Pesto', 25.0, 'g', 50.0, 1.25, 0.8, 4.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Reduced Pesto'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cucumber', 40.0, 'g', 6.4, 0.44, 0.36, 0.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cucumber'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Lettuce', 40.0, 'g', 8.0, 1.48, 0.36, 0.04, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Lettuce'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cottage Cheese', 30.0, 'g', 31.5, 1.26, 2.85, 1.68, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cottage Cheese'))));
  end if;

  -- Pesto Chicken Pannini (Lunches)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Pesto Chicken Pannini'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Pesto Chicken Pannini', 'lunch', 'Add paprika')
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Panini', 1.0, 'roll', 250.0, 46.5, 8.3, 2.5, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Panini'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cooked Chicken', 80.0, 'g', 100.0, 0.4, 20.8, 1.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cooked Chicken'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Reduced Pesto', 25.0, 'g', 50.0, 1.25, 0.8, 4.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Reduced Pesto'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cucumber', 40.0, 'g', 6.4, 0.44, 0.36, 0.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cucumber'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Lettuce', 40.0, 'g', 8.0, 1.48, 0.36, 0.04, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Lettuce'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cottage Cheese', 30.0, 'g', 31.5, 1.26, 2.85, 1.68, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cottage Cheese'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cheese (50% Lighter)', 10.0, 'g', 27.2, 0.68, 2.96, 1.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cheese (50% Lighter)'))));
  end if;

  -- Egg Salad Bun (Lunches)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Egg Salad Bun'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Egg Salad Bun', 'lunch', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Eggs', 3.0, 'large', 237.0, 1.5, 22.8, 16.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Eggs'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Wholemeal Bap', 1.0, 'unit', 123.0, 19.0, 6.5, 1.7, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Wholemeal Bap'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Lettuce', 50.0, 'g', 10.0, 1.85, 0.45, 0.05, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Lettuce'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Salad Cream (50% Reduced)', 15.0, 'g', 15.0, 1.5, 0.1, 0.9, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Salad Cream (50% Reduced)'))));
  end if;

  -- Ham and Cheese Toastie (Lunches)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Ham and Cheese Toastie'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Ham and Cheese Toastie', 'lunch', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Jason''s No.9 Wholemeal Sourdough', 2.0, 'slice', 210.0, 35.8, 11.2, 1.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Jason''s No.9 Wholemeal Sourdough'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Wafer Thin Honey Roast Ham', 6.0, 'slice', 84.0, 2.4, 14.4, 1.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Wafer Thin Honey Roast Ham'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cheese (50% Lighter)', 25.0, 'g', 68.0, 1.7, 7.4, 3.5, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cheese (50% Lighter)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Butter', 10.0, 'g', 67.9, 0.06, 0.05, 7.5, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Butter'))));
  end if;

  -- Chicken Pita (Lunches)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Chicken Pita'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Chicken Pita', 'lunch', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Pita Bread', 1.0, 'unit', 145.0, 28.8, 5.4, 0.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Pita Bread'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken (Raw)', 120.0, 'g', 144.0, 0.0, 27.0, 3.12, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken (Raw)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Lettuce', 30.0, 'g', 6.0, 1.11, 0.27, 0.03, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Lettuce'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Reduced Sweet Chilli Sauce', 20.0, 'g', 27.2, 6.72, 0.08, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Reduced Sweet Chilli Sauce'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Onion', 0.5, 'small', 14.0, 3.25, 0.4, 0.05, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Onion'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Pepper', 0.5, 'unit', 15.5, 7.4, 0.6, 0.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Pepper'))));
  end if;

  -- Chicken, Rice and Veg (Lunches)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Chicken, Rice and Veg'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Chicken, Rice and Veg', 'lunch', 'Batch cooking this meal canbe SO quick. Just cook the chicken and rice all at once and then microwave the veg from frozen before eating. Cook as many meals as you want and freeze if needed.')
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Rice (uncooked)', 50.0, 'g', 182.5, 41.4, 4.2, 0.45, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Rice (uncooked)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken (Raw)', 120.0, 'g', 144.0, 0.0, 27.0, 3.12, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken (Raw)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Country Vegetable Mix (Frozen)', 150.0, 'g', 69.0, 8.85, 4.2, 1.05, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Country Vegetable Mix (Frozen)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Reduced Sweet Chilli Sauce', 25.0, 'g', 34.0, 8.4, 0.1, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Reduced Sweet Chilli Sauce'))));
  end if;

  -- Chicken Caesar Salad (Lunches)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Chicken Caesar Salad'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Chicken Caesar Salad', 'lunch', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken (Raw)', 100.0, 'g', 120.0, 0.0, 22.5, 2.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken (Raw)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Reduced Caesar Dressing', 15.0, 'ml', 34.0, 0.8, 0.3, 3.3, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Reduced Caesar Dressing'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Eggs', 1.0, 'large', 79.0, 0.5, 7.6, 5.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Eggs'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Avacado', 0.5, 'unit', 120.0, 6.4, 1.5, 11.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Avacado'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Lettuce', 100.0, 'g', 20.0, 3.7, 0.9, 0.1, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Lettuce'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Parmesan', 10.0, 'g', 48.4, 0.0, 3.88, 3.56, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Parmesan'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cucumber', 50.0, 'g', 8.0, 0.55, 0.45, 0.25, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cucumber'))));
  end if;

  -- Roast Ham Sandwich (Lunches)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Roast Ham Sandwich'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Roast Ham Sandwich', 'lunch', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Gammon', 120.0, 'g', 208.8, 0.36, 21.6, 13.44, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Gammon'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Jason''s No.9 Wholemeal Sourdough', 2.0, 'slice', 210.0, 35.8, 11.2, 1.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Jason''s No.9 Wholemeal Sourdough'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Tomato', 0.5, 'unit', 8.4, 1.44, 0.24, 0.06, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Tomato'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cucumber', 100.0, 'g', 16.0, 1.1, 0.9, 0.5, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cucumber'))));
  end if;

  -- Naked Borrito (Lunches)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Naked Borrito'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Naked Borrito', 'lunch', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, '5% Fat Mince (uncooked)', 150.0, 'g', 193.5, 2.7, 30.45, 6.75, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('5% Fat Mince (uncooked)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Sweet Potato (Raw)', 150.0, 'g', 135.0, 31.5, 3.0, 0.3, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Sweet Potato (Raw)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Taco Seasoning', 0.25, 'packet', 12.0, 2.05, 0.2, 0.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Taco Seasoning'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Kidney Beans', 0.25, 'tin', 57.5, 7.9, 4.1, 0.25, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Kidney Beans'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Lettuce', 100.0, 'g', 20.0, 3.7, 0.9, 0.1, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Lettuce'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Avacado', 0.25, 'unit', 60.0, 3.2, 0.75, 5.5, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Avacado'))));
  end if;

  -- Rice Cakes (Pre-Workouts)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'pre_workout' and lower(trim(name)) = lower(trim('Rice Cakes'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Rice Cakes', 'pre_workout', '(Overnight oats) Maybe bulk prep these for the week and keep them in the fridge
I personally prefer vanilla protein powder in this meal but use whichever you like:)')
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Caramel Rice Cake', 2.0, 'unit', 102.0, 22.6, 0.0, 0.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Caramel Rice Cake'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Banana', 0.75, 'unit', 53.25, 13.725, 0.675, 0.225, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Banana'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Isolate Protein Powder', 25.0, 'g', 91.0, 0.6, 22.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Isolate Protein Powder'))));
  end if;

  -- Cereal (Pre-Workouts)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'pre_workout' and lower(trim(name)) = lower(trim('Cereal'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Cereal', 'pre_workout', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Coco Pops', 50.0, 'g', 193.5, 44.85, 2.35, 1.35, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Coco Pops'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Semi-Skimmed Milk', 200.0, 'ml', 98.0, 9.6, 7.2, 3.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Semi-Skimmed Milk'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Isolate Protein Powder', 20.0, 'g', 72.8, 0.48, 17.6, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Isolate Protein Powder'))));
  end if;

  -- Oats (Pre-Workouts)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'pre_workout' and lower(trim(name)) = lower(trim('Oats'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Oats', 'pre_workout', 'Make using water, let the oats cooldown slightly and then put the protein powder in (to prevent it de-naturing the protein). I like using chocolate protein powder for this')
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Oats', 50.0, 'g', 185.0, 32.5, 6.0, 2.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Oats'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Isolate Protein Powder', 20.0, 'g', 72.8, 0.48, 17.6, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Isolate Protein Powder'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Strawberries', 60.0, 'g', 18.0, 3.6, 0.48, 0.06, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Strawberries'))));
  end if;

  -- Bagel Thin (Pre-Workouts)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'pre_workout' and lower(trim(name)) = lower(trim('Bagel Thin'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Bagel Thin', 'pre_workout', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Bagel Thin', 1.0, 'unit', 130.0, 25.0, 5.0, 0.7, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Bagel Thin'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Jam', 25.0, 'g', 62.0, 15.2, 0.8, 0.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Jam'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Isolate Protein Powder', 20.0, 'g', 72.8, 0.48, 17.6, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Isolate Protein Powder'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Strawberries', 60.0, 'g', 18.0, 3.6, 0.48, 0.06, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Strawberries'))));
  end if;

  -- Sweet Potato (Pre-Workouts)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'pre_workout' and lower(trim(name)) = lower(trim('Sweet Potato'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Sweet Potato', 'pre_workout', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Sweet Potato (Raw)', 150.0, 'g', 135.0, 31.5, 3.0, 0.3, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Sweet Potato (Raw)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken (Raw)', 100.0, 'g', 120.0, 0.0, 22.5, 2.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken (Raw)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Olive Oil', 5.0, 'g', 45.0, 0.0, 0.0, 5.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Olive Oil'))));
  end if;

  -- Crumpets (Pre-Workouts)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'pre_workout' and lower(trim(name)) = lower(trim('Crumpets'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Crumpets', 'pre_workout', '(Overnight oats) Maybe bulk prep these for the week and keep them in the fridge
I personally prefer vanilla protein powder in this meal but use whichever you like:)')
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Crumpets', 2.0, 'unit', 194.0, 38.8, 6.6, 0.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Crumpets'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Jam', 20.0, 'g', 49.6, 12.16, 0.64, 0.64, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Jam'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Isolate Protein Powder', 20.0, 'g', 72.8, 0.48, 17.6, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Isolate Protein Powder'))));
  end if;

  -- Squares Bar and Banana (Pre-Workouts)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'pre_workout' and lower(trim(name)) = lower(trim('Squares Bar and Banana'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Squares Bar and Banana', 'pre_workout', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Rice Crispies Squares Bar', 1.0, 'unit', 119.0, 21.0, 0.8, 3.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Rice Crispies Squares Bar'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Banana', 1.0, 'unit', 71.0, 18.3, 0.9, 0.3, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Banana'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Isolate Protein Powder', 25.0, 'g', 91.0, 0.6, 22.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Isolate Protein Powder'))));
  end if;

  -- Protein Yogurt (Pouch) (Pre-Workouts)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'pre_workout' and lower(trim(name)) = lower(trim('Protein Yogurt (Pouch)'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Protein Yogurt (Pouch)', 'pre_workout', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Protein Yogurt (Pouch)', 1.0, 'unit', 148.0, 8.9, 25.0, 0.9, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Protein Yogurt (Pouch)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Caramel Rice Cake', 2.0, 'unit', 102.0, 22.6, 0.0, 0.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Caramel Rice Cake'))));
  end if;

  -- Jam Crumpet Thins (Pre-Workouts)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'pre_workout' and lower(trim(name)) = lower(trim('Jam Crumpet Thins'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Jam Crumpet Thins', 'pre_workout', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Crumpet Thin', 2.0, 'unit', 122.0, 24.6, 4.0, 0.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Crumpet Thin'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Protein Yogurt (Pouch)', 1.0, 'unit', 148.0, 8.9, 25.0, 0.9, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Protein Yogurt (Pouch)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Jam', 15.0, 'g', 37.2, 9.12, 0.48, 0.48, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Jam'))));
  end if;

  -- Jam Bagel (Pre-Workouts)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'pre_workout' and lower(trim(name)) = lower(trim('Jam Bagel'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Jam Bagel', 'pre_workout', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Bagel', 1.0, 'unit', 225.0, 44.3, 7.9, 1.3, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Bagel'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Jam', 25.0, 'g', 62.0, 15.2, 0.8, 0.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Jam'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Protein Yogurt (Pouch)', 1.0, 'unit', 148.0, 8.9, 25.0, 0.9, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Protein Yogurt (Pouch)'))));
  end if;

  -- Steak and Poatoes (Teas)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Steak and Poatoes'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Steak and Poatoes', 'dinner', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Sirloin Steak (Raw)', 180.0, 'g', 361.8, 0.0, 38.88, 22.86, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Sirloin Steak (Raw)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Salad', 150.0, 'g', 25.5, 3.9, 2.4, 0.45, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Salad'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Baking Potato', 200.0, 'g', 154.0, 35.0, 4.0, 0.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Baking Potato'))));
  end if;

  -- Chicken and Potatos (Teas)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Chicken and Potatos'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Chicken and Potatos', 'dinner', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Baby Potatoes (Boiled)', 350.0, 'g', 250.0, 52.2, 6.4, 0.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Baby Potatoes (Boiled)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken (Raw)', 130.0, 'g', 156.0, 0.0, 29.25, 3.38, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken (Raw)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Pepper', 1.0, 'unit', 31.0, 14.8, 1.2, 0.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Pepper'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Light Soy Sauce', 1.0, 'tbsp', 9.0, 1.8, 0.3, 0.1, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Light Soy Sauce'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Olive Oil', 5.0, 'g', 45.0, 0.0, 0.0, 5.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Olive Oil'))));
  end if;

  -- Fajitas (Teas)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Fajitas'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Fajitas', 'dinner', 'Fajita Seasoning is based on the full packet (0.4 = 40% of the packet)')
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken (Raw)', 130.0, 'g', 156.0, 0.0, 29.25, 3.38, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken (Raw)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Small Wrap', 2.0, 'unit', 176.0, 30.8, 5.0, 3.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Small Wrap'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Pepper', 0.5, 'unit', 15.5, 7.4, 0.6, 0.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Pepper'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Onion', 0.5, 'small', 14.0, 3.25, 0.4, 0.05, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Onion'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Fajita Seasoning', 0.5, 'packet', 52.0, 11.2, 1.2, 0.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Fajita Seasoning'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Salsa', 70.0, 'g', 23.8, 4.69, 0.98, 0.14, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Salsa'))));
  end if;

  -- Smash Burger (Teas)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Smash Burger'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Smash Burger', 'dinner', 'You can swap out the sauces + use any low cal sauce. Just don’t go crazy')
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, '5% Fat Mince (Uncooked)', 150.0, 'g', 193.5, 2.7, 30.45, 6.75, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('5% Fat Mince (Uncooked)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Brioche Bun', 1.0, 'unit', 172.0, 29.9, 5.2, 2.9, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Brioche Bun'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Sweet Potato (Raw)', 100.0, 'g', 90.0, 21.0, 2.0, 0.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Sweet Potato (Raw)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Burger Sauce', 15.0, 'g', 56.0, 1.8, 0.1, 5.3, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Burger Sauce'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Lettuce', 50.0, 'g', 10.0, 1.85, 0.45, 0.05, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Lettuce'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, '50% Plastic Cheese Slice', 1.0, 'unit', 36.0, 2.3, 3.2, 1.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('50% Plastic Cheese Slice'))));
  end if;

  -- Salmon and Potatoes (Teas)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Salmon and Potatoes'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Salmon and Potatoes', 'dinner', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Salmon Fillet', 130.0, 'g', 197.0, 0.0, 23.8, 11.3, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Salmon Fillet'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Baby Potatoes (Raw)', 250.0, 'g', 187.5, 42.75, 4.25, 0.75, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Baby Potatoes (Raw)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Tenderstem Broccoli', 100.0, 'g', 38.0, 1.8, 4.3, 0.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Tenderstem Broccoli'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Olive Oil', 5.0, 'g', 45.0, 0.0, 0.0, 5.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Olive Oil'))));
  end if;

  -- Stir Fry (Teas)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Stir Fry'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Stir Fry', 'dinner', 'Change Veg as desired
0.5 Stir Fry sauce = half a packet')
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken (Raw)', 100.0, 'g', 120.0, 0.0, 22.5, 2.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken (Raw)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Medium Egg Noodles', 1.0, 'unit', 271.0, 54.0, 10.0, 1.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Medium Egg Noodles'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Pepper', 1.0, 'unit', 31.0, 14.8, 1.2, 0.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Pepper'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Onion', 0.5, 'small', 14.0, 3.25, 0.4, 0.05, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Onion'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Tenderstem Broccoli', 100.0, 'g', 38.0, 1.8, 4.3, 0.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Tenderstem Broccoli'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Stir Fry Sauce', 0.5, 'unit', 47.5, 11.25, 0.12, 0.21, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Stir Fry Sauce'))));
  end if;

  -- Chicken and Rice (Teas)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Chicken and Rice'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Chicken and Rice', 'dinner', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Rice (Cooked)', 170.0, 'g', 221.0, 47.6, 4.59, 0.51, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Rice (Cooked)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken (Raw)', 130.0, 'g', 156.0, 0.0, 29.25, 3.38, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken (Raw)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Broccoli', 100.0, 'g', 39.0, 6.3, 0.3, 2.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Broccoli'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Reduced Sweet Chilli Sauce', 25.0, 'g', 34.0, 8.4, 0.1, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Reduced Sweet Chilli Sauce'))));
  end if;

  -- Chicken Burger (Teas)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Chicken Burger'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Chicken Burger', 'dinner', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken (Raw)', 100.0, 'g', 120.0, 0.0, 22.5, 2.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken (Raw)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Corn Flakes', 40.0, 'g', 151.2, 33.6, 2.8, 0.36, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Corn Flakes'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Brioche Bun', 1.0, 'unit', 172.0, 29.9, 5.2, 2.9, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Brioche Bun'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Sweet Potato (Raw)', 100.0, 'g', 90.0, 21.0, 2.0, 0.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Sweet Potato (Raw)'))));
  end if;

  -- Burger Bowl (Teas)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Burger Bowl'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Burger Bowl', 'dinner', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, '5% Fat Mince (Uncooked)', 100.0, 'g', 129.0, 1.8, 20.3, 4.5, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('5% Fat Mince (Uncooked)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Sweet Potato (Raw)', 150.0, 'g', 135.0, 31.5, 3.0, 0.3, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Sweet Potato (Raw)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Lettuce', 100.0, 'g', 20.0, 3.7, 0.9, 0.1, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Lettuce'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Crinkle Cut Gherkins', 30.0, 'g', 16.0, 3.0, 0.3, 0.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Crinkle Cut Gherkins'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cheese (50% Lighter)', 15.0, 'g', 40.8, 1.02, 4.44, 2.1, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cheese (50% Lighter)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Reduced Ketchup', 15.0, 'g', 7.0, 1.4, 0.2, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Reduced Ketchup'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Lighter than Light Mayo', 10.0, 'g', 7.5, 0.7, 0.25, 0.45, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Lighter than Light Mayo'))));
  end if;

  -- Tortilla Pizza (Teas)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Tortilla Pizza'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Tortilla Pizza', 'dinner', 'Spread tomato puree over tortilla, stack with grated cheese, cooked chicken, red pepper and a drizzle of reduced BBQ sauce and stack (high) with spinnach as it shrinks. Put in 180 oven for 13 mins')
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Tortilla Wrap', 1.0, 'unit', 181.0, 36.8, 4.5, 2.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Tortilla Wrap'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cooked Chicken', 60.0, 'g', 75.0, 0.3, 15.6, 1.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cooked Chicken'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Tomato Puree', 15.0, 'g', 13.0, 2.8, 0.6, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Tomato Puree'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cheese (50% Lighter)', 25.0, 'g', 68.0, 1.7, 7.4, 3.5, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cheese (50% Lighter)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Pepper', 1.0, 'unit', 31.0, 14.8, 1.2, 0.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Pepper'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Spinach', 100.0, 'g', 19.0, 0.2, 2.6, 0.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Spinach'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'BBQ Sauce', 15.0, 'g', 15.0, 3.7, 0.1, 0.1, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('BBQ Sauce'))));
  end if;

  -- Chicken and Sweet Potato (Teas)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Chicken and Sweet Potato'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Chicken and Sweet Potato', 'dinner', 'Sweet Potato - Make into fries, coat with oil, chinese 5 spice and salt
Chicken - Coat with chinese 5 spice, salt and soy sauce')
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken (Raw)', 130.0, 'g', 156.0, 0.0, 29.25, 3.38, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken (Raw)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Sweet Potato (Raw)', 150.0, 'g', 135.0, 31.5, 3.0, 0.3, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Sweet Potato (Raw)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Lettuce', 100.0, 'g', 20.0, 3.7, 0.9, 0.1, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Lettuce'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Light Soy Sauce', 7.0, 'tbsp', 63.0, 12.6, 2.1, 0.7, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Light Soy Sauce'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Olive Oil', 5.0, 'g', 45.0, 0.0, 0.0, 5.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Olive Oil'))));
  end if;

  -- Sticky Honey Chicken and Rice (Teas)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Sticky Honey Chicken and Rice'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Sticky Honey Chicken and Rice', 'dinner', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Rice (Cooked)', 80.0, 'g', 104.0, 22.4, 2.16, 0.24, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Rice (Cooked)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken (raw)', 120.0, 'g', 144.0, 0.0, 27.0, 3.12, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken (raw)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Corn Flour', 15.0, 'g', 56.4, 13.8, 0.12, 0.12, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Corn Flour'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Light Soy Sauce', 8.0, 'tbsp', 72.0, 14.4, 2.4, 0.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Light Soy Sauce'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Reduced Sweet Chilli Sauce', 25.0, 'g', 34.0, 8.4, 0.1, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Reduced Sweet Chilli Sauce'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Broccoli', 70.0, 'g', 27.3, 4.41, 0.21, 1.82, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Broccoli'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Honey', 20.0, 'g', 60.0, 16.0, 0.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Honey'))));
  end if;

  -- Cheesy Beef Pasta (Teas)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Cheesy Beef Pasta'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Cheesy Beef Pasta', 'dinner', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, '5% Fat Mince (Uncooked)', 100.0, 'g', 129.0, 1.8, 20.3, 4.5, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('5% Fat Mince (Uncooked)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Penne Pasta (uncooked)', 60.0, 'g', 210.0, 44.4, 7.5, 0.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Penne Pasta (uncooked)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Onion', 0.25, 'small', 7.0, 1.625, 0.2, 0.025, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Onion'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Passata', 125.0, 'g', 26.5, 3.95, 1.55, 0.25, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Passata'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Carrot', 0.25, 'unit', 8.0, 1.55, 0.1, 0.075, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Carrot'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Tomato Puree', 5.0, 'g', 5.2, 1.12, 0.24, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Tomato Puree'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Light Soy Sauce', 3.0, 'tbsp', 27.0, 5.4, 0.9, 0.3, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Light Soy Sauce'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Beef Stock Cube', 0.5, 'unit', 14.0, 0.8, 0.4, 0.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Beef Stock Cube'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cheese (50% Lighter)', 20.0, 'g', 54.4, 1.36, 5.92, 2.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cheese (50% Lighter)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Pepper', 0.25, 'unit', 7.75, 3.7, 0.3, 0.1, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Pepper'))));
  end if;

  -- Creamy Chicken Pasta (Teas)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Creamy Chicken Pasta'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Creamy Chicken Pasta', 'dinner', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Penne Pasta (uncooked)', 60.0, 'g', 210.0, 44.4, 7.5, 0.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Penne Pasta (uncooked)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken (Raw)', 100.0, 'g', 120.0, 0.0, 22.5, 2.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken (Raw)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Sun-Dried Tomatos', 20.0, 'g', 39.6, 1.5, 0.66, 3.06, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Sun-Dried Tomatos'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Reduced Crème Fresh', 80.0, 'ml', 130.4, 3.52, 2.16, 12.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Reduced Crème Fresh'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Spring Onion', 40.0, 'g', 11.0, 1.2, 0.8, 0.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Spring Onion'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken Stock Cube', 0.5, 'unit', 14.0, 1.0, 0.6, 0.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken Stock Cube'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Tomato Puree', 15.0, 'g', 13.0, 2.8, 0.6, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Tomato Puree'))));
  end if;

  -- Chicken, Hallouimi and Chorizo Pasta (Teas)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Chicken, Hallouimi and Chorizo Pasta'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Chicken, Hallouimi and Chorizo Pasta', 'dinner', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken (Raw)', 90.0, 'g', 108.0, 0.0, 20.25, 2.34, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken (Raw)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Penne Pasta (uncooked)', 60.0, 'g', 210.0, 44.4, 7.5, 0.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Penne Pasta (uncooked)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Halloumi', 15.0, 'g', 45.0, 0.55, 3.1, 3.35, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Halloumi'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chorizo', 20.0, 'g', 94.05, 0.315, 4.545, 8.145, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chorizo'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Reduced Red Pesto', 15.0, 'g', 35.7, 1.2, 0.69, 3.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Reduced Red Pesto'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Parmesan', 5.0, 'g', 24.2, 0.0, 1.94, 1.78, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Parmesan'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Tomato Puree', 15.0, 'g', 13.0, 2.8, 0.6, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Tomato Puree'))));
  end if;

  -- Sweet Chilli Chicken Egg Fried Rice (Teas)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Sweet Chilli Chicken Egg Fried Rice'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Sweet Chilli Chicken Egg Fried Rice', 'dinner', 'Use paprika and garlic seasonings')
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, '5% Fat Chicken Mince (raw)', 125.0, 'g', 146.25, 0.625, 23.625, 5.5, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('5% Fat Chicken Mince (raw)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Rice (Cooked)', 80.0, 'g', 104.0, 22.4, 2.16, 0.24, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Rice (Cooked)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Pepper', 0.5, 'unit', 15.5, 7.4, 0.6, 0.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Pepper'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Onion', 0.5, 'small', 14.0, 3.25, 0.4, 0.05, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Onion'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Spring Onion', 40.0, 'g', 11.0, 1.2, 0.8, 0.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Spring Onion'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Mushrooms', 50.0, 'g', 4.2, 0.12, 0.48, 0.12, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Mushrooms'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Light Soy Sauce', 5.0, 'tbsp', 45.0, 9.0, 1.5, 0.5, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Light Soy Sauce'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Reduced Sweet Chilli Sauce', 15.0, 'g', 20.4, 5.04, 0.06, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Reduced Sweet Chilli Sauce'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Tomato Puree', 5.0, 'g', 3.9, 0.84, 0.18, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Tomato Puree'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Eggs', 1.0, 'large', 79.0, 0.5, 7.6, 5.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Eggs'))));
  end if;

  -- Creamy Garlic Cheesy Chicken & Potatos (Teas)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Creamy Garlic Cheesy Chicken & Potatos'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Creamy Garlic Cheesy Chicken & Potatos', 'dinner', 'Onion Powder, Mixed Herbs, Chilli flakes, Paprika, Salt')
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken (Raw)', 120.0, 'g', 144.0, 0.0, 27.0, 3.12, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken (Raw)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Baking Potato', 200.0, 'g', 154.0, 35.0, 4.0, 0.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Baking Potato'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Olive Oil', 5.0, 'g', 45.0, 0.0, 0.0, 5.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Olive Oil'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Garlic', 1.0, 'clove', 5.0, 1.0, 0.2, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Garlic'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Semi-Skimmed Milk', 30.0, 'ml', 14.7, 1.44, 1.08, 0.51, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Semi-Skimmed Milk'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Light Cream Cheese', 25.0, 'g', 35.2, 1.2, 1.76, 2.56, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Light Cream Cheese'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Parmesan', 10.0, 'g', 36.3, 0.0, 2.91, 2.67, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Parmesan'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cheese (50% Lighter)', 15.0, 'g', 40.8, 1.02, 4.44, 2.1, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cheese (50% Lighter)'))));
  end if;

  -- Cheesy BBQ Chicken Loaded Fries (Teas)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Cheesy BBQ Chicken Loaded Fries'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Cheesy BBQ Chicken Loaded Fries', 'dinner', 'Salt, Mixed Herbs, Paprika, Garlic Powder, Onion Granules')
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken (Raw)', 120.0, 'g', 144.0, 0.0, 27.0, 3.12, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken (Raw)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Baking Potato', 200.0, 'g', 154.0, 35.0, 4.0, 0.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Baking Potato'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Onion', 0.5, 'small', 14.0, 3.25, 0.4, 0.05, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Onion'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Tomato Puree', 15.0, 'g', 13.0, 2.8, 0.6, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Tomato Puree'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'BBQ Sauce', 15.0, 'g', 15.0, 3.7, 0.1, 0.1, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('BBQ Sauce'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Light Cream Cheese', 30.0, 'g', 44.0, 1.5, 2.2, 3.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Light Cream Cheese'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken Stock Cube', 0.5, 'unit', 14.0, 1.0, 0.6, 0.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken Stock Cube'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cheese (50% Lighter)', 25.0, 'g', 68.0, 1.7, 7.4, 3.5, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cheese (50% Lighter)'))));
  end if;

  -- Creamy Cajun Chicken Pasta (Teas)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Creamy Cajun Chicken Pasta'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Creamy Cajun Chicken Pasta', 'dinner', 'Pink Salt, Garlic Granules. Onion Granules')
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken (raw)', 120.0, 'g', 144.0, 0.0, 27.0, 3.12, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken (raw)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Penne Pasta (uncooked)', 60.0, 'g', 210.0, 44.4, 7.5, 0.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Penne Pasta (uncooked)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Onion', 0.5, 'small', 14.0, 3.25, 0.4, 0.05, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Onion'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Pepper', 0.5, 'unit', 15.5, 7.4, 0.6, 0.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Pepper'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Garlic', 1.0, 'clove', 5.0, 1.0, 0.2, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Garlic'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chopped Tomatoes', 0.5, 'tin', 47.0, 7.2, 2.6, 0.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chopped Tomatoes'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Light Cream Cheese', 25.0, 'g', 35.2, 1.2, 1.76, 2.56, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Light Cream Cheese'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Parmesan', 10.0, 'g', 36.3, 0.0, 2.91, 2.67, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Parmesan'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken Stock Cube', 0.5, 'unit', 14.0, 1.0, 0.6, 0.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken Stock Cube'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Spring Onion', 15.0, 'g', 4.4, 0.48, 0.32, 0.08, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Spring Onion'))));
  end if;

  -- Chicken and Chorizo Rice (Teas)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Chicken and Chorizo Rice'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Chicken and Chorizo Rice', 'dinner', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken (raw)', 100.0, 'g', 120.0, 0.0, 22.5, 2.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken (raw)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chorizo', 30.0, 'g', 146.3, 0.49, 7.07, 12.67, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chorizo'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Rice (Cooked)', 130.0, 'g', 169.0, 36.4, 3.51, 0.39, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Rice (Cooked)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Tomato Puree', 15.0, 'g', 13.0, 2.8, 0.6, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Tomato Puree'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Garlic', 1.0, 'clove', 5.0, 1.0, 0.2, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Garlic'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken Stock Cube', 0.5, 'unit', 14.0, 1.0, 0.6, 0.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken Stock Cube'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cheese (50% Lighter)', 20.0, 'g', 54.4, 1.36, 5.92, 2.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cheese (50% Lighter)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Onion', 0.5, 'small', 14.0, 3.25, 0.4, 0.05, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Onion'))));
  end if;

  -- Spaghetti Bolognase (Teas)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Spaghetti Bolognase'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Spaghetti Bolognase', 'dinner', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Spaghetti (Dry)', 60.0, 'g', 214.4, 42.88, 7.92, 0.56, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Spaghetti (Dry)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, '5% Fat Mince (uncooked)', 100.0, 'g', 129.0, 1.8, 20.3, 4.5, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('5% Fat Mince (uncooked)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chopped Tomatoes', 0.5, 'tin', 47.0, 7.2, 2.6, 0.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chopped Tomatoes'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cheese (50% Lighter)', 10.0, 'g', 21.76, 0.544, 2.368, 1.12, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cheese (50% Lighter)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Tomato Puree', 15.0, 'g', 13.0, 2.8, 0.6, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Tomato Puree'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Onion', 1.0, 'small', 28.0, 6.5, 0.8, 0.1, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Onion'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Celery', 50.0, 'g', 5.0, 0.45, 0.25, 0.1, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Celery'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Carrot', 1.0, 'unit', 32.0, 6.2, 0.4, 0.3, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Carrot'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Red wine Stock Pot', 0.5, 'pot', 24.0, 4.6, 0.4, 0.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Red wine Stock Pot'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Beef Stock Cube', 0.5, 'unit', 14.0, 0.8, 0.4, 0.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Beef Stock Cube'))));
  end if;

  -- BBQ Chicken Pizza (Teas)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('BBQ Chicken Pizza'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'BBQ Chicken Pizza', 'dinner', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, '0% Greek Yogurt', 100.0, 'g', 54.0, 3.0, 10.3, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('0% Greek Yogurt'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Self-Raising Flour', 75.0, 'g', 264.0, 54.75, 7.35, 1.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Self-Raising Flour'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Tomato Puree', 15.0, 'g', 13.0, 2.8, 0.6, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Tomato Puree'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cooked Chicken', 50.0, 'g', 62.5, 0.25, 13.0, 1.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cooked Chicken'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Onion', 0.5, 'small', 14.0, 3.25, 0.4, 0.05, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Onion'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Pepper', 0.5, 'unit', 15.5, 7.4, 0.6, 0.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Pepper'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'BBQ Sauce', 15.0, 'g', 15.0, 3.7, 0.1, 0.1, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('BBQ Sauce'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cheese (50% Lighter)', 25.0, 'g', 68.0, 1.7, 7.4, 3.5, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cheese (50% Lighter)'))));
  end if;

  -- Big Mac Loaded Fries (Teas)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Big Mac Loaded Fries'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Big Mac Loaded Fries', 'dinner', 'Pink Salt, Chinese 5 Spice, Garlic Granules, Onion Granules')
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, '5% Fat Mince (Uncooked)', 110.0, 'g', 141.9, 1.98, 22.33, 4.95, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('5% Fat Mince (Uncooked)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Sweet Potato (Raw)', 200.0, 'g', 180.0, 42.0, 4.0, 0.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Sweet Potato (Raw)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Lettuce', 70.0, 'g', 14.0, 2.59, 0.63, 0.07, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Lettuce'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Crinkle Cut Gherkins', 30.0, 'g', 16.0, 3.0, 0.3, 0.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Crinkle Cut Gherkins'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cheese (50% Lighter)', 25.0, 'g', 68.0, 1.7, 7.4, 3.5, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cheese (50% Lighter)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Reduced Ketchup', 15.0, 'g', 7.0, 1.4, 0.2, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Reduced Ketchup'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Burger Sauce', 15.0, 'g', 56.0, 1.8, 0.1, 5.3, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Burger Sauce'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Tomato Puree', 15.0, 'g', 13.0, 2.8, 0.6, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Tomato Puree'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Spring Onion', 25.0, 'g', 6.6, 0.72, 0.48, 0.12, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Spring Onion'))));
  end if;

  -- Chilli and Wedges (Teas)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Chilli and Wedges'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Chilli and Wedges', 'dinner', 'Tsp Chilli Powder, Cumin, Cinnamon, Paprika and Garlic Granules')
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Baking Potato', 150.0, 'g', 115.5, 26.25, 3.0, 0.15, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Baking Potato'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, '5% Fat Mince (uncooked)', 130.0, 'g', 167.7, 2.34, 26.39, 5.85, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('5% Fat Mince (uncooked)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Kidney Beans In Chilli Sauce', 0.5, 'tin', 134.0, 19.4, 8.7, 0.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Kidney Beans In Chilli Sauce'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Onion', 1.0, 'small', 28.0, 6.5, 0.8, 0.1, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Onion'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Pepper', 0.5, 'unit', 15.5, 7.4, 0.6, 0.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Pepper'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chopped Tomatoes', 0.5, 'tin', 47.0, 7.2, 2.6, 0.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chopped Tomatoes'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Coriander', 10.0, 'g', 3.3, 0.37, 0.21, 0.05, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Coriander'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Tomato Puree', 15.0, 'g', 13.0, 2.8, 0.6, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Tomato Puree'))));
  end if;

  -- Nandos Orzo (Teas)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Nandos Orzo'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Nandos Orzo', 'dinner', 'Salt, Peri Peri Seasoning')
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken (raw)', 120.0, 'g', 144.0, 0.0, 27.0, 3.12, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken (raw)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Orzo (dry)', 50.0, 'g', 196.3, 39.13, 7.67, 0.39, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Orzo (dry)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Halloumi', 25.0, 'g', 72.0, 0.88, 4.96, 5.36, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Halloumi'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Nandos Peri Peri Sauce', 20.0, 'g', 9.0, 0.1, 0.1, 0.7, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Nandos Peri Peri Sauce'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken Stock Cube', 0.25, 'unit', 7.0, 0.5, 0.3, 0.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken Stock Cube'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Tomato Puree', 15.0, 'g', 13.0, 2.8, 0.6, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Tomato Puree'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Light Cream Cheese', 15.0, 'g', 22.0, 0.75, 1.1, 1.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Light Cream Cheese'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Onion', 0.5, 'small', 14.0, 3.25, 0.4, 0.05, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Onion'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Pepper', 0.5, 'unit', 15.5, 7.4, 0.6, 0.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Pepper'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cherry Tomatoes', 50.0, 'g', 12.6, 1.74, 0.54, 0.24, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cherry Tomatoes'))));
  end if;

  -- Chicken Sausage and Mascarpone (Teas)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Chicken Sausage and Mascarpone'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Chicken Sausage and Mascarpone', 'dinner', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken Chipolata Sausages', 4.0, 'unit', 172.0, 8.8, 17.6, 6.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken Chipolata Sausages'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Penne Pasta (uncooked)', 50.0, 'g', 175.0, 37.0, 6.25, 0.5, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Penne Pasta (uncooked)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chopped Tomatoes', 0.5, 'tin', 47.0, 7.2, 2.6, 0.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chopped Tomatoes'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Tomato Mascarpone Sauce', 100.0, 'g', 91.0, 6.5, 1.8, 6.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Tomato Mascarpone Sauce'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Tomato Puree', 15.0, 'g', 13.0, 2.8, 0.6, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Tomato Puree'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken Stock Cube', 0.5, 'unit', 14.0, 1.0, 0.6, 0.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken Stock Cube'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cheese (50% Lighter)', 20.0, 'g', 54.4, 1.36, 5.92, 2.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cheese (50% Lighter)'))));
  end if;

  -- Chicken and Bacon Potato Pie (Teas)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Chicken and Bacon Potato Pie'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Chicken and Bacon Potato Pie', 'dinner', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Bacon Medallions', 1.0, 'unit', 27.0, 0.2, 5.2, 0.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Bacon Medallions'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken (Raw)', 70.0, 'g', 84.0, 0.0, 15.75, 1.82, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken (Raw)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Baby Potatoes (Raw)', 150.0, 'g', 112.5, 25.65, 2.55, 0.45, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Baby Potatoes (Raw)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, '0% Greek Yogurt', 100.0, 'g', 54.0, 3.0, 10.3, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('0% Greek Yogurt'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Semi-Skimmed Milk', 100.0, 'ml', 49.0, 4.8, 3.6, 1.7, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Semi-Skimmed Milk'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Leeks', 1.0, 'unit', 27.0, 2.9, 1.6, 0.5, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Leeks'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken Stock Cube', 0.25, 'unit', 7.0, 0.5, 0.3, 0.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken Stock Cube'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Reduced Crème Fresh', 50.0, 'ml', 81.5, 2.2, 1.35, 7.5, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Reduced Crème Fresh'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Mustard (Wholegrain)', 10.0, 'g', 20.0, 0.8, 1.0, 1.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Mustard (Wholegrain)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cheese (50% Lighter)', 10.0, 'g', 27.2, 0.68, 2.96, 1.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cheese (50% Lighter)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Plain Flour', 10.0, 'g', 35.7, 7.35, 0.99, 0.17, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Plain Flour'))));
  end if;

  -- Jacket Potato, Tuna, Cheese and Onion (Teas)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Jacket Potato, Tuna, Cheese and Onion'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Jacket Potato, Tuna, Cheese and Onion', 'dinner', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Baking Potato', 300.0, 'g', 231.0, 52.5, 6.0, 0.3, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Baking Potato'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Tuna', 1.0, 'tin', 110.0, 0.0, 25.4, 1.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Tuna'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Onion', 0.5, 'small', 14.0, 3.25, 0.4, 0.05, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Onion'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cheese (50% Lighter)', 25.0, 'g', 68.0, 1.7, 7.4, 3.5, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cheese (50% Lighter)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Salad', 100.0, 'g', 17.0, 2.6, 1.6, 0.3, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Salad'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Olive Oil', 5.0, 'g', 45.0, 0.0, 0.0, 5.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Olive Oil'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Lighter than Light Mayo', 15.0, 'g', 15.0, 1.4, 0.5, 0.9, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Lighter than Light Mayo'))));
  end if;

  -- Chicken Fajitas (Teas)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Chicken Fajitas'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Chicken Fajitas', 'dinner', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken (Raw)', 130.0, 'g', 156.0, 0.0, 29.25, 3.38, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken (Raw)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Small Wrap', 2.0, 'unit', 176.0, 30.8, 5.0, 3.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Small Wrap'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Pepper', 0.5, 'unit', 15.5, 7.4, 0.6, 0.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Pepper'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Onion', 0.5, 'small', 14.0, 3.25, 0.4, 0.05, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Onion'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Fajita Seasoning', 0.5, 'packet', 52.0, 11.2, 1.2, 0.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Fajita Seasoning'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Salsa', 50.0, 'g', 17.0, 3.35, 0.7, 0.1, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Salsa'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cheese (50% Lighter)', 25.0, 'g', 68.0, 1.7, 7.4, 3.5, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cheese (50% Lighter)'))));
  end if;

  -- Creamy Nandos Chicken Pasta (Teas)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Creamy Nandos Chicken Pasta'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Creamy Nandos Chicken Pasta', 'dinner', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken (raw)', 120.0, 'g', 144.0, 0.0, 27.0, 3.12, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken (raw)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Penne Pasta (uncooked)', 60.0, 'g', 210.0, 44.4, 7.5, 0.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Penne Pasta (uncooked)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Nandos Peri Peri Sauce', 20.0, 'g', 9.0, 0.1, 0.1, 0.7, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Nandos Peri Peri Sauce'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Pepper', 0.5, 'unit', 15.5, 7.4, 0.6, 0.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Pepper'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Onion', 0.5, 'small', 14.0, 3.25, 0.4, 0.05, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Onion'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Light Cream Cheese', 30.0, 'g', 44.0, 1.5, 2.2, 3.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Light Cream Cheese'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cheese (50% Lighter)', 20.0, 'g', 54.4, 1.36, 5.92, 2.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cheese (50% Lighter)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chopped Tomatoes', 0.5, 'tin', 47.0, 7.2, 2.6, 0.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chopped Tomatoes'))));
  end if;

  -- Beef Tacos (Teas)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Beef Tacos'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Beef Tacos', 'dinner', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, '5% Fat Mince (Uncooked)', 200.0, 'g', 258.0, 3.6, 40.6, 9.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('5% Fat Mince (Uncooked)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Pepper', 1.0, 'unit', 31.0, 14.8, 1.2, 0.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Pepper'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Onion', 1.0, 'small', 28.0, 6.5, 0.8, 0.1, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Onion'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Taco Seasoning', 0.5, 'packet', 24.0, 4.1, 0.4, 0.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Taco Seasoning'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Salsa', 150.0, 'g', 51.0, 10.05, 2.1, 0.3, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Salsa'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Taco Shells', 2.0, 'unit', 118.0, 17.2, 1.6, 4.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Taco Shells'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Lettuce', 70.0, 'g', 14.0, 2.59, 0.63, 0.07, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Lettuce'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cucumber', 50.0, 'g', 8.0, 0.55, 0.45, 0.25, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cucumber'))));
  end if;

  -- Mayflower Curry (Teas)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Mayflower Curry'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Mayflower Curry', 'dinner', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Rice (Cooked)', 100.0, 'g', 130.0, 28.0, 2.7, 0.3, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Rice (Cooked)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Mayflower Curry Sauce', 200.0, 'g', 154.0, 16.6, 2.2, 7.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Mayflower Curry Sauce'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken (Raw)', 150.0, 'g', 180.0, 0.0, 33.75, 3.9, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken (Raw)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Onion', 0.5, 'small', 14.0, 3.25, 0.4, 0.05, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Onion'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Garden Peas (cooked)', 40.0, 'g', 29.5, 3.5, 2.0, 0.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Garden Peas (cooked)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Olive Oil', 5.0, 'g', 45.0, 0.0, 0.0, 5.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Olive Oil'))));
  end if;

  -- Chicken Pita and Sweet Potato Fries (Teas)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Chicken Pita and Sweet Potato Fries'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Chicken Pita and Sweet Potato Fries', 'dinner', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Pita Bread', 1.0, 'unit', 145.0, 28.8, 5.4, 0.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Pita Bread'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken (Raw)', 120.0, 'g', 144.0, 0.0, 27.0, 3.12, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken (Raw)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Onion', 1.0, 'small', 28.0, 6.5, 0.8, 0.1, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Onion'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Pepper', 0.5, 'unit', 15.5, 7.4, 0.6, 0.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Pepper'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cherry Tomatoes', 40.0, 'g', 10.5, 1.45, 0.45, 0.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cherry Tomatoes'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Sweet Potato (Raw)', 120.0, 'g', 108.0, 25.2, 2.4, 0.24, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Sweet Potato (Raw)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Lettuce', 50.0, 'g', 10.0, 1.85, 0.45, 0.05, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Lettuce'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Olive Oil', 5.0, 'g', 45.0, 0.0, 0.0, 5.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Olive Oil'))));
  end if;

  -- Chicken Chow Mein (Teas)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Chicken Chow Mein'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Chicken Chow Mein', 'dinner', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken (Raw)', 120.0, 'g', 144.0, 0.0, 27.0, 3.12, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken (Raw)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Medium Egg Noodles', 1.0, 'unit', 271.0, 54.0, 10.0, 1.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Medium Egg Noodles'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Onion', 1.0, 'small', 28.0, 6.5, 0.8, 0.1, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Onion'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Pepper', 1.0, 'unit', 31.0, 14.8, 1.2, 0.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Pepper'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Bean Sprouts', 50.0, 'g', 23.5, 1.05, 1.4, 1.25, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Bean Sprouts'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Light Soy Sauce', 5.0, 'tbsp', 45.0, 9.0, 1.5, 0.5, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Light Soy Sauce'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Oyster Sauce', 3.0, 'tbsp', 54.0, 12.0, 0.6, 0.3, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Oyster Sauce'))));
  end if;

  -- Potato Fajitas (Teas)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Potato Fajitas'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Potato Fajitas', 'dinner', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken (Raw)', 130.0, 'g', 156.0, 0.0, 29.25, 3.38, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken (Raw)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Baking Potato', 200.0, 'g', 154.0, 35.0, 4.0, 0.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Baking Potato'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Pepper', 0.5, 'unit', 15.5, 7.4, 0.6, 0.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Pepper'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Onion', 0.5, 'small', 14.0, 3.25, 0.4, 0.05, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Onion'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Fajita Seasoning', 0.5, 'packet', 52.0, 11.2, 1.2, 0.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Fajita Seasoning'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Salsa', 70.0, 'g', 23.8, 4.69, 0.98, 0.14, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Salsa'))));
  end if;

  -- Jacket Potato, Beans and Cheese (Teas)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Jacket Potato, Beans and Cheese'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Jacket Potato, Beans and Cheese', 'dinner', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Baking Potato', 250.0, 'g', 192.5, 43.75, 5.0, 0.25, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Baking Potato'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Baked Beans', 1.0, 'tin', 338.0, 64.9, 20.1, 1.5, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Baked Beans'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cheese (50% Lighter)', 15.0, 'g', 40.8, 1.02, 4.44, 2.1, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cheese (50% Lighter)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Salad', 100.0, 'g', 17.0, 2.6, 1.6, 0.3, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Salad'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Olive Oil', 5.0, 'g', 45.0, 0.0, 0.0, 5.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Olive Oil'))));
  end if;

  -- Chicken Sausage and Sweet Potato Mash (Teas)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Chicken Sausage and Sweet Potato Mash'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Chicken Sausage and Sweet Potato Mash', 'dinner', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken Sausages', 3.0, 'unit', 267.0, 9.9, 30.0, 11.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken Sausages'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Reduced Gravy Granules', 20.0, 'g', 82.0, 13.0, 0.3, 3.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Reduced Gravy Granules'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Sweet Potato (Raw)', 230.0, 'g', 207.0, 48.3, 4.6, 0.46, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Sweet Potato (Raw)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Broccoli', 100.0, 'g', 39.0, 6.3, 0.3, 2.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Broccoli'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Carrot', 1.0, 'unit', 32.0, 6.2, 0.4, 0.3, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Carrot'))));
  end if;

  -- Reduced Lasange (Teas)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Reduced Lasange'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Reduced Lasange', 'dinner', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, '5% Fat Mince (uncooked)', 120.0, 'g', 154.8, 2.16, 24.36, 5.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('5% Fat Mince (uncooked)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Lasagne Sheet', 2.0, 'unit', 144.0, 28.4, 5.2, 0.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Lasagne Sheet'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Onion', 0.5, 'small', 14.0, 3.25, 0.4, 0.05, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Onion'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Carrot', 0.5, 'unit', 16.0, 3.1, 0.2, 0.15, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Carrot'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chopped Tomatoes', 0.5, 'tin', 47.0, 7.2, 2.6, 0.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chopped Tomatoes'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Tomato Puree', 15.0, 'g', 13.0, 2.8, 0.6, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Tomato Puree'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cheese (50% Lighter)', 15.0, 'g', 34.0, 0.85, 3.7, 1.75, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cheese (50% Lighter)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Reduced Lasagne Sauce', 200.0, 'g', 146.0, 13.8, 1.0, 9.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Reduced Lasagne Sauce'))));
  end if;

  -- Cheesey Chicken and Broccoli Pasta (Teas)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Cheesey Chicken and Broccoli Pasta'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Cheesey Chicken and Broccoli Pasta', 'dinner', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken (Raw)', 120.0, 'g', 144.0, 0.0, 27.0, 3.12, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken (Raw)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Penne Pasta (uncooked)', 50.0, 'g', 175.0, 37.0, 6.25, 0.5, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Penne Pasta (uncooked)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Broccoli', 100.0, 'g', 39.0, 6.3, 0.3, 2.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Broccoli'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cheese (50% Lighter)', 25.0, 'g', 68.0, 1.7, 7.4, 3.5, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cheese (50% Lighter)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Lightest Philadelphia', 30.0, 'g', 26.0, 1.5, 3.2, 0.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Lightest Philadelphia'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken Stock Cube', 0.5, 'unit', 14.0, 1.0, 0.6, 0.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken Stock Cube'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Garlic', 1.0, 'clove', 5.0, 1.0, 0.2, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Garlic'))));
  end if;

  -- Greek Yogurt (Evening Snacks)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'evening_snack' and lower(trim(name)) = lower(trim('Greek Yogurt'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Greek Yogurt', 'evening_snack', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, '0% Greek Yogurt', 200.0, 'g', 108.0, 6.0, 20.6, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('0% Greek Yogurt'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Breakfast Topper', 60.0, 'g', 27.0, 5.28, 0.42, 0.18, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Breakfast Topper'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, '70% Dark Chocolate', 1.0, 'square', 72.0, 5.6, 1.2, 5.5, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('70% Dark Chocolate'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Honey', 15.0, 'g', 45.0, 12.0, 0.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Honey'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chia Seeds', 15.0, 'g', 66.0, 1.2, 2.5, 4.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chia Seeds'))));
  end if;

  -- Bagel Thin (Evening Snacks)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'evening_snack' and lower(trim(name)) = lower(trim('Bagel Thin'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Bagel Thin', 'evening_snack', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Bagel Thin', 1.0, 'unit', 130.0, 25.0, 5.0, 0.7, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Bagel Thin'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Peanut Butter', 25.0, 'g', 160.0, 5.6, 5.6, 12.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Peanut Butter'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Isolate Protein Powder', 25.0, 'g', 91.0, 0.6, 22.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Isolate Protein Powder'))));
  end if;

  -- Rice Cakes (Evening Snacks)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'evening_snack' and lower(trim(name)) = lower(trim('Rice Cakes'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Rice Cakes', 'evening_snack', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Caramel Rice Cake', 3.0, 'unit', 153.0, 33.9, 0.0, 0.9, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Caramel Rice Cake'))));
  end if;

  -- Cinnamon and Raisin Bagel (Evening Snacks)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'evening_snack' and lower(trim(name)) = lower(trim('Cinnamon and Raisin Bagel'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Cinnamon and Raisin Bagel', 'evening_snack', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cinnamon and Raisin Bagel', 1.0, 'unit', 229.0, 43.5, 7.6, 1.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cinnamon and Raisin Bagel'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Peanut Butter', 25.0, 'g', 160.0, 5.6, 5.6, 12.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Peanut Butter'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Banana', 1.0, 'unit', 71.0, 18.3, 0.9, 0.3, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Banana'))));
  end if;

  -- Peanut Butter Bagel Thin (Evening Snacks)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'evening_snack' and lower(trim(name)) = lower(trim('Peanut Butter Bagel Thin'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Peanut Butter Bagel Thin', 'evening_snack', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Bagel Thin', 1.0, 'unit', 130.0, 25.0, 5.0, 0.7, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Bagel Thin'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Peanut Butter', 25.0, 'g', 160.0, 5.6, 5.6, 12.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Peanut Butter'))));
  end if;

  -- Kinder Protein Cheesecake (Low Calorie Snacks)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'snack' and lower(trim(name)) = lower(trim('Kinder Protein Cheesecake'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Kinder Protein Cheesecake', 'snack', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Digestive Biscuit', 1.0, 'unit', 71.0, 9.3, 1.0, 3.1, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Digestive Biscuit'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, '0% Greek Yogurt', 75.0, 'g', 40.5, 2.25, 7.725, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('0% Greek Yogurt'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Light Cream Cheese', 50.0, 'g', 74.8, 2.55, 3.74, 5.44, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Light Cream Cheese'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Isolate Protein Powder', 20.0, 'g', 72.8, 0.48, 17.6, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Isolate Protein Powder'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Kinder Bar', 0.5, 'unit', 35.5, 3.35, 0.55, 2.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Kinder Bar'))));
  end if;

  -- Banana and Raspberry Biscoff Baked Oats (Low Calorie Snacks)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'snack' and lower(trim(name)) = lower(trim('Banana and Raspberry Biscoff Baked Oats'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Banana and Raspberry Biscoff Baked Oats', 'snack', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Oats', 20.0, 'g', 74.0, 13.0, 2.4, 1.04, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Oats'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Isolate Protein Powder', 10.0, 'g', 36.4, 0.24, 8.8, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Isolate Protein Powder'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Banana', 0.5, 'unit', 35.5, 9.15, 0.45, 0.15, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Banana'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Eggs', 0.5, 'large', 39.5, 0.25, 3.8, 2.7, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Eggs'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Semi-Skimmed Milk', 100.0, 'ml', 49.0, 4.8, 3.6, 1.7, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Semi-Skimmed Milk'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Baking Powder', 1.0, 'tsp', 8.0, 1.7, 0.2, 0.1, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Baking Powder'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Raspberries', 50.0, 'g', 17.0, 2.55, 0.4, 0.15, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Raspberries'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Biscoff Spread', 10.0, 'g', 47.2, 4.24, 0.24, 3.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Biscoff Spread'))));
  end if;

end $$;

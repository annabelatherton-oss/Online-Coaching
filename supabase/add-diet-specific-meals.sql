-- New meals for clients with dietary requirements, built entirely from ingredients already
-- in the coach's library (supabase/add-ingredient-library-foods.sql). Uses raw/uncooked weight
-- for chicken, rice, potatoes and pasta throughout (weigh before cooking), matching the coach's
-- meal-prep convention.
--
-- Safe to run whether or not you already ran an earlier version of this file: each meal's
-- ingredient list is always reset to the values below, so re-running it applies any corrections
-- (like this uncooked-weight change) to meals you already created.

do $$
declare
  v_coach_id uuid := (select id from profiles where email = 'annabelatherton@gmail.com');
  v_meal_id uuid;
begin

  -- ============ BREAKFAST ============

  -- Veggie Scrambled Eggs & Sourdough (breakfast)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('Veggie Scrambled Eggs & Sourdough'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Veggie Scrambled Eggs & Sourdough', 'breakfast', 'Toast the sourdough. Wilt the spinach in a dry pan for 1 min, then push to one side. Whisk the eggs and pour into the pan; scramble on low-medium heat until just set. Serve on the toast with the cherry tomatoes, halved and pan-warmed for 1-2 min.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Toast the sourdough. Wilt the spinach in a dry pan for 1 min, then push to one side. Whisk the eggs and pour into the pan; scramble on low-medium heat until just set. Serve on the toast with the cherry tomatoes, halved and pan-warmed for 1-2 min.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Eggs', 3.0, 'large', 237.0, 3.0, 24.0, 15.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Eggs'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Wholemeal Sourdough', 2.0, 'slice', 300.0, 58.0, 12.0, 2.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Wholemeal Sourdough'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Spinach', 30, 'g', 5.7, 0.0, 0.9, 0.3, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Spinach'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cherry Tomatoes', 40, 'g', 10.5, 1.5, 0.5, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cherry Tomatoes'))));

  -- Greek Yogurt Protein Pot (breakfast)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('Greek Yogurt Protein Pot'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Greek Yogurt Protein Pot', 'breakfast', 'Spoon the yogurt into a bowl or jar. Top with the granola and berries, then drizzle over the honey.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Spoon the yogurt into a bowl or jar. Top with the granola and berries, then drizzle over the honey.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, '0% Greek Yogurt', 200, 'g', 108.0, 6.0, 20.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('0% Greek Yogurt'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Granola', 40, 'g', 167.2, 26.8, 4.0, 4.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Granola'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Berries', 80, 'g', 27.2, 4.0, 0.8, 0.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Berries'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Honey', 15, 'g', 45.0, 12.0, 0.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Honey'))));

  -- Quorn Sausage Breakfast Wrap (breakfast)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('Quorn Sausage Breakfast Wrap'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Quorn Sausage Breakfast Wrap', 'breakfast', 'Grill or pan-fry the Quorn sausages for 8-10 min until browned, turning occasionally. Scramble the egg in a separate pan. Warm the wrap for 20 sec, then fill with the sausages, egg and spinach and roll up.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Grill or pan-fry the Quorn sausages for 8-10 min until browned, turning occasionally. Scramble the egg in a separate pan. Warm the wrap for 20 sec, then fill with the sausages, egg and spinach and roll up.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Quorn Sausages', 2.0, 'unit', 150.0, 8.0, 12.0, 8.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Quorn Sausages'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Tortilla Wrap', 1.0, 'unit', 181.0, 37.0, 5.0, 2.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Tortilla Wrap'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Eggs', 1.0, 'large', 79.0, 1.0, 8.0, 5.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Eggs'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Spinach', 20, 'g', 3.8, 0.0, 0.6, 0.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Spinach'))));

  -- ============ LUNCH ============

  -- Halloumi & Veg Wrap (lunch)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Halloumi & Veg Wrap'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Halloumi & Veg Wrap', 'lunch', 'Slice the halloumi and fry for 1-2 min per side until golden. Warm the wrap, spread with the mayo, then add the salad, cherry tomatoes and halloumi. Fold or roll to close.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Slice the halloumi and fry for 1-2 min per side until golden. Warm the wrap, spread with the mayo, then add the salad, cherry tomatoes and halloumi. Fold or roll to close.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Halloumi', 60, 'g', 180.0, 2.0, 12.0, 14.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Halloumi'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Tortilla Wrap', 1.0, 'unit', 181.0, 37.0, 5.0, 2.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Tortilla Wrap'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Salad', 60, 'g', 10.2, 1.8, 1.2, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Salad'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cherry Tomatoes', 40, 'g', 10.5, 1.5, 0.5, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cherry Tomatoes'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Light Mayo', 15, 'g', 40.0, 2.0, 0.0, 4.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Light Mayo'))));

  -- Chickpea & Feta Salad (lunch)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Chickpea & Feta Salad'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Chickpea & Feta Salad', 'lunch', 'Drain and rinse the chickpeas. Combine with the cucumber, cherry tomatoes and salad in a bowl. Crumble over the feta, drizzle with the olive oil and toss.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Drain and rinse the chickpeas. Combine with the cucumber, cherry tomatoes and salad in a bowl. Crumble over the feta, drizzle with the olive oil and toss.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chickpeas', 1.0, 'tin', 302.0, 38.0, 19.0, 6.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chickpeas'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Feta Cheese', 40, 'g', 112.0, 0.0, 6.7, 9.3, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Feta Cheese'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cucumber', 60, 'g', 9.6, 0.6, 0.6, 0.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cucumber'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cherry Tomatoes', 60, 'g', 15.8, 2.2, 0.8, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cherry Tomatoes'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Salad', 60, 'g', 10.2, 1.8, 1.2, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Salad'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Olive Oil', 10, 'g', 90.0, 0.0, 0.0, 10.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Olive Oil'))));

  -- Quorn Chicken Caesar Salad (lunch)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Quorn Chicken Caesar Salad'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Quorn Chicken Caesar Salad', 'lunch', 'Cook the Quorn chicken pieces per pack instructions (pan-fry or oven-bake until hot through). Boil the egg for 7-8 min, cool, peel and halve. Toss the lettuce with the Caesar dressing, top with the Quorn chicken, egg and shaved Parmesan.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Cook the Quorn chicken pieces per pack instructions (pan-fry or oven-bake until hot through). Boil the egg for 7-8 min, cool, peel and halve. Toss the lettuce with the Caesar dressing, top with the Quorn chicken, egg and shaved Parmesan.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Quorn Chicken Pieces', 120, 'g', 116.4, 4.8, 16.8, 2.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Quorn Chicken Pieces'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Lettuce', 100, 'g', 20.0, 4.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Lettuce'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Parmesan', 15, 'g', 60.5, 0.0, 5.0, 4.5, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Parmesan'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Reduced Caesar Dressing', 15, 'ml', 34.0, 1.0, 0.0, 3.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Reduced Caesar Dressing'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Eggs', 1.0, 'large', 79.0, 1.0, 8.0, 5.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Eggs'))));

  -- Cottage Cheese Baked Potato (lunch)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Cottage Cheese Baked Potato'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Cottage Cheese Baked Potato', 'lunch', 'Prick the potato and bake at 200°C for 60-75 min (or microwave ~10 min, then crisp in the oven) until soft. Cut open, top with the cottage cheese, sweetcorn and spring onion.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Prick the potato and bake at 200°C for 60-75 min (or microwave ~10 min, then crisp in the oven) until soft. Cut open, top with the cottage cheese, sweetcorn and spring onion.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Baking Potato', 200, 'g', 154.0, 36.0, 4.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Baking Potato'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cottage Cheese', 150, 'g', 157.5, 6.0, 15.0, 9.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cottage Cheese'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Sweetcorn', 80, 'g', 64.0, 9.0, 2.0, 2.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Sweetcorn'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Spring Onion', 20, 'g', 5.5, 0.5, 0.5, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Spring Onion'))));

  -- Kidney Bean & Rice Bowl (lunch)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Kidney Bean & Rice Bowl'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Kidney Bean & Rice Bowl', 'lunch', 'Cook the rice per pack instructions. Drain and rinse the kidney beans and warm through in a pan. Build the bowl with rice, beans, salsa and diced pepper, then top with the grated cheese.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Cook the rice per pack instructions. Drain and rinse the kidney beans and warm through in a pan. Build the bowl with rice, beans, salsa and diced pepper, then top with the grated cheese.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Kidney Beans', 1.0, 'tin', 230.0, 32.0, 16.0, 1.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Kidney Beans'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Rice (Uncooked)', 55, 'g', 200.8, 45.7, 4.4, 0.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Rice (Uncooked)'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Salsa', 40, 'g', 13.6, 2.8, 0.4, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Salsa'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Pepper', 1.0, 'unit', 31.0, 15.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Pepper'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cheese (50% Lighter)', 25, 'g', 68.0, 2.0, 7.0, 4.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cheese (50% Lighter)'))));

  -- ============ DINNER ============

  -- Quorn Mince Bolognese (dinner)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Quorn Mince Bolognese'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Quorn Mince Bolognese', 'dinner', 'Cook the spaghetti per pack instructions. Meanwhile fry the diced onion for 2-3 min, add the Quorn mince and cook for 5 min, then stir in the passata and simmer for 8-10 min. Serve over the spaghetti, topped with grated Parmesan.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Cook the spaghetti per pack instructions. Meanwhile fry the diced onion for 2-3 min, add the Quorn mince and cook for 5 min, then stir in the passata and simmer for 8-10 min. Serve over the spaghetti, topped with grated Parmesan.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Quorn Mince', 150, 'g', 154.5, 4.5, 24.0, 3.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Quorn Mince'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Spaghetti (Dry)', 75, 'g', 268.0, 54.0, 10.0, 1.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Spaghetti (Dry)'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Passata', 150, 'g', 31.8, 4.8, 1.8, 0.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Passata'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Onion', 1.0, 'small', 28.0, 7.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Onion'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Parmesan', 15, 'g', 60.5, 0.0, 5.0, 4.5, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Parmesan'))));

  -- Halloumi & Veg Traybake (dinner)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Halloumi & Veg Traybake'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Halloumi & Veg Traybake', 'dinner', 'Toss the diced sweet potato and pepper in the olive oil and roast at 200°C for 20 min. Add the broccoli florets and sliced halloumi, then roast for a further 12-15 min until the halloumi is golden and veg is tender.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Toss the diced sweet potato and pepper in the olive oil and roast at 200°C for 20 min. Add the broccoli florets and sliced halloumi, then roast for a further 12-15 min until the halloumi is golden and veg is tender.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Halloumi', 90, 'g', 270.0, 3.0, 18.0, 21.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Halloumi'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Sweet Potato (Raw)', 200, 'g', 180.0, 42.0, 4.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Sweet Potato (Raw)'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Pepper', 1.0, 'unit', 31.0, 15.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Pepper'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Broccoli', 100, 'g', 39.0, 6.0, 0.0, 3.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Broccoli'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Olive Oil', 10, 'g', 90.0, 0.0, 0.0, 10.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Olive Oil'))));

  -- Veggie Chilli (dinner)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Veggie Chilli'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Veggie Chilli', 'dinner', 'Cook the rice per pack instructions. Warm the kidney beans in chilli sauce in a pan with the diced pepper and onion for 8-10 min until the veg softens. Serve over the rice, topped with grated cheese.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Cook the rice per pack instructions. Warm the kidney beans in chilli sauce in a pan with the diced pepper and onion for 8-10 min until the veg softens. Serve over the rice, topped with grated cheese.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Kidney Beans In Chilli Sauce', 1.0, 'tin', 268.0, 39.0, 17.0, 1.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Kidney Beans In Chilli Sauce'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Rice (Uncooked)', 55, 'g', 200.8, 45.7, 4.4, 0.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Rice (Uncooked)'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Pepper', 1.0, 'unit', 31.0, 15.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Pepper'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Onion', 1.0, 'small', 28.0, 7.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Onion'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cheese (50% Lighter)', 25, 'g', 68.0, 2.0, 7.0, 4.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cheese (50% Lighter)'))));

  -- Quorn Sausage & Mash (dinner)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Quorn Sausage & Mash'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Quorn Sausage & Mash', 'dinner', 'Grill or bake the Quorn sausages per pack instructions. Boil the potato, chopped into chunks, for 15-18 min until soft; drain and mash with the butter. Warm the peas and gravy granules (made up per packet with a splash of water). Serve together.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Grill or bake the Quorn sausages per pack instructions. Boil the potato, chopped into chunks, for 15-18 min until soft; drain and mash with the butter. Warm the peas and gravy granules (made up per packet with a splash of water). Serve together.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Quorn Sausages', 3.0, 'unit', 225.0, 12.0, 18.0, 12.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Quorn Sausages'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Baking Potato', 250, 'g', 192.5, 45.0, 5.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Baking Potato'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Garden Peas (cooked)', 80, 'g', 59.0, 7.0, 4.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Garden Peas (cooked)'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Reduced Gravy Granules', 20, 'g', 82.0, 14.0, 0.0, 4.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Reduced Gravy Granules'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Butter', 10, 'g', 67.9, 0.0, 0.0, 8.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Butter'))));

  -- Chickpea Curry & Rice (dinner)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Chickpea Curry & Rice'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Chickpea Curry & Rice', 'dinner', 'Cook the rice per pack instructions. Drain and rinse the chickpeas, then warm through in the curry sauce for 8-10 min, stirring in the spinach for the last 2 min until wilted. Serve over the rice.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Cook the rice per pack instructions. Drain and rinse the chickpeas, then warm through in the curry sauce for 8-10 min, stirring in the spinach for the last 2 min until wilted. Serve over the rice.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chickpeas', 1.0, 'tin', 302.0, 38.0, 19.0, 6.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chickpeas'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Mayflower Curry Sauce', 150, 'g', 115.5, 12.0, 1.5, 6.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Mayflower Curry Sauce'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Rice (Uncooked)', 55, 'g', 200.8, 45.7, 4.4, 0.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Rice (Uncooked)'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Spinach', 40, 'g', 7.6, 0.0, 1.2, 0.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Spinach'))));

  -- ============ PRE_WORKOUT ============

  -- Banana & Peanut Butter Rice Cakes (pre_workout)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'pre_workout' and lower(trim(name)) = lower(trim('Banana & Peanut Butter Rice Cakes'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Banana & Peanut Butter Rice Cakes', 'pre_workout', 'Spread the peanut butter over the rice cakes and top with sliced banana.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Spread the peanut butter over the rice cakes and top with sliced banana.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Banana', 1.0, 'unit', 71.0, 18.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Banana'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Peanut Butter', 25, 'g', 160.0, 6.0, 6.0, 13.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Peanut Butter'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Salted Rice Cakes', 2.0, 'unit', 54.0, 12.0, 2.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Salted Rice Cakes'))));

  -- Protein Yogurt & Granola (pre_workout)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'pre_workout' and lower(trim(name)) = lower(trim('Protein Yogurt & Granola'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Protein Yogurt & Granola', 'pre_workout', 'Stir the granola through the protein yogurt, or sprinkle on top.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Stir the granola through the protein yogurt, or sprinkle on top.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Protein Yogurt (Pouch)', 1.0, 'unit', 148.0, 9.0, 25.0, 1.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Protein Yogurt (Pouch)'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Granola', 30, 'g', 125.4, 20.1, 3.0, 3.3, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Granola'))));

  -- Sourdough Toast & Honey (pre_workout)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'pre_workout' and lower(trim(name)) = lower(trim('Sourdough Toast & Honey'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Sourdough Toast & Honey', 'pre_workout', 'Toast the sourdough. Spread with the peanut butter and drizzle over the honey.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Toast the sourdough. Spread with the peanut butter and drizzle over the honey.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Wholemeal Sourdough', 2.0, 'slice', 300.0, 58.0, 12.0, 2.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Wholemeal Sourdough'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Honey', 20, 'g', 60.0, 16.0, 0.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Honey'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Peanut Butter', 15, 'g', 96.0, 3.6, 3.6, 7.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Peanut Butter'))));

  -- ============ EVENING_SNACK ============

  -- Cottage Cheese & Berries (evening_snack)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'evening_snack' and lower(trim(name)) = lower(trim('Cottage Cheese & Berries'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Cottage Cheese & Berries', 'evening_snack', 'Spoon the cottage cheese into a bowl, top with the berries and drizzle over the honey.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Spoon the cottage cheese into a bowl, top with the berries and drizzle over the honey.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cottage Cheese', 100, 'g', 105.0, 4.0, 10.0, 6.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cottage Cheese'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Berries', 60, 'g', 20.4, 3.0, 0.6, 0.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Berries'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Honey', 10, 'g', 30.0, 8.0, 0.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Honey'))));

  -- Greek Yogurt & Dark Chocolate (evening_snack)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'evening_snack' and lower(trim(name)) = lower(trim('Greek Yogurt & Dark Chocolate'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Greek Yogurt & Dark Chocolate', 'evening_snack', 'Spoon the yogurt into a bowl and grate or chop the dark chocolate over the top.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Spoon the yogurt into a bowl and grate or chop the dark chocolate over the top.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, '0% Greek Style Yogurt', 150, 'g', 90.0, 12.0, 9.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('0% Greek Style Yogurt'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, '70% Dark Chocolate', 1.0, 'square', 72.0, 6.0, 1.0, 6.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('70% Dark Chocolate'))));

  -- Protein Mousse Pot (evening_snack)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'evening_snack' and lower(trim(name)) = lower(trim('Protein Mousse Pot'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Protein Mousse Pot', 'evening_snack', 'Ready to eat straight from the pot — chill before serving if preferred.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Ready to eat straight from the pot — chill before serving if preferred.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Protein Mousse', 1.0, 'unit', 153.0, 10.0, 20.0, 3.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Protein Mousse'))));

  -- ============ SNACK ============

  -- Rice Cakes & Peanut Butter (snack)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'snack' and lower(trim(name)) = lower(trim('Rice Cakes & Peanut Butter'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Rice Cakes & Peanut Butter', 'snack', 'Spread the peanut butter over the rice cakes.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Spread the peanut butter over the rice cakes.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Salted Rice Cakes', 2.0, 'unit', 54.0, 12.0, 2.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Salted Rice Cakes'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Peanut Butter', 20, 'g', 128.0, 4.8, 4.8, 10.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Peanut Butter'))));

  -- Apple & Almonds (snack)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'snack' and lower(trim(name)) = lower(trim('Apple & Almonds'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Apple & Almonds', 'snack', 'Slice the apple and serve with the almonds.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Slice the apple and serve with the almonds.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Apple', 1.0, 'unit', 104.0, 28.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Apple'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Almonds', 20, 'g', 127.3, 1.3, 2.7, 11.3, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Almonds'))));

  -- ============ BREAKFAST ============

  -- GF Oats with Berries (breakfast)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('GF Oats with Berries'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'GF Oats with Berries', 'breakfast', 'Combine the oats and milk in a pan or microwave-safe bowl. Cook on the hob for 3-4 min, stirring, or microwave in 45 sec bursts, stirring between each, until thick and creamy. Top with the berries and honey.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Combine the oats and milk in a pan or microwave-safe bowl. Cook on the hob for 3-4 min, stirring, or microwave in 45 sec bursts, stirring between each, until thick and creamy. Top with the berries and honey.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Gluten Free Oats', 60, 'g', 234.0, 38.4, 9.0, 4.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Gluten Free Oats'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Semi-Skimmed Milk', 150, 'ml', 73.5, 7.5, 6.0, 3.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Semi-Skimmed Milk'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Berries', 60, 'g', 20.4, 3.0, 0.6, 0.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Berries'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Honey', 15, 'g', 45.0, 12.0, 0.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Honey'))));

  -- Bacon & Eggs (breakfast)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('Bacon & Eggs'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Bacon & Eggs', 'breakfast', 'Grill or fry the bacon medallions for 4-5 min, turning once, until crisp. Fry or scramble the eggs to your liking. Serve with the tomato, halved and pan-warmed for 1-2 min.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Grill or fry the bacon medallions for 4-5 min, turning once, until crisp. Fry or scramble the eggs to your liking. Serve with the tomato, halved and pan-warmed for 1-2 min.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Bacon Medallions', 3.0, 'unit', 81.0, 0.0, 15.0, 3.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Bacon Medallions'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Eggs', 2.0, 'large', 158.0, 2.0, 16.0, 10.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Eggs'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Tomato', 1.0, 'unit', 14.0, 2.0, 0.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Tomato'))));

  -- GF Bagel & Salmon (breakfast)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('GF Bagel & Salmon'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'GF Bagel & Salmon', 'breakfast', 'Toast the bagel and split in half. Spread with the cream cheese, top with the smoked salmon and sliced cucumber.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Toast the bagel and split in half. Spread with the cream cheese, top with the smoked salmon and sliced cucumber.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Gluten Free Bagel', 1.0, 'unit', 174.0, 34.0, 3.0, 2.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Gluten Free Bagel'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Salmon Fillet', 60, 'g', 90.9, 0.0, 11.1, 5.1, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Salmon Fillet'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Light cream Cheese', 30, 'g', 44.0, 2.0, 2.0, 3.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Light cream Cheese'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cucumber', 40, 'g', 6.4, 0.4, 0.4, 0.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cucumber'))));

  -- GF Rice Pudding with Berries (breakfast)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('GF Rice Pudding with Berries'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'GF Rice Pudding with Berries', 'breakfast', 'Combine the Cream of Rice and milk in a pan. Bring to a gentle simmer, stirring constantly, for 3-4 min until thickened. Stir through the honey and top with the berries.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Combine the Cream of Rice and milk in a pan. Bring to a gentle simmer, stirring constantly, for 3-4 min until thickened. Stir through the honey and top with the berries.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cream of Rice', 60, 'g', 206.4, 48.0, 3.6, 0.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cream of Rice'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Semi-Skimmed Milk', 200, 'ml', 98.0, 10.0, 8.0, 4.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Semi-Skimmed Milk'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Honey', 15, 'g', 45.0, 12.0, 0.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Honey'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Berries', 60, 'g', 20.4, 3.0, 0.6, 0.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Berries'))));

  -- ============ LUNCH ============

  -- Chicken & Rice Salad (lunch)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Chicken & Rice Salad'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Chicken & Rice Salad', 'lunch', 'Cook the rice per pack instructions. Season the raw chicken and pan-fry or grill for 6-7 min per side until cooked through and no longer pink in the middle; slice. Toss the salad and cherry tomatoes with the olive oil, then top with the rice and sliced chicken.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Cook the rice per pack instructions. Season the raw chicken and pan-fry or grill for 6-7 min per side until cooked through and no longer pink in the middle; slice. Toss the salad and cherry tomatoes with the olive oil, then top with the rice and sliced chicken.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken (Raw)', 205, 'g', 246.0, 0.0, 47.1, 6.1, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken (Raw)'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Rice (Uncooked)', 55, 'g', 200.8, 45.7, 4.4, 0.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Rice (Uncooked)'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Salad', 60, 'g', 10.2, 1.8, 1.2, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Salad'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cherry Tomatoes', 60, 'g', 15.8, 2.2, 0.8, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cherry Tomatoes'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Olive Oil', 10, 'g', 90.0, 0.0, 0.0, 10.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Olive Oil'))));

  -- Tuna & Baby Potato Salad (lunch)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Tuna & Baby Potato Salad'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Tuna & Baby Potato Salad', 'lunch', 'Boil the baby potatoes for 12-15 min until tender; drain and cool slightly, then halve. Drain the tuna and mix with the mayo, sweetcorn and spring onion. Combine with the potatoes.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Boil the baby potatoes for 12-15 min until tender; drain and cool slightly, then halve. Drain the tuna and mix with the mayo, sweetcorn and spring onion. Combine with the potatoes.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Tuna', 1.0, 'tin', 110.0, 0.0, 25.0, 1.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Tuna'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Baby Potatoes (Raw)', 165, 'g', 123.8, 28.0, 3.3, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Baby Potatoes (Raw)'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Sweetcorn', 80, 'g', 64.0, 9.0, 2.0, 2.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Sweetcorn'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Light Mayo', 15, 'g', 40.0, 2.0, 0.0, 4.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Light Mayo'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Spring Onion', 20, 'g', 5.5, 0.5, 0.5, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Spring Onion'))));

  -- GF Wrap Chicken Fajita (lunch)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('GF Wrap Chicken Fajita'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'GF Wrap Chicken Fajita', 'lunch', 'Slice the raw chicken into strips and toss with the fajita seasoning. Pan-fry with the sliced pepper and onion for 7-8 min until the chicken is cooked through. Warm the wrap and fill.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Slice the raw chicken into strips and toss with the fajita seasoning. Pan-fry with the sliced pepper and onion for 7-8 min until the chicken is cooked through. Warm the wrap and fill.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Gluten Free Wrap', 1.0, 'unit', 138.0, 28.0, 2.0, 3.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Gluten Free Wrap'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken (Raw)', 165, 'g', 198.0, 0.0, 37.9, 4.9, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken (Raw)'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Fajita Seasoning', 1.0, 'packet', 104.0, 22.0, 2.0, 1.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Fajita Seasoning'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Pepper', 1.0, 'unit', 31.0, 15.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Pepper'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Onion', 1.0, 'small', 28.0, 7.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Onion'))));

  -- Steak & Sweet Potato (lunch)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Steak & Sweet Potato'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Steak & Sweet Potato', 'lunch', 'Cut the sweet potato into wedges, toss with a little oil and roast at 200°C for 25-30 min, turning once. Steam or boil the green beans for the last 5 min. Season the steak and fry or grill for 2-3 min per side for medium, then rest for 2 min before serving.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Cut the sweet potato into wedges, toss with a little oil and roast at 200°C for 25-30 min, turning once. Steam or boil the green beans for the last 5 min. Season the steak and fry or grill for 2-3 min per side for medium, then rest for 2 min before serving.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Sirloin Steak (Raw)', 150, 'g', 301.5, 0.0, 33.0, 19.5, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Sirloin Steak (Raw)'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Sweet Potato (Raw)', 200, 'g', 180.0, 42.0, 4.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Sweet Potato (Raw)'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Green Beans', 100, 'g', 31.0, 7.0, 2.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Green Beans'))));

  -- Gammon & Baked Potato (lunch)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Gammon & Baked Potato'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Gammon & Baked Potato', 'lunch', 'Prick the potato and bake at 200°C for 60-75 min until soft (or microwave then crisp in the oven). Grill or fry the gammon steak for 4-5 min per side until cooked through. Warm the peas. Serve together.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Prick the potato and bake at 200°C for 60-75 min until soft (or microwave then crisp in the oven). Grill or fry the gammon steak for 4-5 min per side until cooked through. Warm the peas. Serve together.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Gammon', 130, 'g', 226.2, 0.0, 23.4, 14.3, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Gammon'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Baking Potato', 220, 'g', 169.4, 39.6, 4.4, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Baking Potato'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Garden Peas (cooked)', 80, 'g', 59.0, 7.0, 4.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Garden Peas (cooked)'))));

  -- ============ DINNER ============

  -- Chicken, Rice & Broccoli (dinner)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Chicken, Rice & Broccoli'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Chicken, Rice & Broccoli', 'dinner', 'Cook the rice per pack instructions. Season the raw chicken and pan-fry or grill for 6-7 min per side until cooked through; slice. Steam the broccoli and frozen vegetable mix for 4-5 min. Serve together.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Cook the rice per pack instructions. Season the raw chicken and pan-fry or grill for 6-7 min per side until cooked through; slice. Steam the broccoli and frozen vegetable mix for 4-5 min. Serve together.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken (Raw)', 205, 'g', 246.0, 0.0, 47.1, 6.1, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken (Raw)'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Rice (Uncooked)', 55, 'g', 200.8, 45.7, 4.4, 0.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Rice (Uncooked)'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Broccoli', 100, 'g', 39.0, 6.0, 0.0, 3.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Broccoli'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Country Vegetable Mix (Frozen)', 80, 'g', 36.8, 4.8, 2.4, 0.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Country Vegetable Mix (Frozen)'))));

  -- GF Spaghetti Bolognese (dinner)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('GF Spaghetti Bolognese'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'GF Spaghetti Bolognese', 'dinner', 'Cook the gluten-free spaghetti per pack instructions. Brown the mince in a pan for 5-6 min, breaking it up, then add the diced onion and cook for 2-3 min. Stir in the passata and simmer for 10-12 min. Serve over the spaghetti with grated Parmesan.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Cook the gluten-free spaghetti per pack instructions. Brown the mince in a pan for 5-6 min, breaking it up, then add the diced onion and cook for 2-3 min. Stir in the passata and simmer for 10-12 min. Serve over the spaghetti with grated Parmesan.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Gluten Free Spaghetti (Dry)', 75, 'g', 278.0, 62.0, 5.0, 1.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Gluten Free Spaghetti (Dry)'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, '5% Fat Mince (Uncooked)', 150, 'g', 193.5, 3.0, 30.0, 7.5, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('5% Fat Mince (Uncooked)'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Passata', 150, 'g', 31.8, 4.8, 1.8, 0.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Passata'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Onion', 1.0, 'small', 28.0, 7.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Onion'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Parmesan', 15, 'g', 60.5, 0.0, 5.0, 4.5, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Parmesan'))));

  -- GF Penne Chicken Pesto (dinner)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('GF Penne Chicken Pesto'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'GF Penne Chicken Pesto', 'dinner', 'Cook the gluten-free penne per pack instructions. Season the raw chicken and pan-fry for 6-7 min per side until cooked through; slice. Toss the drained pasta with the pesto, chicken and halved cherry tomatoes.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Cook the gluten-free penne per pack instructions. Season the raw chicken and pan-fry for 6-7 min per side until cooked through; slice. Toss the drained pasta with the pesto, chicken and halved cherry tomatoes.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Gluten Free Penne Pasta (Dry)', 75, 'g', 310.0, 62.0, 6.0, 1.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Gluten Free Penne Pasta (Dry)'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken (Raw)', 180, 'g', 216.0, 0.0, 41.4, 5.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken (Raw)'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Reduced Pesto', 30, 'g', 60.0, 1.8, 1.2, 4.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Reduced Pesto'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cherry Tomatoes', 60, 'g', 15.8, 2.2, 0.8, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cherry Tomatoes'))));

  -- Chorizo & Rice (dinner)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Chorizo & Rice'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Chorizo & Rice', 'dinner', 'Cook the rice per pack instructions. Fry the sliced chorizo for 2-3 min until it releases its oil, add the diced pepper and onion and cook for 4-5 min, then stir in the chopped tomatoes and simmer for 8 min. Serve over the rice.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Cook the rice per pack instructions. Fry the sliced chorizo for 2-3 min until it releases its oil, add the diced pepper and onion and cook for 4-5 min, then stir in the chopped tomatoes and simmer for 8 min. Serve over the rice.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chorizo', 45, 'g', 209.0, 1.0, 10.0, 18.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chorizo'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Rice (Uncooked)', 55, 'g', 200.8, 45.7, 4.4, 0.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Rice (Uncooked)'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Pepper', 1.0, 'unit', 31.0, 15.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Pepper'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Onion', 1.0, 'small', 28.0, 7.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Onion'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chopped Tomatoes', 1.0, 'tin', 94.0, 14.0, 5.0, 1.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chopped Tomatoes'))));

  -- ============ PRE_WORKOUT ============

  -- GF Oats & Banana (pre_workout)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'pre_workout' and lower(trim(name)) = lower(trim('GF Oats & Banana'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'GF Oats & Banana', 'pre_workout', 'Combine the oats and milk in a pan or microwave-safe bowl. Cook for 3-4 min on the hob (stirring) or in 45 sec microwave bursts until thick. Top with sliced banana and honey.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Combine the oats and milk in a pan or microwave-safe bowl. Cook for 3-4 min on the hob (stirring) or in 45 sec microwave bursts until thick. Top with sliced banana and honey.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Gluten Free Oats', 50, 'g', 195.0, 32.0, 7.5, 4.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Gluten Free Oats'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Semi-Skimmed Milk', 100, 'ml', 49.0, 5.0, 4.0, 2.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Semi-Skimmed Milk'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Banana', 1.0, 'unit', 71.0, 18.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Banana'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Honey', 15, 'g', 45.0, 12.0, 0.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Honey'))));

  -- Protein Yogurt & Grapes (pre_workout)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'pre_workout' and lower(trim(name)) = lower(trim('Protein Yogurt & Grapes'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Protein Yogurt & Grapes', 'pre_workout', 'Serve the protein yogurt with the grapes on the side or stirred through.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Serve the protein yogurt with the grapes on the side or stirred through.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Protein Yogurt (Pouch)', 1.0, 'unit', 148.0, 9.0, 25.0, 1.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Protein Yogurt (Pouch)'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Grapes', 80, 'g', 58.4, 13.6, 0.8, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Grapes'))));

  -- ============ EVENING_SNACK ============

  -- Greek Yogurt & Berries (GF) (evening_snack)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'evening_snack' and lower(trim(name)) = lower(trim('Greek Yogurt & Berries (GF)'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Greek Yogurt & Berries (GF)', 'evening_snack', 'Spoon the yogurt into a bowl and top with the berries.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Spoon the yogurt into a bowl and top with the berries.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, '0% Greek Yogurt', 150, 'g', 81.0, 4.5, 15.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('0% Greek Yogurt'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Berries', 80, 'g', 27.2, 4.0, 0.8, 0.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Berries'))));

  -- Turkey Slice Roll-ups (evening_snack)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'evening_snack' and lower(trim(name)) = lower(trim('Turkey Slice Roll-ups'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Turkey Slice Roll-ups', 'evening_snack', 'Lay out the turkey slices and place a cucumber stick on each; roll up.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Lay out the turkey slices and place a cucumber stick on each; roll up.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Turkey Slice', 4.0, 'slice', 84.0, 0.0, 0.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Turkey Slice'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cucumber', 60, 'g', 9.6, 0.6, 0.6, 0.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cucumber'))));

  -- ============ SNACK ============

  -- Rice Cakes & Almonds (snack)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'snack' and lower(trim(name)) = lower(trim('Rice Cakes & Almonds'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Rice Cakes & Almonds', 'snack', 'Serve the rice cakes with the almonds on the side.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Serve the rice cakes with the almonds on the side.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Salted Rice Cakes', 2.0, 'unit', 54.0, 12.0, 2.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Salted Rice Cakes'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Almonds', 20, 'g', 127.3, 1.3, 2.7, 11.3, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Almonds'))));

  -- Apple & Peanut Butter (snack)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'snack' and lower(trim(name)) = lower(trim('Apple & Peanut Butter'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Apple & Peanut Butter', 'snack', 'Slice the apple and serve with the peanut butter for dipping.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Slice the apple and serve with the peanut butter for dipping.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Apple', 1.0, 'unit', 104.0, 28.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Apple'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Peanut Butter', 20, 'g', 128.0, 4.8, 4.8, 10.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Peanut Butter'))));

  -- ============ BREAKFAST ============

  -- Oat Milk Porridge (breakfast)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('Oat Milk Porridge'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Oat Milk Porridge', 'breakfast', 'Combine the oats and oat milk in a pan or microwave-safe bowl. Cook for 3-4 min on the hob, stirring, or in 45 sec microwave bursts until thick and creamy. Top with sliced banana and honey.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Combine the oats and oat milk in a pan or microwave-safe bowl. Cook for 3-4 min on the hob, stirring, or in 45 sec microwave bursts until thick and creamy. Top with sliced banana and honey.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Oats', 60, 'g', 222.0, 39.0, 7.2, 3.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Oats'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Oat Milk', 200, 'ml', 80.0, 12.0, 0.0, 4.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Oat Milk'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Banana', 1.0, 'unit', 71.0, 18.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Banana'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Honey', 15, 'g', 45.0, 12.0, 0.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Honey'))));

  -- Scrambled Eggs & Avocado on Sourdough (breakfast)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('Scrambled Eggs & Avocado on Sourdough'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Scrambled Eggs & Avocado on Sourdough', 'breakfast', 'Toast the sourdough. Whisk the eggs and scramble in a dry pan (or with a little oil) on low-medium heat until just set. Mash the avocado and spread onto the toast, then top with the scrambled egg.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Toast the sourdough. Whisk the eggs and scramble in a dry pan (or with a little oil) on low-medium heat until just set. Mash the avocado and spread onto the toast, then top with the scrambled egg.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Eggs', 2.0, 'large', 158.0, 2.0, 16.0, 10.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Eggs'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Avacado', 0.5, 'unit', 120.0, 6.5, 1.5, 11.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Avacado'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Wholemeal Sourdough', 2.0, 'slice', 300.0, 58.0, 12.0, 2.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Wholemeal Sourdough'))));

  -- Protein Oats (Dairy-Free) (breakfast)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('Protein Oats (Dairy-Free)'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Protein Oats (Dairy-Free)', 'breakfast', 'Combine the oats and oat milk in a pan or bowl and cook (3-4 min on the hob, or microwave in bursts) until thick. Stir through the protein powder once slightly cooled, then top with sliced banana.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Combine the oats and oat milk in a pan or bowl and cook (3-4 min on the hob, or microwave in bursts) until thick. Stir through the protein powder once slightly cooled, then top with sliced banana.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Oats', 50, 'g', 185.0, 32.5, 6.0, 2.5, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Oats'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Oat Milk', 150, 'ml', 60.0, 9.0, 0.0, 3.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Oat Milk'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Isolate Protein Powder', 25, 'g', 91.0, 1.0, 22.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Isolate Protein Powder'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Banana', 1.0, 'unit', 71.0, 18.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Banana'))));

  -- ============ LUNCH ============

  -- Chicken, Avocado & Salad Wrap (lunch)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Chicken, Avocado & Salad Wrap'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Chicken, Avocado & Salad Wrap', 'lunch', 'Season the raw chicken and pan-fry or grill for 6-7 min per side until cooked through; slice. Warm the wrap, spread with the mayo, then add the salad, sliced avocado and chicken. Roll to close.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Season the raw chicken and pan-fry or grill for 6-7 min per side until cooked through; slice. Warm the wrap, spread with the mayo, then add the salad, sliced avocado and chicken. Roll to close.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Tortilla Wrap', 1.0, 'unit', 181.0, 37.0, 5.0, 2.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Tortilla Wrap'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken (Raw)', 180, 'g', 216.0, 0.0, 41.4, 5.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken (Raw)'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Avacado', 0.5, 'unit', 120.0, 6.5, 1.5, 11.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Avacado'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Salad', 60, 'g', 10.2, 1.8, 1.2, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Salad'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Light Mayo', 15, 'g', 40.0, 2.0, 0.0, 4.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Light Mayo'))));

  -- Tuna & Sweetcorn Jacket Potato (lunch)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Tuna & Sweetcorn Jacket Potato'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Tuna & Sweetcorn Jacket Potato', 'lunch', 'Prick the potato and bake at 200°C for 60-75 min until soft (or microwave then crisp in the oven). Drain the tuna and mix with the mayo and sweetcorn. Split the potato and top with the tuna mix.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Prick the potato and bake at 200°C for 60-75 min until soft (or microwave then crisp in the oven). Drain the tuna and mix with the mayo and sweetcorn. Split the potato and top with the tuna mix.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Baking Potato', 220, 'g', 169.4, 39.6, 4.4, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Baking Potato'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Tuna', 1.0, 'tin', 110.0, 0.0, 25.0, 1.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Tuna'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Sweetcorn', 80, 'g', 64.0, 9.0, 2.0, 2.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Sweetcorn'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Light Mayo', 20, 'g', 53.3, 2.7, 0.0, 5.3, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Light Mayo'))));

  -- Steak & Salad (Dairy-Free) (lunch)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Steak & Salad (Dairy-Free)'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Steak & Salad (Dairy-Free)', 'lunch', 'Season the steak and fry or grill for 2-3 min per side for medium, then rest for 2 min and slice. Toss the salad and cherry tomatoes with the olive oil, then top with the steak.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Season the steak and fry or grill for 2-3 min per side for medium, then rest for 2 min and slice. Toss the salad and cherry tomatoes with the olive oil, then top with the steak.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Sirloin Steak (Raw)', 150, 'g', 301.5, 0.0, 33.0, 19.5, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Sirloin Steak (Raw)'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Salad', 80, 'g', 13.6, 2.4, 1.6, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Salad'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cherry Tomatoes', 60, 'g', 15.8, 2.2, 0.8, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cherry Tomatoes'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Olive Oil', 10, 'g', 90.0, 0.0, 0.0, 10.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Olive Oil'))));

  -- Chicken Fajita Wrap (lunch)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Chicken Fajita Wrap'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Chicken Fajita Wrap', 'lunch', 'Slice the raw chicken into strips and toss with the fajita seasoning. Pan-fry with the sliced pepper and onion for 7-8 min until cooked through. Warm the wrap, fill with the chicken mix and top with salsa.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Slice the raw chicken into strips and toss with the fajita seasoning. Pan-fry with the sliced pepper and onion for 7-8 min until cooked through. Warm the wrap, fill with the chicken mix and top with salsa.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Tortilla Wrap', 1.0, 'unit', 181.0, 37.0, 5.0, 2.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Tortilla Wrap'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken (Raw)', 180, 'g', 216.0, 0.0, 41.4, 5.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken (Raw)'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Fajita Seasoning', 1.0, 'packet', 104.0, 22.0, 2.0, 1.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Fajita Seasoning'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Pepper', 1.0, 'unit', 31.0, 15.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Pepper'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Onion', 1.0, 'small', 28.0, 7.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Onion'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Salsa', 40, 'g', 13.6, 2.8, 0.4, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Salsa'))));

  -- Gammon, Rice & Green Beans (lunch)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Gammon, Rice & Green Beans'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Gammon, Rice & Green Beans', 'lunch', 'Cook the rice per pack instructions. Grill or fry the gammon for 4-5 min per side until cooked through. Steam or boil the green beans for 4-5 min. Serve together.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Cook the rice per pack instructions. Grill or fry the gammon for 4-5 min per side until cooked through. Steam or boil the green beans for 4-5 min. Serve together.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Gammon', 130, 'g', 226.2, 0.0, 23.4, 14.3, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Gammon'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Rice (Uncooked)', 55, 'g', 200.8, 45.7, 4.4, 0.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Rice (Uncooked)'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Green Beans', 100, 'g', 31.0, 7.0, 2.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Green Beans'))));

  -- ============ DINNER ============

  -- Beef Mince Chilli (dinner)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Beef Mince Chilli'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Beef Mince Chilli', 'dinner', 'Cook the rice per pack instructions. Brown the mince in a pan for 5-6 min, breaking it up. Drain and rinse the kidney beans and add to the pan with the chopped tomatoes; simmer for 12-15 min. Serve over the rice.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Cook the rice per pack instructions. Brown the mince in a pan for 5-6 min, breaking it up. Drain and rinse the kidney beans and add to the pan with the chopped tomatoes; simmer for 12-15 min. Serve over the rice.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, '5% Fat Mince (Uncooked)', 150, 'g', 193.5, 3.0, 30.0, 7.5, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('5% Fat Mince (Uncooked)'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Kidney Beans', 1.0, 'tin', 230.0, 32.0, 16.0, 1.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Kidney Beans'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chopped Tomatoes', 1.0, 'tin', 94.0, 14.0, 5.0, 1.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chopped Tomatoes'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Rice (Uncooked)', 55, 'g', 200.8, 45.7, 4.4, 0.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Rice (Uncooked)'))));

  -- Salmon, Sweet Potato & Greens (dinner)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Salmon, Sweet Potato & Greens'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Salmon, Sweet Potato & Greens', 'dinner', 'Cut the sweet potato into wedges and roast at 200°C for 25-30 min, turning once. Season the salmon and pan-fry skin-side down for 4 min, then flip for 2-3 min more (or bake at 200°C for 12-15 min). Steam the tenderstem broccoli for the last 4 min. Serve together.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Cut the sweet potato into wedges and roast at 200°C for 25-30 min, turning once. Season the salmon and pan-fry skin-side down for 4 min, then flip for 2-3 min more (or bake at 200°C for 12-15 min). Steam the tenderstem broccoli for the last 4 min. Serve together.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Salmon Fillet', 130, 'g', 197.0, 0.0, 24.0, 11.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Salmon Fillet'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Sweet Potato (Raw)', 200, 'g', 180.0, 42.0, 4.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Sweet Potato (Raw)'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Tenderstem Broccoli', 100, 'g', 38.0, 2.0, 4.0, 1.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Tenderstem Broccoli'))));

  -- Chicken Stir Fry (dinner)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Chicken Stir Fry'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Chicken Stir Fry', 'dinner', 'Cook the rice per pack instructions. Slice the raw chicken and stir-fry over high heat for 6-7 min until cooked through. Add the bean sprouts and sliced pepper and stir-fry for 2-3 min more, then stir through the sauce. Serve over the rice.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Cook the rice per pack instructions. Slice the raw chicken and stir-fry over high heat for 6-7 min until cooked through. Add the bean sprouts and sliced pepper and stir-fry for 2-3 min more, then stir through the sauce. Serve over the rice.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken (Raw)', 205, 'g', 246.0, 0.0, 47.1, 6.1, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken (Raw)'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Rice (Uncooked)', 55, 'g', 200.8, 45.7, 4.4, 0.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Rice (Uncooked)'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Bean Sprouts', 80, 'g', 37.6, 1.6, 2.4, 2.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Bean Sprouts'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Pepper', 1.0, 'unit', 31.0, 15.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Pepper'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Stir Fry Sauce', 1.0, 'unit', 95.0, 23.0, 0.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Stir Fry Sauce'))));

  -- Sausage & Sweet Potato Mash (dinner)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Sausage & Sweet Potato Mash'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Sausage & Sweet Potato Mash', 'dinner', 'Grill or bake the sausages per pack instructions. Boil the sweet potato, chopped into chunks, for 12-15 min until soft; drain and mash with the olive oil. Warm the peas. Serve together.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Grill or bake the sausages per pack instructions. Boil the sweet potato, chopped into chunks, for 12-15 min until soft; drain and mash with the olive oil. Warm the peas. Serve together.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken Sausages', 3.0, 'unit', 267.0, 9.0, 30.0, 12.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken Sausages'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Sweet Potato (Raw)', 250, 'g', 225.0, 52.5, 5.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Sweet Potato (Raw)'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Garden Peas (cooked)', 80, 'g', 59.0, 7.0, 4.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Garden Peas (cooked)'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Olive Oil', 10, 'g', 90.0, 0.0, 0.0, 10.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Olive Oil'))));

  -- ============ PRE_WORKOUT ============

  -- Sourdough, Peanut Butter & Banana (pre_workout)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'pre_workout' and lower(trim(name)) = lower(trim('Sourdough, Peanut Butter & Banana'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Sourdough, Peanut Butter & Banana', 'pre_workout', 'Toast the sourdough. Spread with the peanut butter and top with sliced banana.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Toast the sourdough. Spread with the peanut butter and top with sliced banana.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Wholemeal Sourdough', 2.0, 'slice', 300.0, 58.0, 12.0, 2.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Wholemeal Sourdough'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Peanut Butter', 20, 'g', 128.0, 4.8, 4.8, 10.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Peanut Butter'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Banana', 1.0, 'unit', 71.0, 18.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Banana'))));

  -- Oats & Honey (Dairy-Free) (pre_workout)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'pre_workout' and lower(trim(name)) = lower(trim('Oats & Honey (Dairy-Free)'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Oats & Honey (Dairy-Free)', 'pre_workout', 'Combine the oats and oat milk in a pan or bowl and cook (3-4 min on the hob, or microwave in bursts) until thick. Stir through the honey.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Combine the oats and oat milk in a pan or bowl and cook (3-4 min on the hob, or microwave in bursts) until thick. Stir through the honey.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Oats', 50, 'g', 185.0, 32.5, 6.0, 2.5, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Oats'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Oat Milk', 150, 'ml', 60.0, 9.0, 0.0, 3.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Oat Milk'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Honey', 15, 'g', 45.0, 12.0, 0.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Honey'))));

  -- Dates & Almonds (pre_workout)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'pre_workout' and lower(trim(name)) = lower(trim('Dates & Almonds'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Dates & Almonds', 'pre_workout', 'Serve the dates and almonds together.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Serve the dates and almonds together.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Medjool Dates', 30, 'g', 87.0, 20.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Medjool Dates'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Almonds', 20, 'g', 127.3, 1.3, 2.7, 11.3, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Almonds'))));

  -- ============ EVENING_SNACK ============

  -- Dairy-Free Protein Shake (evening_snack)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'evening_snack' and lower(trim(name)) = lower(trim('Dairy-Free Protein Shake'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Dairy-Free Protein Shake', 'evening_snack', 'Blend or shake the protein powder with the oat milk until smooth.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Blend or shake the protein powder with the oat milk until smooth.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Vegan Protein Powder', 25, 'g', 88.0, 1.5, 18.0, 0.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Vegan Protein Powder'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Oat Milk', 250, 'ml', 100.0, 15.0, 0.0, 5.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Oat Milk'))));

  -- Dark Chocolate & Almonds (evening_snack)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'evening_snack' and lower(trim(name)) = lower(trim('Dark Chocolate & Almonds'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Dark Chocolate & Almonds', 'evening_snack', 'Serve the dark chocolate and almonds together.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Serve the dark chocolate and almonds together.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, '70% Dark Chocolate', 2.0, 'square', 144.0, 12.0, 2.0, 12.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('70% Dark Chocolate'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Almonds', 15, 'g', 95.5, 1.0, 2.0, 8.5, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Almonds'))));

  -- ============ SNACK ============

  -- Grapes & Walnuts (snack)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'snack' and lower(trim(name)) = lower(trim('Grapes & Walnuts'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Grapes & Walnuts', 'snack', 'Serve the grapes and walnuts together.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Serve the grapes and walnuts together.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Grapes', 100, 'g', 73.0, 17.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Grapes'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Walnuts', 20, 'g', 140.0, 0.7, 2.7, 14.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Walnuts'))));

  -- ============ BREAKFAST ============

  -- Vegan Oat Porridge with Berries (breakfast)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('Vegan Oat Porridge with Berries'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Vegan Oat Porridge with Berries', 'breakfast', 'Combine the oats and oat milk in a pan or bowl. Cook for 3-4 min on the hob, stirring, or in 45 sec microwave bursts until thick. Stir through the chia seeds and top with the berries.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Combine the oats and oat milk in a pan or bowl. Cook for 3-4 min on the hob, stirring, or in 45 sec microwave bursts until thick. Stir through the chia seeds and top with the berries.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Oats', 60, 'g', 222.0, 39.0, 7.2, 3.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Oats'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Oat Milk', 200, 'ml', 80.0, 12.0, 0.0, 4.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Oat Milk'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Berries', 80, 'g', 27.2, 4.0, 0.8, 0.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Berries'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chia Seeds', 15, 'g', 66.0, 1.0, 3.0, 5.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chia Seeds'))));

  -- Peanut Butter Banana Oats (breakfast)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('Peanut Butter Banana Oats'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Peanut Butter Banana Oats', 'breakfast', 'Combine the oats and oat milk in a pan or bowl and cook (3-4 min on the hob, or microwave in bursts) until thick. Stir through the peanut butter and top with sliced banana.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Combine the oats and oat milk in a pan or bowl and cook (3-4 min on the hob, or microwave in bursts) until thick. Stir through the peanut butter and top with sliced banana.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Oats', 60, 'g', 222.0, 39.0, 7.2, 3.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Oats'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Oat Milk', 200, 'ml', 80.0, 12.0, 0.0, 4.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Oat Milk'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Banana', 1.0, 'unit', 71.0, 18.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Banana'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Peanut Butter', 20, 'g', 128.0, 4.8, 4.8, 10.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Peanut Butter'))));

  -- Baked Beans on Sourdough (breakfast)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('Baked Beans on Sourdough'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Baked Beans on Sourdough', 'breakfast', 'Toast the sourdough. Warm the baked beans in a pan or microwave for 2-3 min, stirring occasionally. Spoon over the toast.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Toast the sourdough. Warm the baked beans in a pan or microwave for 2-3 min, stirring occasionally. Spoon over the toast.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Baked Beans', 1.0, 'tin', 338.0, 65.0, 20.0, 2.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Baked Beans'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Wholemeal Sourdough', 2.0, 'slice', 300.0, 58.0, 12.0, 2.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Wholemeal Sourdough'))));

  -- ============ LUNCH ============

  -- Chickpea & Avocado Salad (lunch)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Chickpea & Avocado Salad'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Chickpea & Avocado Salad', 'lunch', 'Drain and rinse the chickpeas. Combine with the cucumber, cherry tomatoes, salad and sliced avocado in a bowl. Drizzle with the olive oil and toss.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Drain and rinse the chickpeas. Combine with the cucumber, cherry tomatoes, salad and sliced avocado in a bowl. Drizzle with the olive oil and toss.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chickpeas', 1.0, 'tin', 302.0, 38.0, 19.0, 6.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chickpeas'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Avacado', 0.5, 'unit', 120.0, 6.5, 1.5, 11.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Avacado'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cherry Tomatoes', 60, 'g', 15.8, 2.2, 0.8, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cherry Tomatoes'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cucumber', 60, 'g', 9.6, 0.6, 0.6, 0.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cucumber'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Salad', 60, 'g', 10.2, 1.8, 1.2, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Salad'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Olive Oil', 10, 'g', 90.0, 0.0, 0.0, 10.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Olive Oil'))));

  -- Kidney Bean Rice Bowl (lunch)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Kidney Bean Rice Bowl'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Kidney Bean Rice Bowl', 'lunch', 'Cook the rice per pack instructions. Drain and rinse the kidney beans and warm through. Build the bowl with rice, beans, salsa, diced pepper and spring onion.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Cook the rice per pack instructions. Drain and rinse the kidney beans and warm through. Build the bowl with rice, beans, salsa, diced pepper and spring onion.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Kidney Beans', 1.0, 'tin', 230.0, 32.0, 16.0, 1.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Kidney Beans'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Rice (Uncooked)', 55, 'g', 200.8, 45.7, 4.4, 0.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Rice (Uncooked)'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Salsa', 40, 'g', 13.6, 2.8, 0.4, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Salsa'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Pepper', 1.0, 'unit', 31.0, 15.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Pepper'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Spring Onion', 20, 'g', 5.5, 0.5, 0.5, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Spring Onion'))));

  -- Chickpea & Avocado Wrap (lunch)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Chickpea & Avocado Wrap'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Chickpea & Avocado Wrap', 'lunch', 'Drain and rinse the chickpeas and lightly mash. Warm the wrap, fill with the salad, mashed chickpeas and sliced avocado, then roll to close.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Drain and rinse the chickpeas and lightly mash. Warm the wrap, fill with the salad, mashed chickpeas and sliced avocado, then roll to close.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Tortilla Wrap', 1.0, 'unit', 181.0, 37.0, 5.0, 2.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Tortilla Wrap'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chickpeas', 1.0, 'tin', 302.0, 38.0, 19.0, 6.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chickpeas'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Avacado', 0.5, 'unit', 120.0, 6.5, 1.5, 11.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Avacado'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Salad', 60, 'g', 10.2, 1.8, 1.2, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Salad'))));

  -- Baked Beans & Sweet Potato Jacket (lunch)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Baked Beans & Sweet Potato Jacket'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Baked Beans & Sweet Potato Jacket', 'lunch', 'Prick the sweet potato and bake at 200°C for 40-50 min until soft (or microwave then crisp in the oven). Warm the baked beans in a pan for 2-3 min. Split the potato, top with the beans and spring onion.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Prick the sweet potato and bake at 200°C for 40-50 min until soft (or microwave then crisp in the oven). Warm the baked beans in a pan for 2-3 min. Split the potato, top with the beans and spring onion.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Sweet Potato (Raw)', 220, 'g', 198.0, 46.2, 4.4, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Sweet Potato (Raw)'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Baked Beans', 1.0, 'tin', 338.0, 65.0, 20.0, 2.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Baked Beans'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Spring Onion', 20, 'g', 5.5, 0.5, 0.5, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Spring Onion'))));

  -- ============ DINNER ============

  -- Kidney Bean Chilli & Rice (dinner)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Kidney Bean Chilli & Rice'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Kidney Bean Chilli & Rice', 'dinner', 'Cook the rice per pack instructions. Warm the kidney beans in chilli sauce with the diced pepper and onion for 8-10 min until the veg softens. Serve over the rice.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Cook the rice per pack instructions. Warm the kidney beans in chilli sauce with the diced pepper and onion for 8-10 min until the veg softens. Serve over the rice.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Kidney Beans In Chilli Sauce', 1.0, 'tin', 268.0, 39.0, 17.0, 1.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Kidney Beans In Chilli Sauce'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Rice (Uncooked)', 55, 'g', 200.8, 45.7, 4.4, 0.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Rice (Uncooked)'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Pepper', 1.0, 'unit', 31.0, 15.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Pepper'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Onion', 1.0, 'small', 28.0, 7.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Onion'))));

  -- Chickpea Tomato Curry & Rice (dinner)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Chickpea Tomato Curry & Rice'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Chickpea Tomato Curry & Rice', 'dinner', 'Cook the rice per pack instructions. Fry the diced onion for 2-3 min, add the drained chickpeas and passata and simmer for 10-12 min, stirring through the spinach for the last 2 min until wilted. Serve over the rice.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Cook the rice per pack instructions. Fry the diced onion for 2-3 min, add the drained chickpeas and passata and simmer for 10-12 min, stirring through the spinach for the last 2 min until wilted. Serve over the rice.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chickpeas', 1.0, 'tin', 302.0, 38.0, 19.0, 6.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chickpeas'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Passata', 200, 'g', 42.4, 6.4, 2.4, 0.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Passata'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Onion', 1.0, 'small', 28.0, 7.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Onion'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Rice (Uncooked)', 55, 'g', 200.8, 45.7, 4.4, 0.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Rice (Uncooked)'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Spinach', 40, 'g', 7.6, 0.0, 1.2, 0.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Spinach'))));

  -- Bean & Veg Stir Fry (dinner)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Bean & Veg Stir Fry'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Bean & Veg Stir Fry', 'dinner', 'Cook the rice per pack instructions. Drain and rinse the kidney beans. Stir-fry the bean sprouts and sliced pepper over high heat for 3-4 min, add the beans and sauce and cook for 2 min more. Serve over the rice.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Cook the rice per pack instructions. Drain and rinse the kidney beans. Stir-fry the bean sprouts and sliced pepper over high heat for 3-4 min, add the beans and sauce and cook for 2 min more. Serve over the rice.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Kidney Beans', 1.0, 'tin', 230.0, 32.0, 16.0, 1.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Kidney Beans'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Bean Sprouts', 80, 'g', 37.6, 1.6, 2.4, 2.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Bean Sprouts'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Pepper', 1.0, 'unit', 31.0, 15.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Pepper'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Rice (Uncooked)', 55, 'g', 200.8, 45.7, 4.4, 0.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Rice (Uncooked)'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Stir Fry Sauce', 1.0, 'unit', 95.0, 23.0, 0.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Stir Fry Sauce'))));

  -- Sweet Potato & Chickpea Traybake (dinner)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Sweet Potato & Chickpea Traybake'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Sweet Potato & Chickpea Traybake', 'dinner', 'Toss the diced sweet potato, drained chickpeas and sliced pepper in the olive oil. Roast at 200°C for 25-30 min, turning halfway, until the sweet potato is tender and starting to char.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Toss the diced sweet potato, drained chickpeas and sliced pepper in the olive oil. Roast at 200°C for 25-30 min, turning halfway, until the sweet potato is tender and starting to char.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Sweet Potato (Raw)', 220, 'g', 198.0, 46.2, 4.4, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Sweet Potato (Raw)'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chickpeas', 1.0, 'tin', 302.0, 38.0, 19.0, 6.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chickpeas'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Pepper', 1.0, 'unit', 31.0, 15.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Pepper'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Olive Oil', 10, 'g', 90.0, 0.0, 0.0, 10.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Olive Oil'))));

  -- ============ EVENING_SNACK ============

  -- Dark Chocolate & Walnuts (evening_snack)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'evening_snack' and lower(trim(name)) = lower(trim('Dark Chocolate & Walnuts'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Dark Chocolate & Walnuts', 'evening_snack', 'Serve the dark chocolate and walnuts together.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Serve the dark chocolate and walnuts together.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, '70% Dark Chocolate', 2.0, 'square', 144.0, 12.0, 2.0, 12.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('70% Dark Chocolate'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Walnuts', 20, 'g', 140.0, 0.7, 2.7, 14.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Walnuts'))));
end $$;

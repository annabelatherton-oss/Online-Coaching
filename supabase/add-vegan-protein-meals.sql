-- Higher-protein vegan meals using the new ingredients (tofu, tempeh, lentils, edamame,
-- vegan mince, soy milk, vegan protein powder, hummus, vegan cheese) from
-- supabase/add-vegan-protein-ingredients.sql — run that file FIRST. These sit alongside
-- (not instead of) the bean/chickpea-based vegan meals added earlier. Uses raw/uncooked
-- weight for rice throughout (weigh before cooking).
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

  -- Tofu Scramble on Sourdough (breakfast)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('Tofu Scramble on Sourdough'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Tofu Scramble on Sourdough', 'breakfast', null)
    returning id into v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Firm Tofu', 150, 'g', 159.0, 2.5, 17.0, 8.7, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Firm Tofu'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Wholemeal Sourdough', 2.0, 'slice', 300.0, 58.0, 12.0, 2.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Wholemeal Sourdough'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Spinach', 30, 'g', 5.7, 0.0, 0.9, 0.3, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Spinach'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cherry Tomatoes', 40, 'g', 10.5, 1.5, 0.5, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cherry Tomatoes'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Olive Oil', 5, 'g', 45.0, 0.0, 0.0, 5.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Olive Oil'))));

  -- Soy Milk Protein Oats (breakfast)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('Soy Milk Protein Oats'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Soy Milk Protein Oats', 'breakfast', null)
    returning id into v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Oats', 60, 'g', 222.0, 39.0, 7.2, 3.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Oats'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Unsweetened Soy Milk', 200, 'ml', 64.0, 0.0, 6.6, 3.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Unsweetened Soy Milk'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Vegan Protein Powder', 25, 'g', 88.0, 1.5, 18.0, 0.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Vegan Protein Powder'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Banana', 1.0, 'unit', 71.0, 18.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Banana'))));

  -- ============ LUNCH ============

  -- Tofu & Edamame Salad (lunch)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Tofu & Edamame Salad'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Tofu & Edamame Salad', 'lunch', null)
    returning id into v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Firm Tofu', 150, 'g', 159.0, 2.5, 17.0, 8.7, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Firm Tofu'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Edamame Beans', 80, 'g', 124.8, 7.4, 9.6, 4.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Edamame Beans'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Salad', 60, 'g', 10.2, 1.8, 1.2, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Salad'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cherry Tomatoes', 60, 'g', 15.8, 2.2, 0.8, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cherry Tomatoes'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Olive Oil', 10, 'g', 90.0, 0.0, 0.0, 10.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Olive Oil'))));

  -- Hummus & Chickpea Wrap (lunch)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Hummus & Chickpea Wrap'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Hummus & Chickpea Wrap', 'lunch', null)
    returning id into v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Tortilla Wrap', 1.0, 'unit', 181.0, 37.0, 5.0, 2.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Tortilla Wrap'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Hummus', 60, 'g', 138.0, 7.2, 3.6, 10.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Hummus'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chickpeas', 1.0, 'tin', 302.0, 38.0, 19.0, 6.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chickpeas'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Salad', 60, 'g', 10.2, 1.8, 1.2, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Salad'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cucumber', 40, 'g', 6.4, 0.4, 0.4, 0.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cucumber'))));

  -- Tempeh & Rice Bowl (lunch)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Tempeh & Rice Bowl'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Tempeh & Rice Bowl', 'lunch', null)
    returning id into v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Tempeh', 150, 'g', 252.0, 9.0, 30.0, 10.5, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Tempeh'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Rice (Uncooked)', 55, 'g', 200.8, 45.7, 4.4, 0.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Rice (Uncooked)'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Pepper', 1.0, 'unit', 31.0, 15.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Pepper'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Spring Onion', 20, 'g', 5.5, 0.5, 0.5, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Spring Onion'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Stir Fry Sauce', 1.0, 'unit', 95.0, 23.0, 0.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Stir Fry Sauce'))));

  -- Red Lentil Dahl & Rice (lunch)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Red Lentil Dahl & Rice'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Red Lentil Dahl & Rice', 'lunch', null)
    returning id into v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Red Lentils (Dry)', 75, 'g', 262.5, 45.0, 18.8, 1.1, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Red Lentils (Dry)'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Passata', 150, 'g', 31.8, 4.8, 1.8, 0.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Passata'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Onion', 1.0, 'small', 28.0, 7.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Onion'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Rice (Uncooked)', 55, 'g', 200.8, 45.7, 4.4, 0.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Rice (Uncooked)'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Spinach', 30, 'g', 5.7, 0.0, 0.9, 0.3, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Spinach'))));

  -- ============ DINNER ============

  -- Tofu Stir Fry (dinner)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Tofu Stir Fry'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Tofu Stir Fry', 'dinner', null)
    returning id into v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Firm Tofu', 180, 'g', 190.8, 3.1, 20.3, 10.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Firm Tofu'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Rice (Uncooked)', 55, 'g', 200.8, 45.7, 4.4, 0.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Rice (Uncooked)'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Bean Sprouts', 80, 'g', 37.6, 1.6, 2.4, 2.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Bean Sprouts'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Pepper', 1.0, 'unit', 31.0, 15.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Pepper'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Stir Fry Sauce', 1.0, 'unit', 95.0, 23.0, 0.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Stir Fry Sauce'))));

  -- Vegan Mince Bolognese (dinner)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Vegan Mince Bolognese'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Vegan Mince Bolognese', 'dinner', null)
    returning id into v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Vegan Mince', 150, 'g', 271.5, 14.2, 21.5, 10.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Vegan Mince'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Spaghetti (Dry)', 75, 'g', 268.0, 54.0, 10.0, 1.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Spaghetti (Dry)'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Passata', 150, 'g', 31.8, 4.8, 1.8, 0.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Passata'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Onion', 1.0, 'small', 28.0, 7.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Onion'))));

  -- Tempeh & Sweet Potato Traybake (dinner)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Tempeh & Sweet Potato Traybake'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Tempeh & Sweet Potato Traybake', 'dinner', null)
    returning id into v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Tempeh', 150, 'g', 252.0, 9.0, 30.0, 10.5, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Tempeh'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Sweet Potato (Raw)', 220, 'g', 198.0, 46.2, 4.4, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Sweet Potato (Raw)'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Pepper', 1.0, 'unit', 31.0, 15.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Pepper'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Olive Oil', 10, 'g', 90.0, 0.0, 0.0, 10.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Olive Oil'))));

  -- Green Lentil Dahl & Rice (dinner)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Green Lentil Dahl & Rice'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Green Lentil Dahl & Rice', 'dinner', null)
    returning id into v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Green Lentils (Tinned)', 1, 'tin', 242, 40, 18, 1, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Green Lentils (Tinned)'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Passata', 150, 'g', 31.8, 4.8, 1.8, 0.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Passata'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Onion', 1.0, 'small', 28.0, 7.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Onion'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Rice (Uncooked)', 55, 'g', 200.8, 45.7, 4.4, 0.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Rice (Uncooked)'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Spinach', 40, 'g', 7.6, 0.0, 1.2, 0.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Spinach'))));

  -- ============ PRE_WORKOUT ============

  -- Vegan Protein Shake (pre_workout)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'pre_workout' and lower(trim(name)) = lower(trim('Vegan Protein Shake'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Vegan Protein Shake', 'pre_workout', null)
    returning id into v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Vegan Protein Powder', 25, 'g', 88.0, 1.5, 18.0, 0.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Vegan Protein Powder'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Unsweetened Soy Milk', 250, 'ml', 80.0, 0.0, 8.2, 4.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Unsweetened Soy Milk'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Banana', 1.0, 'unit', 71.0, 18.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Banana'))));

  -- Hummus & Rice Cakes (pre_workout)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'pre_workout' and lower(trim(name)) = lower(trim('Hummus & Rice Cakes'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Hummus & Rice Cakes', 'pre_workout', null)
    returning id into v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Hummus', 60, 'g', 138.0, 7.2, 3.6, 10.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Hummus'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Salted Rice Cakes', 2.0, 'unit', 54.0, 12.0, 2.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Salted Rice Cakes'))));

  -- ============ EVENING_SNACK ============

  -- Steamed Edamame (evening_snack)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'evening_snack' and lower(trim(name)) = lower(trim('Steamed Edamame'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Steamed Edamame', 'evening_snack', null)
    returning id into v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Edamame Beans', 150, 'g', 234.0, 13.8, 18.0, 9.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Edamame Beans'))));

  -- Vegan Cheese & Rice Cakes (evening_snack)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'evening_snack' and lower(trim(name)) = lower(trim('Vegan Cheese & Rice Cakes'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Vegan Cheese & Rice Cakes', 'evening_snack', null)
    returning id into v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Vegan Cheese Slice', 2, 'g', 5.9, 0.4, 0.0, 0.5, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Vegan Cheese Slice'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Salted Rice Cakes', 2.0, 'unit', 54.0, 12.0, 2.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Salted Rice Cakes'))));

  -- ============ SNACK ============

  -- Hummus & Carrot Sticks (snack)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'snack' and lower(trim(name)) = lower(trim('Hummus & Carrot Sticks'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Hummus & Carrot Sticks', 'snack', null)
    returning id into v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Hummus', 60, 'g', 138.0, 7.2, 3.6, 10.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Hummus'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Carrot', 2.0, 'unit', 64.0, 12.0, 0.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Carrot'))));
end $$;

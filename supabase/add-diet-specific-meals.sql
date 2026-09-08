-- New meals for clients with dietary requirements, built entirely from ingredients already
-- in the coach's library (supabase/add-ingredient-library-foods.sql). Same idempotent pattern
-- as the earlier meal imports: guarded by (coach_id, category, name), so re-running this is
-- always safe and never creates duplicates or touches meals you've already added by hand.

do $$
declare
  v_coach_id uuid := (select id from profiles where email = 'annabelatherton@gmail.com');
  v_meal_id uuid;
begin

  -- ============ VEGETARIAN MEALS ============

  -- Veggie Scrambled Eggs & Sourdough (breakfast)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('Veggie Scrambled Eggs & Sourdough'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Veggie Scrambled Eggs & Sourdough', 'breakfast', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Eggs', 3.0, 'large', 237.0, 3.0, 24.0, 15.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Eggs'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Wholemeal Sourdough', 2.0, 'slice', 300.0, 58.0, 12.0, 2.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Wholemeal Sourdough'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Spinach', 30, 'g', 5.7, 0.0, 0.9, 0.3, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Spinach'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cherry Tomatoes', 40, 'g', 10.5, 1.5, 0.5, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cherry Tomatoes'))));
  end if;

  -- Greek Yogurt Protein Pot (breakfast)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('Greek Yogurt Protein Pot'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Greek Yogurt Protein Pot', 'breakfast', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, '0% Greek Yogurt', 200, 'g', 108.0, 6.0, 20.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('0% Greek Yogurt'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Granola', 40, 'g', 167.2, 26.8, 4.0, 4.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Granola'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Berries', 80, 'g', 27.2, 4.0, 0.8, 0.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Berries'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Honey', 15, 'g', 45.0, 12.0, 0.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Honey'))));
  end if;

  -- Quorn Sausage Breakfast Wrap (breakfast)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('Quorn Sausage Breakfast Wrap'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Quorn Sausage Breakfast Wrap', 'breakfast', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Quorn Sausages', 2.0, 'unit', 150.0, 8.0, 12.0, 8.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Quorn Sausages'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Tortilla Wrap', 1.0, 'unit', 181.0, 37.0, 5.0, 2.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Tortilla Wrap'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Eggs', 1.0, 'large', 79.0, 1.0, 8.0, 5.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Eggs'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Spinach', 20, 'g', 3.8, 0.0, 0.6, 0.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Spinach'))));
  end if;

  -- Cottage Cheese & Fruit Bowl (breakfast)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('Cottage Cheese & Fruit Bowl'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Cottage Cheese & Fruit Bowl', 'breakfast', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cottage Cheese', 150, 'g', 157.5, 6.0, 15.0, 9.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cottage Cheese'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Banana', 1.0, 'unit', 71.0, 18.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Banana'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Berries', 60, 'g', 20.4, 3.0, 0.6, 0.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Berries'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Honey', 10, 'g', 30.0, 8.0, 0.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Honey'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Almonds', 15, 'g', 95.5, 1.0, 2.0, 8.5, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Almonds'))));
  end if;

  -- Halloumi & Veg Wrap (lunch)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Halloumi & Veg Wrap'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Halloumi & Veg Wrap', 'lunch', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Halloumi', 60, 'g', 180.0, 2.0, 12.0, 14.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Halloumi'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Tortilla Wrap', 1.0, 'unit', 181.0, 37.0, 5.0, 2.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Tortilla Wrap'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Salad', 60, 'g', 10.2, 1.8, 1.2, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Salad'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cherry Tomatoes', 40, 'g', 10.5, 1.5, 0.5, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cherry Tomatoes'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Light Mayo', 15, 'g', 40.0, 2.0, 0.0, 4.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Light Mayo'))));
  end if;

  -- Chickpea & Feta Salad (lunch)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Chickpea & Feta Salad'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Chickpea & Feta Salad', 'lunch', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chickpeas', 1.0, 'tin', 302.0, 38.0, 19.0, 6.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chickpeas'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Feta Cheese', 40, 'g', 112.0, 0.0, 6.7, 9.3, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Feta Cheese'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cucumber', 60, 'g', 9.6, 0.6, 0.6, 0.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cucumber'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cherry Tomatoes', 60, 'g', 15.8, 2.2, 0.8, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cherry Tomatoes'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Salad', 60, 'g', 10.2, 1.8, 1.2, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Salad'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Olive Oil', 10, 'g', 90.0, 0.0, 0.0, 10.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Olive Oil'))));
  end if;

  -- Quorn Chicken Caesar Salad (lunch)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Quorn Chicken Caesar Salad'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Quorn Chicken Caesar Salad', 'lunch', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Quorn Chicken Pieces', 120, 'g', 116.4, 4.8, 16.8, 2.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Quorn Chicken Pieces'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Lettuce', 100, 'g', 20.0, 4.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Lettuce'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Parmesan', 15, 'g', 60.5, 0.0, 5.0, 4.5, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Parmesan'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Reduced Caesar Dressing', 15, 'ml', 34.0, 1.0, 0.0, 3.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Reduced Caesar Dressing'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Eggs', 1.0, 'large', 79.0, 1.0, 8.0, 5.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Eggs'))));
  end if;

  -- Cottage Cheese Baked Potato (lunch)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Cottage Cheese Baked Potato'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Cottage Cheese Baked Potato', 'lunch', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Baking Potato', 200, 'g', 154.0, 36.0, 4.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Baking Potato'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cottage Cheese', 150, 'g', 157.5, 6.0, 15.0, 9.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cottage Cheese'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Sweetcorn', 80, 'g', 64.0, 9.0, 2.0, 2.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Sweetcorn'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Spring Onion', 20, 'g', 5.5, 0.5, 0.5, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Spring Onion'))));
  end if;

  -- Kidney Bean & Rice Bowl (lunch)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Kidney Bean & Rice Bowl'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Kidney Bean & Rice Bowl', 'lunch', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Kidney Beans', 1.0, 'tin', 230.0, 32.0, 16.0, 1.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Kidney Beans'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Rice (Cooked)', 150, 'g', 195.0, 42.0, 4.5, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Rice (Cooked)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Salsa', 40, 'g', 13.6, 2.8, 0.4, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Salsa'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Pepper', 1.0, 'unit', 31.0, 15.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Pepper'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cheese (50% Lighter)', 25, 'g', 68.0, 2.0, 7.0, 4.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cheese (50% Lighter)'))));
  end if;

  -- Quorn Mince Bolognese (dinner)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Quorn Mince Bolognese'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Quorn Mince Bolognese', 'dinner', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Quorn Mince', 150, 'g', 154.5, 4.5, 24.0, 3.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Quorn Mince'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Spaghetti (Dry)', 75, 'g', 268.0, 54.0, 10.0, 1.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Spaghetti (Dry)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Passata', 150, 'g', 31.8, 4.8, 1.8, 0.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Passata'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Onion', 1.0, 'small', 28.0, 7.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Onion'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Parmesan', 15, 'g', 60.5, 0.0, 5.0, 4.5, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Parmesan'))));
  end if;

  -- Halloumi & Veg Traybake (dinner)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Halloumi & Veg Traybake'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Halloumi & Veg Traybake', 'dinner', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Halloumi', 90, 'g', 270.0, 3.0, 18.0, 21.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Halloumi'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Sweet Potato (Raw)', 200, 'g', 180.0, 42.0, 4.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Sweet Potato (Raw)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Pepper', 1.0, 'unit', 31.0, 15.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Pepper'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Broccoli', 100, 'g', 39.0, 6.0, 0.0, 3.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Broccoli'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Olive Oil', 10, 'g', 90.0, 0.0, 0.0, 10.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Olive Oil'))));
  end if;

  -- Veggie Chilli (dinner)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Veggie Chilli'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Veggie Chilli', 'dinner', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Kidney Beans In Chilli Sauce', 1.0, 'tin', 268.0, 39.0, 17.0, 1.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Kidney Beans In Chilli Sauce'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Rice (Cooked)', 150, 'g', 195.0, 42.0, 4.5, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Rice (Cooked)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Pepper', 1.0, 'unit', 31.0, 15.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Pepper'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Onion', 1.0, 'small', 28.0, 7.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Onion'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cheese (50% Lighter)', 25, 'g', 68.0, 2.0, 7.0, 4.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cheese (50% Lighter)'))));
  end if;

  -- Quorn Sausage & Mash (dinner)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Quorn Sausage & Mash'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Quorn Sausage & Mash', 'dinner', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Quorn Sausages', 3.0, 'unit', 225.0, 12.0, 18.0, 12.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Quorn Sausages'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Baking Potato', 250, 'g', 192.5, 45.0, 5.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Baking Potato'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Garden Peas (cooked)', 80, 'g', 59.0, 7.0, 4.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Garden Peas (cooked)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Reduced Gravy Granules', 20, 'g', 82.0, 14.0, 0.0, 4.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Reduced Gravy Granules'))));
  end if;

  -- Chickpea Curry & Rice (dinner)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Chickpea Curry & Rice'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Chickpea Curry & Rice', 'dinner', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chickpeas', 1.0, 'tin', 302.0, 38.0, 19.0, 6.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chickpeas'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Mayflower Curry Sauce', 150, 'g', 115.5, 12.0, 1.5, 6.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Mayflower Curry Sauce'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Rice (Cooked)', 150, 'g', 195.0, 42.0, 4.5, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Rice (Cooked)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Spinach', 40, 'g', 7.6, 0.0, 1.2, 0.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Spinach'))));
  end if;

  -- Banana & Peanut Butter Rice Cakes (pre_workout)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'pre_workout' and lower(trim(name)) = lower(trim('Banana & Peanut Butter Rice Cakes'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Banana & Peanut Butter Rice Cakes', 'pre_workout', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Banana', 1.0, 'unit', 71.0, 18.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Banana'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Peanut Butter', 25, 'g', 160.0, 6.0, 6.0, 13.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Peanut Butter'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Salted Rice Cakes', 2.0, 'unit', 54.0, 12.0, 2.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Salted Rice Cakes'))));
  end if;

  -- Protein Yogurt & Granola (pre_workout)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'pre_workout' and lower(trim(name)) = lower(trim('Protein Yogurt & Granola'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Protein Yogurt & Granola', 'pre_workout', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Protein Yogurt (Pouch)', 1.0, 'unit', 148.0, 9.0, 25.0, 1.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Protein Yogurt (Pouch)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Granola', 30, 'g', 125.4, 20.1, 3.0, 3.3, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Granola'))));
  end if;

  -- Sourdough Toast & Honey (pre_workout)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'pre_workout' and lower(trim(name)) = lower(trim('Sourdough Toast & Honey'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Sourdough Toast & Honey', 'pre_workout', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Wholemeal Sourdough', 2.0, 'slice', 300.0, 58.0, 12.0, 2.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Wholemeal Sourdough'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Honey', 20, 'g', 60.0, 16.0, 0.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Honey'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Peanut Butter', 15, 'g', 96.0, 3.6, 3.6, 7.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Peanut Butter'))));
  end if;

  -- Cottage Cheese & Berries (evening_snack)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'evening_snack' and lower(trim(name)) = lower(trim('Cottage Cheese & Berries'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Cottage Cheese & Berries', 'evening_snack', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cottage Cheese', 100, 'g', 105.0, 4.0, 10.0, 6.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cottage Cheese'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Berries', 60, 'g', 20.4, 3.0, 0.6, 0.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Berries'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Honey', 10, 'g', 30.0, 8.0, 0.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Honey'))));
  end if;

  -- Greek Yogurt & Dark Chocolate (evening_snack)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'evening_snack' and lower(trim(name)) = lower(trim('Greek Yogurt & Dark Chocolate'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Greek Yogurt & Dark Chocolate', 'evening_snack', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, '0% Greek Style Yogurt', 150, 'g', 90.0, 12.0, 9.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('0% Greek Style Yogurt'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, '70% Dark Chocolate', 1.0, 'square', 72.0, 6.0, 1.0, 6.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('70% Dark Chocolate'))));
  end if;

  -- Protein Mousse Pot (evening_snack)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'evening_snack' and lower(trim(name)) = lower(trim('Protein Mousse Pot'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Protein Mousse Pot', 'evening_snack', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Protein Mousse', 1.0, 'unit', 153.0, 10.0, 20.0, 3.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Protein Mousse'))));
  end if;

  -- Rice Cakes & Peanut Butter (snack)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'snack' and lower(trim(name)) = lower(trim('Rice Cakes & Peanut Butter'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Rice Cakes & Peanut Butter', 'snack', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Salted Rice Cakes', 2.0, 'unit', 54.0, 12.0, 2.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Salted Rice Cakes'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Peanut Butter', 20, 'g', 128.0, 4.8, 4.8, 10.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Peanut Butter'))));
  end if;

  -- Apple & Almonds (snack)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'snack' and lower(trim(name)) = lower(trim('Apple & Almonds'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Apple & Almonds', 'snack', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Apple', 1.0, 'unit', 104.0, 28.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Apple'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Almonds', 20, 'g', 127.3, 1.3, 2.7, 11.3, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Almonds'))));
  end if;

  -- ============ GLUTEN-FREE MEALS ============

  -- GF Oats with Berries (breakfast)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('GF Oats with Berries'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'GF Oats with Berries', 'breakfast', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Gluten Free Oats', 60, 'g', 234.0, 38.4, 9.0, 4.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Gluten Free Oats'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Semi-Skimmed Milk', 150, 'ml', 73.5, 7.5, 6.0, 3.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Semi-Skimmed Milk'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Berries', 60, 'g', 20.4, 3.0, 0.6, 0.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Berries'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Honey', 15, 'g', 45.0, 12.0, 0.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Honey'))));
  end if;

  -- Bacon & Eggs (breakfast)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('Bacon & Eggs'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Bacon & Eggs', 'breakfast', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Bacon Medallions', 3.0, 'unit', 81.0, 0.0, 15.0, 3.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Bacon Medallions'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Eggs', 2.0, 'large', 158.0, 2.0, 16.0, 10.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Eggs'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Tomato', 1.0, 'unit', 14.0, 2.0, 0.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Tomato'))));
  end if;

  -- GF Bagel & Salmon (breakfast)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('GF Bagel & Salmon'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'GF Bagel & Salmon', 'breakfast', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Gluten Free Bagel', 1.0, 'unit', 174.0, 34.0, 3.0, 2.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Gluten Free Bagel'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Salmon Fillet', 60, 'g', 90.9, 0.0, 11.1, 5.1, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Salmon Fillet'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Light cream Cheese', 30, 'g', 44.0, 2.0, 2.0, 3.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Light cream Cheese'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cucumber', 40, 'g', 6.4, 0.4, 0.4, 0.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cucumber'))));
  end if;

  -- GF Rice Pudding with Berries (breakfast)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('GF Rice Pudding with Berries'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'GF Rice Pudding with Berries', 'breakfast', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cream of Rice', 60, 'g', 206.4, 48.0, 3.6, 0.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cream of Rice'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Semi-Skimmed Milk', 200, 'ml', 98.0, 10.0, 8.0, 4.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Semi-Skimmed Milk'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Honey', 15, 'g', 45.0, 12.0, 0.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Honey'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Berries', 60, 'g', 20.4, 3.0, 0.6, 0.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Berries'))));
  end if;

  -- Chicken & Rice Salad (lunch)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Chicken & Rice Salad'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Chicken & Rice Salad', 'lunch', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken (Cooked)', 150, 'g', 247.5, 0.0, 46.5, 6.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken (Cooked)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Rice (Cooked)', 150, 'g', 195.0, 42.0, 4.5, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Rice (Cooked)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Salad', 60, 'g', 10.2, 1.8, 1.2, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Salad'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cherry Tomatoes', 60, 'g', 15.8, 2.2, 0.8, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cherry Tomatoes'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Olive Oil', 10, 'g', 90.0, 0.0, 0.0, 10.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Olive Oil'))));
  end if;

  -- Tuna & Baby Potato Salad (lunch)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Tuna & Baby Potato Salad'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Tuna & Baby Potato Salad', 'lunch', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Tuna', 1.0, 'tin', 110.0, 0.0, 25.0, 1.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Tuna'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Baby Potatoes (Boiled)', 175, 'g', 125.0, 26.0, 3.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Baby Potatoes (Boiled)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Sweetcorn', 80, 'g', 64.0, 9.0, 2.0, 2.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Sweetcorn'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Light Mayo', 15, 'g', 40.0, 2.0, 0.0, 4.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Light Mayo'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Spring Onion', 20, 'g', 5.5, 0.5, 0.5, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Spring Onion'))));
  end if;

  -- GF Wrap Chicken Fajita (lunch)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('GF Wrap Chicken Fajita'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'GF Wrap Chicken Fajita', 'lunch', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Gluten Free Wrap', 1.0, 'unit', 138.0, 28.0, 2.0, 3.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Gluten Free Wrap'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken (Cooked)', 120, 'g', 198.0, 0.0, 37.2, 4.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken (Cooked)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Fajita Seasoning', 1.0, 'packet', 104.0, 22.0, 2.0, 1.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Fajita Seasoning'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Pepper', 1.0, 'unit', 31.0, 15.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Pepper'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Onion', 1.0, 'small', 28.0, 7.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Onion'))));
  end if;

  -- Steak & Sweet Potato (lunch)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Steak & Sweet Potato'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Steak & Sweet Potato', 'lunch', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Sirloin Steak (Raw)', 150, 'g', 301.5, 0.0, 33.0, 19.5, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Sirloin Steak (Raw)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Sweet Potato (Raw)', 200, 'g', 180.0, 42.0, 4.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Sweet Potato (Raw)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Green Beans', 100, 'g', 31.0, 7.0, 2.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Green Beans'))));
  end if;

  -- Gammon & Baked Potato (lunch)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Gammon & Baked Potato'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Gammon & Baked Potato', 'lunch', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Gammon', 130, 'g', 226.2, 0.0, 23.4, 14.3, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Gammon'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Baking Potato', 220, 'g', 169.4, 39.6, 4.4, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Baking Potato'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Garden Peas (cooked)', 80, 'g', 59.0, 7.0, 4.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Garden Peas (cooked)'))));
  end if;

  -- Chicken, Rice & Broccoli (dinner)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Chicken, Rice & Broccoli'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Chicken, Rice & Broccoli', 'dinner', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken (Cooked)', 150, 'g', 247.5, 0.0, 46.5, 6.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken (Cooked)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Rice (Cooked)', 150, 'g', 195.0, 42.0, 4.5, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Rice (Cooked)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Broccoli', 100, 'g', 39.0, 6.0, 0.0, 3.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Broccoli'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Country Vegetable Mix (Frozen)', 80, 'g', 36.8, 4.8, 2.4, 0.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Country Vegetable Mix (Frozen)'))));
  end if;

  -- GF Spaghetti Bolognese (dinner)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('GF Spaghetti Bolognese'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'GF Spaghetti Bolognese', 'dinner', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Gluten Free Spaghetti (Dry)', 75, 'g', 278.0, 62.0, 5.0, 1.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Gluten Free Spaghetti (Dry)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, '5% Fat Mince (Uncooked)', 150, 'g', 193.5, 3.0, 30.0, 7.5, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('5% Fat Mince (Uncooked)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Passata', 150, 'g', 31.8, 4.8, 1.8, 0.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Passata'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Onion', 1.0, 'small', 28.0, 7.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Onion'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Parmesan', 15, 'g', 60.5, 0.0, 5.0, 4.5, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Parmesan'))));
  end if;

  -- Salmon & New Potatoes (dinner)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Salmon & New Potatoes'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Salmon & New Potatoes', 'dinner', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Salmon Fillet', 130, 'g', 197.0, 0.0, 24.0, 11.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Salmon Fillet'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Baby Potatoes (Boiled)', 175, 'g', 125.0, 26.0, 3.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Baby Potatoes (Boiled)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Tenderstem Broccoli', 100, 'g', 38.0, 2.0, 4.0, 1.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Tenderstem Broccoli'))));
  end if;

  -- GF Penne Chicken Pesto (dinner)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('GF Penne Chicken Pesto'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'GF Penne Chicken Pesto', 'dinner', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Gluten Free Penne Pasta (Dry)', 75, 'g', 310.0, 62.0, 6.0, 1.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Gluten Free Penne Pasta (Dry)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken (Cooked)', 130, 'g', 214.5, 0.0, 40.3, 5.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken (Cooked)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Reduced Pesto', 30, 'g', 60.0, 1.8, 1.2, 4.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Reduced Pesto'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cherry Tomatoes', 60, 'g', 15.8, 2.2, 0.8, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cherry Tomatoes'))));
  end if;

  -- Chorizo & Rice (dinner)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Chorizo & Rice'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Chorizo & Rice', 'dinner', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chorizo', 45, 'g', 209.0, 1.0, 10.0, 18.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chorizo'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Rice (Cooked)', 150, 'g', 195.0, 42.0, 4.5, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Rice (Cooked)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Pepper', 1.0, 'unit', 31.0, 15.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Pepper'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Onion', 1.0, 'small', 28.0, 7.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Onion'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chopped Tomatoes', 1.0, 'tin', 94.0, 14.0, 5.0, 1.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chopped Tomatoes'))));
  end if;

  -- GF Oats & Banana (pre_workout)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'pre_workout' and lower(trim(name)) = lower(trim('GF Oats & Banana'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'GF Oats & Banana', 'pre_workout', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Gluten Free Oats', 50, 'g', 195.0, 32.0, 7.5, 4.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Gluten Free Oats'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Banana', 1.0, 'unit', 71.0, 18.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Banana'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Honey', 15, 'g', 45.0, 12.0, 0.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Honey'))));
  end if;

  -- Rice Cakes & Peanut Butter (GF) (pre_workout)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'pre_workout' and lower(trim(name)) = lower(trim('Rice Cakes & Peanut Butter (GF)'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Rice Cakes & Peanut Butter (GF)', 'pre_workout', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Salted Rice Cakes', 2.0, 'unit', 54.0, 12.0, 2.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Salted Rice Cakes'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Peanut Butter', 25, 'g', 160.0, 6.0, 6.0, 13.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Peanut Butter'))));
  end if;

  -- Protein Yogurt & Grapes (pre_workout)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'pre_workout' and lower(trim(name)) = lower(trim('Protein Yogurt & Grapes'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Protein Yogurt & Grapes', 'pre_workout', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Protein Yogurt (Pouch)', 1.0, 'unit', 148.0, 9.0, 25.0, 1.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Protein Yogurt (Pouch)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Grapes', 80, 'g', 58.4, 13.6, 0.8, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Grapes'))));
  end if;

  -- Greek Yogurt & Berries (GF) (evening_snack)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'evening_snack' and lower(trim(name)) = lower(trim('Greek Yogurt & Berries (GF)'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Greek Yogurt & Berries (GF)', 'evening_snack', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, '0% Greek Yogurt', 150, 'g', 81.0, 4.5, 15.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('0% Greek Yogurt'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Berries', 80, 'g', 27.2, 4.0, 0.8, 0.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Berries'))));
  end if;

  -- Cottage Cheese & Cucumber (evening_snack)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'evening_snack' and lower(trim(name)) = lower(trim('Cottage Cheese & Cucumber'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Cottage Cheese & Cucumber', 'evening_snack', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cottage Cheese', 100, 'g', 105.0, 4.0, 10.0, 6.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cottage Cheese'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cucumber', 80, 'g', 12.8, 0.8, 0.8, 0.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cucumber'))));
  end if;

  -- Turkey Slice Roll-ups (evening_snack)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'evening_snack' and lower(trim(name)) = lower(trim('Turkey Slice Roll-ups'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Turkey Slice Roll-ups', 'evening_snack', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Turkey Slice', 4.0, 'slice', 84.0, 0.0, 0.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Turkey Slice'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cucumber', 60, 'g', 9.6, 0.6, 0.6, 0.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cucumber'))));
  end if;

  -- Rice Cakes & Almonds (snack)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'snack' and lower(trim(name)) = lower(trim('Rice Cakes & Almonds'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Rice Cakes & Almonds', 'snack', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Salted Rice Cakes', 2.0, 'unit', 54.0, 12.0, 2.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Salted Rice Cakes'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Almonds', 20, 'g', 127.3, 1.3, 2.7, 11.3, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Almonds'))));
  end if;

  -- Apple & Peanut Butter (GF) (snack)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'snack' and lower(trim(name)) = lower(trim('Apple & Peanut Butter (GF)'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Apple & Peanut Butter (GF)', 'snack', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Apple', 1.0, 'unit', 104.0, 28.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Apple'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Peanut Butter', 20, 'g', 128.0, 4.8, 4.8, 10.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Peanut Butter'))));
  end if;

  -- ============ DAIRY-FREE MEALS ============

  -- Oat Milk Porridge (breakfast)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('Oat Milk Porridge'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Oat Milk Porridge', 'breakfast', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Oats', 60, 'g', 222.0, 39.0, 7.2, 3.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Oats'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Oat Milk', 200, 'ml', 80.0, 12.0, 0.0, 4.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Oat Milk'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Banana', 1.0, 'unit', 71.0, 18.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Banana'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Honey', 15, 'g', 45.0, 12.0, 0.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Honey'))));
  end if;

  -- Bacon, Eggs & Tomato (breakfast)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('Bacon, Eggs & Tomato'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Bacon, Eggs & Tomato', 'breakfast', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Bacon Medallions', 3.0, 'unit', 81.0, 0.0, 15.0, 3.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Bacon Medallions'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Eggs', 2.0, 'large', 158.0, 2.0, 16.0, 10.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Eggs'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Tomato', 1.0, 'unit', 14.0, 2.0, 0.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Tomato'))));
  end if;

  -- Scrambled Eggs & Avocado on Sourdough (breakfast)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('Scrambled Eggs & Avocado on Sourdough'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Scrambled Eggs & Avocado on Sourdough', 'breakfast', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Eggs', 2.0, 'large', 158.0, 2.0, 16.0, 10.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Eggs'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Avacado', 0.5, 'unit', 120.0, 6.5, 1.5, 11.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Avacado'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Wholemeal Sourdough', 2.0, 'slice', 300.0, 58.0, 12.0, 2.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Wholemeal Sourdough'))));
  end if;

  -- Protein Oats (Dairy-Free) (breakfast)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('Protein Oats (Dairy-Free)'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Protein Oats (Dairy-Free)', 'breakfast', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Oats', 50, 'g', 185.0, 32.5, 6.0, 2.5, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Oats'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Oat Milk', 150, 'ml', 60.0, 9.0, 0.0, 3.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Oat Milk'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Isolate Protein Powder', 25, 'g', 91.0, 1.0, 22.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Isolate Protein Powder'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Banana', 1.0, 'unit', 71.0, 18.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Banana'))));
  end if;

  -- Chicken, Avocado & Salad Wrap (lunch)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Chicken, Avocado & Salad Wrap'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Chicken, Avocado & Salad Wrap', 'lunch', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Tortilla Wrap', 1.0, 'unit', 181.0, 37.0, 5.0, 2.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Tortilla Wrap'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken (Cooked)', 130, 'g', 214.5, 0.0, 40.3, 5.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken (Cooked)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Avacado', 0.5, 'unit', 120.0, 6.5, 1.5, 11.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Avacado'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Salad', 60, 'g', 10.2, 1.8, 1.2, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Salad'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Light Mayo', 15, 'g', 40.0, 2.0, 0.0, 4.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Light Mayo'))));
  end if;

  -- Tuna & Sweetcorn Jacket Potato (lunch)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Tuna & Sweetcorn Jacket Potato'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Tuna & Sweetcorn Jacket Potato', 'lunch', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Baking Potato', 220, 'g', 169.4, 39.6, 4.4, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Baking Potato'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Tuna', 1.0, 'tin', 110.0, 0.0, 25.0, 1.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Tuna'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Sweetcorn', 80, 'g', 64.0, 9.0, 2.0, 2.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Sweetcorn'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Light Mayo', 20, 'g', 53.3, 2.7, 0.0, 5.3, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Light Mayo'))));
  end if;

  -- Steak & Salad (Dairy-Free) (lunch)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Steak & Salad (Dairy-Free)'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Steak & Salad (Dairy-Free)', 'lunch', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Sirloin Steak (Raw)', 150, 'g', 301.5, 0.0, 33.0, 19.5, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Sirloin Steak (Raw)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Salad', 80, 'g', 13.6, 2.4, 1.6, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Salad'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cherry Tomatoes', 60, 'g', 15.8, 2.2, 0.8, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cherry Tomatoes'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Olive Oil', 10, 'g', 90.0, 0.0, 0.0, 10.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Olive Oil'))));
  end if;

  -- Chicken Fajita Wrap (lunch)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Chicken Fajita Wrap'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Chicken Fajita Wrap', 'lunch', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Tortilla Wrap', 1.0, 'unit', 181.0, 37.0, 5.0, 2.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Tortilla Wrap'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken (Cooked)', 130, 'g', 214.5, 0.0, 40.3, 5.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken (Cooked)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Fajita Seasoning', 1.0, 'packet', 104.0, 22.0, 2.0, 1.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Fajita Seasoning'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Pepper', 1.0, 'unit', 31.0, 15.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Pepper'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Onion', 1.0, 'small', 28.0, 7.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Onion'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Salsa', 40, 'g', 13.6, 2.8, 0.4, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Salsa'))));
  end if;

  -- Gammon, Rice & Green Beans (lunch)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Gammon, Rice & Green Beans'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Gammon, Rice & Green Beans', 'lunch', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Gammon', 130, 'g', 226.2, 0.0, 23.4, 14.3, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Gammon'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Rice (Cooked)', 150, 'g', 195.0, 42.0, 4.5, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Rice (Cooked)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Green Beans', 100, 'g', 31.0, 7.0, 2.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Green Beans'))));
  end if;

  -- Chicken, Rice & Veg (Dairy-Free) (dinner)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Chicken, Rice & Veg (Dairy-Free)'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Chicken, Rice & Veg (Dairy-Free)', 'dinner', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken (Cooked)', 150, 'g', 247.5, 0.0, 46.5, 6.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken (Cooked)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Rice (Cooked)', 150, 'g', 195.0, 42.0, 4.5, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Rice (Cooked)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Broccoli', 100, 'g', 39.0, 6.0, 0.0, 3.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Broccoli'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Olive Oil', 10, 'g', 90.0, 0.0, 0.0, 10.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Olive Oil'))));
  end if;

  -- Beef Mince Chilli (dinner)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Beef Mince Chilli'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Beef Mince Chilli', 'dinner', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, '5% Fat Mince (Uncooked)', 150, 'g', 193.5, 3.0, 30.0, 7.5, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('5% Fat Mince (Uncooked)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Kidney Beans', 1.0, 'tin', 230.0, 32.0, 16.0, 1.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Kidney Beans'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chopped Tomatoes', 1.0, 'tin', 94.0, 14.0, 5.0, 1.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chopped Tomatoes'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Rice (Cooked)', 150, 'g', 195.0, 42.0, 4.5, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Rice (Cooked)'))));
  end if;

  -- Salmon, Sweet Potato & Greens (dinner)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Salmon, Sweet Potato & Greens'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Salmon, Sweet Potato & Greens', 'dinner', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Salmon Fillet', 130, 'g', 197.0, 0.0, 24.0, 11.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Salmon Fillet'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Sweet Potato (Raw)', 200, 'g', 180.0, 42.0, 4.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Sweet Potato (Raw)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Tenderstem Broccoli', 100, 'g', 38.0, 2.0, 4.0, 1.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Tenderstem Broccoli'))));
  end if;

  -- Chicken Stir Fry (dinner)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Chicken Stir Fry'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Chicken Stir Fry', 'dinner', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken (Cooked)', 150, 'g', 247.5, 0.0, 46.5, 6.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken (Cooked)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Rice (Cooked)', 150, 'g', 195.0, 42.0, 4.5, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Rice (Cooked)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Bean Sprouts', 80, 'g', 37.6, 1.6, 2.4, 2.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Bean Sprouts'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Pepper', 1.0, 'unit', 31.0, 15.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Pepper'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Stir Fry Sauce', 1.0, 'unit', 95.0, 23.0, 0.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Stir Fry Sauce'))));
  end if;

  -- Sausage & Sweet Potato Mash (dinner)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Sausage & Sweet Potato Mash'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Sausage & Sweet Potato Mash', 'dinner', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken Sausages', 3.0, 'unit', 267.0, 9.0, 30.0, 12.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken Sausages'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Sweet Potato (Raw)', 250, 'g', 225.0, 52.5, 5.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Sweet Potato (Raw)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Garden Peas (cooked)', 80, 'g', 59.0, 7.0, 4.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Garden Peas (cooked)'))));
  end if;

  -- Sourdough, Peanut Butter & Banana (pre_workout)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'pre_workout' and lower(trim(name)) = lower(trim('Sourdough, Peanut Butter & Banana'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Sourdough, Peanut Butter & Banana', 'pre_workout', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Wholemeal Sourdough', 2.0, 'slice', 300.0, 58.0, 12.0, 2.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Wholemeal Sourdough'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Peanut Butter', 20, 'g', 128.0, 4.8, 4.8, 10.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Peanut Butter'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Banana', 1.0, 'unit', 71.0, 18.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Banana'))));
  end if;

  -- Oats & Honey (Dairy-Free) (pre_workout)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'pre_workout' and lower(trim(name)) = lower(trim('Oats & Honey (Dairy-Free)'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Oats & Honey (Dairy-Free)', 'pre_workout', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Oats', 50, 'g', 185.0, 32.5, 6.0, 2.5, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Oats'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Oat Milk', 150, 'ml', 60.0, 9.0, 0.0, 3.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Oat Milk'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Honey', 15, 'g', 45.0, 12.0, 0.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Honey'))));
  end if;

  -- Dates & Almonds (pre_workout)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'pre_workout' and lower(trim(name)) = lower(trim('Dates & Almonds'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Dates & Almonds', 'pre_workout', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Medjool Dates', 30, 'g', 87.0, 20.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Medjool Dates'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Almonds', 20, 'g', 127.3, 1.3, 2.7, 11.3, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Almonds'))));
  end if;

  -- Apple & Peanut Butter (Dairy-Free) (evening_snack)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'evening_snack' and lower(trim(name)) = lower(trim('Apple & Peanut Butter (Dairy-Free)'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Apple & Peanut Butter (Dairy-Free)', 'evening_snack', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Apple', 1.0, 'unit', 104.0, 28.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Apple'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Peanut Butter', 20, 'g', 128.0, 4.8, 4.8, 10.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Peanut Butter'))));
  end if;

  -- Dairy-Free Protein Shake (evening_snack)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'evening_snack' and lower(trim(name)) = lower(trim('Dairy-Free Protein Shake'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Dairy-Free Protein Shake', 'evening_snack', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Isolate Protein Powder', 25, 'g', 91.0, 1.0, 22.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Isolate Protein Powder'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Oat Milk', 250, 'ml', 100.0, 15.0, 0.0, 5.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Oat Milk'))));
  end if;

  -- Dark Chocolate & Almonds (evening_snack)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'evening_snack' and lower(trim(name)) = lower(trim('Dark Chocolate & Almonds'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Dark Chocolate & Almonds', 'evening_snack', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, '70% Dark Chocolate', 2.0, 'square', 144.0, 12.0, 2.0, 12.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('70% Dark Chocolate'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Almonds', 15, 'g', 95.5, 1.0, 2.0, 8.5, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Almonds'))));
  end if;

  -- Rice Cakes & Peanut Butter (Dairy-Free) (snack)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'snack' and lower(trim(name)) = lower(trim('Rice Cakes & Peanut Butter (Dairy-Free)'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Rice Cakes & Peanut Butter (Dairy-Free)', 'snack', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Salted Rice Cakes', 2.0, 'unit', 54.0, 12.0, 2.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Salted Rice Cakes'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Peanut Butter', 20, 'g', 128.0, 4.8, 4.8, 10.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Peanut Butter'))));
  end if;

  -- Grapes & Walnuts (snack)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'snack' and lower(trim(name)) = lower(trim('Grapes & Walnuts'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Grapes & Walnuts', 'snack', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Grapes', 100, 'g', 73.0, 17.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Grapes'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Walnuts', 20, 'g', 140.0, 0.7, 2.7, 14.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Walnuts'))));
  end if;

  -- ============ VEGAN MEALS ============

  -- Vegan Oat Porridge with Berries (breakfast)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('Vegan Oat Porridge with Berries'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Vegan Oat Porridge with Berries', 'breakfast', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Oats', 60, 'g', 222.0, 39.0, 7.2, 3.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Oats'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Oat Milk', 200, 'ml', 80.0, 12.0, 0.0, 4.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Oat Milk'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Berries', 80, 'g', 27.2, 4.0, 0.8, 0.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Berries'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chia Seeds', 15, 'g', 66.0, 1.0, 3.0, 5.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chia Seeds'))));
  end if;

  -- Peanut Butter Banana Oats (breakfast)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('Peanut Butter Banana Oats'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Peanut Butter Banana Oats', 'breakfast', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Oats', 60, 'g', 222.0, 39.0, 7.2, 3.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Oats'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Oat Milk', 200, 'ml', 80.0, 12.0, 0.0, 4.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Oat Milk'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Banana', 1.0, 'unit', 71.0, 18.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Banana'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Peanut Butter', 20, 'g', 128.0, 4.8, 4.8, 10.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Peanut Butter'))));
  end if;

  -- Baked Beans on Sourdough (breakfast)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('Baked Beans on Sourdough'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Baked Beans on Sourdough', 'breakfast', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Baked Beans', 1.0, 'tin', 338.0, 65.0, 20.0, 2.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Baked Beans'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Wholemeal Sourdough', 2.0, 'slice', 300.0, 58.0, 12.0, 2.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Wholemeal Sourdough'))));
  end if;

  -- Chickpea & Avocado Salad (lunch)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Chickpea & Avocado Salad'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Chickpea & Avocado Salad', 'lunch', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chickpeas', 1.0, 'tin', 302.0, 38.0, 19.0, 6.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chickpeas'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Avacado', 0.5, 'unit', 120.0, 6.5, 1.5, 11.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Avacado'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cherry Tomatoes', 60, 'g', 15.8, 2.2, 0.8, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cherry Tomatoes'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cucumber', 60, 'g', 9.6, 0.6, 0.6, 0.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cucumber'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Salad', 60, 'g', 10.2, 1.8, 1.2, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Salad'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Olive Oil', 10, 'g', 90.0, 0.0, 0.0, 10.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Olive Oil'))));
  end if;

  -- Kidney Bean Rice Bowl (lunch)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Kidney Bean Rice Bowl'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Kidney Bean Rice Bowl', 'lunch', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Kidney Beans', 1.0, 'tin', 230.0, 32.0, 16.0, 1.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Kidney Beans'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Rice (Cooked)', 150, 'g', 195.0, 42.0, 4.5, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Rice (Cooked)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Salsa', 40, 'g', 13.6, 2.8, 0.4, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Salsa'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Pepper', 1.0, 'unit', 31.0, 15.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Pepper'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Spring Onion', 20, 'g', 5.5, 0.5, 0.5, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Spring Onion'))));
  end if;

  -- Chickpea & Avocado Wrap (lunch)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Chickpea & Avocado Wrap'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Chickpea & Avocado Wrap', 'lunch', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Tortilla Wrap', 1.0, 'unit', 181.0, 37.0, 5.0, 2.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Tortilla Wrap'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chickpeas', 1.0, 'tin', 302.0, 38.0, 19.0, 6.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chickpeas'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Avacado', 0.5, 'unit', 120.0, 6.5, 1.5, 11.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Avacado'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Salad', 60, 'g', 10.2, 1.8, 1.2, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Salad'))));
  end if;

  -- Baked Beans & Sweet Potato Jacket (lunch)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Baked Beans & Sweet Potato Jacket'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Baked Beans & Sweet Potato Jacket', 'lunch', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Sweet Potato (Raw)', 220, 'g', 198.0, 46.2, 4.4, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Sweet Potato (Raw)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Baked Beans', 1.0, 'tin', 338.0, 65.0, 20.0, 2.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Baked Beans'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Spring Onion', 20, 'g', 5.5, 0.5, 0.5, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Spring Onion'))));
  end if;

  -- Kidney Bean Chilli & Rice (dinner)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Kidney Bean Chilli & Rice'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Kidney Bean Chilli & Rice', 'dinner', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Kidney Beans In Chilli Sauce', 1.0, 'tin', 268.0, 39.0, 17.0, 1.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Kidney Beans In Chilli Sauce'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Rice (Cooked)', 150, 'g', 195.0, 42.0, 4.5, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Rice (Cooked)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Pepper', 1.0, 'unit', 31.0, 15.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Pepper'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Onion', 1.0, 'small', 28.0, 7.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Onion'))));
  end if;

  -- Chickpea Tomato Curry & Rice (dinner)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Chickpea Tomato Curry & Rice'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Chickpea Tomato Curry & Rice', 'dinner', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chickpeas', 1.0, 'tin', 302.0, 38.0, 19.0, 6.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chickpeas'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Passata', 200, 'g', 42.4, 6.4, 2.4, 0.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Passata'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Onion', 1.0, 'small', 28.0, 7.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Onion'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Rice (Cooked)', 150, 'g', 195.0, 42.0, 4.5, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Rice (Cooked)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Spinach', 40, 'g', 7.6, 0.0, 1.2, 0.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Spinach'))));
  end if;

  -- Bean & Veg Stir Fry (dinner)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Bean & Veg Stir Fry'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Bean & Veg Stir Fry', 'dinner', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Kidney Beans', 1.0, 'tin', 230.0, 32.0, 16.0, 1.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Kidney Beans'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Bean Sprouts', 80, 'g', 37.6, 1.6, 2.4, 2.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Bean Sprouts'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Pepper', 1.0, 'unit', 31.0, 15.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Pepper'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Rice (Cooked)', 150, 'g', 195.0, 42.0, 4.5, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Rice (Cooked)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Stir Fry Sauce', 1.0, 'unit', 95.0, 23.0, 0.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Stir Fry Sauce'))));
  end if;

  -- Sweet Potato & Chickpea Traybake (dinner)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Sweet Potato & Chickpea Traybake'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Sweet Potato & Chickpea Traybake', 'dinner', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Sweet Potato (Raw)', 220, 'g', 198.0, 46.2, 4.4, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Sweet Potato (Raw)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chickpeas', 1.0, 'tin', 302.0, 38.0, 19.0, 6.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chickpeas'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Pepper', 1.0, 'unit', 31.0, 15.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Pepper'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Olive Oil', 10, 'g', 90.0, 0.0, 0.0, 10.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Olive Oil'))));
  end if;

  -- Banana & Peanut Butter Rice Cakes (Vegan) (pre_workout)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'pre_workout' and lower(trim(name)) = lower(trim('Banana & Peanut Butter Rice Cakes (Vegan)'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Banana & Peanut Butter Rice Cakes (Vegan)', 'pre_workout', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Banana', 1.0, 'unit', 71.0, 18.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Banana'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Peanut Butter', 25, 'g', 160.0, 6.0, 6.0, 13.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Peanut Butter'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Salted Rice Cakes', 2.0, 'unit', 54.0, 12.0, 2.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Salted Rice Cakes'))));
  end if;

  -- Dates & Almonds (Vegan) (pre_workout)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'pre_workout' and lower(trim(name)) = lower(trim('Dates & Almonds (Vegan)'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Dates & Almonds (Vegan)', 'pre_workout', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Medjool Dates', 30, 'g', 87.0, 20.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Medjool Dates'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Almonds', 20, 'g', 127.3, 1.3, 2.7, 11.3, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Almonds'))));
  end if;

  -- Apple & Peanut Butter (Vegan) (evening_snack)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'evening_snack' and lower(trim(name)) = lower(trim('Apple & Peanut Butter (Vegan)'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Apple & Peanut Butter (Vegan)', 'evening_snack', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Apple', 1.0, 'unit', 104.0, 28.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Apple'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Peanut Butter', 20, 'g', 128.0, 4.8, 4.8, 10.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Peanut Butter'))));
  end if;

  -- Dark Chocolate & Walnuts (evening_snack)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'evening_snack' and lower(trim(name)) = lower(trim('Dark Chocolate & Walnuts'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Dark Chocolate & Walnuts', 'evening_snack', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, '70% Dark Chocolate', 2.0, 'square', 144.0, 12.0, 2.0, 12.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('70% Dark Chocolate'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Walnuts', 20, 'g', 140.0, 0.7, 2.7, 14.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Walnuts'))));
  end if;

  -- Rice Cakes & Peanut Butter (Vegan) (snack)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'snack' and lower(trim(name)) = lower(trim('Rice Cakes & Peanut Butter (Vegan)'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Rice Cakes & Peanut Butter (Vegan)', 'snack', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Salted Rice Cakes', 2.0, 'unit', 54.0, 12.0, 2.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Salted Rice Cakes'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Peanut Butter', 20, 'g', 128.0, 4.8, 4.8, 10.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Peanut Butter'))));
  end if;
end $$;

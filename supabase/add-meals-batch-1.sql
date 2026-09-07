-- Adds 4 lunch meals the coach specified individually.
-- Idempotent: skips a meal if one with the same name already exists for this coach
-- in the same category.

do $$
declare
  v_coach_id uuid := (select id from profiles where email = 'annabelatherton@gmail.com');
  v_meal_id uuid;
begin
  -- Chicken, Rice and Veg
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Chicken, Rice and Veg'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Chicken, Rice and Veg', 'lunch', 'Batch cooking this meal canbe SO quick. Just cook the chicken and rice all at once and then microwave the veg from frozen before eating. Cook as many meals as you want and freeze if needed.')
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Rice (uncooked)', 50, 'g', 182.5, 41.4, 4.2, 0.5, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Rice (uncooked)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken (Raw)', 120, 'g', 144.0, 0.0, 27.0, 3.1, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken (Raw)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Country Vegetable Mix (Frozen)', 150, 'g', 69.0, 8.9, 4.2, 1.1, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Country Vegetable Mix (Frozen)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Reduced Sweet Chilli Sauce', 25, 'g', 34.0, 8.4, 0.1, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Reduced Sweet Chilli Sauce'))));
  end if;

  -- Chicken Caesar Salad
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Chicken Caesar Salad'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Chicken Caesar Salad', 'lunch', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken (Raw)', 100, 'g', 120.0, 0.0, 22.5, 2.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken (Raw)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Reduced Caesar Dressing', 15, 'ml', 34.0, 0.8, 0.3, 3.3, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Reduced Caesar Dressing'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Eggs', 1, 'large', 79.0, 0.5, 7.6, 5.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Eggs'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Avacado', 0.5, 'unit', 120.0, 6.4, 1.5, 11.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Avacado'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Lettuce', 100, 'g', 20.0, 3.7, 0.9, 0.1, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Lettuce'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Parmesan', 10, 'g', 48.4, 0.0, 3.9, 3.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Parmesan'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cucumber', 50, 'g', 8.0, 0.6, 0.5, 0.3, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cucumber'))));
  end if;

  -- Roast Ham Sandwich
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Roast Ham Sandwich'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Roast Ham Sandwich', 'lunch', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Gammon', 120, 'g', 208.8, 0.4, 21.6, 13.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Gammon'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Jason''s No.9 Wholemeal Sourdough', 2, 'slice', 210.0, 35.8, 11.2, 1.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Jason''s No.9 Wholemeal Sourdough'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Tomato', 0.5, 'unit', 8.4, 1.4, 0.2, 0.1, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Tomato'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cucumber', 100, 'g', 16.0, 1.1, 0.9, 0.5, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cucumber'))));
  end if;

  -- Naked Borrito
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Naked Borrito'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Naked Borrito', 'lunch', null)
    returning id into v_meal_id;

    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, '5% Fat Mince (uncooked)', 150, 'g', 193.5, 2.7, 30.5, 6.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('5% Fat Mince (uncooked)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Sweet Potato (Raw)', 150, 'g', 135.0, 31.5, 3.0, 0.3, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Sweet Potato (Raw)'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Taco Seasoning', 0.25, 'packet', 12.0, 2.1, 0.2, 0.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Taco Seasoning'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Kidney Beans', 0.25, 'tin', 57.5, 7.9, 4.1, 0.3, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Kidney Beans'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Lettuce', 100, 'g', 20.0, 3.7, 0.9, 0.1, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Lettuce'))));
    insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Avacado', 0.25, 'unit', 60.0, 3.2, 0.8, 5.5, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Avacado'))));
  end if;

end $$;

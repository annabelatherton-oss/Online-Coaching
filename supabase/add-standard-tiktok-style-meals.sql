-- New Standard (no dietary requirement) meals, TikTok/viral-recipe style, matching your
-- existing meals' portion/ingredient conventions. Every breakfast/lunch/dinner here has at
-- least 25g protein and lands within ~10 percentage points of your standard 40/35/25
-- carb/protein/fat split. Built entirely from ingredients already in your library. Uses
-- raw/uncooked weight for chicken, rice, potatoes and pasta throughout (weigh before cooking).
--
-- Safe to run whether or not you already ran an earlier version of this file: each meal's
-- ingredient list is always reset to the (corrected) values below, so if you ran this before
-- and are running it again, your meals get updated to the fixed portions rather than staying
-- on the old ones. Nothing outside this named batch of meals is touched.

do $$
declare
  v_coach_id uuid := (select id from profiles where email = 'annabelatherton@gmail.com');
  v_meal_id uuid;
begin

  -- Renamed from an earlier draft of this batch (was 'High-Protein Cottage Cheese Flatbread') —
  -- rebalance changed it into more of a bowl/parfait, so the name now matches.
  update meals set name = 'High-Protein Cottage Cheese Bowl'
  where coach_id = v_coach_id and category = 'breakfast'
    and lower(trim(name)) = lower(trim('High-Protein Cottage Cheese Flatbread'));

  -- ============ BREAKFAST ============

  -- High-Protein Cottage Cheese Bowl (breakfast)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('High-Protein Cottage Cheese Bowl'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'High-Protein Cottage Cheese Bowl', 'breakfast', 'Spoon the cottage cheese into a bowl. Beat the egg and egg white together, then microwave in a separate mug for 60-90 sec, stirring halfway, until just set, and stir into the cottage cheese (or simply mix in raw pasteurised egg if you prefer not to cook it — do not eat undercooked egg). Drizzle with the honey and top with the berries and granola.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Spoon the cottage cheese into a bowl. Beat the egg and egg white together, then microwave in a separate mug for 60-90 sec, stirring halfway, until just set, and stir into the cottage cheese (or simply mix in raw pasteurised egg if you prefer not to cook it — do not eat undercooked egg). Drizzle with the honey and top with the berries and granola.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cottage Cheese', 180, 'g', 189.0, 7.2, 18.0, 10.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cottage Cheese'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Eggs', 1.0, 'large', 79.0, 1.0, 8.0, 5.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Eggs'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Egg White', 2.0, 'egg', 40.0, 0.0, 8.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Egg White'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Honey', 25, 'g', 75.0, 20.0, 0.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Honey'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Berries', 150, 'g', 51.0, 7.5, 1.5, 1.5, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Berries'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Granola', 15, 'g', 62.7, 10.0, 1.5, 1.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Granola'))));

  -- Protein Baked Oats (breakfast)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('Protein Baked Oats'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Protein Baked Oats', 'breakfast', 'Preheat the oven to 180°C. Mash the banana, then whisk in the egg, milk and peanut butter. Stir in the oats, protein powder and baking powder until just combined. Pour into a small baking dish and bake for 20-25 min until set and golden on top — don''t overbake or the protein powder can make it rubbery.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Preheat the oven to 180°C. Mash the banana, then whisk in the egg, milk and peanut butter. Stir in the oats, protein powder and baking powder until just combined. Pour into a small baking dish and bake for 20-25 min until set and golden on top — don''t overbake or the protein powder can make it rubbery.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Oats', 60, 'g', 222.0, 39.0, 7.2, 3.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Oats'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Isolate Protein Powder', 25, 'g', 91.0, 1.0, 22.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Isolate Protein Powder'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Eggs', 1.0, 'large', 79.0, 1.0, 8.0, 5.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Eggs'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Banana', 1.0, 'unit', 71.0, 18.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Banana'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Peanut Butter', 15, 'g', 96.0, 3.6, 3.6, 7.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Peanut Butter'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Semi-Skimmed Milk', 80, 'ml', 39.2, 4.0, 3.2, 1.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Semi-Skimmed Milk'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Baking Powder', 0.5, 'tsp', 4.0, 1.0, 0.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Baking Powder'))));

  -- Crispy Bacon & Egg Protein Wrap (breakfast)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('Crispy Bacon & Egg Protein Wrap'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Crispy Bacon & Egg Protein Wrap', 'breakfast', 'Grill or fry the bacon for 4-5 min until crisp. Scramble the eggs in a separate pan. Warm the wrap, fill with the scrambled egg, bacon and grated cheese, then roll to close.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Grill or fry the bacon for 4-5 min until crisp. Scramble the eggs in a separate pan. Warm the wrap, fill with the scrambled egg, bacon and grated cheese, then roll to close.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Bacon Medallions', 4.0, 'unit', 108.0, 0.0, 20.0, 4.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Bacon Medallions'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Eggs', 2.0, 'large', 158.0, 2.0, 16.0, 10.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Eggs'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Tortilla Wrap', 1.0, 'unit', 181.0, 37.0, 5.0, 2.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Tortilla Wrap'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cheese (50% Lighter)', 25, 'g', 68.0, 2.0, 7.0, 4.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cheese (50% Lighter)'))));

  -- Protein French Toast (breakfast)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('Protein French Toast'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Protein French Toast', 'breakfast', 'Whisk the eggs and milk together first until fully combined, then whisk in the protein powder a little at a time until completely smooth with no lumps. Dip each slice of sourdough in the mixture, coating both sides well. Fry in a lightly oiled pan over medium (not high) heat for 2-3 min per side until golden — medium heat stops the protein powder catching before the bread warms through. Drizzle with the honey.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Whisk the eggs and milk together first until fully combined, then whisk in the protein powder a little at a time until completely smooth with no lumps. Dip each slice of sourdough in the mixture, coating both sides well. Fry in a lightly oiled pan over medium (not high) heat for 2-3 min per side until golden — medium heat stops the protein powder catching before the bread warms through. Drizzle with the honey.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Wholemeal Sourdough', 2.0, 'slice', 300.0, 58.0, 12.0, 2.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Wholemeal Sourdough'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Eggs', 2.0, 'large', 158.0, 2.0, 16.0, 10.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Eggs'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Isolate Protein Powder', 18, 'g', 65.5, 0.7, 15.8, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Isolate Protein Powder'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Honey', 15, 'g', 45.0, 12.0, 0.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Honey'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Semi-Skimmed Milk', 70, 'ml', 34.3, 3.5, 2.8, 1.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Semi-Skimmed Milk'))));

  -- Salmon & Cream Cheese Bagel (breakfast)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('Salmon & Cream Cheese Bagel'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Salmon & Cream Cheese Bagel', 'breakfast', 'Toast the bagel and split in half. Spread with the cream cheese, top with the smoked salmon and sliced cucumber.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Toast the bagel and split in half. Spread with the cream cheese, top with the smoked salmon and sliced cucumber.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Bagel', 1.0, 'unit', 225.0, 44.0, 8.0, 1.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Bagel'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Salmon Fillet', 130, 'g', 197.0, 0.0, 24.0, 11.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Salmon Fillet'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Light cream Cheese', 30, 'g', 44.0, 2.0, 2.0, 3.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Light cream Cheese'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cucumber', 40, 'g', 6.4, 0.4, 0.4, 0.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cucumber'))));

  -- Chorizo & Egg Hash (breakfast)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('Chorizo & Egg Hash'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Chorizo & Egg Hash', 'breakfast', 'Dice and boil the baby potatoes for 8-10 min until just tender; drain. Fry the diced chorizo for 2 min, add the potatoes and diced pepper and fry for 6-8 min until golden, stirring occasionally. Push to one side, crack in the eggs and egg white, and scramble or fry to your liking.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Dice and boil the baby potatoes for 8-10 min until just tender; drain. Fry the diced chorizo for 2 min, add the potatoes and diced pepper and fry for 6-8 min until golden, stirring occasionally. Push to one side, crack in the eggs and egg white, and scramble or fry to your liking.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chorizo', 20, 'g', 92.9, 0.4, 4.4, 8.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chorizo'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Eggs', 2.0, 'large', 158.0, 2.0, 16.0, 10.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Eggs'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Egg White', 2.0, 'egg', 40.0, 0.0, 8.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Egg White'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Baby Potatoes (Raw)', 240, 'g', 180.0, 40.8, 4.8, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Baby Potatoes (Raw)'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Pepper', 1.0, 'unit', 31.0, 15.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Pepper'))));

  -- ============ LUNCH ============

  -- Marry Me Chicken Orzo (lunch)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Marry Me Chicken Orzo'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Marry Me Chicken Orzo', 'lunch', 'Cook the orzo per pack instructions. Season the raw chicken and pan-fry for 6-7 min per side until cooked through; slice. In the same pan, add the sun-dried tomatoes and crème fraîche, stir in the drained orzo and chicken, then simmer for 2-3 min. Top with grated Parmesan.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Cook the orzo per pack instructions. Season the raw chicken and pan-fry for 6-7 min per side until cooked through; slice. In the same pan, add the sun-dried tomatoes and crème fraîche, stir in the drained orzo and chicken, then simmer for 2-3 min. Top with grated Parmesan.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken (Raw)', 205, 'g', 246.0, 0.0, 47.1, 6.1, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken (Raw)'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Orzo (dry)', 75, 'g', 302.0, 60.0, 12.0, 1.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Orzo (dry)'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Sun-Dried Tomatos', 35, 'g', 66.0, 3.0, 1.0, 5.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Sun-Dried Tomatos'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Parmesan', 15, 'g', 60.5, 0.0, 5.0, 4.5, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Parmesan'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Reduced Crème Fresh', 60, 'ml', 97.8, 2.4, 1.8, 9.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Reduced Crème Fresh'))));

  -- Baked Feta Chicken Pasta (lunch)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Baked Feta Chicken Pasta'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Baked Feta Chicken Pasta', 'lunch', 'Preheat the oven to 200°C. Place the block of feta in an ovenproof dish surrounded by the cherry tomatoes, drizzle with the olive oil and bake for 20-25 min until the tomatoes have burst. Meanwhile season the raw chicken and pan-fry for 6-7 min per side until cooked through; slice. Cook the pasta per pack instructions. Mash the baked feta and tomatoes together into a sauce, then stir through the drained pasta and chicken.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Preheat the oven to 200°C. Place the block of feta in an ovenproof dish surrounded by the cherry tomatoes, drizzle with the olive oil and bake for 20-25 min until the tomatoes have burst. Meanwhile season the raw chicken and pan-fry for 6-7 min per side until cooked through; slice. Cook the pasta per pack instructions. Mash the baked feta and tomatoes together into a sauce, then stir through the drained pasta and chicken.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken (Raw)', 180, 'g', 216.0, 0.0, 41.4, 5.4, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken (Raw)'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Feta Cheese', 40, 'g', 112.0, 0.0, 6.7, 9.3, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Feta Cheese'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cherry Tomatoes', 100, 'g', 26.2, 3.8, 1.2, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cherry Tomatoes'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Penne Pasta (Uncooked)', 65, 'g', 227.5, 48.1, 8.5, 0.7, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Penne Pasta (Uncooked)'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Olive Oil', 10, 'g', 90.0, 0.0, 0.0, 10.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Olive Oil'))));

  -- Chicken Shawarma Rice Bowl (lunch)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Chicken Shawarma Rice Bowl'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Chicken Shawarma Rice Bowl', 'lunch', 'Cook the rice per pack instructions. Slice the raw chicken, toss with the fajita seasoning and pan-fry for 6-7 min until cooked through. Build the bowl with rice, salad and chicken, then drizzle with the mayo.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Cook the rice per pack instructions. Slice the raw chicken, toss with the fajita seasoning and pan-fry for 6-7 min until cooked through. Build the bowl with rice, salad and chicken, then drizzle with the mayo.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken (Raw)', 205, 'g', 246.0, 0.0, 47.1, 6.1, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken (Raw)'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Rice (Uncooked)', 55, 'g', 200.8, 45.7, 4.4, 0.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Rice (Uncooked)'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Salad', 60, 'g', 10.2, 1.8, 1.2, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Salad'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Light Mayo', 15, 'g', 40.0, 2.0, 0.0, 4.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Light Mayo'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Fajita Seasoning', 1.0, 'packet', 104.0, 22.0, 2.0, 1.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Fajita Seasoning'))));

  -- Birria Tacos (lunch)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Birria Tacos'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Birria Tacos', 'lunch', 'Brown the mince in a pan for 5-6 min, breaking it up. Add the chopped tomatoes, taco seasoning and crumbled stock cube with a splash of water, and simmer for 12-15 min until rich and thick. Warm the taco shells per pack instructions. Fill with the beef mixture and grated cheese, and spoon over a little of the cooking liquid to dip.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Brown the mince in a pan for 5-6 min, breaking it up. Add the chopped tomatoes, taco seasoning and crumbled stock cube with a splash of water, and simmer for 12-15 min until rich and thick. Warm the taco shells per pack instructions. Fill with the beef mixture and grated cheese, and spoon over a little of the cooking liquid to dip.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, '5% Fat Mince (Uncooked)', 180, 'g', 232.2, 3.6, 36.0, 9.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('5% Fat Mince (Uncooked)'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Taco Shells', 3.0, 'unit', 177.0, 27.0, 3.0, 6.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Taco Shells'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chopped Tomatoes', 1.0, 'tin', 94.0, 14.0, 5.0, 1.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chopped Tomatoes'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Taco Seasoning', 1.0, 'packet', 48.0, 8.0, 1.0, 1.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Taco Seasoning'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cheese (50% Lighter)', 25, 'g', 68.0, 2.0, 7.0, 4.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cheese (50% Lighter)'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Beef Stock Cube', 0.5, 'unit', 14.0, 1.0, 0.0, 1.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Beef Stock Cube'))));

  -- Crack Chicken Baked Potato (lunch)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Crack Chicken Baked Potato'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Crack Chicken Baked Potato', 'lunch', 'Prick the potato and bake at 200°C for 60-75 min until soft (or microwave then crisp in the oven). Season the raw chicken and pan-fry for 6-7 min per side until cooked through; shred or dice. Grill or fry the bacon until crisp and chop. Split the potato, stir the cream cheese through the flesh, then top with the chicken and bacon.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Prick the potato and bake at 200°C for 60-75 min until soft (or microwave then crisp in the oven). Season the raw chicken and pan-fry for 6-7 min per side until cooked through; shred or dice. Grill or fry the bacon until crisp and chop. Split the potato, stir the cream cheese through the flesh, then top with the chicken and bacon.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken (Raw)', 165, 'g', 198.0, 0.0, 37.9, 4.9, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken (Raw)'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Bacon Medallions', 2.0, 'unit', 54.0, 0.0, 10.0, 2.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Bacon Medallions'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Light cream Cheese', 30, 'g', 44.0, 2.0, 2.0, 3.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Light cream Cheese'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Baking Potato', 280, 'g', 215.6, 50.4, 5.6, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Baking Potato'))));

  -- Tuna Melt Panini (lunch)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Tuna Melt Panini'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Tuna Melt Panini', 'lunch', 'Drain the tuna and mix with the mayo and sweetcorn. Split the panini roll, fill with the tuna mix and grated cheese, then toast in a panini press or under the grill for 3-4 min per side until the cheese has melted and the bread is golden.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Drain the tuna and mix with the mayo and sweetcorn. Split the panini roll, fill with the tuna mix and grated cheese, then toast in a panini press or under the grill for 3-4 min per side until the cheese has melted and the bread is golden.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Tuna', 1.0, 'tin', 110.0, 0.0, 25.0, 1.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Tuna'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Panini', 1.0, 'roll', 250.0, 47.0, 8.0, 3.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Panini'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cheese (50% Lighter)', 25, 'g', 68.0, 2.0, 7.0, 4.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cheese (50% Lighter)'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Light Mayo', 15, 'g', 40.0, 2.0, 0.0, 4.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Light Mayo'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Sweetcorn', 40, 'g', 32.0, 4.5, 1.0, 1.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Sweetcorn'))));

  -- ============ DINNER ============

  -- Honey Garlic Salmon Bites & Rice (dinner)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Honey Garlic Salmon Bites & Rice'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Honey Garlic Salmon Bites & Rice', 'dinner', 'Cook the rice per pack instructions. Cube the salmon fillet and pan-fry for 3-4 min, turning, until nearly cooked through. Mix the honey, peri peri sauce and crushed garlic in a small bowl. Lower the heat, pour the sauce over the salmon and toss for 1-2 min until glazed and caramelised — don''t add it earlier or the honey will burn. Serve over the rice.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Cook the rice per pack instructions. Cube the salmon fillet and pan-fry for 3-4 min, turning, until nearly cooked through. Mix the honey, peri peri sauce and crushed garlic in a small bowl. Lower the heat, pour the sauce over the salmon and toss for 1-2 min until glazed and caramelised — don''t add it earlier or the honey will burn. Serve over the rice.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Salmon Fillet', 160, 'g', 242.5, 0.0, 29.5, 13.5, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Salmon Fillet'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Rice (Uncooked)', 55, 'g', 200.8, 45.7, 4.4, 0.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Rice (Uncooked)'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Honey', 15, 'g', 45.0, 12.0, 0.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Honey'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Nandos Peri Peri Sauce', 20, 'g', 9.0, 0.0, 0.0, 1.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Nandos Peri Peri Sauce'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Garlic', 2.0, 'clove', 10.0, 2.0, 0.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Garlic'))));

  -- BBQ Pulled Chicken & Sweet Potato (dinner)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('BBQ Pulled Chicken & Sweet Potato'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'BBQ Pulled Chicken & Sweet Potato', 'dinner', 'Cut the sweet potato into wedges and roast at 200°C for 25-30 min, turning once. Season the raw chicken and poach or pan-fry until cooked through (poaching in a little water for 12-15 min makes it easiest to shred), then shred with two forks and stir through the BBQ sauce. Serve with the sweet potato wedges, topped with grated cheese.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Cut the sweet potato into wedges and roast at 200°C for 25-30 min, turning once. Season the raw chicken and poach or pan-fry until cooked through (poaching in a little water for 12-15 min makes it easiest to shred), then shred with two forks and stir through the BBQ sauce. Serve with the sweet potato wedges, topped with grated cheese.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chicken (Raw)', 235, 'g', 282.0, 0.0, 54.1, 7.1, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken (Raw)'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Sweet Potato (Raw)', 220, 'g', 198.0, 46.2, 4.4, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Sweet Potato (Raw)'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'BBQ Sauce', 30, 'g', 30.0, 8.0, 0.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('BBQ Sauce'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cheese (50% Lighter)', 25, 'g', 68.0, 2.0, 7.0, 4.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cheese (50% Lighter)'))));

  -- Chicken Meatballs & Spaghetti (dinner)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Chicken Meatballs & Spaghetti'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Chicken Meatballs & Spaghetti', 'dinner', 'Combine the mince, egg and breadcrumbs in a bowl and mix well. Shape into 12-14 small meatballs. Brown in a pan for 5-6 min, turning, until sealed all over. Add the passata, cover and simmer for 12-15 min until cooked through. Meanwhile cook the spaghetti per pack instructions. Serve the meatballs and sauce over the spaghetti, topped with grated Parmesan.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Combine the mince, egg and breadcrumbs in a bowl and mix well. Shape into 12-14 small meatballs. Brown in a pan for 5-6 min, turning, until sealed all over. Add the passata, cover and simmer for 12-15 min until cooked through. Meanwhile cook the spaghetti per pack instructions. Serve the meatballs and sauce over the spaghetti, topped with grated Parmesan.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, '5% Fat Chicken Mince (raw)', 180, 'g', 210.6, 1.8, 34.2, 7.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('5% Fat Chicken Mince (raw)'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Eggs', 1.0, 'large', 79.0, 1.0, 8.0, 5.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Eggs'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Panko Breadcrumbs', 25, 'g', 95.0, 19.0, 2.0, 1.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Panko Breadcrumbs'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Spaghetti (Dry)', 75, 'g', 268.0, 54.0, 10.0, 1.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Spaghetti (Dry)'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Passata', 150, 'g', 31.8, 4.8, 1.8, 0.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Passata'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Parmesan', 15, 'g', 60.5, 0.0, 5.0, 4.5, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Parmesan'))));

  -- Gammon, Egg & Chips (dinner)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Gammon, Egg & Chips'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Gammon, Egg & Chips', 'dinner', 'Chop the baby potatoes into chip-sized pieces, toss with a little oil and roast at 200°C for 25-30 min, turning halfway, until golden. Grill or fry the gammon for 4-5 min per side until cooked through. Fry the egg to your liking. Warm the peas. Serve together.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Chop the baby potatoes into chip-sized pieces, toss with a little oil and roast at 200°C for 25-30 min, turning halfway, until golden. Grill or fry the gammon for 4-5 min per side until cooked through. Fry the egg to your liking. Warm the peas. Serve together.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Gammon', 130, 'g', 226.2, 0.0, 23.4, 14.3, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Gammon'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Eggs', 1.0, 'large', 79.0, 1.0, 8.0, 5.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Eggs'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Baby Potatoes (Raw)', 265, 'g', 198.8, 45.0, 5.3, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Baby Potatoes (Raw)'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Garden Peas (cooked)', 80, 'g', 59.0, 7.0, 4.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Garden Peas (cooked)'))));

  -- ============ PRE_WORKOUT ============

  -- Protein Mug Cake (pre_workout)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'pre_workout' and lower(trim(name)) = lower(trim('Protein Mug Cake'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Protein Mug Cake', 'pre_workout', 'Mash the banana well in a large mug. Whisk in the egg, milk and peanut butter until smooth, then stir in the oats, protein powder and baking powder — mix just until combined, don''t overmix or it''ll turn dense. Microwave on high for 60-90 sec, checking at 60 sec, until risen and just set in the middle (a few seconds too long will make it rubbery, so stop as soon as it''s set). Let it sit for 1 min before eating — it firms up as it cools.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Mash the banana well in a large mug. Whisk in the egg, milk and peanut butter until smooth, then stir in the oats, protein powder and baking powder — mix just until combined, don''t overmix or it''ll turn dense. Microwave on high for 60-90 sec, checking at 60 sec, until risen and just set in the middle (a few seconds too long will make it rubbery, so stop as soon as it''s set). Let it sit for 1 min before eating — it firms up as it cools.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Banana', 1.0, 'unit', 71.0, 18.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Banana'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Oats', 25, 'g', 92.5, 16.2, 3.0, 1.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Oats'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Eggs', 1.0, 'large', 79.0, 1.0, 8.0, 5.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Eggs'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Isolate Protein Powder', 20, 'g', 72.8, 0.8, 17.6, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Isolate Protein Powder'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Peanut Butter', 10, 'g', 64.0, 2.4, 2.4, 5.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Peanut Butter'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Baking Powder', 0.5, 'tsp', 4.0, 1.0, 0.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Baking Powder'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Semi-Skimmed Milk', 30, 'ml', 14.7, 1.5, 1.2, 0.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Semi-Skimmed Milk'))));

  -- Protein Overnight Oats (pre_workout)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'pre_workout' and lower(trim(name)) = lower(trim('Protein Overnight Oats'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Protein Overnight Oats', 'pre_workout', 'Combine the oats, yogurt, protein powder, honey and milk in a jar or container and stir well. Cover and refrigerate overnight (or for at least 3-4 hours) until the oats have softened.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Combine the oats, yogurt, protein powder, honey and milk in a jar or container and stir well. Cover and refrigerate overnight (or for at least 3-4 hours) until the oats have softened.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Oats', 50, 'g', 185.0, 32.5, 6.0, 2.5, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Oats'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, '0% Greek Yogurt', 100, 'g', 54.0, 3.0, 10.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('0% Greek Yogurt'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Isolate Protein Powder', 25, 'g', 91.0, 1.0, 22.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Isolate Protein Powder'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Honey', 15, 'g', 45.0, 12.0, 0.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Honey'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Semi-Skimmed Milk', 100, 'ml', 49.0, 5.0, 4.0, 2.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Semi-Skimmed Milk'))));

  -- ============ EVENING_SNACK ============

  -- Protein Yogurt Bark (evening_snack)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'evening_snack' and lower(trim(name)) = lower(trim('Protein Yogurt Bark'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Protein Yogurt Bark', 'evening_snack', 'Line a tray with baking paper. Mix the yogurt with the granola and half the berries, then spread out on the tray in an even layer. Scatter over the remaining berries and grate or chop the dark chocolate on top. Freeze for at least 3 hours, then break into pieces.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Line a tray with baking paper. Mix the yogurt with the granola and half the berries, then spread out on the tray in an even layer. Scatter over the remaining berries and grate or chop the dark chocolate on top. Freeze for at least 3 hours, then break into pieces.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, '0% Greek Style Yogurt', 200, 'g', 120.0, 16.0, 12.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('0% Greek Style Yogurt'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Berries', 60, 'g', 20.4, 3.0, 0.6, 0.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Berries'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Granola', 20, 'g', 83.6, 13.4, 2.0, 2.2, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Granola'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, '70% Dark Chocolate', 1.0, 'square', 72.0, 6.0, 1.0, 6.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('70% Dark Chocolate'))));

  -- Cottage Cheese & Everything Bagel Style (evening_snack)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'evening_snack' and lower(trim(name)) = lower(trim('Cottage Cheese & Everything Bagel Style'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Cottage Cheese & Everything Bagel Style', 'evening_snack', 'Spoon the cottage cheese into a bowl and top with the sliced cucumber and spring onion.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Spoon the cottage cheese into a bowl and top with the sliced cucumber and spring onion.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cottage Cheese', 150, 'g', 157.5, 6.0, 15.0, 9.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cottage Cheese'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cucumber', 60, 'g', 9.6, 0.6, 0.6, 0.6, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cucumber'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Spring Onion', 20, 'g', 5.5, 0.5, 0.5, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Spring Onion'))));

  -- Protein Hot Chocolate (evening_snack)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'evening_snack' and lower(trim(name)) = lower(trim('Protein Hot Chocolate'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Protein Hot Chocolate', 'evening_snack', 'Warm the milk in a pan or microwave until hot but not boiling. Whisk in the protein powder and chocolate chips until smooth and the chocolate has melted.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Warm the milk in a pan or microwave until hot but not boiling. Whisk in the protein powder and chocolate chips until smooth and the chocolate has melted.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Semi-Skimmed Milk', 200, 'ml', 98.0, 10.0, 8.0, 4.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Semi-Skimmed Milk'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Isolate Protein Powder', 25, 'g', 91.0, 1.0, 22.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Isolate Protein Powder'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Chocolate Chips', 10, 'g', 47.0, 7.0, 1.0, 3.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chocolate Chips'))));

  -- ============ SNACK ============

  -- Protein Nice Cream (snack)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'snack' and lower(trim(name)) = lower(trim('Protein Nice Cream'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Protein Nice Cream', 'snack', 'Freeze the peeled, sliced banana for at least 2 hours (or use frozen banana). Blend with the protein powder and peanut butter in a food processor until smooth and ice-cream-like, scraping down the sides as needed.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Freeze the peeled, sliced banana for at least 2 hours (or use frozen banana). Blend with the protein powder and peanut butter in a food processor until smooth and ice-cream-like, scraping down the sides as needed.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Banana', 1.0, 'unit', 71.0, 18.0, 1.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Banana'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Isolate Protein Powder', 25, 'g', 91.0, 1.0, 22.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Isolate Protein Powder'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Peanut Butter', 15, 'g', 96.0, 3.6, 3.6, 7.8, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Peanut Butter'))));

  -- Turkey & Cheese Roll-Ups (snack)
  select id into v_meal_id from meals where coach_id = v_coach_id and category = 'snack' and lower(trim(name)) = lower(trim('Turkey & Cheese Roll-Ups'));
  if v_meal_id is null then
    insert into meals (coach_id, name, category, instructions)
    values (v_coach_id, 'Turkey & Cheese Roll-Ups', 'snack', 'Lay out the turkey slices, place a piece of cheese on each, then roll up.')
    returning id into v_meal_id;
  else
    update meals set instructions = 'Lay out the turkey slices, place a piece of cheese on each, then roll up.' where id = v_meal_id;
  end if;
  delete from meal_ingredients where meal_id = v_meal_id;
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Turkey Slice', 4.0, 'slice', 84.0, 0.0, 0.0, 0.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Turkey Slice'))));
  insert into meal_ingredients (meal_id, name, quantity_g, unit, calories, carbs_g, protein_g, fat_g, ingredient_id) values (v_meal_id, 'Cheese (50% Lighter)', 25, 'g', 68.0, 2.0, 7.0, 4.0, (select id from ingredients where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cheese (50% Lighter)'))));
end $$;

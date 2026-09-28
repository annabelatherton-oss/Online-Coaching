-- Fixes: Standard clients could still pick vegetarian/vegan meals as swap options.
--
-- These ~50 meals were purpose-built as vegetarian/vegan accommodations (see
-- add-diet-specific-meals.sql, add-vegan-protein-meals.sql, tagged by
-- tag-diet-specific-meals.sql) and were originally meant to appear ONLY in their own diet's
-- plan (per meal-diet-tags-migration.sql's original design). A later migration
-- (auto-tag-all-meals-migration.sql) redefined diet_tags as non-exclusive — informational
-- only — and left `standard_eligible` (the column that actually excludes a meal from Standard)
-- true for any meal that doesn't use a literal meat/dairy-substitute product (Quorn, tofu,
-- tempeh, soy milk). Most of these meals don't use one of those — a "Chickpea & Feta Salad" or
-- "Halloumi & Veg Traybake" is vegetarian without using a substitute ingredient at all — so they
-- were quietly staying visible to Standard clients as swap options.
--
-- Scoped to vegetarian/vegan only, not gluten_free/dairy_free: those meals are ordinary
-- meat/fish dishes (e.g. "Chicken & Rice Salad", "Salmon & New Potatoes") that just also happen
-- to avoid gluten or dairy — nothing about them is unusual for a Standard client, so they stay
-- eligible. Safe to re-run; matches meals by exact (coach_id, category, name), same as
-- tag-diet-specific-meals.sql.
do $$
declare
  v_coach_id uuid := (select id from profiles where email = 'annabelatherton@gmail.com');
begin
  update meals set standard_eligible = false where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('Veggie Scrambled Eggs & Sourdough'));
  update meals set standard_eligible = false where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('Greek Yogurt Protein Pot'));
  update meals set standard_eligible = false where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('Quorn Sausage Breakfast Wrap'));
  update meals set standard_eligible = false where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('Cottage Cheese & Fruit Bowl'));
  update meals set standard_eligible = false where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Halloumi & Veg Wrap'));
  update meals set standard_eligible = false where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Chickpea & Feta Salad'));
  update meals set standard_eligible = false where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Quorn Chicken Caesar Salad'));
  update meals set standard_eligible = false where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Cottage Cheese Baked Potato'));
  update meals set standard_eligible = false where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Kidney Bean & Rice Bowl'));
  update meals set standard_eligible = false where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Quorn Mince Bolognese'));
  update meals set standard_eligible = false where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Halloumi & Veg Traybake'));
  update meals set standard_eligible = false where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Veggie Chilli'));
  update meals set standard_eligible = false where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Quorn Sausage & Mash'));
  update meals set standard_eligible = false where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Chickpea Curry & Rice'));
  update meals set standard_eligible = false where coach_id = v_coach_id and category = 'pre_workout' and lower(trim(name)) = lower(trim('Banana & Peanut Butter Rice Cakes'));
  update meals set standard_eligible = false where coach_id = v_coach_id and category = 'pre_workout' and lower(trim(name)) = lower(trim('Protein Yogurt & Granola'));
  update meals set standard_eligible = false where coach_id = v_coach_id and category = 'pre_workout' and lower(trim(name)) = lower(trim('Sourdough Toast & Honey'));
  update meals set standard_eligible = false where coach_id = v_coach_id and category = 'evening_snack' and lower(trim(name)) = lower(trim('Cottage Cheese & Berries'));
  update meals set standard_eligible = false where coach_id = v_coach_id and category = 'evening_snack' and lower(trim(name)) = lower(trim('Greek Yogurt & Dark Chocolate'));
  update meals set standard_eligible = false where coach_id = v_coach_id and category = 'evening_snack' and lower(trim(name)) = lower(trim('Protein Mousse Pot'));
  update meals set standard_eligible = false where coach_id = v_coach_id and category = 'snack' and lower(trim(name)) = lower(trim('Rice Cakes & Peanut Butter'));
  update meals set standard_eligible = false where coach_id = v_coach_id and category = 'snack' and lower(trim(name)) = lower(trim('Apple & Almonds'));
  update meals set standard_eligible = false where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('Vegan Oat Porridge with Berries'));
  update meals set standard_eligible = false where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('Peanut Butter Banana Oats'));
  update meals set standard_eligible = false where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('Baked Beans on Sourdough'));
  update meals set standard_eligible = false where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Chickpea & Avocado Salad'));
  update meals set standard_eligible = false where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Kidney Bean Rice Bowl'));
  update meals set standard_eligible = false where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Chickpea & Avocado Wrap'));
  update meals set standard_eligible = false where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Baked Beans & Sweet Potato Jacket'));
  update meals set standard_eligible = false where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Kidney Bean Chilli & Rice'));
  update meals set standard_eligible = false where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Chickpea Tomato Curry & Rice'));
  update meals set standard_eligible = false where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Bean & Veg Stir Fry'));
  update meals set standard_eligible = false where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Sweet Potato & Chickpea Traybake'));
  update meals set standard_eligible = false where coach_id = v_coach_id and category = 'pre_workout' and lower(trim(name)) = lower(trim('Banana & Peanut Butter Rice Cakes (Vegan)'));
  update meals set standard_eligible = false where coach_id = v_coach_id and category = 'pre_workout' and lower(trim(name)) = lower(trim('Dates & Almonds (Vegan)'));
  update meals set standard_eligible = false where coach_id = v_coach_id and category = 'evening_snack' and lower(trim(name)) = lower(trim('Apple & Peanut Butter (Vegan)'));
  update meals set standard_eligible = false where coach_id = v_coach_id and category = 'evening_snack' and lower(trim(name)) = lower(trim('Dark Chocolate & Walnuts'));
  update meals set standard_eligible = false where coach_id = v_coach_id and category = 'snack' and lower(trim(name)) = lower(trim('Rice Cakes & Peanut Butter (Vegan)'));
  update meals set standard_eligible = false where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('Tofu Scramble on Sourdough'));
  update meals set standard_eligible = false where coach_id = v_coach_id and category = 'breakfast' and lower(trim(name)) = lower(trim('Soy Milk Protein Oats'));
  update meals set standard_eligible = false where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Tofu & Edamame Salad'));
  update meals set standard_eligible = false where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Hummus & Chickpea Wrap'));
  update meals set standard_eligible = false where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Tempeh & Rice Bowl'));
  update meals set standard_eligible = false where coach_id = v_coach_id and category = 'lunch' and lower(trim(name)) = lower(trim('Red Lentil Dahl & Rice'));
  update meals set standard_eligible = false where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Tofu Stir Fry'));
  update meals set standard_eligible = false where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Vegan Mince Bolognese'));
  update meals set standard_eligible = false where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Tempeh & Sweet Potato Traybake'));
  update meals set standard_eligible = false where coach_id = v_coach_id and category = 'dinner' and lower(trim(name)) = lower(trim('Green Lentil Dahl & Rice'));
  update meals set standard_eligible = false where coach_id = v_coach_id and category = 'pre_workout' and lower(trim(name)) = lower(trim('Vegan Protein Shake'));
  update meals set standard_eligible = false where coach_id = v_coach_id and category = 'pre_workout' and lower(trim(name)) = lower(trim('Hummus & Rice Cakes'));
  update meals set standard_eligible = false where coach_id = v_coach_id and category = 'evening_snack' and lower(trim(name)) = lower(trim('Steamed Edamame'));
  update meals set standard_eligible = false where coach_id = v_coach_id and category = 'evening_snack' and lower(trim(name)) = lower(trim('Vegan Cheese & Rice Cakes'));
  update meals set standard_eligible = false where coach_id = v_coach_id and category = 'snack' and lower(trim(name)) = lower(trim('Hummus & Carrot Sticks'));
end $$;

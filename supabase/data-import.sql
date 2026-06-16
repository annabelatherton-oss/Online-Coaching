-- ============================================================
-- Ingredient Library + Meal Variations Import
-- Run this in Supabase SQL Editor
-- ============================================================

DO $$
DECLARE
  coach_uuid uuid;
  meal_uuid uuid;
BEGIN

  -- Get coach profile id by email
  SELECT id INTO coach_uuid FROM profiles WHERE email = 'annabelatherton@gmail.com' LIMIT 1;
  IF coach_uuid IS NULL THEN
    RAISE EXCEPTION 'Coach profile not found. Make sure you are logged in and your email is annabelatherton@gmail.com';
  END IF;

  -- ── INGREDIENTS ─────────────────────────────────────────

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Baby Potatoes (Raw)', 100.0, 'g', 75.0, 17.1, 1.7, 0.3)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Baby Potatoes (Boiled)', 175.0, 'g', 125.0, 26.1, 3.2, 0.2)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Bagel', 1.0, 'unit', 225.0, 44.3, 7.9, 1.3)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Bagel Thin', 1.0, 'unit', 130.0, 25.0, 5.0, 0.7)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Baking Potato', 100.0, 'g', 77.0, 17.5, 2.0, 0.1)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Banana', 1.0, 'unit', 71.0, 18.3, 0.9, 0.3)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Brioche Bun', 1.0, 'unit', 172.0, 29.9, 5.2, 2.9)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Caramel Rice Cake', 1.0, 'unit', 51.0, 11.3, 0, 0.3)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Chocolate Rice Cake', 1.0, 'unit', 58.0, 11.0, 0.9, 0.9)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Cibatta Roll', 1.0, 'Roll', 239.0, 44.0, 9.5, 2.4)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Cinnamon and Raisin Bagel', 1.0, 'unit', 229.0, 43.5, 7.6, 1.6)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Coco Pops', 100.0, 'g', 387.0, 89.7, 4.7, 2.7)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Corn Flakes', 100.0, 'g', 378.0, 84.0, 7.0, 0.9)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Corn Flour', 25.0, 'g', 94.0, 23.0, 0.2, 0.2)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Cream of Rice', 100.0, 'g', 344.0, 80.0, 6.4, 1.2)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Crumpets', 1.0, 'unit', 97.0, 19.4, 3.3, 0.4)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Crumpet Thin', 1.0, 'unit', 61.0, 12.3, 2.0, 0.3)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Pitted Dates', 1.0, 'date', 20.0, 5.3, 0.2, 0)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Frosties', 100.0, 'g', 390.0, 89.7, 5.3, 0.7)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Gluten Free Bagel', 1.0, 'unit', 174.0, 33.8, 2.5, 1.9)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Gluten Free Bun', 1.0, 'unit', 180.0, 30.5, 2.1, 4.7)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Gluten Free Oats', 100.0, 'g', 390.0, 64.0, 14.9, 8.0)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Gluten Free Penne Pasta (Dry)', 75.0, 'g', 310.0, 61.8, 6.1, 0.9)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Gluten Free Pita', 1.0, 'unit', 131.0, 24.0, 2.7, 1.5)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Gluten Free Spaghetti (Dry)', 75.0, 'g', 278.0, 61.5, 5.3, 0.6)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Gluten Free Wrap', 1.0, 'unit', 138.0, 28.1, 1.8, 2.6)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Gluten Free Wrap (Small)', 1.0, 'unit', 97.0, 21.0, 0.7, 0.8)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Honey', 25.0, 'g', 75.0, 20.0, 0, 0)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Hot Cross Bun - Flavoured', 1.0, 'unit', 209.0, 35.0, 5.0, 5.1)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Hovis Medium Wholemeal', 1.0, 'unit', 64.0, 11.0, 2.9, 0.5)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Jam', 25.0, 'g', 62.0, 15.2, 0.8, 0.8)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Jason''s No.9 Wholemeal Sourdough', 1.0, 'slice', 105.0, 17.9, 5.6, 0.6)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Lasagne Sheet', 1.0, 'unit', 72.0, 14.2, 2.6, 0.3)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Medium Egg Noodles', 1.0, 'unit', 271.0, 54.0, 10.0, 1.0)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Medjool Dates', 30.0, 'g', 87.0, 19.9, 0.7, 0.1)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Semi-Skimmed Milk', 100.0, 'ml', 49.0, 4.8, 3.6, 1.7)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Oat Milk', 100.0, 'ml', 40.0, 5.6, 0.2, 1.5)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Oats', 100.0, 'g', 370.0, 65.0, 12.0, 5.2)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Orzo (dry)', 75.0, 'g', 302.0, 60.2, 11.8, 0.6)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Panini', 1.0, 'roll', 250.0, 46.5, 8.3, 2.5)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Penne Pasta (Cooked)', 100.0, 'g', 157.0, 30.7, 5.8, 0.9)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Penne Pasta (Uncooked)', 100.0, 'g', 350.0, 74.0, 12.5, 1.0)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Plain Flour', 100.0, 'g', 357.0, 73.5, 9.9, 1.7)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Pita Bread', 1.0, 'unit', 145.0, 28.8, 5.4, 0.4)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Rice (Cooked)', 100.0, 'g', 130.0, 28.0, 2.7, 0.3)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Rice (Uncooked)', 100.0, 'g', 365.0, 82.8, 8.4, 0.9)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Rice Crispies', 100.0, 'g', 383.0, 87.7, 6.0, 1.0)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Rice Crispies Squares Bar', 1.0, 'unit', 119.0, 21.0, 0.8, 3.4)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Salt and Vinegar Rice Cake', 1.0, 'unit', 43.0, 8.2, 0.9, 0.6)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Salted Rice Cakes', 1.0, 'unit', 27.0, 5.6, 0.6, 0.2)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Self-Raising Flour', 100.0, 'g', 352.0, 73.0, 9.8, 1.6)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Small Wrap', 1.0, 'unit', 88.0, 15.4, 2.5, 1.6)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Wholemeal Sourdough', 1.0, 'slice', 150.0, 29.0, 6.0, 0.7)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Spaghetti (Dry)', 75.0, 'g', 268.0, 53.6, 9.9, 0.7)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Spaghetti Hoops', 1.0, 'tin', 240.0, 50.0, 3.6, 2.2)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Sweet Potato (Raw)', 100.0, 'g', 90.0, 21.0, 2.0, 0.2)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Sweet Potato Wrap', 1.0, 'unit', 91.0, 22.1, 1.9, 0.9)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Taco Shells', 1.0, 'unit', 59.0, 8.6, 0.8, 2.2)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Tortilla Wrap', 1.0, 'unit', 181.0, 36.8, 4.5, 2.2)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Warbutons NAS Wholemeal', 1.0, 'unit', 55.0, 9.0, 2.5, 0.7)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Weetabix', 1.0, 'unit', 68.0, 14.8, 2.2, 0.4)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Wholemeal Bap', 1.0, 'unit', 123.0, 19.0, 6.5, 1.7)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Wholemeal Rice (Cooked)', 100.0, 'g', 175.0, 35.3, 4.0, 1.5)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'White Bap', 1.0, 'unit', 125.0, 22.7, 5.0, 1.2)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, '0% Greek Style Yogurt', 100.0, 'g', 60.0, 7.7, 6.2, 0.2)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, '0% Greek Yogurt', 100.0, 'g', 54.0, 3.0, 10.3, 0)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, '5% Fat Chicken Mince (raw)', 100.0, 'g', 117.0, 0.5, 18.9, 4.4)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, '5% Fat Mince (Uncooked)', 100.0, 'g', 129.0, 1.8, 20.3, 4.5)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Bacon Medallions', 1.0, 'unit', 27.0, 0.2, 5.2, 0.6)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Baked Beans', 1.0, 'tin', 338.0, 64.9, 20.1, 1.5)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Chicken (Cooked)', 100.0, 'g', 165.0, 0, 31.0, 3.6)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Chicken (Raw)', 100.0, 'g', 120.0, 0, 22.5, 2.6)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Chicken Chipolata Sausages', 1.0, 'unit', 43.0, 2.2, 4.4, 1.7)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Chicken Sausages', 1.0, 'unit', 89.0, 3.3, 10.0, 3.8)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Chickpeas', 1.0, 'tin', 302.0, 37.6, 18.8, 5.6)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Cooked Chicken', 100.0, 'g', 125.0, 0.5, 26.0, 2.0)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Cottage Cheese', 100.0, 'g', 105.0, 4.2, 9.5, 5.6)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Chorizo', 45.0, 'g', 209.0, 0.7, 10.1, 18.1)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Eggs', 1.0, 'large', 79.0, 0.5, 7.6, 5.4)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Egg White', 1.0, 'egg', 20.0, 0.2, 4.0, 0)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Full Fat Greek Style Yogurt', 100.0, 'g', 100.0, 4.2, 3.7, 7.5)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Full fat Greek Yogurt', 100.0, 'g', 132.0, 3.8, 6.1, 10.3)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Gammon', 100.0, 'g', 174.0, 0.3, 18.0, 11.2)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Isolate Protein Powder', 25.0, 'g', 91.0, 0.6, 22.0, 0)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Kidney Beans', 1.0, 'tin', 230.0, 31.6, 16.4, 1.0)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Kidney Beans In Chilli Sauce', 1.0, 'tin', 268.0, 38.8, 17.4, 0.8)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Parmesan', 30.0, 'g', 121.0, 0, 9.7, 8.9)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Protein Mousse', 1.0, 'unit', 153.0, 9.8, 20.3, 3.0)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Protein Yogurt (Pouch)', 1.0, 'unit', 148.0, 8.9, 25.0, 0.9)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Roast Chicken Wafer Thin Slices', 1.0, 'slice', 17.0, 0.1, 3.7, 0.2)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Ready Cooked Chicken', 100.0, 'g', 115.0, 1.5, 23.3, 1.6)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Salmon Fillet', 130.0, 'g', 197.0, 0, 23.8, 11.3)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Sirloin Steak (Raw)', 100.0, 'g', 201.0, 0, 21.6, 12.7)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Sourdough', 1.0, 'slice', 119.0, 43.4, 7.5, 2.8)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, '0% Strawberry Skyr', 100.0, 'g', 69.0, 7.4, 8.8, 0.2)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Tin of Beans', 420.0, 'g', 354.0, 58.0, 19.0, 1.6)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Turkey Slice', 1.0, 'slice', 21.0, 0.2, 0.2, 0.1)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Tuna', 1.0, 'tin', 110.0, 0, 25.4, 1.0)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Wafer Thin Honey Roast Ham', 1.0, 'slice', 14.0, 0.4, 2.4, 0.3)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, '70% Dark Chocolate', 1.0, 'square', 72.0, 5.6, 1.2, 5.5)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, '85% Dark Chocolate (12.5g)', 1.0, 'Square', 75.0, 2.3, 1.5, 6.5)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Almonds', 30.0, 'g', 191.0, 2.1, 3.6, 16.7)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Avacado', 1.0, 'unit', 240.0, 12.8, 3.0, 22.0)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Butter', 10.0, 'g', 67.9, 0.06, 0.05, 7.5)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Chia Seeds', 15.0, 'g', 66.0, 1.2, 2.5, 4.6)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Flaxseeds', 30.0, 'g', 152.0, 1.5, 7.2, 11.4)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Garlic and Herb Butter', 10.0, 'g', 74.0, 0.5, 0.1, 8.0)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Granola', 100.0, 'g', 418.0, 66.9, 9.5, 11.4)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Olive Oil', 5.0, 'g', 45.0, 0, 0, 5.0)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Peanut Butter', 25.0, 'g', 160.0, 5.6, 5.6, 12.8)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Walnuts', 30.0, 'g', 210.0, 1.0, 4.4, 20.6)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Apple', 1.0, 'unit', 104.0, 27.6, 0.5, 0.3)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Aspagargus', 100.0, 'g', 28.0, 2.0, 2.9, 0.6)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Bean Sprouts', 100.0, 'g', 47.0, 2.1, 2.8, 2.5)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Broccoli', 100.0, 'g', 39.0, 6.3, 0.3, 2.6)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Carrot', 1.0, 'unit', 32.0, 6.2, 0.4, 0.3)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Celery', 100.0, 'g', 10.0, 0.9, 0.5, 0.2)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Cherry Tomatoes', 80.0, 'g', 21.0, 2.9, 0.9, 0.4)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Chopped Tomatoes', 1.0, 'tin', 94.0, 14.4, 5.2, 0.8)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Coriander', 100.0, 'g', 33.0, 3.7, 2.1, 0.5)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Crinkle Cut Gherkins', 30.0, 'g', 16.0, 3.0, 0.3, 0.2)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Cucumber', 100.0, 'g', 16.0, 1.1, 0.9, 0.5)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Garden Peas (cooked)', 80.0, 'g', 59.0, 7.0, 4.0, 0.4)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Garlic', 1.0, 'clove', 5.0, 1.0, 0.2, 0)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Grapes', 100.0, 'g', 73.0, 17.0, 0.6, 0.1)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Green Beans', 100.0, 'g', 31.0, 7.0, 1.8, 0.2)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Kiwi', 1.0, 'unit', 25.0, 4.3, 0.4, 0.5)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Leeks', 1.0, 'unit', 27.0, 2.9, 1.6, 0.5)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Lettuce', 100.0, 'g', 20.0, 3.7, 0.9, 0.1)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Onion', 1.0, 'small', 28.0, 6.5, 0.8, 0.1)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Mushrooms', 80.0, 'g', 7.0, 0.2, 0.8, 0.2)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Parsnip', 100.0, 'g', 76.0, 12.5, 1.8, 1.1)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Pepper', 1.0, 'unit', 31.0, 14.8, 1.2, 0.4)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Raspberries', 100.0, 'g', 34.0, 5.1, 0.8, 0.3)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Salad', 100.0, 'g', 17.0, 2.6, 1.6, 0.3)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Spinach', 100.0, 'g', 19.0, 0.2, 2.6, 0.6)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Strawberries', 100.0, 'g', 30.0, 6.0, 0.8, 0.1)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Sun-Dried Tomatos', 35.0, 'g', 66.0, 2.5, 1.1, 5.1)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Spring Onion', 80.0, 'g', 22.0, 2.4, 1.6, 0.4)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Steam Bag', 1.0, 'bag', 53.0, 8.3, 1.1, 0.8)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Sweetcorn', 80.0, 'g', 64.0, 9.3, 2.2, 1.5)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Swede', 100.0, 'g', 29.0, 5.0, 0.7, 0.3)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Tenderstem Broccoli', 100.0, 'g', 38.0, 1.8, 4.3, 0.6)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Tomato', 1.0, 'unit', 14.0, 2.4, 0.4, 0.1)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Baking Powder', 1.0, 'tsp', 8.0, 1.7, 0.2, 0.1)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'BBQ Sauce', 15.0, 'g', 15.0, 3.7, 0.1, 0.1)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Beef Stock Cube', 0.5, 'unit', 14.0, 0.8, 0.4, 0.8)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Berries', 100.0, 'g', 34.0, 4.6, 0.7, 0.6)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Biscoff Spread', 10.0, 'g', 59.0, 5.3, 0.3, 4.0)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Breakfast Topper', 100.0, 'g', 45.0, 8.8, 0.7, 0.3)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Burger Sauce', 15.0, 'g', 56.0, 1.8, 0.1, 5.3)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Cheese (50% Lighter)', 25.0, 'g', 68.0, 1.7, 7.4, 3.5)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Chicken Stock Cube', 0.5, 'unit', 14.0, 1.0, 0.6, 0.8)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Chocolate Chips', 10.0, 'g', 47.0, 6.7, 0.7, 2.7)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Fajita Seasoning', 1.0, 'packet', 104.0, 22.4, 2.4, 0.8)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Feta Cheese', 30.0, 'g', 84.0, 0.3, 5.1, 6.9)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Halloumi', 30.0, 'g', 90.0, 1.1, 6.2, 6.7)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Light cream Cheese', 30.0, 'g', 44.0, 1.5, 2.2, 3.2)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Lightest Philadelphia', 30.0, 'g', 26.0, 1.5, 3.2, 0.8)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Light Soy Sauce', 1.0, 'tbsp', 9.0, 1.8, 0.3, 0.1)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Stir Fry Sauce', 1.0, 'unit', 95.0, 22.5, 0.24, 0.42)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Light Mayo', 15.0, 'g', 40.0, 1.5, 0.1, 3.8)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Lighter than Light Mayo', 15.0, 'g', 15.0, 1.4, 0.5, 0.9)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Mayflower Curry Sauce', 100.0, 'g', 77.0, 8.3, 1.1, 3.8)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Mustard (Wholegrain)', 10.0, 'g', 20.0, 0.8, 1.0, 1.2)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Nandos Sweet Chilli Jam', 15.0, 'g', 21.0, 4.8, 0.1, 0)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Nandos Peri Peri Sauce', 20.0, 'g', 9.0, 0.1, 0.1, 0.7)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Nutella', 10.0, 'g', 53.9, 5.7, 0.6, 3.9)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Oyster Sauce', 1.0, 'tbsp', 18.0, 4.0, 0.2, 0.1)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Reduced Lasagne Sauce', 100.0, 'g', 73.0, 6.9, 0.5, 4.8)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Reduced Crème Fresh', 100.0, 'ml', 163.0, 4.4, 2.7, 15.0)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Reduced Ketchup', 15.0, 'g', 7.0, 1.4, 0.2, 0)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Reduced Pesto', 50.0, 'g', 100.0, 2.5, 1.6, 8.4)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Reduced Red Pesto', 50.0, 'g', 119.0, 4.0, 2.3, 10.0)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Reduced Sweet Chilli Sauce', 25.0, 'g', 34.0, 8.4, 0.1, 0)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Salad Cream (50% Reduced)', 15.0, 'g', 15.0, 1.5, 0.1, 0.9)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Salsa', 100.0, 'g', 34.0, 6.7, 1.4, 0.2)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Red Pesto', 50.0, 'g', 175.0, 2.6, 1.5, 17.1)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Red Wine Stock Pot', 0.5, 'pot', 24.0, 4.6, 0.4, 0.4)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Reduced Gravy Granules', 10.0, 'g', 41.0, 6.5, 0.15, 1.6)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Reggae Reggae Sauce', 10.0, 'g', 13.7, 3.2, 0.1, 0.1)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Spreadable Butter (Lighter)', 100.0, 'g', 516.0, 0.4, 0.3, 57.0)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Taco Seasoning', 1.0, 'packet', 48.0, 8.2, 0.8, 0.8)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Tomato Mascarpone Sauce', 100.0, 'g', 91.0, 6.5, 1.8, 6.0)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Panko Breadcrumbs', 25.0, 'g', 95.0, 19.0, 2.4, 0.8)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Passata', 250.0, 'g', 53.0, 7.9, 3.1, 0.5)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Tomato Puree', 15.0, 'g', 13.0, 2.8, 0.6, 0)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, '50% Plastic Cheese Slice', 1.0, 'unit', 36.0, 2.3, 3.2, 1.6)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Digestive Biscuit', 1.0, 'unit', 71.0, 9.3, 1.0, 3.1)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Kinder Bar', 1.0, 'unit', 71.0, 6.7, 1.1, 4.4)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Dairy Milk Little Bar', 1.0, 'bar', 96.0, 10.0, 1.3, 5.5)
  ON CONFLICT DO NOTHING;

  INSERT INTO ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, carbs_per_serving, protein_per_serving, fat_per_serving)
  VALUES (coach_uuid, 'Twirl Bar (43g)', 1.0, 'bar', 228.0, 26.0, 3.0, 12.6)
  ON CONFLICT DO NOTHING;


  -- ── MEALS ───────────────────────────────────────────────

  -- Overnight Oats (breakfast)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Overnight Oats', 'breakfast', '(Overnight Oats) Maybe bulk prep these for the week and keep them in the fridge
I personally prefer vanilla protein powder in this meal but use whichever you like:)')
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Oats') AND coach_id = coach_uuid LIMIT 1),
    'Oats',
    40.0,
    148.0,
    26.0,
    4.8,
    2.08
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('0% Greek Yogurt') AND coach_id = coach_uuid LIMIT 1),
    '0% Greek Yogurt',
    100.0,
    54.0,
    3.0,
    10.3,
    0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Isolate Protein Powder') AND coach_id = coach_uuid LIMIT 1),
    'Isolate Protein Powder',
    20.0,
    72.8,
    0.48,
    17.6,
    0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Raspberries') AND coach_id = coach_uuid LIMIT 1),
    'Raspberries',
    100.0,
    34.0,
    5.1,
    0.8,
    0.3
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Semi-Skimmed Milk') AND coach_id = coach_uuid LIMIT 1),
    'Semi-Skimmed Milk',
    100.0,
    49.0,
    4.8,
    3.6,
    1.7
  );

  -- Breakfast Bagel (breakfast)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Breakfast Bagel', 'breakfast', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Chicken Chipolata Sausages') AND coach_id = coach_uuid LIMIT 1),
    'Chicken Chipolata Sausages',
    2.0,
    86.0,
    4.4,
    8.8,
    3.4
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Bagel Thin') AND coach_id = coach_uuid LIMIT 1),
    'Bagel Thin',
    1.0,
    130.0,
    25.0,
    5.0,
    0.7
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Eggs') AND coach_id = coach_uuid LIMIT 1),
    'Eggs',
    1.0,
    79.0,
    0.5,
    7.6,
    5.4
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Bacon Medallions') AND coach_id = coach_uuid LIMIT 1),
    'Bacon Medallions',
    2.0,
    54.0,
    0.4,
    10.4,
    1.2
  );

  -- PB&J Bagel (breakfast)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'PB&J Bagel', 'breakfast', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Bagel') AND coach_id = coach_uuid LIMIT 1),
    'Bagel',
    1.0,
    225.0,
    44.3,
    7.9,
    1.3
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Jam') AND coach_id = coach_uuid LIMIT 1),
    'Jam',
    15.0,
    37.2,
    9.12,
    0.48,
    0.48
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Isolate Protein Powder') AND coach_id = coach_uuid LIMIT 1),
    'Isolate Protein Powder',
    25.0,
    91.0,
    0.6,
    22.0,
    0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Peanut Butter') AND coach_id = coach_uuid LIMIT 1),
    'Peanut Butter',
    15.0,
    80.0,
    2.8,
    2.8,
    6.4
  );

  -- Porridge (breakfast)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Porridge', 'breakfast', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Oats') AND coach_id = coach_uuid LIMIT 1),
    'Oats',
    50.0,
    185.0,
    32.5,
    6.0,
    2.6
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Semi-Skimmed Milk') AND coach_id = coach_uuid LIMIT 1),
    'Semi-Skimmed Milk',
    200.0,
    98.0,
    9.6,
    7.2,
    3.4
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Honey') AND coach_id = coach_uuid LIMIT 1),
    'Honey',
    25.0,
    75.0,
    20.0,
    0,
    0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Isolate Protein Powder') AND coach_id = coach_uuid LIMIT 1),
    'Isolate Protein Powder',
    20.0,
    72.8,
    0.48,
    17.6,
    0
  );

  -- Eggs (breakfast)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Eggs', 'breakfast', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Eggs') AND coach_id = coach_uuid LIMIT 1),
    'Eggs',
    3.0,
    237.0,
    1.5,
    22.8,
    16.2
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Bagel Thin') AND coach_id = coach_uuid LIMIT 1),
    'Bagel Thin',
    1.0,
    130.0,
    25.0,
    5.0,
    0.7
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Strawberries') AND coach_id = coach_uuid LIMIT 1),
    'Strawberries',
    100.0,
    30.0,
    6.0,
    0.8,
    0.1
  );

  -- Yogurt (breakfast)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Yogurt', 'breakfast', 'If you’re prepping this meal, don’t put the granola in until you go to eat it or it''ll go soggy…')
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('0% Greek Yogurt') AND coach_id = coach_uuid LIMIT 1),
    '0% Greek Yogurt',
    250.0,
    135.0,
    7.5,
    25.75,
    0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Breakfast Topper') AND coach_id = coach_uuid LIMIT 1),
    'Breakfast Topper',
    60.0,
    27.0,
    5.28,
    0.42,
    0.18
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Honey') AND coach_id = coach_uuid LIMIT 1),
    'Honey',
    15.0,
    45.0,
    12.0,
    0,
    0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Granola') AND coach_id = coach_uuid LIMIT 1),
    'Granola',
    15.0,
    62.7,
    10.04,
    1.43,
    1.71
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('85% Dark Chocolate (12.5g)') AND coach_id = coach_uuid LIMIT 1),
    '85% Dark Chocolate (12.5g)',
    1.0,
    75.0,
    2.3,
    1.5,
    6.5
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Chia Seeds') AND coach_id = coach_uuid LIMIT 1),
    'Chia Seeds',
    15.0,
    66.0,
    1.2,
    2.5,
    4.6
  );

  -- Overnight Weetabix (breakfast)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Overnight Weetabix', 'breakfast', '(Overnight Weetabix) Maybe bulk prep these for the week and keep them in the fridge
I personally prefer vanilla protein powder in this meal but use whichever you like:)')
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Weetabix') AND coach_id = coach_uuid LIMIT 1),
    'Weetabix',
    2.0,
    136.0,
    29.6,
    4.4,
    0.8
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('0% Greek Yogurt') AND coach_id = coach_uuid LIMIT 1),
    '0% Greek Yogurt',
    100.0,
    54.0,
    3.0,
    10.3,
    0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Isolate Protein Powder') AND coach_id = coach_uuid LIMIT 1),
    'Isolate Protein Powder',
    20.0,
    72.8,
    0.48,
    17.6,
    0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Raspberries') AND coach_id = coach_uuid LIMIT 1),
    'Raspberries',
    60.0,
    20.4,
    3.06,
    0.48,
    0.18
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Semi-Skimmed Milk') AND coach_id = coach_uuid LIMIT 1),
    'Semi-Skimmed Milk',
    100.0,
    49.0,
    4.8,
    3.6,
    1.7
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Flaxseeds') AND coach_id = coach_uuid LIMIT 1),
    'Flaxseeds',
    15.0,
    76.0,
    0.75,
    3.6,
    5.7
  );

  -- Avacado on Toast (breakfast)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Avacado on Toast', 'breakfast', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Avacado') AND coach_id = coach_uuid LIMIT 1),
    'Avacado',
    0.5,
    120.0,
    6.4,
    1.5,
    11.0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Bagel') AND coach_id = coach_uuid LIMIT 1),
    'Bagel',
    1.0,
    225.0,
    44.3,
    7.9,
    1.3
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Isolate Protein Powder') AND coach_id = coach_uuid LIMIT 1),
    'Isolate Protein Powder',
    25.0,
    91.0,
    0.6,
    22.0,
    0
  );

  -- Breafkast Wrap (breakfast)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Breafkast Wrap', 'breakfast', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Tortilla Wrap') AND coach_id = coach_uuid LIMIT 1),
    'Tortilla Wrap',
    1.0,
    181.0,
    36.8,
    4.5,
    2.2
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Bacon Medallions') AND coach_id = coach_uuid LIMIT 1),
    'Bacon Medallions',
    2.0,
    54.0,
    0.4,
    10.4,
    1.2
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Chicken Chipolata Sausages') AND coach_id = coach_uuid LIMIT 1),
    'Chicken Chipolata Sausages',
    4.0,
    172.0,
    8.8,
    17.6,
    6.8
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Eggs') AND coach_id = coach_uuid LIMIT 1),
    'Eggs',
    1.0,
    79.0,
    0.5,
    7.6,
    5.4
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Cheese (50% Lighter)') AND coach_id = coach_uuid LIMIT 1),
    'Cheese (50% Lighter)',
    15.0,
    40.8,
    1.02,
    4.44,
    2.1
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('BBQ Sauce') AND coach_id = coach_uuid LIMIT 1),
    'BBQ Sauce',
    15.0,
    15.0,
    3.7,
    0.1,
    0.1
  );

  -- Protein Pancakes (breakfast)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Protein Pancakes', 'breakfast', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Self-Raising Flour') AND coach_id = coach_uuid LIMIT 1),
    'Self-Raising Flour',
    35.0,
    123.2,
    25.55,
    3.43,
    0.56
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Isolate Protein Powder') AND coach_id = coach_uuid LIMIT 1),
    'Isolate Protein Powder',
    20.0,
    72.8,
    0.48,
    17.6,
    0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Baking Powder') AND coach_id = coach_uuid LIMIT 1),
    'Baking Powder',
    1.0,
    8.0,
    1.7,
    0.2,
    0.1
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Eggs') AND coach_id = coach_uuid LIMIT 1),
    'Eggs',
    1.0,
    79.0,
    0.5,
    7.6,
    5.4
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Semi-Skimmed Milk') AND coach_id = coach_uuid LIMIT 1),
    'Semi-Skimmed Milk',
    30.0,
    14.7,
    1.44,
    1.08,
    0.51
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('70% Dark Chocolate') AND coach_id = coach_uuid LIMIT 1),
    '70% Dark Chocolate',
    1.0,
    72.0,
    5.6,
    1.2,
    5.5
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('0% Greek Yogurt') AND coach_id = coach_uuid LIMIT 1),
    '0% Greek Yogurt',
    100.0,
    54.0,
    3.0,
    10.3,
    0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Honey') AND coach_id = coach_uuid LIMIT 1),
    'Honey',
    25.0,
    75.0,
    20.0,
    0,
    0
  );

  -- Chia Pudding (breakfast)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Chia Pudding', 'breakfast', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Oats') AND coach_id = coach_uuid LIMIT 1),
    'Oats',
    50.0,
    185.0,
    32.5,
    6.0,
    2.6
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('0% Greek Yogurt') AND coach_id = coach_uuid LIMIT 1),
    '0% Greek Yogurt',
    150.0,
    81.0,
    4.5,
    15.45,
    0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Chia Seeds') AND coach_id = coach_uuid LIMIT 1),
    'Chia Seeds',
    15.0,
    66.0,
    1.2,
    2.5,
    4.6
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Berries') AND coach_id = coach_uuid LIMIT 1),
    'Berries',
    60.0,
    20.4,
    2.76,
    0.42,
    0.36
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Isolate Protein Powder') AND coach_id = coach_uuid LIMIT 1),
    'Isolate Protein Powder',
    15.0,
    54.6,
    0.36,
    13.2,
    0
  );

  -- Chicken Sausage Bagel (breakfast)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Chicken Sausage Bagel', 'breakfast', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Bagel') AND coach_id = coach_uuid LIMIT 1),
    'Bagel',
    1.0,
    225.0,
    44.3,
    7.9,
    1.3
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Chicken Chipolata Sausages') AND coach_id = coach_uuid LIMIT 1),
    'Chicken Chipolata Sausages',
    4.0,
    172.0,
    8.8,
    17.6,
    6.8
  );

  -- Honey Bagel (breakfast)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Honey Bagel', 'breakfast', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Bagel') AND coach_id = coach_uuid LIMIT 1),
    'Bagel',
    1.0,
    225.0,
    44.3,
    7.9,
    1.3
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Honey') AND coach_id = coach_uuid LIMIT 1),
    'Honey',
    25.0,
    75.0,
    20.0,
    0,
    0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Isolate Protein Powder') AND coach_id = coach_uuid LIMIT 1),
    'Isolate Protein Powder',
    25.0,
    91.0,
    0.6,
    22.0,
    0
  );

  -- Avacado and Egg (breakfast)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Avacado and Egg', 'breakfast', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Wholemeal Sourdough') AND coach_id = coach_uuid LIMIT 1),
    'Wholemeal Sourdough',
    1.0,
    150.0,
    29.0,
    6.0,
    0.7
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Avacado') AND coach_id = coach_uuid LIMIT 1),
    'Avacado',
    0.5,
    120.0,
    6.4,
    1.5,
    11.0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Eggs') AND coach_id = coach_uuid LIMIT 1),
    'Eggs',
    2.0,
    158.0,
    1.0,
    15.2,
    10.8
  );

  -- Oats and Water (breakfast)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Oats and Water', 'breakfast', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Oats') AND coach_id = coach_uuid LIMIT 1),
    'Oats',
    60.0,
    222.0,
    39.0,
    7.2,
    3.12
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Isolate Protein Powder') AND coach_id = coach_uuid LIMIT 1),
    'Isolate Protein Powder',
    25.0,
    91.0,
    0.6,
    22.0,
    0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Berries') AND coach_id = coach_uuid LIMIT 1),
    'Berries',
    100.0,
    34.0,
    4.6,
    0.7,
    0.6
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Chia Seeds') AND coach_id = coach_uuid LIMIT 1),
    'Chia Seeds',
    15.0,
    66.0,
    1.2,
    2.5,
    4.6
  );

  -- Sticky Toffee Baked Oats (breakfast)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Sticky Toffee Baked Oats', 'breakfast', 'Use Baking Powder, Vanilla Extract, Cinnamon Powder and Salt')
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Medjool Dates') AND coach_id = coach_uuid LIMIT 1),
    'Medjool Dates',
    25.0,
    69.6,
    15.92,
    0.56,
    0.08
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Banana') AND coach_id = coach_uuid LIMIT 1),
    'Banana',
    0.5,
    35.5,
    9.15,
    0.45,
    0.15
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Oats') AND coach_id = coach_uuid LIMIT 1),
    'Oats',
    60.0,
    222.0,
    39.0,
    7.2,
    3.12
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Semi-Skimmed Milk') AND coach_id = coach_uuid LIMIT 1),
    'Semi-Skimmed Milk',
    100.0,
    49.0,
    4.8,
    3.6,
    1.7
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Isolate Protein Powder') AND coach_id = coach_uuid LIMIT 1),
    'Isolate Protein Powder',
    20.0,
    72.8,
    0.48,
    17.6,
    0
  );

  -- Carrot Cake Baked Oats (breakfast)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Carrot Cake Baked Oats', 'breakfast', 'Carrot Cake Baked Oats
Include Cinnamon + Baking Powder
Yog and Light Cream Cheese for the topping')
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Oats') AND coach_id = coach_uuid LIMIT 1),
    'Oats',
    50.0,
    185.0,
    32.5,
    6.0,
    2.6
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Carrot') AND coach_id = coach_uuid LIMIT 1),
    'Carrot',
    0.25,
    8.0,
    1.55,
    0.1,
    0.07
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Isolate Protein Powder') AND coach_id = coach_uuid LIMIT 1),
    'Isolate Protein Powder',
    15.0,
    54.6,
    0.36,
    13.2,
    0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Oat Milk') AND coach_id = coach_uuid LIMIT 1),
    'Oat Milk',
    50.0,
    20.0,
    2.8,
    0.1,
    0.75
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Walnuts') AND coach_id = coach_uuid LIMIT 1),
    'Walnuts',
    10.0,
    52.5,
    0.25,
    1.1,
    5.15
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Banana') AND coach_id = coach_uuid LIMIT 1),
    'Banana',
    0.5,
    35.5,
    9.15,
    0.45,
    0.15
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Honey') AND coach_id = coach_uuid LIMIT 1),
    'Honey',
    10.0,
    30.0,
    8.0,
    0,
    0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('0% Greek Yogurt') AND coach_id = coach_uuid LIMIT 1),
    '0% Greek Yogurt',
    100.0,
    54.0,
    3.0,
    10.3,
    0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Light Cream Cheese') AND coach_id = coach_uuid LIMIT 1),
    'Light Cream Cheese',
    30.0,
    44.0,
    1.5,
    2.2,
    3.2
  );

  -- Flavoured Hot Cross Bun (breakfast)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Flavoured Hot Cross Bun', 'breakfast', 'Hot Cross Bun (Easter Plan Edition) <3
Try to aim for one that''s not over around 210 calories but have fun with this!')
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Hot Cross Bun - Flavoured') AND coach_id = coach_uuid LIMIT 1),
    'Hot Cross Bun - Flavoured',
    1.0,
    209.0,
    35.0,
    5.0,
    5.1
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Isolate Protein Powder') AND coach_id = coach_uuid LIMIT 1),
    'Isolate Protein Powder',
    25.0,
    91.0,
    0.6,
    22.0,
    0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Butter') AND coach_id = coach_uuid LIMIT 1),
    'Butter',
    15.0,
    101.85,
    0.09,
    0.08,
    11.25
  );

  -- Apple Crumble Baked Oats (breakfast)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Apple Crumble Baked Oats', 'breakfast', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Oats') AND coach_id = coach_uuid LIMIT 1),
    'Oats',
    40.0,
    148.0,
    26.0,
    4.8,
    2.08
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Apple') AND coach_id = coach_uuid LIMIT 1),
    'Apple',
    1.0,
    104.0,
    27.6,
    0.5,
    0.3
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Baking Powder') AND coach_id = coach_uuid LIMIT 1),
    'Baking Powder',
    1.0,
    8.0,
    1.7,
    0.2,
    0.1
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Eggs') AND coach_id = coach_uuid LIMIT 1),
    'Eggs',
    1.0,
    79.0,
    0.5,
    7.6,
    5.4
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Semi-Skimmed Milk') AND coach_id = coach_uuid LIMIT 1),
    'Semi-Skimmed Milk',
    100.0,
    49.0,
    4.8,
    3.6,
    1.7
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Isolate Protein Powder') AND coach_id = coach_uuid LIMIT 1),
    'Isolate Protein Powder',
    15.0,
    54.6,
    0.36,
    13.2,
    0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Honey') AND coach_id = coach_uuid LIMIT 1),
    'Honey',
    15.0,
    45.0,
    12.0,
    0,
    0
  );

  -- Jam Crumpets (breakfast)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Jam Crumpets', 'breakfast', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Crumpet Thin') AND coach_id = coach_uuid LIMIT 1),
    'Crumpet Thin',
    4.0,
    244.0,
    49.2,
    8.0,
    1.2
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Jam') AND coach_id = coach_uuid LIMIT 1),
    'Jam',
    25.0,
    62.0,
    15.2,
    0.8,
    0.8
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Isolate Protein Powder') AND coach_id = coach_uuid LIMIT 1),
    'Isolate Protein Powder',
    25.0,
    91.0,
    0.6,
    22.0,
    0
  );

  -- Sausages, Beans and Toast (breakfast)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Sausages, Beans and Toast', 'breakfast', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Chicken Chipolata Sausages') AND coach_id = coach_uuid LIMIT 1),
    'Chicken Chipolata Sausages',
    3.0,
    129.0,
    6.6,
    13.2,
    5.1
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Baked Beans') AND coach_id = coach_uuid LIMIT 1),
    'Baked Beans',
    0.5,
    169.0,
    32.45,
    10.05,
    0.75
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Jason''s No.9 Wholemeal Sourdough') AND coach_id = coach_uuid LIMIT 1),
    'Jason''s No.9 Wholemeal Sourdough',
    1.0,
    105.0,
    17.9,
    5.6,
    0.6
  );

  -- Biscoff Overnight Oats (breakfast)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Biscoff Overnight Oats', 'breakfast', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Oats') AND coach_id = coach_uuid LIMIT 1),
    'Oats',
    50.0,
    185.0,
    32.5,
    6.0,
    2.6
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('0% Greek Yogurt') AND coach_id = coach_uuid LIMIT 1),
    '0% Greek Yogurt',
    100.0,
    54.0,
    3.0,
    10.3,
    0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Isolate Protein Powder') AND coach_id = coach_uuid LIMIT 1),
    'Isolate Protein Powder',
    20.0,
    72.8,
    0.48,
    17.6,
    0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Biscoff Spread') AND coach_id = coach_uuid LIMIT 1),
    'Biscoff Spread',
    10.0,
    59.0,
    5.3,
    0.3,
    4.0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Semi-Skimmed Milk') AND coach_id = coach_uuid LIMIT 1),
    'Semi-Skimmed Milk',
    100.0,
    49.0,
    4.8,
    3.6,
    1.7
  );

  -- Strawberry Cheesecake Overnight Oats (breakfast)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Strawberry Cheesecake Overnight Oats', 'breakfast', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Oats') AND coach_id = coach_uuid LIMIT 1),
    'Oats',
    40.0,
    148.0,
    26.0,
    4.8,
    2.08
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Isolate Protein Powder') AND coach_id = coach_uuid LIMIT 1),
    'Isolate Protein Powder',
    20.0,
    72.8,
    0.48,
    17.6,
    0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('0% Strawberry Skyr') AND coach_id = coach_uuid LIMIT 1),
    '0% Strawberry Skyr',
    100.0,
    69.0,
    7.4,
    8.8,
    0.2
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Honey') AND coach_id = coach_uuid LIMIT 1),
    'Honey',
    5.0,
    15.0,
    4.0,
    0,
    0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Strawberries') AND coach_id = coach_uuid LIMIT 1),
    'Strawberries',
    60.0,
    18.0,
    3.6,
    0.48,
    0.06
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Digestive Biscuit') AND coach_id = coach_uuid LIMIT 1),
    'Digestive Biscuit',
    1.0,
    71.0,
    9.3,
    1.0,
    3.1
  );

  -- Sweet Chilli Chicken Wrap (lunch)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Sweet Chilli Chicken Wrap', 'lunch', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Tortilla Wrap') AND coach_id = coach_uuid LIMIT 1),
    'Tortilla Wrap',
    1.0,
    181.0,
    36.8,
    4.5,
    2.2
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Chicken (Raw)') AND coach_id = coach_uuid LIMIT 1),
    'Chicken (Raw)',
    150.0,
    180.0,
    0,
    33.75,
    3.9
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Lettuce') AND coach_id = coach_uuid LIMIT 1),
    'Lettuce',
    75.0,
    15.0,
    2.78,
    0.68,
    0.08
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Reduced Sweet Chilli Sauce') AND coach_id = coach_uuid LIMIT 1),
    'Reduced Sweet Chilli Sauce',
    25.0,
    34.0,
    8.4,
    0.1,
    0
  );

  -- Chicken Sausage Bagel (lunch)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Chicken Sausage Bagel', 'lunch', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Chicken Chipolata Sausages') AND coach_id = coach_uuid LIMIT 1),
    'Chicken Chipolata Sausages',
    4.0,
    172.0,
    8.8,
    17.6,
    6.8
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Bagel Thin') AND coach_id = coach_uuid LIMIT 1),
    'Bagel Thin',
    1.0,
    130.0,
    25.0,
    5.0,
    0.7
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Eggs') AND coach_id = coach_uuid LIMIT 1),
    'Eggs',
    1.0,
    79.0,
    0.5,
    7.6,
    5.4
  );

  -- Avacado and Egg on Sourdough (lunch)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Avacado and Egg on Sourdough', 'lunch', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Jason''s No.9 Wholemeal Sourdough') AND coach_id = coach_uuid LIMIT 1),
    'Jason''s No.9 Wholemeal Sourdough',
    1.0,
    105.0,
    17.9,
    5.6,
    0.6
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Eggs') AND coach_id = coach_uuid LIMIT 1),
    'Eggs',
    2.0,
    158.0,
    1.0,
    15.2,
    10.8
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Avacado') AND coach_id = coach_uuid LIMIT 1),
    'Avacado',
    0.5,
    120.0,
    6.4,
    1.5,
    11.0
  );

  -- Chicken and Rice (lunch)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Chicken and Rice', 'lunch', 'You can use any veg substitution')
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Chicken (Raw)') AND coach_id = coach_uuid LIMIT 1),
    'Chicken (Raw)',
    130.0,
    156.0,
    0,
    29.25,
    3.38
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Rice (uncooked)') AND coach_id = coach_uuid LIMIT 1),
    'Rice (uncooked)',
    50.0,
    182.5,
    41.4,
    4.2,
    0.45
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Broccoli') AND coach_id = coach_uuid LIMIT 1),
    'Broccoli',
    100.0,
    39.0,
    6.3,
    0.3,
    2.6
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Olive Oil') AND coach_id = coach_uuid LIMIT 1),
    'Olive Oil',
    5.0,
    45.0,
    0,
    0,
    5.0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Reduced Sweet Chilli Sauce') AND coach_id = coach_uuid LIMIT 1),
    'Reduced Sweet Chilli Sauce',
    25.0,
    34.0,
    8.4,
    0.1,
    0
  );

  -- Tuna Pasta (lunch)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Tuna Pasta', 'lunch', 'Vag can be swapped/use different variations')
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Penne Pasta (uncooked)') AND coach_id = coach_uuid LIMIT 1),
    'Penne Pasta (uncooked)',
    60.0,
    210.0,
    44.4,
    7.5,
    0.6
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Tuna') AND coach_id = coach_uuid LIMIT 1),
    'Tuna',
    1.0,
    110.0,
    0,
    25.4,
    1.0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Onion') AND coach_id = coach_uuid LIMIT 1),
    'Onion',
    0.5,
    14.0,
    3.25,
    0.4,
    0.05
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Sweetcorn') AND coach_id = coach_uuid LIMIT 1),
    'Sweetcorn',
    30.0,
    25.6,
    3.72,
    0.88,
    0.6
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Light Mayo') AND coach_id = coach_uuid LIMIT 1),
    'Light Mayo',
    25.0,
    64.0,
    2.4,
    0.16,
    6.08
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Cucumber') AND coach_id = coach_uuid LIMIT 1),
    'Cucumber',
    50.0,
    8.0,
    0.55,
    0.45,
    0.25
  );

  -- Chicken and Sweet Potato (lunch)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Chicken and Sweet Potato', 'lunch', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Chicken (Raw)') AND coach_id = coach_uuid LIMIT 1),
    'Chicken (Raw)',
    130.0,
    156.0,
    0,
    29.25,
    3.38
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Sweet Potato (Raw)') AND coach_id = coach_uuid LIMIT 1),
    'Sweet Potato (Raw)',
    150.0,
    135.0,
    31.5,
    3.0,
    0.3
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Lettuce') AND coach_id = coach_uuid LIMIT 1),
    'Lettuce',
    100.0,
    20.0,
    3.7,
    0.9,
    0.1
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Light Soy Sauce') AND coach_id = coach_uuid LIMIT 1),
    'Light Soy Sauce',
    7.0,
    63.0,
    12.6,
    2.1,
    0.7
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Olive Oil') AND coach_id = coach_uuid LIMIT 1),
    'Olive Oil',
    5.0,
    45.0,
    0,
    0,
    5.0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Broccoli') AND coach_id = coach_uuid LIMIT 1),
    'Broccoli',
    50.0,
    19.5,
    3.15,
    0.15,
    1.3
  );

  -- Beans on Toast (lunch)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Beans on Toast', 'lunch', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Hovis Medium Wholemeal') AND coach_id = coach_uuid LIMIT 1),
    'Hovis Medium Wholemeal',
    2.0,
    128.0,
    22.0,
    5.8,
    1.0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Tin of Beans') AND coach_id = coach_uuid LIMIT 1),
    'Tin of Beans',
    210.0,
    177.0,
    29.0,
    9.5,
    0.8
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Cheese (50% Lighter)') AND coach_id = coach_uuid LIMIT 1),
    'Cheese (50% Lighter)',
    20.0,
    54.4,
    1.36,
    5.92,
    2.8
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Spreadable Butter (Lighter)') AND coach_id = coach_uuid LIMIT 1),
    'Spreadable Butter (Lighter)',
    10.0,
    51.6,
    0.04,
    0.03,
    5.7
  );

  -- Tuna Bun (lunch)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Tuna Bun', 'lunch', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Tuna') AND coach_id = coach_uuid LIMIT 1),
    'Tuna',
    1.0,
    110.0,
    0,
    25.4,
    1.0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Wholemeal Bap') AND coach_id = coach_uuid LIMIT 1),
    'Wholemeal Bap',
    1.0,
    123.0,
    19.0,
    6.5,
    1.7
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Onion') AND coach_id = coach_uuid LIMIT 1),
    'Onion',
    1.0,
    28.0,
    6.5,
    0.8,
    0.1
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Caramel Rice Cake') AND coach_id = coach_uuid LIMIT 1),
    'Caramel Rice Cake',
    2.0,
    102.0,
    22.6,
    0,
    0.6
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Lighter than Light Mayo') AND coach_id = coach_uuid LIMIT 1),
    'Lighter than Light Mayo',
    15.0,
    15.0,
    1.4,
    0.5,
    0.9
  );

  -- Tuna Pita (lunch)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Tuna Pita', 'lunch', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Tuna') AND coach_id = coach_uuid LIMIT 1),
    'Tuna',
    1.0,
    110.0,
    0,
    25.4,
    1.0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Pita Bread') AND coach_id = coach_uuid LIMIT 1),
    'Pita Bread',
    1.0,
    145.0,
    28.8,
    5.4,
    0.4
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Onion') AND coach_id = coach_uuid LIMIT 1),
    'Onion',
    1.0,
    28.0,
    6.5,
    0.8,
    0.1
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Lighter than Light Mayo') AND coach_id = coach_uuid LIMIT 1),
    'Lighter than Light Mayo',
    15.0,
    15.0,
    1.4,
    0.5,
    0.9
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Caramel Rice Cake') AND coach_id = coach_uuid LIMIT 1),
    'Caramel Rice Cake',
    1.0,
    51.0,
    11.3,
    0,
    0.3
  );

  -- Avacado Bagel (lunch)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Avacado Bagel', 'lunch', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Bagel') AND coach_id = coach_uuid LIMIT 1),
    'Bagel',
    1.0,
    225.0,
    44.3,
    7.9,
    1.3
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Avacado') AND coach_id = coach_uuid LIMIT 1),
    'Avacado',
    0.5,
    120.0,
    6.4,
    1.5,
    11.0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Eggs') AND coach_id = coach_uuid LIMIT 1),
    'Eggs',
    2.0,
    158.0,
    1.0,
    15.2,
    10.8
  );

  -- Tuna Bagel (lunch)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Tuna Bagel', 'lunch', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Tuna') AND coach_id = coach_uuid LIMIT 1),
    'Tuna',
    1.0,
    110.0,
    0,
    25.4,
    1.0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Bagel Thin') AND coach_id = coach_uuid LIMIT 1),
    'Bagel Thin',
    1.0,
    130.0,
    25.0,
    5.0,
    0.7
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Cheese (50% Lighter)') AND coach_id = coach_uuid LIMIT 1),
    'Cheese (50% Lighter)',
    25.0,
    68.0,
    1.7,
    7.4,
    3.5
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Onion') AND coach_id = coach_uuid LIMIT 1),
    'Onion',
    1.0,
    28.0,
    6.5,
    0.8,
    0.1
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Lighter than Light Mayo') AND coach_id = coach_uuid LIMIT 1),
    'Lighter than Light Mayo',
    15.0,
    15.0,
    1.4,
    0.5,
    0.9
  );

  -- Chicken and Egg Fried Rice (lunch)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Chicken and Egg Fried Rice', 'lunch', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Rice (uncooked)') AND coach_id = coach_uuid LIMIT 1),
    'Rice (uncooked)',
    50.0,
    182.5,
    41.4,
    4.2,
    0.45
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Chicken (raw)') AND coach_id = coach_uuid LIMIT 1),
    'Chicken (raw)',
    110.0,
    132.0,
    0,
    24.75,
    2.86
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Eggs') AND coach_id = coach_uuid LIMIT 1),
    'Eggs',
    1.0,
    79.0,
    0.5,
    7.6,
    5.4
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Light Soy Sauce') AND coach_id = coach_uuid LIMIT 1),
    'Light Soy Sauce',
    5.0,
    45.0,
    9.0,
    1.5,
    0.5
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Garden Peas (cooked)') AND coach_id = coach_uuid LIMIT 1),
    'Garden Peas (cooked)',
    80.0,
    59.0,
    7.0,
    4.0,
    0.4
  );

  -- BBQ Chicken Wrap (lunch)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'BBQ Chicken Wrap', 'lunch', 'Garlic, Smoked Paprika, Salt')
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Ready Cooked Chicken') AND coach_id = coach_uuid LIMIT 1),
    'Ready Cooked Chicken',
    100.0,
    115.0,
    1.5,
    23.3,
    1.6
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Tortilla Wrap') AND coach_id = coach_uuid LIMIT 1),
    'Tortilla Wrap',
    1.0,
    181.0,
    36.8,
    4.5,
    2.2
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Pepper') AND coach_id = coach_uuid LIMIT 1),
    'Pepper',
    0.5,
    15.5,
    7.4,
    0.6,
    0.2
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Onion') AND coach_id = coach_uuid LIMIT 1),
    'Onion',
    0.5,
    14.0,
    3.25,
    0.4,
    0.05
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('BBQ Sauce') AND coach_id = coach_uuid LIMIT 1),
    'BBQ Sauce',
    25.0,
    22.5,
    5.55,
    0.15,
    0.15
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Lighter than Light Mayo') AND coach_id = coach_uuid LIMIT 1),
    'Lighter than Light Mayo',
    15.0,
    15.0,
    1.4,
    0.5,
    0.9
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Lettuce') AND coach_id = coach_uuid LIMIT 1),
    'Lettuce',
    40.0,
    8.0,
    1.48,
    0.36,
    0.04
  );

  -- Jerk Chicken Cheese Burger (lunch)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Jerk Chicken Cheese Burger', 'lunch', 'Chicken Seasoning, Smoked Paprika, Salt')
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Chicken (Raw)') AND coach_id = coach_uuid LIMIT 1),
    'Chicken (Raw)',
    120.0,
    144.0,
    0,
    27.0,
    3.12
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('White Bap') AND coach_id = coach_uuid LIMIT 1),
    'White Bap',
    1.0,
    125.0,
    22.7,
    5.0,
    1.2
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Reggae Reggae Sauce') AND coach_id = coach_uuid LIMIT 1),
    'Reggae Reggae Sauce',
    20.0,
    27.4,
    6.4,
    0.2,
    0.2
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Cheese (50% Lighter)') AND coach_id = coach_uuid LIMIT 1),
    'Cheese (50% Lighter)',
    15.0,
    40.8,
    1.02,
    4.44,
    2.1
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Lettuce') AND coach_id = coach_uuid LIMIT 1),
    'Lettuce',
    30.0,
    6.0,
    1.11,
    0.27,
    0.03
  );

  -- Club Sandwich (lunch)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Club Sandwich', 'lunch', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Warbutons NAS Wholemeal') AND coach_id = coach_uuid LIMIT 1),
    'Warbutons NAS Wholemeal',
    2.0,
    110.0,
    18.0,
    5.0,
    1.4
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Cooked Chicken') AND coach_id = coach_uuid LIMIT 1),
    'Cooked Chicken',
    70.0,
    87.5,
    0.35,
    18.2,
    1.4
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Bacon Medallions') AND coach_id = coach_uuid LIMIT 1),
    'Bacon Medallions',
    2.0,
    54.0,
    0.4,
    10.4,
    1.2
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Lettuce') AND coach_id = coach_uuid LIMIT 1),
    'Lettuce',
    30.0,
    6.0,
    1.11,
    0.27,
    0.03
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Tomato') AND coach_id = coach_uuid LIMIT 1),
    'Tomato',
    1.0,
    14.0,
    2.4,
    0.4,
    0.1
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Light Mayo') AND coach_id = coach_uuid LIMIT 1),
    'Light Mayo',
    10.0,
    26.0,
    0.98,
    0.07,
    2.47
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Butter') AND coach_id = coach_uuid LIMIT 1),
    'Butter',
    10.0,
    67.9,
    0.06,
    0.05,
    7.5
  );

  -- Cheesy Chicken and Chorizo Wrap (lunch)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Cheesy Chicken and Chorizo Wrap', 'lunch', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Tortilla Wrap') AND coach_id = coach_uuid LIMIT 1),
    'Tortilla Wrap',
    1.0,
    181.0,
    36.8,
    4.5,
    2.2
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Cooked Chicken') AND coach_id = coach_uuid LIMIT 1),
    'Cooked Chicken',
    100.0,
    125.0,
    0.5,
    26.0,
    2.0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Chorizo') AND coach_id = coach_uuid LIMIT 1),
    'Chorizo',
    15.0,
    62.7,
    0.21,
    3.03,
    5.43
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Onion') AND coach_id = coach_uuid LIMIT 1),
    'Onion',
    0.5,
    14.0,
    3.25,
    0.4,
    0.05
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Tomato Puree') AND coach_id = coach_uuid LIMIT 1),
    'Tomato Puree',
    15.0,
    13.0,
    2.8,
    0.6,
    0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Cheese (50% Lighter)') AND coach_id = coach_uuid LIMIT 1),
    'Cheese (50% Lighter)',
    20.0,
    54.4,
    1.36,
    5.92,
    2.8
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Lightest Philadelphia') AND coach_id = coach_uuid LIMIT 1),
    'Lightest Philadelphia',
    30.0,
    26.0,
    1.5,
    3.2,
    0.8
  );

  -- Cheese Burger Wrap (lunch)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Cheese Burger Wrap', 'lunch', 'Salt, Pepper, Paprika, Onion Salt')
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Tortilla Wrap') AND coach_id = coach_uuid LIMIT 1),
    'Tortilla Wrap',
    1.0,
    181.0,
    36.8,
    4.5,
    2.2
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('5% Fat Mince (uncooked)') AND coach_id = coach_uuid LIMIT 1),
    '5% Fat Mince (uncooked)',
    120.0,
    154.8,
    2.16,
    24.36,
    5.4
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Onion') AND coach_id = coach_uuid LIMIT 1),
    'Onion',
    0.5,
    14.0,
    3.25,
    0.4,
    0.05
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Tomato Puree') AND coach_id = coach_uuid LIMIT 1),
    'Tomato Puree',
    15.0,
    13.0,
    2.8,
    0.6,
    0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Cheese (50% Lighter)') AND coach_id = coach_uuid LIMIT 1),
    'Cheese (50% Lighter)',
    20.0,
    54.4,
    1.36,
    5.92,
    2.8
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Burger Sauce') AND coach_id = coach_uuid LIMIT 1),
    'Burger Sauce',
    15.0,
    56.0,
    1.8,
    0.1,
    5.3
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Lettuce') AND coach_id = coach_uuid LIMIT 1),
    'Lettuce',
    50.0,
    10.0,
    1.85,
    0.45,
    0.05
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Reduced Ketchup') AND coach_id = coach_uuid LIMIT 1),
    'Reduced Ketchup',
    15.0,
    7.0,
    1.4,
    0.2,
    0
  );

  -- Tuna and Cheese Bagel (lunch)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Tuna and Cheese Bagel', 'lunch', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Bagel') AND coach_id = coach_uuid LIMIT 1),
    'Bagel',
    1.0,
    225.0,
    44.3,
    7.9,
    1.3
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Tuna') AND coach_id = coach_uuid LIMIT 1),
    'Tuna',
    1.0,
    110.0,
    0,
    25.4,
    1.0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Cheese (50% Lighter)') AND coach_id = coach_uuid LIMIT 1),
    'Cheese (50% Lighter)',
    25.0,
    68.0,
    1.7,
    7.4,
    3.5
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Onion') AND coach_id = coach_uuid LIMIT 1),
    'Onion',
    0.5,
    14.0,
    3.25,
    0.4,
    0.05
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Lighter than Light Mayo') AND coach_id = coach_uuid LIMIT 1),
    'Lighter than Light Mayo',
    15.0,
    15.0,
    1.4,
    0.5,
    0.9
  );

  -- Nandos Chicken Cibatta (lunch)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Nandos Chicken Cibatta', 'lunch', 'Nandos Chicken Cibatta')
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Cibatta Roll') AND coach_id = coach_uuid LIMIT 1),
    'Cibatta Roll',
    1.0,
    239.0,
    44.0,
    9.5,
    2.4
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Chicken (Raw)') AND coach_id = coach_uuid LIMIT 1),
    'Chicken (Raw)',
    120.0,
    144.0,
    0,
    27.0,
    3.12
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Pepper') AND coach_id = coach_uuid LIMIT 1),
    'Pepper',
    0.5,
    15.5,
    7.4,
    0.6,
    0.2
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Onion') AND coach_id = coach_uuid LIMIT 1),
    'Onion',
    0.5,
    14.0,
    3.25,
    0.4,
    0.05
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Nandos Peri Peri Sauce') AND coach_id = coach_uuid LIMIT 1),
    'Nandos Peri Peri Sauce',
    15.0,
    7.2,
    0.08,
    0.08,
    0.56
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Cheese (50% Lighter)') AND coach_id = coach_uuid LIMIT 1),
    'Cheese (50% Lighter)',
    10.0,
    27.2,
    0.68,
    2.96,
    1.4
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Nandos Sweet Chilli Jam') AND coach_id = coach_uuid LIMIT 1),
    'Nandos Sweet Chilli Jam',
    15.0,
    21.0,
    4.8,
    0.1,
    0
  );

  -- Scrambled Egg Bagel (lunch)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Scrambled Egg Bagel', 'lunch', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Eggs') AND coach_id = coach_uuid LIMIT 1),
    'Eggs',
    3.0,
    237.0,
    1.5,
    22.8,
    16.2
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Bagel Thin') AND coach_id = coach_uuid LIMIT 1),
    'Bagel Thin',
    1.0,
    130.0,
    25.0,
    5.0,
    0.7
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Strawberries') AND coach_id = coach_uuid LIMIT 1),
    'Strawberries',
    100.0,
    30.0,
    6.0,
    0.8,
    0.1
  );

  -- Roasted Tomato Pepper and Feta Soup (lunch)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Roasted Tomato Pepper and Feta Soup', 'lunch', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Tomato') AND coach_id = coach_uuid LIMIT 1),
    'Tomato',
    1.0,
    14.0,
    2.4,
    0.4,
    0.1
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Pepper') AND coach_id = coach_uuid LIMIT 1),
    'Pepper',
    0.5,
    15.5,
    7.4,
    0.6,
    0.2
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Onion') AND coach_id = coach_uuid LIMIT 1),
    'Onion',
    0.5,
    14.0,
    3.25,
    0.4,
    0.05
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Garlic') AND coach_id = coach_uuid LIMIT 1),
    'Garlic',
    0.5,
    2.5,
    0.5,
    0.1,
    0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Feta Cheese') AND coach_id = coach_uuid LIMIT 1),
    'Feta Cheese',
    10.0,
    25.2,
    0.09,
    1.53,
    2.07
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Chicken Stock Cube') AND coach_id = coach_uuid LIMIT 1),
    'Chicken Stock Cube',
    0.25,
    7.0,
    0.5,
    0.3,
    0.4
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Cottage Cheese') AND coach_id = coach_uuid LIMIT 1),
    'Cottage Cheese',
    20.0,
    21.0,
    0.84,
    1.9,
    1.12
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Tomato Puree') AND coach_id = coach_uuid LIMIT 1),
    'Tomato Puree',
    10.0,
    6.5,
    1.4,
    0.3,
    0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Chickpeas') AND coach_id = coach_uuid LIMIT 1),
    'Chickpeas',
    0.75,
    226.5,
    28.2,
    14.1,
    4.2
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Warbutons NAS Wholemeal') AND coach_id = coach_uuid LIMIT 1),
    'Warbutons NAS Wholemeal',
    2.0,
    110.0,
    18.0,
    5.0,
    1.4
  );

  -- Chicken and Veg Soup (lunch)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Chicken and Veg Soup', 'lunch', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Chicken (Raw)') AND coach_id = coach_uuid LIMIT 1),
    'Chicken (Raw)',
    100.0,
    120.0,
    0,
    22.5,
    2.6
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Baking Potato') AND coach_id = coach_uuid LIMIT 1),
    'Baking Potato',
    50.0,
    38.5,
    8.75,
    1.0,
    0.05
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Swede') AND coach_id = coach_uuid LIMIT 1),
    'Swede',
    50.0,
    14.5,
    2.5,
    0.35,
    0.15
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Parsnip') AND coach_id = coach_uuid LIMIT 1),
    'Parsnip',
    50.0,
    38.0,
    6.25,
    0.9,
    0.55
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Carrot') AND coach_id = coach_uuid LIMIT 1),
    'Carrot',
    1.0,
    32.0,
    6.2,
    0.4,
    0.3
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Leeks') AND coach_id = coach_uuid LIMIT 1),
    'Leeks',
    1.0,
    27.0,
    2.9,
    1.6,
    0.5
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Chicken Stock Cube') AND coach_id = coach_uuid LIMIT 1),
    'Chicken Stock Cube',
    0.25,
    7.0,
    0.5,
    0.3,
    0.4
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Warbutons NAS Wholemeal') AND coach_id = coach_uuid LIMIT 1),
    'Warbutons NAS Wholemeal',
    2.0,
    110.0,
    18.0,
    5.0,
    1.4
  );

  -- Chicken Salad (lunch)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Chicken Salad', 'lunch', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Chicken (Raw)') AND coach_id = coach_uuid LIMIT 1),
    'Chicken (Raw)',
    130.0,
    156.0,
    0,
    29.25,
    3.38
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Lettuce') AND coach_id = coach_uuid LIMIT 1),
    'Lettuce',
    100.0,
    20.0,
    3.7,
    0.9,
    0.1
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Pepper') AND coach_id = coach_uuid LIMIT 1),
    'Pepper',
    0.5,
    15.5,
    7.4,
    0.6,
    0.2
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Cucumber') AND coach_id = coach_uuid LIMIT 1),
    'Cucumber',
    50.0,
    8.0,
    0.55,
    0.45,
    0.25
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Cherry Tomatoes') AND coach_id = coach_uuid LIMIT 1),
    'Cherry Tomatoes',
    40.0,
    10.5,
    1.45,
    0.45,
    0.2
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Cottage Cheese') AND coach_id = coach_uuid LIMIT 1),
    'Cottage Cheese',
    50.0,
    52.5,
    2.1,
    4.75,
    2.8
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Penne Pasta (uncooked)') AND coach_id = coach_uuid LIMIT 1),
    'Penne Pasta (uncooked)',
    40.0,
    140.0,
    29.6,
    5.0,
    0.4
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Olive Oil') AND coach_id = coach_uuid LIMIT 1),
    'Olive Oil',
    5.0,
    45.0,
    0,
    0,
    5.0
  );

  -- Crispy Chilli Chicken Wrap (lunch)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Crispy Chilli Chicken Wrap', 'lunch', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Chicken (Raw)') AND coach_id = coach_uuid LIMIT 1),
    'Chicken (Raw)',
    120.0,
    144.0,
    0,
    27.0,
    3.12
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Tortilla Wrap') AND coach_id = coach_uuid LIMIT 1),
    'Tortilla Wrap',
    1.0,
    181.0,
    36.8,
    4.5,
    2.2
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Egg White') AND coach_id = coach_uuid LIMIT 1),
    'Egg White',
    1.0,
    20.0,
    0.2,
    4.0,
    0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Panko Breadcrumbs') AND coach_id = coach_uuid LIMIT 1),
    'Panko Breadcrumbs',
    10.0,
    38.0,
    7.6,
    0.96,
    0.32
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Lettuce') AND coach_id = coach_uuid LIMIT 1),
    'Lettuce',
    60.0,
    12.0,
    2.22,
    0.54,
    0.06
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Reduced Sweet Chilli Sauce') AND coach_id = coach_uuid LIMIT 1),
    'Reduced Sweet Chilli Sauce',
    15.0,
    20.4,
    5.04,
    0.06,
    0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Light Soy Sauce') AND coach_id = coach_uuid LIMIT 1),
    'Light Soy Sauce',
    2.0,
    18.0,
    3.6,
    0.6,
    0.2
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Honey') AND coach_id = coach_uuid LIMIT 1),
    'Honey',
    5.0,
    15.0,
    4.0,
    0,
    0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Light Mayo') AND coach_id = coach_uuid LIMIT 1),
    'Light Mayo',
    10.0,
    24.0,
    0.9,
    0.06,
    2.28
  );

  -- BBQ Chicken Pita (lunch)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'BBQ Chicken Pita', 'lunch', 'Mix chicken, pepper, onion, spinach, BBQ sauce and cottage cheese in a pan
Toast pita, open up and place in lettuce, then stuff with mix from pan')
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Pita Bread') AND coach_id = coach_uuid LIMIT 1),
    'Pita Bread',
    1.0,
    145.0,
    28.8,
    5.4,
    0.4
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Cooked Chicken') AND coach_id = coach_uuid LIMIT 1),
    'Cooked Chicken',
    100.0,
    125.0,
    0.5,
    26.0,
    2.0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Pepper') AND coach_id = coach_uuid LIMIT 1),
    'Pepper',
    0.5,
    15.5,
    7.4,
    0.6,
    0.2
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Onion') AND coach_id = coach_uuid LIMIT 1),
    'Onion',
    0.5,
    14.0,
    3.25,
    0.4,
    0.05
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Lettuce') AND coach_id = coach_uuid LIMIT 1),
    'Lettuce',
    30.0,
    6.0,
    1.11,
    0.27,
    0.03
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Spinach') AND coach_id = coach_uuid LIMIT 1),
    'Spinach',
    50.0,
    9.5,
    0.1,
    1.3,
    0.3
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('BBQ Sauce') AND coach_id = coach_uuid LIMIT 1),
    'BBQ Sauce',
    15.0,
    15.0,
    3.7,
    0.1,
    0.1
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Cottage Cheese') AND coach_id = coach_uuid LIMIT 1),
    'Cottage Cheese',
    50.0,
    52.5,
    2.1,
    4.75,
    2.8
  );

  -- Pesto Chicken Cibatta (lunch)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Pesto Chicken Cibatta', 'lunch', 'Mixing chicken with pesto makes this so much easier
Add paprika')
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Cibatta Roll') AND coach_id = coach_uuid LIMIT 1),
    'Cibatta Roll',
    1.0,
    239.0,
    44.0,
    9.5,
    2.4
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Cooked Chicken') AND coach_id = coach_uuid LIMIT 1),
    'Cooked Chicken',
    80.0,
    100.0,
    0.4,
    20.8,
    1.6
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Reduced Pesto') AND coach_id = coach_uuid LIMIT 1),
    'Reduced Pesto',
    25.0,
    50.0,
    1.25,
    0.8,
    4.2
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Cucumber') AND coach_id = coach_uuid LIMIT 1),
    'Cucumber',
    40.0,
    6.4,
    0.44,
    0.36,
    0.2
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Lettuce') AND coach_id = coach_uuid LIMIT 1),
    'Lettuce',
    40.0,
    8.0,
    1.48,
    0.36,
    0.04
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Cottage Cheese') AND coach_id = coach_uuid LIMIT 1),
    'Cottage Cheese',
    30.0,
    31.5,
    1.26,
    2.85,
    1.68
  );

  -- Pesto Chicken Pannini (lunch)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Pesto Chicken Pannini', 'lunch', 'Add paprika')
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Panini') AND coach_id = coach_uuid LIMIT 1),
    'Panini',
    1.0,
    250.0,
    46.5,
    8.3,
    2.5
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Cooked Chicken') AND coach_id = coach_uuid LIMIT 1),
    'Cooked Chicken',
    80.0,
    100.0,
    0.4,
    20.8,
    1.6
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Reduced Pesto') AND coach_id = coach_uuid LIMIT 1),
    'Reduced Pesto',
    25.0,
    50.0,
    1.25,
    0.8,
    4.2
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Cucumber') AND coach_id = coach_uuid LIMIT 1),
    'Cucumber',
    40.0,
    6.4,
    0.44,
    0.36,
    0.2
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Lettuce') AND coach_id = coach_uuid LIMIT 1),
    'Lettuce',
    40.0,
    8.0,
    1.48,
    0.36,
    0.04
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Cottage Cheese') AND coach_id = coach_uuid LIMIT 1),
    'Cottage Cheese',
    30.0,
    31.5,
    1.26,
    2.85,
    1.68
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Cheese (50% Lighter)') AND coach_id = coach_uuid LIMIT 1),
    'Cheese (50% Lighter)',
    10.0,
    27.2,
    0.68,
    2.96,
    1.4
  );

  -- Egg Salad Bun (lunch)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Egg Salad Bun', 'lunch', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Eggs') AND coach_id = coach_uuid LIMIT 1),
    'Eggs',
    3.0,
    237.0,
    1.5,
    22.8,
    16.2
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Wholemeal Bap') AND coach_id = coach_uuid LIMIT 1),
    'Wholemeal Bap',
    1.0,
    123.0,
    19.0,
    6.5,
    1.7
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Lettuce') AND coach_id = coach_uuid LIMIT 1),
    'Lettuce',
    50.0,
    10.0,
    1.85,
    0.45,
    0.05
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Salad Cream (50% Reduced)') AND coach_id = coach_uuid LIMIT 1),
    'Salad Cream (50% Reduced)',
    15.0,
    15.0,
    1.5,
    0.1,
    0.9
  );

  -- Ham and Cheese Toastie (lunch)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Ham and Cheese Toastie', 'lunch', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Jason''s No.9 Wholemeal Sourdough') AND coach_id = coach_uuid LIMIT 1),
    'Jason''s No.9 Wholemeal Sourdough',
    2.0,
    210.0,
    35.8,
    11.2,
    1.2
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Wafer Thin Honey Roast Ham') AND coach_id = coach_uuid LIMIT 1),
    'Wafer Thin Honey Roast Ham',
    6.0,
    84.0,
    2.4,
    14.4,
    1.8
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Cheese (50% Lighter)') AND coach_id = coach_uuid LIMIT 1),
    'Cheese (50% Lighter)',
    25.0,
    68.0,
    1.7,
    7.4,
    3.5
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Butter') AND coach_id = coach_uuid LIMIT 1),
    'Butter',
    10.0,
    67.9,
    0.06,
    0.05,
    7.5
  );

  -- Chicken Pita (lunch)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Chicken Pita', 'lunch', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Pita Bread') AND coach_id = coach_uuid LIMIT 1),
    'Pita Bread',
    1.0,
    145.0,
    28.8,
    5.4,
    0.4
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Chicken (Raw)') AND coach_id = coach_uuid LIMIT 1),
    'Chicken (Raw)',
    120.0,
    144.0,
    0,
    27.0,
    3.12
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Lettuce') AND coach_id = coach_uuid LIMIT 1),
    'Lettuce',
    30.0,
    6.0,
    1.11,
    0.27,
    0.03
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Reduced Sweet Chilli Sauce') AND coach_id = coach_uuid LIMIT 1),
    'Reduced Sweet Chilli Sauce',
    20.0,
    27.2,
    6.72,
    0.08,
    0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Onion') AND coach_id = coach_uuid LIMIT 1),
    'Onion',
    0.5,
    14.0,
    3.25,
    0.4,
    0.05
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Pepper') AND coach_id = coach_uuid LIMIT 1),
    'Pepper',
    0.5,
    15.5,
    7.4,
    0.6,
    0.2
  );

  -- Rice Cakes (pre_workout)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Rice Cakes', 'pre_workout', '(Overnight oats) Maybe bulk prep these for the week and keep them in the fridge
I personally prefer vanilla protein powder in this meal but use whichever you like:)')
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Caramel Rice Cake') AND coach_id = coach_uuid LIMIT 1),
    'Caramel Rice Cake',
    2.0,
    102.0,
    22.6,
    0,
    0.6
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Banana') AND coach_id = coach_uuid LIMIT 1),
    'Banana',
    0.75,
    53.25,
    13.73,
    0.68,
    0.22
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Isolate Protein Powder') AND coach_id = coach_uuid LIMIT 1),
    'Isolate Protein Powder',
    25.0,
    91.0,
    0.6,
    22.0,
    0
  );

  -- Cereal (pre_workout)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Cereal', 'pre_workout', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Coco Pops') AND coach_id = coach_uuid LIMIT 1),
    'Coco Pops',
    50.0,
    193.5,
    44.85,
    2.35,
    1.35
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Semi-Skimmed Milk') AND coach_id = coach_uuid LIMIT 1),
    'Semi-Skimmed Milk',
    200.0,
    98.0,
    9.6,
    7.2,
    3.4
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Isolate Protein Powder') AND coach_id = coach_uuid LIMIT 1),
    'Isolate Protein Powder',
    20.0,
    72.8,
    0.48,
    17.6,
    0
  );

  -- Oats (pre_workout)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Oats', 'pre_workout', 'Make using water, let the oats cooldown slightly and then put the protein powder in (to prevent it de-naturing the protein). I like using chocolate protein powder for this')
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Oats') AND coach_id = coach_uuid LIMIT 1),
    'Oats',
    50.0,
    185.0,
    32.5,
    6.0,
    2.6
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Isolate Protein Powder') AND coach_id = coach_uuid LIMIT 1),
    'Isolate Protein Powder',
    20.0,
    72.8,
    0.48,
    17.6,
    0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Strawberries') AND coach_id = coach_uuid LIMIT 1),
    'Strawberries',
    60.0,
    18.0,
    3.6,
    0.48,
    0.06
  );

  -- Bagel Thin (pre_workout)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Bagel Thin', 'pre_workout', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Bagel Thin') AND coach_id = coach_uuid LIMIT 1),
    'Bagel Thin',
    1.0,
    130.0,
    25.0,
    5.0,
    0.7
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Jam') AND coach_id = coach_uuid LIMIT 1),
    'Jam',
    25.0,
    62.0,
    15.2,
    0.8,
    0.8
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Isolate Protein Powder') AND coach_id = coach_uuid LIMIT 1),
    'Isolate Protein Powder',
    20.0,
    72.8,
    0.48,
    17.6,
    0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Strawberries') AND coach_id = coach_uuid LIMIT 1),
    'Strawberries',
    60.0,
    18.0,
    3.6,
    0.48,
    0.06
  );

  -- Sweet Potato (pre_workout)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Sweet Potato', 'pre_workout', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Sweet Potato (Raw)') AND coach_id = coach_uuid LIMIT 1),
    'Sweet Potato (Raw)',
    150.0,
    135.0,
    31.5,
    3.0,
    0.3
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Chicken (Raw)') AND coach_id = coach_uuid LIMIT 1),
    'Chicken (Raw)',
    100.0,
    120.0,
    0,
    22.5,
    2.6
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Olive Oil') AND coach_id = coach_uuid LIMIT 1),
    'Olive Oil',
    5.0,
    45.0,
    0,
    0,
    5.0
  );

  -- Crumpets (pre_workout)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Crumpets', 'pre_workout', '(Overnight oats) Maybe bulk prep these for the week and keep them in the fridge
I personally prefer vanilla protein powder in this meal but use whichever you like:)')
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Crumpets') AND coach_id = coach_uuid LIMIT 1),
    'Crumpets',
    2.0,
    194.0,
    38.8,
    6.6,
    0.8
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Jam') AND coach_id = coach_uuid LIMIT 1),
    'Jam',
    20.0,
    49.6,
    12.16,
    0.64,
    0.64
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Isolate Protein Powder') AND coach_id = coach_uuid LIMIT 1),
    'Isolate Protein Powder',
    20.0,
    72.8,
    0.48,
    17.6,
    0
  );

  -- Squares Bar and Banana (pre_workout)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Squares Bar and Banana', 'pre_workout', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Rice Crispies Squares Bar') AND coach_id = coach_uuid LIMIT 1),
    'Rice Crispies Squares Bar',
    1.0,
    119.0,
    21.0,
    0.8,
    3.4
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Banana') AND coach_id = coach_uuid LIMIT 1),
    'Banana',
    1.0,
    71.0,
    18.3,
    0.9,
    0.3
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Isolate Protein Powder') AND coach_id = coach_uuid LIMIT 1),
    'Isolate Protein Powder',
    25.0,
    91.0,
    0.6,
    22.0,
    0
  );

  -- Protein Yogurt (Pouch) (pre_workout)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Protein Yogurt (Pouch)', 'pre_workout', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Protein Yogurt (Pouch)') AND coach_id = coach_uuid LIMIT 1),
    'Protein Yogurt (Pouch)',
    1.0,
    148.0,
    8.9,
    25.0,
    0.9
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Caramel Rice Cake') AND coach_id = coach_uuid LIMIT 1),
    'Caramel Rice Cake',
    2.0,
    102.0,
    22.6,
    0,
    0.6
  );

  -- Jam Crumpet Thins (pre_workout)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Jam Crumpet Thins', 'pre_workout', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Crumpet Thin') AND coach_id = coach_uuid LIMIT 1),
    'Crumpet Thin',
    2.0,
    122.0,
    24.6,
    4.0,
    0.6
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Protein Yogurt (Pouch)') AND coach_id = coach_uuid LIMIT 1),
    'Protein Yogurt (Pouch)',
    1.0,
    148.0,
    8.9,
    25.0,
    0.9
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Jam') AND coach_id = coach_uuid LIMIT 1),
    'Jam',
    15.0,
    37.2,
    9.12,
    0.48,
    0.48
  );

  -- Jam Bagel (pre_workout)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Jam Bagel', 'pre_workout', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Bagel') AND coach_id = coach_uuid LIMIT 1),
    'Bagel',
    1.0,
    225.0,
    44.3,
    7.9,
    1.3
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Jam') AND coach_id = coach_uuid LIMIT 1),
    'Jam',
    25.0,
    62.0,
    15.2,
    0.8,
    0.8
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Protein Yogurt (Pouch)') AND coach_id = coach_uuid LIMIT 1),
    'Protein Yogurt (Pouch)',
    1.0,
    148.0,
    8.9,
    25.0,
    0.9
  );

  -- Steak and Poatoes (dinner)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Steak and Poatoes', 'dinner', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Sirloin Steak (Raw)') AND coach_id = coach_uuid LIMIT 1),
    'Sirloin Steak (Raw)',
    180.0,
    361.8,
    0,
    38.88,
    22.86
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Salad') AND coach_id = coach_uuid LIMIT 1),
    'Salad',
    150.0,
    25.5,
    3.9,
    2.4,
    0.45
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Baking Potato') AND coach_id = coach_uuid LIMIT 1),
    'Baking Potato',
    200.0,
    154.0,
    35.0,
    4.0,
    0.2
  );

  -- Chicken and Potatos (dinner)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Chicken and Potatos', 'dinner', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Baby Potatoes (Boiled)') AND coach_id = coach_uuid LIMIT 1),
    'Baby Potatoes (Boiled)',
    350.0,
    250.0,
    52.2,
    6.4,
    0.4
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Chicken (Raw)') AND coach_id = coach_uuid LIMIT 1),
    'Chicken (Raw)',
    130.0,
    156.0,
    0,
    29.25,
    3.38
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Pepper') AND coach_id = coach_uuid LIMIT 1),
    'Pepper',
    1.0,
    31.0,
    14.8,
    1.2,
    0.4
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Light Soy Sauce') AND coach_id = coach_uuid LIMIT 1),
    'Light Soy Sauce',
    1.0,
    9.0,
    1.8,
    0.3,
    0.1
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Olive Oil') AND coach_id = coach_uuid LIMIT 1),
    'Olive Oil',
    5.0,
    45.0,
    0,
    0,
    5.0
  );

  -- Fajitas (dinner)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Fajitas', 'dinner', 'Fajita Seasoning is based on the full packet (0.4 = 40% of the packet)')
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Chicken (Raw)') AND coach_id = coach_uuid LIMIT 1),
    'Chicken (Raw)',
    130.0,
    156.0,
    0,
    29.25,
    3.38
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Small Wrap') AND coach_id = coach_uuid LIMIT 1),
    'Small Wrap',
    2.0,
    176.0,
    30.8,
    5.0,
    3.2
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Pepper') AND coach_id = coach_uuid LIMIT 1),
    'Pepper',
    0.5,
    15.5,
    7.4,
    0.6,
    0.2
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Onion') AND coach_id = coach_uuid LIMIT 1),
    'Onion',
    0.5,
    14.0,
    3.25,
    0.4,
    0.05
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Fajita Seasoning') AND coach_id = coach_uuid LIMIT 1),
    'Fajita Seasoning',
    0.5,
    52.0,
    11.2,
    1.2,
    0.4
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Salsa') AND coach_id = coach_uuid LIMIT 1),
    'Salsa',
    70.0,
    23.8,
    4.69,
    0.98,
    0.14
  );

  -- Smash Burger (dinner)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Smash Burger', 'dinner', 'You can swap out the sauces + use any low cal sauce. Just don’t go crazy')
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('5% Fat Mince (Uncooked)') AND coach_id = coach_uuid LIMIT 1),
    '5% Fat Mince (Uncooked)',
    150.0,
    193.5,
    2.7,
    30.45,
    6.75
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Brioche Bun') AND coach_id = coach_uuid LIMIT 1),
    'Brioche Bun',
    1.0,
    172.0,
    29.9,
    5.2,
    2.9
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Sweet Potato (Raw)') AND coach_id = coach_uuid LIMIT 1),
    'Sweet Potato (Raw)',
    100.0,
    90.0,
    21.0,
    2.0,
    0.2
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Burger Sauce') AND coach_id = coach_uuid LIMIT 1),
    'Burger Sauce',
    15.0,
    56.0,
    1.8,
    0.1,
    5.3
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Lettuce') AND coach_id = coach_uuid LIMIT 1),
    'Lettuce',
    50.0,
    10.0,
    1.85,
    0.45,
    0.05
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('50% Plastic Cheese Slice') AND coach_id = coach_uuid LIMIT 1),
    '50% Plastic Cheese Slice',
    1.0,
    36.0,
    2.3,
    3.2,
    1.6
  );

  -- Salmon and Potatoes (dinner)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Salmon and Potatoes', 'dinner', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Salmon Fillet') AND coach_id = coach_uuid LIMIT 1),
    'Salmon Fillet',
    130.0,
    197.0,
    0,
    23.8,
    11.3
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Baby Potatoes (Raw)') AND coach_id = coach_uuid LIMIT 1),
    'Baby Potatoes (Raw)',
    250.0,
    187.5,
    42.75,
    4.25,
    0.75
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Tenderstem Broccoli') AND coach_id = coach_uuid LIMIT 1),
    'Tenderstem Broccoli',
    100.0,
    38.0,
    1.8,
    4.3,
    0.6
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Olive Oil') AND coach_id = coach_uuid LIMIT 1),
    'Olive Oil',
    5.0,
    45.0,
    0,
    0,
    5.0
  );

  -- Stir Fry (dinner)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Stir Fry', 'dinner', 'Change Veg as desired
0.5 Stir Fry sauce = half a packet')
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Chicken (Raw)') AND coach_id = coach_uuid LIMIT 1),
    'Chicken (Raw)',
    100.0,
    120.0,
    0,
    22.5,
    2.6
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Medium Egg Noodles') AND coach_id = coach_uuid LIMIT 1),
    'Medium Egg Noodles',
    1.0,
    271.0,
    54.0,
    10.0,
    1.0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Pepper') AND coach_id = coach_uuid LIMIT 1),
    'Pepper',
    1.0,
    31.0,
    14.8,
    1.2,
    0.4
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Onion') AND coach_id = coach_uuid LIMIT 1),
    'Onion',
    0.5,
    14.0,
    3.25,
    0.4,
    0.05
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Tenderstem Broccoli') AND coach_id = coach_uuid LIMIT 1),
    'Tenderstem Broccoli',
    100.0,
    38.0,
    1.8,
    4.3,
    0.6
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Stir Fry Sauce') AND coach_id = coach_uuid LIMIT 1),
    'Stir Fry Sauce',
    0.5,
    47.5,
    11.25,
    0.12,
    0.21
  );

  -- Chicken and Rice (dinner)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Chicken and Rice', 'dinner', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Rice (Cooked)') AND coach_id = coach_uuid LIMIT 1),
    'Rice (Cooked)',
    170.0,
    221.0,
    47.6,
    4.59,
    0.51
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Chicken (Raw)') AND coach_id = coach_uuid LIMIT 1),
    'Chicken (Raw)',
    130.0,
    156.0,
    0,
    29.25,
    3.38
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Broccoli') AND coach_id = coach_uuid LIMIT 1),
    'Broccoli',
    100.0,
    39.0,
    6.3,
    0.3,
    2.6
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Reduced Sweet Chilli Sauce') AND coach_id = coach_uuid LIMIT 1),
    'Reduced Sweet Chilli Sauce',
    25.0,
    34.0,
    8.4,
    0.1,
    0
  );

  -- Chicken Burger (dinner)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Chicken Burger', 'dinner', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Chicken (Raw)') AND coach_id = coach_uuid LIMIT 1),
    'Chicken (Raw)',
    100.0,
    120.0,
    0,
    22.5,
    2.6
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Corn Flakes') AND coach_id = coach_uuid LIMIT 1),
    'Corn Flakes',
    40.0,
    151.2,
    33.6,
    2.8,
    0.36
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Brioche Bun') AND coach_id = coach_uuid LIMIT 1),
    'Brioche Bun',
    1.0,
    172.0,
    29.9,
    5.2,
    2.9
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Sweet Potato (Raw)') AND coach_id = coach_uuid LIMIT 1),
    'Sweet Potato (Raw)',
    100.0,
    90.0,
    21.0,
    2.0,
    0.2
  );

  -- Burger Bowl (dinner)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Burger Bowl', 'dinner', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('5% Fat Mince (Uncooked)') AND coach_id = coach_uuid LIMIT 1),
    '5% Fat Mince (Uncooked)',
    100.0,
    129.0,
    1.8,
    20.3,
    4.5
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Sweet Potato (Raw)') AND coach_id = coach_uuid LIMIT 1),
    'Sweet Potato (Raw)',
    150.0,
    135.0,
    31.5,
    3.0,
    0.3
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Lettuce') AND coach_id = coach_uuid LIMIT 1),
    'Lettuce',
    100.0,
    20.0,
    3.7,
    0.9,
    0.1
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Crinkle Cut Gherkins') AND coach_id = coach_uuid LIMIT 1),
    'Crinkle Cut Gherkins',
    30.0,
    16.0,
    3.0,
    0.3,
    0.2
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Cheese (50% Lighter)') AND coach_id = coach_uuid LIMIT 1),
    'Cheese (50% Lighter)',
    15.0,
    40.8,
    1.02,
    4.44,
    2.1
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Reduced Ketchup') AND coach_id = coach_uuid LIMIT 1),
    'Reduced Ketchup',
    15.0,
    7.0,
    1.4,
    0.2,
    0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Lighter than Light Mayo') AND coach_id = coach_uuid LIMIT 1),
    'Lighter than Light Mayo',
    10.0,
    7.5,
    0.7,
    0.25,
    0.45
  );

  -- Tortilla Pizza (dinner)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Tortilla Pizza', 'dinner', 'Spread tomato puree over tortilla, stack with grated cheese, cooked chicken, red pepper and a drizzle of reduced BBQ sauce and stack (high) with spinnach as it shrinks. Put in 180 oven for 13 mins')
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Tortilla Wrap') AND coach_id = coach_uuid LIMIT 1),
    'Tortilla Wrap',
    1.0,
    181.0,
    36.8,
    4.5,
    2.2
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Cooked Chicken') AND coach_id = coach_uuid LIMIT 1),
    'Cooked Chicken',
    60.0,
    75.0,
    0.3,
    15.6,
    1.2
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Tomato Puree') AND coach_id = coach_uuid LIMIT 1),
    'Tomato Puree',
    15.0,
    13.0,
    2.8,
    0.6,
    0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Cheese (50% Lighter)') AND coach_id = coach_uuid LIMIT 1),
    'Cheese (50% Lighter)',
    25.0,
    68.0,
    1.7,
    7.4,
    3.5
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Pepper') AND coach_id = coach_uuid LIMIT 1),
    'Pepper',
    1.0,
    31.0,
    14.8,
    1.2,
    0.4
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Spinach') AND coach_id = coach_uuid LIMIT 1),
    'Spinach',
    100.0,
    19.0,
    0.2,
    2.6,
    0.6
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('BBQ Sauce') AND coach_id = coach_uuid LIMIT 1),
    'BBQ Sauce',
    15.0,
    15.0,
    3.7,
    0.1,
    0.1
  );

  -- Chicken and Sweet Potato (dinner)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Chicken and Sweet Potato', 'dinner', 'Sweet Potato - Make into fries, coat with oil, chinese 5 spice and salt
Chicken - Coat with chinese 5 spice, salt and soy sauce')
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Chicken (Raw)') AND coach_id = coach_uuid LIMIT 1),
    'Chicken (Raw)',
    130.0,
    156.0,
    0,
    29.25,
    3.38
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Sweet Potato (Raw)') AND coach_id = coach_uuid LIMIT 1),
    'Sweet Potato (Raw)',
    150.0,
    135.0,
    31.5,
    3.0,
    0.3
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Lettuce') AND coach_id = coach_uuid LIMIT 1),
    'Lettuce',
    100.0,
    20.0,
    3.7,
    0.9,
    0.1
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Light Soy Sauce') AND coach_id = coach_uuid LIMIT 1),
    'Light Soy Sauce',
    7.0,
    63.0,
    12.6,
    2.1,
    0.7
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Olive Oil') AND coach_id = coach_uuid LIMIT 1),
    'Olive Oil',
    5.0,
    45.0,
    0,
    0,
    5.0
  );

  -- Sticky Honey Chicken and Rice (dinner)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Sticky Honey Chicken and Rice', 'dinner', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Rice (Cooked)') AND coach_id = coach_uuid LIMIT 1),
    'Rice (Cooked)',
    80.0,
    104.0,
    22.4,
    2.16,
    0.24
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Chicken (raw)') AND coach_id = coach_uuid LIMIT 1),
    'Chicken (raw)',
    120.0,
    144.0,
    0,
    27.0,
    3.12
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Corn Flour') AND coach_id = coach_uuid LIMIT 1),
    'Corn Flour',
    15.0,
    56.4,
    13.8,
    0.12,
    0.12
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Light Soy Sauce') AND coach_id = coach_uuid LIMIT 1),
    'Light Soy Sauce',
    8.0,
    72.0,
    14.4,
    2.4,
    0.8
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Reduced Sweet Chilli Sauce') AND coach_id = coach_uuid LIMIT 1),
    'Reduced Sweet Chilli Sauce',
    25.0,
    34.0,
    8.4,
    0.1,
    0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Broccoli') AND coach_id = coach_uuid LIMIT 1),
    'Broccoli',
    70.0,
    27.3,
    4.41,
    0.21,
    1.82
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Honey') AND coach_id = coach_uuid LIMIT 1),
    'Honey',
    20.0,
    60.0,
    16.0,
    0,
    0
  );

  -- Cheesy Beef Pasta (dinner)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Cheesy Beef Pasta', 'dinner', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('5% Fat Mince (Uncooked)') AND coach_id = coach_uuid LIMIT 1),
    '5% Fat Mince (Uncooked)',
    100.0,
    129.0,
    1.8,
    20.3,
    4.5
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Penne Pasta (uncooked)') AND coach_id = coach_uuid LIMIT 1),
    'Penne Pasta (uncooked)',
    60.0,
    210.0,
    44.4,
    7.5,
    0.6
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Onion') AND coach_id = coach_uuid LIMIT 1),
    'Onion',
    0.25,
    7.0,
    1.62,
    0.2,
    0.03
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Passata') AND coach_id = coach_uuid LIMIT 1),
    'Passata',
    125.0,
    26.5,
    3.95,
    1.55,
    0.25
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Carrot') AND coach_id = coach_uuid LIMIT 1),
    'Carrot',
    0.25,
    8.0,
    1.55,
    0.1,
    0.07
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Tomato Puree') AND coach_id = coach_uuid LIMIT 1),
    'Tomato Puree',
    5.0,
    5.2,
    1.12,
    0.24,
    0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Light Soy Sauce') AND coach_id = coach_uuid LIMIT 1),
    'Light Soy Sauce',
    3.0,
    27.0,
    5.4,
    0.9,
    0.3
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Beef Stock Cube') AND coach_id = coach_uuid LIMIT 1),
    'Beef Stock Cube',
    0.5,
    14.0,
    0.8,
    0.4,
    0.8
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Cheese (50% Lighter)') AND coach_id = coach_uuid LIMIT 1),
    'Cheese (50% Lighter)',
    20.0,
    54.4,
    1.36,
    5.92,
    2.8
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Pepper') AND coach_id = coach_uuid LIMIT 1),
    'Pepper',
    0.25,
    7.75,
    3.7,
    0.3,
    0.1
  );

  -- Creamy Chicken Pasta (dinner)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Creamy Chicken Pasta', 'dinner', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Penne Pasta (uncooked)') AND coach_id = coach_uuid LIMIT 1),
    'Penne Pasta (uncooked)',
    60.0,
    210.0,
    44.4,
    7.5,
    0.6
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Chicken (Raw)') AND coach_id = coach_uuid LIMIT 1),
    'Chicken (Raw)',
    100.0,
    120.0,
    0,
    22.5,
    2.6
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Sun-Dried Tomatos') AND coach_id = coach_uuid LIMIT 1),
    'Sun-Dried Tomatos',
    20.0,
    39.6,
    1.5,
    0.66,
    3.06
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Reduced Crème Fresh') AND coach_id = coach_uuid LIMIT 1),
    'Reduced Crème Fresh',
    80.0,
    130.4,
    3.52,
    2.16,
    12.0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Spring Onion') AND coach_id = coach_uuid LIMIT 1),
    'Spring Onion',
    40.0,
    11.0,
    1.2,
    0.8,
    0.2
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Chicken Stock Cube') AND coach_id = coach_uuid LIMIT 1),
    'Chicken Stock Cube',
    0.5,
    14.0,
    1.0,
    0.6,
    0.8
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Tomato Puree') AND coach_id = coach_uuid LIMIT 1),
    'Tomato Puree',
    15.0,
    13.0,
    2.8,
    0.6,
    0
  );

  -- Chicken, Hallouimi and Chorizo Pasta (dinner)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Chicken, Hallouimi and Chorizo Pasta', 'dinner', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Chicken (Raw)') AND coach_id = coach_uuid LIMIT 1),
    'Chicken (Raw)',
    90.0,
    108.0,
    0,
    20.25,
    2.34
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Penne Pasta (uncooked)') AND coach_id = coach_uuid LIMIT 1),
    'Penne Pasta (uncooked)',
    60.0,
    210.0,
    44.4,
    7.5,
    0.6
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Halloumi') AND coach_id = coach_uuid LIMIT 1),
    'Halloumi',
    15.0,
    45.0,
    0.55,
    3.1,
    3.35
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Chorizo') AND coach_id = coach_uuid LIMIT 1),
    'Chorizo',
    20.0,
    94.05,
    0.32,
    4.54,
    8.15
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Reduced Red Pesto') AND coach_id = coach_uuid LIMIT 1),
    'Reduced Red Pesto',
    15.0,
    35.7,
    1.2,
    0.69,
    3.0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Parmesan') AND coach_id = coach_uuid LIMIT 1),
    'Parmesan',
    5.0,
    24.2,
    0,
    1.94,
    1.78
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Tomato Puree') AND coach_id = coach_uuid LIMIT 1),
    'Tomato Puree',
    15.0,
    13.0,
    2.8,
    0.6,
    0
  );

  -- Sweet Chilli Chicken Egg Fried Rice (dinner)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Sweet Chilli Chicken Egg Fried Rice', 'dinner', 'Use paprika and garlic seasonings')
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('5% Fat Chicken Mince (raw)') AND coach_id = coach_uuid LIMIT 1),
    '5% Fat Chicken Mince (raw)',
    125.0,
    146.25,
    0.62,
    23.62,
    5.5
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Rice (Cooked)') AND coach_id = coach_uuid LIMIT 1),
    'Rice (Cooked)',
    80.0,
    104.0,
    22.4,
    2.16,
    0.24
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Pepper') AND coach_id = coach_uuid LIMIT 1),
    'Pepper',
    0.5,
    15.5,
    7.4,
    0.6,
    0.2
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Onion') AND coach_id = coach_uuid LIMIT 1),
    'Onion',
    0.5,
    14.0,
    3.25,
    0.4,
    0.05
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Spring Onion') AND coach_id = coach_uuid LIMIT 1),
    'Spring Onion',
    40.0,
    11.0,
    1.2,
    0.8,
    0.2
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Mushrooms') AND coach_id = coach_uuid LIMIT 1),
    'Mushrooms',
    50.0,
    4.2,
    0.12,
    0.48,
    0.12
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Light Soy Sauce') AND coach_id = coach_uuid LIMIT 1),
    'Light Soy Sauce',
    5.0,
    45.0,
    9.0,
    1.5,
    0.5
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Reduced Sweet Chilli Sauce') AND coach_id = coach_uuid LIMIT 1),
    'Reduced Sweet Chilli Sauce',
    15.0,
    20.4,
    5.04,
    0.06,
    0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Tomato Puree') AND coach_id = coach_uuid LIMIT 1),
    'Tomato Puree',
    5.0,
    3.9,
    0.84,
    0.18,
    0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Eggs') AND coach_id = coach_uuid LIMIT 1),
    'Eggs',
    1.0,
    79.0,
    0.5,
    7.6,
    5.4
  );

  -- Creamy Garlic Cheesy Chicken & Potatos (dinner)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Creamy Garlic Cheesy Chicken & Potatos', 'dinner', 'Onion Powder, Mixed Herbs, Chilli flakes, Paprika, Salt')
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Chicken (Raw)') AND coach_id = coach_uuid LIMIT 1),
    'Chicken (Raw)',
    120.0,
    144.0,
    0,
    27.0,
    3.12
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Baking Potato') AND coach_id = coach_uuid LIMIT 1),
    'Baking Potato',
    200.0,
    154.0,
    35.0,
    4.0,
    0.2
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Olive Oil') AND coach_id = coach_uuid LIMIT 1),
    'Olive Oil',
    5.0,
    45.0,
    0,
    0,
    5.0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Garlic') AND coach_id = coach_uuid LIMIT 1),
    'Garlic',
    1.0,
    5.0,
    1.0,
    0.2,
    0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Semi-Skimmed Milk') AND coach_id = coach_uuid LIMIT 1),
    'Semi-Skimmed Milk',
    30.0,
    14.7,
    1.44,
    1.08,
    0.51
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Light Cream Cheese') AND coach_id = coach_uuid LIMIT 1),
    'Light Cream Cheese',
    25.0,
    35.2,
    1.2,
    1.76,
    2.56
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Parmesan') AND coach_id = coach_uuid LIMIT 1),
    'Parmesan',
    10.0,
    36.3,
    0,
    2.91,
    2.67
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Cheese (50% Lighter)') AND coach_id = coach_uuid LIMIT 1),
    'Cheese (50% Lighter)',
    15.0,
    40.8,
    1.02,
    4.44,
    2.1
  );

  -- Cheesy BBQ Chicken Loaded Fries (dinner)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Cheesy BBQ Chicken Loaded Fries', 'dinner', 'Salt, Mixed Herbs, Paprika, Garlic Powder, Onion Granules')
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Chicken (Raw)') AND coach_id = coach_uuid LIMIT 1),
    'Chicken (Raw)',
    120.0,
    144.0,
    0,
    27.0,
    3.12
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Baking Potato') AND coach_id = coach_uuid LIMIT 1),
    'Baking Potato',
    200.0,
    154.0,
    35.0,
    4.0,
    0.2
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Onion') AND coach_id = coach_uuid LIMIT 1),
    'Onion',
    0.5,
    14.0,
    3.25,
    0.4,
    0.05
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Tomato Puree') AND coach_id = coach_uuid LIMIT 1),
    'Tomato Puree',
    15.0,
    13.0,
    2.8,
    0.6,
    0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('BBQ Sauce') AND coach_id = coach_uuid LIMIT 1),
    'BBQ Sauce',
    15.0,
    15.0,
    3.7,
    0.1,
    0.1
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Light Cream Cheese') AND coach_id = coach_uuid LIMIT 1),
    'Light Cream Cheese',
    30.0,
    44.0,
    1.5,
    2.2,
    3.2
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Chicken Stock Cube') AND coach_id = coach_uuid LIMIT 1),
    'Chicken Stock Cube',
    0.5,
    14.0,
    1.0,
    0.6,
    0.8
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Cheese (50% Lighter)') AND coach_id = coach_uuid LIMIT 1),
    'Cheese (50% Lighter)',
    25.0,
    68.0,
    1.7,
    7.4,
    3.5
  );

  -- Creamy Cajun Chicken Pasta (dinner)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Creamy Cajun Chicken Pasta', 'dinner', 'Pink Salt, Garlic Granules. Onion Granules')
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Chicken (raw)') AND coach_id = coach_uuid LIMIT 1),
    'Chicken (raw)',
    120.0,
    144.0,
    0,
    27.0,
    3.12
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Penne Pasta (uncooked)') AND coach_id = coach_uuid LIMIT 1),
    'Penne Pasta (uncooked)',
    60.0,
    210.0,
    44.4,
    7.5,
    0.6
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Onion') AND coach_id = coach_uuid LIMIT 1),
    'Onion',
    0.5,
    14.0,
    3.25,
    0.4,
    0.05
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Pepper') AND coach_id = coach_uuid LIMIT 1),
    'Pepper',
    0.5,
    15.5,
    7.4,
    0.6,
    0.2
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Garlic') AND coach_id = coach_uuid LIMIT 1),
    'Garlic',
    1.0,
    5.0,
    1.0,
    0.2,
    0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Chopped Tomatoes') AND coach_id = coach_uuid LIMIT 1),
    'Chopped Tomatoes',
    0.5,
    47.0,
    7.2,
    2.6,
    0.4
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Light Cream Cheese') AND coach_id = coach_uuid LIMIT 1),
    'Light Cream Cheese',
    25.0,
    35.2,
    1.2,
    1.76,
    2.56
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Parmesan') AND coach_id = coach_uuid LIMIT 1),
    'Parmesan',
    10.0,
    36.3,
    0,
    2.91,
    2.67
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Chicken Stock Cube') AND coach_id = coach_uuid LIMIT 1),
    'Chicken Stock Cube',
    0.5,
    14.0,
    1.0,
    0.6,
    0.8
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Spring Onion') AND coach_id = coach_uuid LIMIT 1),
    'Spring Onion',
    15.0,
    4.4,
    0.48,
    0.32,
    0.08
  );

  -- Chicken and Chorizo Rice (dinner)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Chicken and Chorizo Rice', 'dinner', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Chicken (raw)') AND coach_id = coach_uuid LIMIT 1),
    'Chicken (raw)',
    100.0,
    120.0,
    0,
    22.5,
    2.6
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Chorizo') AND coach_id = coach_uuid LIMIT 1),
    'Chorizo',
    30.0,
    146.3,
    0.49,
    7.07,
    12.67
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Rice (Cooked)') AND coach_id = coach_uuid LIMIT 1),
    'Rice (Cooked)',
    130.0,
    169.0,
    36.4,
    3.51,
    0.39
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Tomato Puree') AND coach_id = coach_uuid LIMIT 1),
    'Tomato Puree',
    15.0,
    13.0,
    2.8,
    0.6,
    0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Garlic') AND coach_id = coach_uuid LIMIT 1),
    'Garlic',
    1.0,
    5.0,
    1.0,
    0.2,
    0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Chicken Stock Cube') AND coach_id = coach_uuid LIMIT 1),
    'Chicken Stock Cube',
    0.5,
    14.0,
    1.0,
    0.6,
    0.8
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Cheese (50% Lighter)') AND coach_id = coach_uuid LIMIT 1),
    'Cheese (50% Lighter)',
    20.0,
    54.4,
    1.36,
    5.92,
    2.8
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Onion') AND coach_id = coach_uuid LIMIT 1),
    'Onion',
    0.5,
    14.0,
    3.25,
    0.4,
    0.05
  );

  -- Spaghetti Bolognase (dinner)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Spaghetti Bolognase', 'dinner', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Spaghetti (Dry)') AND coach_id = coach_uuid LIMIT 1),
    'Spaghetti (Dry)',
    60.0,
    214.4,
    42.88,
    7.92,
    0.56
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('5% Fat Mince (uncooked)') AND coach_id = coach_uuid LIMIT 1),
    '5% Fat Mince (uncooked)',
    100.0,
    129.0,
    1.8,
    20.3,
    4.5
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Chopped Tomatoes') AND coach_id = coach_uuid LIMIT 1),
    'Chopped Tomatoes',
    0.5,
    47.0,
    7.2,
    2.6,
    0.4
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Cheese (50% Lighter)') AND coach_id = coach_uuid LIMIT 1),
    'Cheese (50% Lighter)',
    10.0,
    21.76,
    0.54,
    2.37,
    1.12
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Tomato Puree') AND coach_id = coach_uuid LIMIT 1),
    'Tomato Puree',
    15.0,
    13.0,
    2.8,
    0.6,
    0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Onion') AND coach_id = coach_uuid LIMIT 1),
    'Onion',
    1.0,
    28.0,
    6.5,
    0.8,
    0.1
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Celery') AND coach_id = coach_uuid LIMIT 1),
    'Celery',
    50.0,
    5.0,
    0.45,
    0.25,
    0.1
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Carrot') AND coach_id = coach_uuid LIMIT 1),
    'Carrot',
    1.0,
    32.0,
    6.2,
    0.4,
    0.3
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Red wine Stock Pot') AND coach_id = coach_uuid LIMIT 1),
    'Red wine Stock Pot',
    0.5,
    24.0,
    4.6,
    0.4,
    0.4
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Beef Stock Cube') AND coach_id = coach_uuid LIMIT 1),
    'Beef Stock Cube',
    0.5,
    14.0,
    0.8,
    0.4,
    0.8
  );

  -- BBQ Chicken Pizza (dinner)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'BBQ Chicken Pizza', 'dinner', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('0% Greek Yogurt') AND coach_id = coach_uuid LIMIT 1),
    '0% Greek Yogurt',
    100.0,
    54.0,
    3.0,
    10.3,
    0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Self-Raising Flour') AND coach_id = coach_uuid LIMIT 1),
    'Self-Raising Flour',
    75.0,
    264.0,
    54.75,
    7.35,
    1.2
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Tomato Puree') AND coach_id = coach_uuid LIMIT 1),
    'Tomato Puree',
    15.0,
    13.0,
    2.8,
    0.6,
    0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Cooked Chicken') AND coach_id = coach_uuid LIMIT 1),
    'Cooked Chicken',
    50.0,
    62.5,
    0.25,
    13.0,
    1.0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Onion') AND coach_id = coach_uuid LIMIT 1),
    'Onion',
    0.5,
    14.0,
    3.25,
    0.4,
    0.05
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Pepper') AND coach_id = coach_uuid LIMIT 1),
    'Pepper',
    0.5,
    15.5,
    7.4,
    0.6,
    0.2
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('BBQ Sauce') AND coach_id = coach_uuid LIMIT 1),
    'BBQ Sauce',
    15.0,
    15.0,
    3.7,
    0.1,
    0.1
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Cheese (50% Lighter)') AND coach_id = coach_uuid LIMIT 1),
    'Cheese (50% Lighter)',
    25.0,
    68.0,
    1.7,
    7.4,
    3.5
  );

  -- Big Mac Loaded Fries (dinner)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Big Mac Loaded Fries', 'dinner', 'Pink Salt, Chinese 5 Spice, Garlic Granules, Onion Granules')
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('5% Fat Mince (Uncooked)') AND coach_id = coach_uuid LIMIT 1),
    '5% Fat Mince (Uncooked)',
    110.0,
    141.9,
    1.98,
    22.33,
    4.95
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Sweet Potato (Raw)') AND coach_id = coach_uuid LIMIT 1),
    'Sweet Potato (Raw)',
    200.0,
    180.0,
    42.0,
    4.0,
    0.4
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Lettuce') AND coach_id = coach_uuid LIMIT 1),
    'Lettuce',
    70.0,
    14.0,
    2.59,
    0.63,
    0.07
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Crinkle Cut Gherkins') AND coach_id = coach_uuid LIMIT 1),
    'Crinkle Cut Gherkins',
    30.0,
    16.0,
    3.0,
    0.3,
    0.2
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Cheese (50% Lighter)') AND coach_id = coach_uuid LIMIT 1),
    'Cheese (50% Lighter)',
    25.0,
    68.0,
    1.7,
    7.4,
    3.5
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Reduced Ketchup') AND coach_id = coach_uuid LIMIT 1),
    'Reduced Ketchup',
    15.0,
    7.0,
    1.4,
    0.2,
    0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Burger Sauce') AND coach_id = coach_uuid LIMIT 1),
    'Burger Sauce',
    15.0,
    56.0,
    1.8,
    0.1,
    5.3
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Tomato Puree') AND coach_id = coach_uuid LIMIT 1),
    'Tomato Puree',
    15.0,
    13.0,
    2.8,
    0.6,
    0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Spring Onion') AND coach_id = coach_uuid LIMIT 1),
    'Spring Onion',
    25.0,
    6.6,
    0.72,
    0.48,
    0.12
  );

  -- Chilli and Wedges (dinner)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Chilli and Wedges', 'dinner', 'Tsp Chilli Powder, Cumin, Cinnamon, Paprika and Garlic Granules')
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Baking Potato') AND coach_id = coach_uuid LIMIT 1),
    'Baking Potato',
    150.0,
    115.5,
    26.25,
    3.0,
    0.15
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('5% Fat Mince (uncooked)') AND coach_id = coach_uuid LIMIT 1),
    '5% Fat Mince (uncooked)',
    130.0,
    167.7,
    2.34,
    26.39,
    5.85
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Kidney Beans In Chilli Sauce') AND coach_id = coach_uuid LIMIT 1),
    'Kidney Beans In Chilli Sauce',
    0.5,
    134.0,
    19.4,
    8.7,
    0.4
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Onion') AND coach_id = coach_uuid LIMIT 1),
    'Onion',
    1.0,
    28.0,
    6.5,
    0.8,
    0.1
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Pepper') AND coach_id = coach_uuid LIMIT 1),
    'Pepper',
    0.5,
    15.5,
    7.4,
    0.6,
    0.2
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Chopped Tomatoes') AND coach_id = coach_uuid LIMIT 1),
    'Chopped Tomatoes',
    0.5,
    47.0,
    7.2,
    2.6,
    0.4
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Coriander') AND coach_id = coach_uuid LIMIT 1),
    'Coriander',
    10.0,
    3.3,
    0.37,
    0.21,
    0.05
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Tomato Puree') AND coach_id = coach_uuid LIMIT 1),
    'Tomato Puree',
    15.0,
    13.0,
    2.8,
    0.6,
    0
  );

  -- Nandos Orzo (dinner)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Nandos Orzo', 'dinner', 'Salt, Peri Peri Seasoning')
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Chicken (raw)') AND coach_id = coach_uuid LIMIT 1),
    'Chicken (raw)',
    120.0,
    144.0,
    0,
    27.0,
    3.12
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Orzo (dry)') AND coach_id = coach_uuid LIMIT 1),
    'Orzo (dry)',
    50.0,
    196.3,
    39.13,
    7.67,
    0.39
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Halloumi') AND coach_id = coach_uuid LIMIT 1),
    'Halloumi',
    25.0,
    72.0,
    0.88,
    4.96,
    5.36
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Nandos Peri Peri Sauce') AND coach_id = coach_uuid LIMIT 1),
    'Nandos Peri Peri Sauce',
    20.0,
    9.0,
    0.1,
    0.1,
    0.7
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Chicken Stock Cube') AND coach_id = coach_uuid LIMIT 1),
    'Chicken Stock Cube',
    0.25,
    7.0,
    0.5,
    0.3,
    0.4
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Tomato Puree') AND coach_id = coach_uuid LIMIT 1),
    'Tomato Puree',
    15.0,
    13.0,
    2.8,
    0.6,
    0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Light Cream Cheese') AND coach_id = coach_uuid LIMIT 1),
    'Light Cream Cheese',
    15.0,
    22.0,
    0.75,
    1.1,
    1.6
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Onion') AND coach_id = coach_uuid LIMIT 1),
    'Onion',
    0.5,
    14.0,
    3.25,
    0.4,
    0.05
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Pepper') AND coach_id = coach_uuid LIMIT 1),
    'Pepper',
    0.5,
    15.5,
    7.4,
    0.6,
    0.2
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Cherry Tomatoes') AND coach_id = coach_uuid LIMIT 1),
    'Cherry Tomatoes',
    50.0,
    12.6,
    1.74,
    0.54,
    0.24
  );

  -- Chicken Sausage and Mascarpone (dinner)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Chicken Sausage and Mascarpone', 'dinner', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Chicken Chipolata Sausages') AND coach_id = coach_uuid LIMIT 1),
    'Chicken Chipolata Sausages',
    4.0,
    172.0,
    8.8,
    17.6,
    6.8
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Penne Pasta (uncooked)') AND coach_id = coach_uuid LIMIT 1),
    'Penne Pasta (uncooked)',
    50.0,
    175.0,
    37.0,
    6.25,
    0.5
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Chopped Tomatoes') AND coach_id = coach_uuid LIMIT 1),
    'Chopped Tomatoes',
    0.5,
    47.0,
    7.2,
    2.6,
    0.4
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Tomato Mascarpone Sauce') AND coach_id = coach_uuid LIMIT 1),
    'Tomato Mascarpone Sauce',
    100.0,
    91.0,
    6.5,
    1.8,
    6.0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Tomato Puree') AND coach_id = coach_uuid LIMIT 1),
    'Tomato Puree',
    15.0,
    13.0,
    2.8,
    0.6,
    0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Chicken Stock Cube') AND coach_id = coach_uuid LIMIT 1),
    'Chicken Stock Cube',
    0.5,
    14.0,
    1.0,
    0.6,
    0.8
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Cheese (50% Lighter)') AND coach_id = coach_uuid LIMIT 1),
    'Cheese (50% Lighter)',
    20.0,
    54.4,
    1.36,
    5.92,
    2.8
  );

  -- Chicken and Bacon Potato Pie (dinner)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Chicken and Bacon Potato Pie', 'dinner', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Bacon Medallions') AND coach_id = coach_uuid LIMIT 1),
    'Bacon Medallions',
    1.0,
    27.0,
    0.2,
    5.2,
    0.6
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Chicken (Raw)') AND coach_id = coach_uuid LIMIT 1),
    'Chicken (Raw)',
    70.0,
    84.0,
    0,
    15.75,
    1.82
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Baby Potatoes (Raw)') AND coach_id = coach_uuid LIMIT 1),
    'Baby Potatoes (Raw)',
    150.0,
    112.5,
    25.65,
    2.55,
    0.45
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('0% Greek Yogurt') AND coach_id = coach_uuid LIMIT 1),
    '0% Greek Yogurt',
    100.0,
    54.0,
    3.0,
    10.3,
    0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Semi-Skimmed Milk') AND coach_id = coach_uuid LIMIT 1),
    'Semi-Skimmed Milk',
    100.0,
    49.0,
    4.8,
    3.6,
    1.7
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Leeks') AND coach_id = coach_uuid LIMIT 1),
    'Leeks',
    1.0,
    27.0,
    2.9,
    1.6,
    0.5
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Chicken Stock Cube') AND coach_id = coach_uuid LIMIT 1),
    'Chicken Stock Cube',
    0.25,
    7.0,
    0.5,
    0.3,
    0.4
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Reduced Crème Fresh') AND coach_id = coach_uuid LIMIT 1),
    'Reduced Crème Fresh',
    50.0,
    81.5,
    2.2,
    1.35,
    7.5
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Mustard (Wholegrain)') AND coach_id = coach_uuid LIMIT 1),
    'Mustard (Wholegrain)',
    10.0,
    20.0,
    0.8,
    1.0,
    1.2
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Cheese (50% Lighter)') AND coach_id = coach_uuid LIMIT 1),
    'Cheese (50% Lighter)',
    10.0,
    27.2,
    0.68,
    2.96,
    1.4
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Plain Flour') AND coach_id = coach_uuid LIMIT 1),
    'Plain Flour',
    10.0,
    35.7,
    7.35,
    0.99,
    0.17
  );

  -- Jacket Potato, Tuna, Cheese and Onion (dinner)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Jacket Potato, Tuna, Cheese and Onion', 'dinner', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Baking Potato') AND coach_id = coach_uuid LIMIT 1),
    'Baking Potato',
    300.0,
    231.0,
    52.5,
    6.0,
    0.3
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Tuna') AND coach_id = coach_uuid LIMIT 1),
    'Tuna',
    1.0,
    110.0,
    0,
    25.4,
    1.0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Onion') AND coach_id = coach_uuid LIMIT 1),
    'Onion',
    0.5,
    14.0,
    3.25,
    0.4,
    0.05
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Cheese (50% Lighter)') AND coach_id = coach_uuid LIMIT 1),
    'Cheese (50% Lighter)',
    25.0,
    68.0,
    1.7,
    7.4,
    3.5
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Salad') AND coach_id = coach_uuid LIMIT 1),
    'Salad',
    100.0,
    17.0,
    2.6,
    1.6,
    0.3
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Olive Oil') AND coach_id = coach_uuid LIMIT 1),
    'Olive Oil',
    5.0,
    45.0,
    0,
    0,
    5.0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Lighter than Light Mayo') AND coach_id = coach_uuid LIMIT 1),
    'Lighter than Light Mayo',
    15.0,
    15.0,
    1.4,
    0.5,
    0.9
  );

  -- Chicken Fajitas (dinner)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Chicken Fajitas', 'dinner', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Chicken (Raw)') AND coach_id = coach_uuid LIMIT 1),
    'Chicken (Raw)',
    130.0,
    156.0,
    0,
    29.25,
    3.38
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Small Wrap') AND coach_id = coach_uuid LIMIT 1),
    'Small Wrap',
    2.0,
    176.0,
    30.8,
    5.0,
    3.2
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Pepper') AND coach_id = coach_uuid LIMIT 1),
    'Pepper',
    0.5,
    15.5,
    7.4,
    0.6,
    0.2
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Onion') AND coach_id = coach_uuid LIMIT 1),
    'Onion',
    0.5,
    14.0,
    3.25,
    0.4,
    0.05
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Fajita Seasoning') AND coach_id = coach_uuid LIMIT 1),
    'Fajita Seasoning',
    0.5,
    52.0,
    11.2,
    1.2,
    0.4
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Salsa') AND coach_id = coach_uuid LIMIT 1),
    'Salsa',
    50.0,
    17.0,
    3.35,
    0.7,
    0.1
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Cheese (50% Lighter)') AND coach_id = coach_uuid LIMIT 1),
    'Cheese (50% Lighter)',
    25.0,
    68.0,
    1.7,
    7.4,
    3.5
  );

  -- Creamy Nandos Chicken Pasta (dinner)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Creamy Nandos Chicken Pasta', 'dinner', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Chicken (raw)') AND coach_id = coach_uuid LIMIT 1),
    'Chicken (raw)',
    120.0,
    144.0,
    0,
    27.0,
    3.12
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Penne Pasta (uncooked)') AND coach_id = coach_uuid LIMIT 1),
    'Penne Pasta (uncooked)',
    60.0,
    210.0,
    44.4,
    7.5,
    0.6
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Nandos Peri Peri Sauce') AND coach_id = coach_uuid LIMIT 1),
    'Nandos Peri Peri Sauce',
    20.0,
    9.0,
    0.1,
    0.1,
    0.7
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Pepper') AND coach_id = coach_uuid LIMIT 1),
    'Pepper',
    0.5,
    15.5,
    7.4,
    0.6,
    0.2
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Onion') AND coach_id = coach_uuid LIMIT 1),
    'Onion',
    0.5,
    14.0,
    3.25,
    0.4,
    0.05
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Light Cream Cheese') AND coach_id = coach_uuid LIMIT 1),
    'Light Cream Cheese',
    30.0,
    44.0,
    1.5,
    2.2,
    3.2
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Cheese (50% Lighter)') AND coach_id = coach_uuid LIMIT 1),
    'Cheese (50% Lighter)',
    20.0,
    54.4,
    1.36,
    5.92,
    2.8
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Chopped Tomatoes') AND coach_id = coach_uuid LIMIT 1),
    'Chopped Tomatoes',
    0.5,
    47.0,
    7.2,
    2.6,
    0.4
  );

  -- Beef Tacos (dinner)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Beef Tacos', 'dinner', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('5% Fat Mince (Uncooked)') AND coach_id = coach_uuid LIMIT 1),
    '5% Fat Mince (Uncooked)',
    200.0,
    258.0,
    3.6,
    40.6,
    9.0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Pepper') AND coach_id = coach_uuid LIMIT 1),
    'Pepper',
    1.0,
    31.0,
    14.8,
    1.2,
    0.4
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Onion') AND coach_id = coach_uuid LIMIT 1),
    'Onion',
    1.0,
    28.0,
    6.5,
    0.8,
    0.1
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Taco Seasoning') AND coach_id = coach_uuid LIMIT 1),
    'Taco Seasoning',
    0.5,
    24.0,
    4.1,
    0.4,
    0.4
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Salsa') AND coach_id = coach_uuid LIMIT 1),
    'Salsa',
    150.0,
    51.0,
    10.05,
    2.1,
    0.3
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Taco Shells') AND coach_id = coach_uuid LIMIT 1),
    'Taco Shells',
    2.0,
    118.0,
    17.2,
    1.6,
    4.4
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Lettuce') AND coach_id = coach_uuid LIMIT 1),
    'Lettuce',
    70.0,
    14.0,
    2.59,
    0.63,
    0.07
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Cucumber') AND coach_id = coach_uuid LIMIT 1),
    'Cucumber',
    50.0,
    8.0,
    0.55,
    0.45,
    0.25
  );

  -- Chicken Smash Burgers (dinner)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Chicken Smash Burgers', 'dinner', NULL)
  RETURNING id INTO meal_uuid;


  -- Mayflower Curry (dinner)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Mayflower Curry', 'dinner', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Rice (Cooked)') AND coach_id = coach_uuid LIMIT 1),
    'Rice (Cooked)',
    100.0,
    130.0,
    28.0,
    2.7,
    0.3
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Mayflower Curry Sauce') AND coach_id = coach_uuid LIMIT 1),
    'Mayflower Curry Sauce',
    200.0,
    154.0,
    16.6,
    2.2,
    7.6
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Chicken (Raw)') AND coach_id = coach_uuid LIMIT 1),
    'Chicken (Raw)',
    150.0,
    180.0,
    0,
    33.75,
    3.9
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Onion') AND coach_id = coach_uuid LIMIT 1),
    'Onion',
    0.5,
    14.0,
    3.25,
    0.4,
    0.05
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Garden Peas (cooked)') AND coach_id = coach_uuid LIMIT 1),
    'Garden Peas (cooked)',
    40.0,
    29.5,
    3.5,
    2.0,
    0.2
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Olive Oil') AND coach_id = coach_uuid LIMIT 1),
    'Olive Oil',
    5.0,
    45.0,
    0,
    0,
    5.0
  );

  -- Chicken Pita and Sweet Potato Fries (dinner)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Chicken Pita and Sweet Potato Fries', 'dinner', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Pita Bread') AND coach_id = coach_uuid LIMIT 1),
    'Pita Bread',
    1.0,
    145.0,
    28.8,
    5.4,
    0.4
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Chicken (Raw)') AND coach_id = coach_uuid LIMIT 1),
    'Chicken (Raw)',
    120.0,
    144.0,
    0,
    27.0,
    3.12
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Onion') AND coach_id = coach_uuid LIMIT 1),
    'Onion',
    1.0,
    28.0,
    6.5,
    0.8,
    0.1
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Pepper') AND coach_id = coach_uuid LIMIT 1),
    'Pepper',
    0.5,
    15.5,
    7.4,
    0.6,
    0.2
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Cherry Tomatoes') AND coach_id = coach_uuid LIMIT 1),
    'Cherry Tomatoes',
    40.0,
    10.5,
    1.45,
    0.45,
    0.2
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Sweet Potato (Raw)') AND coach_id = coach_uuid LIMIT 1),
    'Sweet Potato (Raw)',
    120.0,
    108.0,
    25.2,
    2.4,
    0.24
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Lettuce') AND coach_id = coach_uuid LIMIT 1),
    'Lettuce',
    50.0,
    10.0,
    1.85,
    0.45,
    0.05
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Olive Oil') AND coach_id = coach_uuid LIMIT 1),
    'Olive Oil',
    5.0,
    45.0,
    0,
    0,
    5.0
  );

  -- Chicken Chow Mein (dinner)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Chicken Chow Mein', 'dinner', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Chicken (Raw)') AND coach_id = coach_uuid LIMIT 1),
    'Chicken (Raw)',
    120.0,
    144.0,
    0,
    27.0,
    3.12
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Medium Egg Noodles') AND coach_id = coach_uuid LIMIT 1),
    'Medium Egg Noodles',
    1.0,
    271.0,
    54.0,
    10.0,
    1.0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Onion') AND coach_id = coach_uuid LIMIT 1),
    'Onion',
    1.0,
    28.0,
    6.5,
    0.8,
    0.1
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Pepper') AND coach_id = coach_uuid LIMIT 1),
    'Pepper',
    1.0,
    31.0,
    14.8,
    1.2,
    0.4
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Bean Sprouts') AND coach_id = coach_uuid LIMIT 1),
    'Bean Sprouts',
    50.0,
    23.5,
    1.05,
    1.4,
    1.25
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Light Soy Sauce') AND coach_id = coach_uuid LIMIT 1),
    'Light Soy Sauce',
    5.0,
    45.0,
    9.0,
    1.5,
    0.5
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Oyster Sauce') AND coach_id = coach_uuid LIMIT 1),
    'Oyster Sauce',
    3.0,
    54.0,
    12.0,
    0.6,
    0.3
  );

  -- Potato Fajitas (dinner)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Potato Fajitas', 'dinner', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Chicken (Raw)') AND coach_id = coach_uuid LIMIT 1),
    'Chicken (Raw)',
    130.0,
    156.0,
    0,
    29.25,
    3.38
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Baking Potato') AND coach_id = coach_uuid LIMIT 1),
    'Baking Potato',
    200.0,
    154.0,
    35.0,
    4.0,
    0.2
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Pepper') AND coach_id = coach_uuid LIMIT 1),
    'Pepper',
    0.5,
    15.5,
    7.4,
    0.6,
    0.2
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Onion') AND coach_id = coach_uuid LIMIT 1),
    'Onion',
    0.5,
    14.0,
    3.25,
    0.4,
    0.05
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Fajita Seasoning') AND coach_id = coach_uuid LIMIT 1),
    'Fajita Seasoning',
    0.5,
    52.0,
    11.2,
    1.2,
    0.4
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Salsa') AND coach_id = coach_uuid LIMIT 1),
    'Salsa',
    70.0,
    23.8,
    4.69,
    0.98,
    0.14
  );

  -- Jacket Potato, Beans and Cheese (dinner)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Jacket Potato, Beans and Cheese', 'dinner', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Baking Potato') AND coach_id = coach_uuid LIMIT 1),
    'Baking Potato',
    250.0,
    192.5,
    43.75,
    5.0,
    0.25
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Baked Beans') AND coach_id = coach_uuid LIMIT 1),
    'Baked Beans',
    1.0,
    338.0,
    64.9,
    20.1,
    1.5
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Cheese (50% Lighter)') AND coach_id = coach_uuid LIMIT 1),
    'Cheese (50% Lighter)',
    15.0,
    40.8,
    1.02,
    4.44,
    2.1
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Salad') AND coach_id = coach_uuid LIMIT 1),
    'Salad',
    100.0,
    17.0,
    2.6,
    1.6,
    0.3
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Olive Oil') AND coach_id = coach_uuid LIMIT 1),
    'Olive Oil',
    5.0,
    45.0,
    0,
    0,
    5.0
  );

  -- Chicken Sausage and Sweet Potato Mash (dinner)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Chicken Sausage and Sweet Potato Mash', 'dinner', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Chicken Sausages') AND coach_id = coach_uuid LIMIT 1),
    'Chicken Sausages',
    3.0,
    267.0,
    9.9,
    30.0,
    11.4
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Reduced Gravy Granules') AND coach_id = coach_uuid LIMIT 1),
    'Reduced Gravy Granules',
    20.0,
    82.0,
    13.0,
    0.3,
    3.2
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Sweet Potato (Raw)') AND coach_id = coach_uuid LIMIT 1),
    'Sweet Potato (Raw)',
    230.0,
    207.0,
    48.3,
    4.6,
    0.46
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Broccoli') AND coach_id = coach_uuid LIMIT 1),
    'Broccoli',
    100.0,
    39.0,
    6.3,
    0.3,
    2.6
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Carrot') AND coach_id = coach_uuid LIMIT 1),
    'Carrot',
    1.0,
    32.0,
    6.2,
    0.4,
    0.3
  );

  -- Reduced Lasange (dinner)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Reduced Lasange', 'dinner', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('5% Fat Mince (uncooked)') AND coach_id = coach_uuid LIMIT 1),
    '5% Fat Mince (uncooked)',
    120.0,
    154.8,
    2.16,
    24.36,
    5.4
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Lasagne Sheet') AND coach_id = coach_uuid LIMIT 1),
    'Lasagne Sheet',
    2.0,
    144.0,
    28.4,
    5.2,
    0.6
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Onion') AND coach_id = coach_uuid LIMIT 1),
    'Onion',
    0.5,
    14.0,
    3.25,
    0.4,
    0.05
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Carrot') AND coach_id = coach_uuid LIMIT 1),
    'Carrot',
    0.5,
    16.0,
    3.1,
    0.2,
    0.15
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Chopped Tomatoes') AND coach_id = coach_uuid LIMIT 1),
    'Chopped Tomatoes',
    0.5,
    47.0,
    7.2,
    2.6,
    0.4
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Tomato Puree') AND coach_id = coach_uuid LIMIT 1),
    'Tomato Puree',
    15.0,
    13.0,
    2.8,
    0.6,
    0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Cheese (50% Lighter)') AND coach_id = coach_uuid LIMIT 1),
    'Cheese (50% Lighter)',
    15.0,
    34.0,
    0.85,
    3.7,
    1.75
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Reduced Lasagne Sauce') AND coach_id = coach_uuid LIMIT 1),
    'Reduced Lasagne Sauce',
    200.0,
    146.0,
    13.8,
    1.0,
    9.6
  );

  -- Cheesey Chicken and Broccoli Pasta (dinner)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Cheesey Chicken and Broccoli Pasta', 'dinner', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Chicken (Raw)') AND coach_id = coach_uuid LIMIT 1),
    'Chicken (Raw)',
    120.0,
    144.0,
    0,
    27.0,
    3.12
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Penne Pasta (uncooked)') AND coach_id = coach_uuid LIMIT 1),
    'Penne Pasta (uncooked)',
    50.0,
    175.0,
    37.0,
    6.25,
    0.5
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Broccoli') AND coach_id = coach_uuid LIMIT 1),
    'Broccoli',
    100.0,
    39.0,
    6.3,
    0.3,
    2.6
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Cheese (50% Lighter)') AND coach_id = coach_uuid LIMIT 1),
    'Cheese (50% Lighter)',
    25.0,
    68.0,
    1.7,
    7.4,
    3.5
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Lightest Philadelphia') AND coach_id = coach_uuid LIMIT 1),
    'Lightest Philadelphia',
    30.0,
    26.0,
    1.5,
    3.2,
    0.8
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Chicken Stock Cube') AND coach_id = coach_uuid LIMIT 1),
    'Chicken Stock Cube',
    0.5,
    14.0,
    1.0,
    0.6,
    0.8
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Garlic') AND coach_id = coach_uuid LIMIT 1),
    'Garlic',
    1.0,
    5.0,
    1.0,
    0.2,
    0
  );

  -- Greek Yogurt (evening_snack)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Greek Yogurt', 'evening_snack', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('0% Greek Yogurt') AND coach_id = coach_uuid LIMIT 1),
    '0% Greek Yogurt',
    200.0,
    108.0,
    6.0,
    20.6,
    0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Breakfast Topper') AND coach_id = coach_uuid LIMIT 1),
    'Breakfast Topper',
    60.0,
    27.0,
    5.28,
    0.42,
    0.18
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('70% Dark Chocolate') AND coach_id = coach_uuid LIMIT 1),
    '70% Dark Chocolate',
    1.0,
    72.0,
    5.6,
    1.2,
    5.5
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Honey') AND coach_id = coach_uuid LIMIT 1),
    'Honey',
    15.0,
    45.0,
    12.0,
    0,
    0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Chia Seeds') AND coach_id = coach_uuid LIMIT 1),
    'Chia Seeds',
    15.0,
    66.0,
    1.2,
    2.5,
    4.6
  );

  -- Bagel Thin (evening_snack)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Bagel Thin', 'evening_snack', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Bagel Thin') AND coach_id = coach_uuid LIMIT 1),
    'Bagel Thin',
    1.0,
    130.0,
    25.0,
    5.0,
    0.7
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Peanut Butter') AND coach_id = coach_uuid LIMIT 1),
    'Peanut Butter',
    25.0,
    160.0,
    5.6,
    5.6,
    12.8
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Isolate Protein Powder') AND coach_id = coach_uuid LIMIT 1),
    'Isolate Protein Powder',
    25.0,
    91.0,
    0.6,
    22.0,
    0
  );

  -- Rice Cakes (evening_snack)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Rice Cakes', 'evening_snack', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Caramel Rice Cake') AND coach_id = coach_uuid LIMIT 1),
    'Caramel Rice Cake',
    3.0,
    153.0,
    33.9,
    0,
    0.9
  );

  -- Granola (evening_snack)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Granola', 'evening_snack', NULL)
  RETURNING id INTO meal_uuid;


  -- Cinnamon and Raisin Bagel (evening_snack)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Cinnamon and Raisin Bagel', 'evening_snack', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Cinnamon and Raisin Bagel') AND coach_id = coach_uuid LIMIT 1),
    'Cinnamon and Raisin Bagel',
    1.0,
    229.0,
    43.5,
    7.6,
    1.6
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Peanut Butter') AND coach_id = coach_uuid LIMIT 1),
    'Peanut Butter',
    25.0,
    160.0,
    5.6,
    5.6,
    12.8
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Banana') AND coach_id = coach_uuid LIMIT 1),
    'Banana',
    1.0,
    71.0,
    18.3,
    0.9,
    0.3
  );

  -- Peanut Butter Bagel Thin (evening_snack)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Peanut Butter Bagel Thin', 'evening_snack', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Bagel Thin') AND coach_id = coach_uuid LIMIT 1),
    'Bagel Thin',
    1.0,
    130.0,
    25.0,
    5.0,
    0.7
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Peanut Butter') AND coach_id = coach_uuid LIMIT 1),
    'Peanut Butter',
    25.0,
    160.0,
    5.6,
    5.6,
    12.8
  );

  -- Kinder Protein Cheesecake (snack)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Kinder Protein Cheesecake', 'snack', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Digestive Biscuit') AND coach_id = coach_uuid LIMIT 1),
    'Digestive Biscuit',
    1.0,
    71.0,
    9.3,
    1.0,
    3.1
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('0% Greek Yogurt') AND coach_id = coach_uuid LIMIT 1),
    '0% Greek Yogurt',
    75.0,
    40.5,
    2.25,
    7.73,
    0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Light Cream Cheese') AND coach_id = coach_uuid LIMIT 1),
    'Light Cream Cheese',
    50.0,
    74.8,
    2.55,
    3.74,
    5.44
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Isolate Protein Powder') AND coach_id = coach_uuid LIMIT 1),
    'Isolate Protein Powder',
    20.0,
    72.8,
    0.48,
    17.6,
    0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Kinder Bar') AND coach_id = coach_uuid LIMIT 1),
    'Kinder Bar',
    0.5,
    35.5,
    3.35,
    0.55,
    2.2
  );

  -- Banana and Raspberry Biscoff Baked Oats (snack)
  INSERT INTO meals (coach_id, name, category, instructions)
  VALUES (coach_uuid, 'Banana and Raspberry Biscoff Baked Oats', 'snack', NULL)
  RETURNING id INTO meal_uuid;

  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Oats') AND coach_id = coach_uuid LIMIT 1),
    'Oats',
    20.0,
    74.0,
    13.0,
    2.4,
    1.04
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Isolate Protein Powder') AND coach_id = coach_uuid LIMIT 1),
    'Isolate Protein Powder',
    10.0,
    36.4,
    0.24,
    8.8,
    0
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Banana') AND coach_id = coach_uuid LIMIT 1),
    'Banana',
    0.5,
    35.5,
    9.15,
    0.45,
    0.15
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Eggs') AND coach_id = coach_uuid LIMIT 1),
    'Eggs',
    0.5,
    39.5,
    0.25,
    3.8,
    2.7
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Semi-Skimmed Milk') AND coach_id = coach_uuid LIMIT 1),
    'Semi-Skimmed Milk',
    100.0,
    49.0,
    4.8,
    3.6,
    1.7
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Baking Powder') AND coach_id = coach_uuid LIMIT 1),
    'Baking Powder',
    1.0,
    8.0,
    1.7,
    0.2,
    0.1
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Raspberries') AND coach_id = coach_uuid LIMIT 1),
    'Raspberries',
    50.0,
    17.0,
    2.55,
    0.4,
    0.15
  );
  INSERT INTO meal_ingredients (meal_id, ingredient_id, name, quantity_g, calories, carbs_g, protein_g, fat_g)
  VALUES (
    meal_uuid,
    (SELECT id FROM ingredients WHERE LOWER(name) = LOWER('Biscoff Spread') AND coach_id = coach_uuid LIMIT 1),
    'Biscoff Spread',
    10.0,
    47.2,
    4.24,
    0.24,
    3.2
  );

  RAISE NOTICE 'Import complete!';
END $$;

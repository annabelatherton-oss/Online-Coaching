-- Higher-protein vegan ingredients you sent nutrition details for, so the vegan meal rotation
-- isn't limited to beans/chickpeas/nuts any more. Run supabase/ingredient-is-vegetarian-migration.sql
-- FIRST — this insert sets is_vegetarian on each row, which needs that column to already exist.
-- Same safe-to-re-run pattern as the rest of the ingredient library: unique (coach_id, name)
-- means anything already present by that exact name is left untouched.

insert into ingredients (coach_id, name, serving_size, serving_unit, calories_per_serving, protein_per_serving, carbs_per_serving, fat_per_serving, is_vegetarian)
select (select id from profiles where email = 'annabelatherton@gmail.com'), v.name, v.serving_size, v.serving_unit, v.calories, v.protein, v.carbs, v.fat, true
from (values
  -- Per 100g, from Tesco Plant Chef tofu (1 pack/300g = 318 kcal, 33.9g protein, 5.1g carbs, 17.4g fat)
  ('Firm Tofu', 100, 'g', 106, 11.3, 1.7, 5.8),
  -- Per 100g, from Better Nature tempeh (1 pack/200g = 336 kcal, 40g protein, ~12g carbs, ~14g fat)
  ('Tempeh', 100, 'g', 168, 20, 6, 7),
  -- Per 100g dry, from Tesco red split lentils
  ('Red Lentils (Dry)', 100, 'g', 350, 25, 60, 1.5),
  -- Per tin, from Tesco tinned green lentils (400g tin, ~240g drained)
  ('Green Lentils (Tinned)', 1, 'tin', 242, 18, 40, 1),
  -- Per 100g, from frozen shelled edamame (1 pack/250g = ~390 kcal, ~30g protein, ~23g carbs, ~15g fat)
  ('Edamame Beans', 100, 'g', 156, 12, 9.2, 6),
  -- Per 100g, from Tesco Plant Chef meat-free mince (1 pack/250g = 453 kcal, 35.8g protein, 23.8g carbs, 18g fat)
  ('Vegan Mince', 100, 'g', 181, 14.3, 9.5, 7.2),
  -- Per 100ml, from Alpro No Sugars Soya (1L carton = 320 kcal, 33g protein, 0g carbs, 19g fat)
  ('Unsweetened Soy Milk', 100, 'ml', 32, 3.3, 0, 1.9),
  -- Per scoop, from a typical pea/soy vegan protein powder
  ('Vegan Protein Powder', 25, 'g', 88, 18, 1.5, 0.8),
  -- Per 100g, from Tesco standard hummus (1 pot/200g = ~460 kcal, ~12g protein, ~24g carbs, ~34g fat)
  ('Hummus', 100, 'g', 230, 6, 12, 17),
  -- Per slice (25g), from Violife Original slices (1 pack/175g = 518 kcal, 0.2g protein, 38.5g carbs, 40.3g fat)
  ('Vegan Cheese Slice', 25, 'g', 74, 0.03, 5.5, 5.8)
) as v(name, serving_size, serving_unit, calories, protein, carbs, fat)
on conflict (coach_id, name) do nothing;

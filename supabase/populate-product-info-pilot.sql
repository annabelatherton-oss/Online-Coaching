-- Populates product name/brand/link for your 12 most-used ingredients, favouring Tesco or Aldi
-- own-brand where one exists and matches reasonably well, with a mainstream mid-cost brand
-- otherwise (never the priciest option). This only sets product_name/product_brand/product_url — it does NOT touch
-- calories_per_serving/protein_per_serving/etc, since changing those needs to go through the
-- Ingredient Library UI (Save an ingredient there and it automatically updates every meal that
-- already uses it — a plain SQL update here would leave those meals with stale numbers). See the
-- chat message for the 3 ingredients worth a manual macro tweak, and 2 that need your own check.
--
-- Safe to re-run.

do $$
declare
  v_coach_id uuid := (select id from profiles where email = 'annabelatherton@gmail.com');
begin
  update ingredients set product_name = 'Impact Whey Isolate', product_brand = 'MyProtein',
    product_url = 'https://www.tesco.com/shop/en-GB/products/317411328'
  where coach_id = v_coach_id and name = 'Isolate Protein Powder';

  update ingredients set product_name = 'Cottage Cheese', product_brand = 'Tesco'
  where coach_id = v_coach_id and name = 'Cottage Cheese';

  update ingredients set product_name = 'Light Mayonnaise', product_brand = 'Tesco',
    product_url = 'https://www.tesco.com/groceries/en-GB/products/305249769'
  where coach_id = v_coach_id and name = 'Light Mayo';

  -- Aldi's Sweet Chilli Sauce (131 kcal/100g) is a closer calorie match to this ingredient than
  -- any "reduced sugar" branded product found (Blue Dragon's reduced-sugar version runs 156/100g).
  update ingredients set product_name = 'Sweet Chilli Sauce', product_brand = 'Aldi'
  where coach_id = v_coach_id and name = 'Reduced Sweet Chilli Sauce';

  update ingredients set product_name = 'BBQ Sauce', product_brand = 'Tesco',
    product_url = 'https://www.tesco.com/groceries/en-GB/products/305833629'
  where coach_id = v_coach_id and name = 'BBQ Sauce';

  update ingredients set product_name = 'Oat Drink', product_brand = 'Tesco',
    product_url = 'https://www.tesco.com/shop/en-GB/products/307760281'
  where coach_id = v_coach_id and name = 'Oat Milk';

  -- Closest real macro match found (~24 kcal / 4.4g protein per medallion vs this ingredient's
  -- 27/5) — note this specific listing is from Aldi's "Specially Selected" range, not their
  -- cheapest bacon line.
  update ingredients set product_name = 'Specially Selected Smoked Bacon Medallions', product_brand = 'Aldi',
    product_url = 'https://www.aldi.co.uk/product/specially-selected-smoked-bacon-medallions-8-pack-000000000620237001'
  where coach_id = v_coach_id and name = 'Bacon Medallions';

  update ingredients set product_name = '2 Cooked Skinless Chicken Breast', product_brand = 'Tesco',
    product_url = 'https://www.tesco.com/groceries/en-GB/products/315588945'
  where coach_id = v_coach_id and name = 'Cooked Chicken';

  update ingredients set product_name = 'British Chicken Sausages', product_brand = 'Tesco'
  where coach_id = v_coach_id and name = 'Chicken Chipolata Sausages';

  -- Aldi Bagel Thins (130 kcal / 5g protein per bagel) match this ingredient almost exactly —
  -- closer than the Warburtons/Thomas' options checked, and no Tesco own-brand thin bagel exists.
  update ingredients set product_name = 'Bagel Thins', product_brand = 'Aldi'
  where coach_id = v_coach_id and name = 'Bagel Thin';

  update ingredients set product_name = 'Smooth Peanut Butter', product_brand = 'Tesco',
    product_url = 'https://www.tesco.com/groceries/en-GB/products/264769626'
  where coach_id = v_coach_id and name = 'Peanut Butter';
end $$;

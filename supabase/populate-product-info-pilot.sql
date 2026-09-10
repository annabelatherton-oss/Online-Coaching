-- Populates product name/brand/link for your 12 most-used ingredients, favouring Tesco or Aldi
-- own-brand where one exists and matches reasonably well, with a mainstream mid-cost brand
-- otherwise (never the priciest option). This only sets product_name/product_brand/product_url — it does NOT touch
-- calories_per_serving/protein_per_serving/etc, since changing those needs to go through the
-- Ingredient Library UI (Save an ingredient there and it automatically updates every meal that
-- already uses it — a plain SQL update here would leave those meals with stale numbers). See the
-- chat message for the 3 ingredients worth a manual macro tweak, and 2 that need your own check.
--
-- CAVEAT (found the hard way on Reduced Sweet Chilli Sauce, since corrected below): every figure
-- here was sourced via web search, which pulls from third-party calorie-tracker sites (FatSecret,
-- MyNetDiary, etc.) rather than the retailer's own page — this environment can't fetch tesco.com
-- or aldi.co.uk directly to verify against them. The same risk applies to every ingredient below,
-- not just the one caught — worth a quick check against the real label/website for any of these
-- you're relying on closely, especially Bacon Medallions, Bagel Thin and Peanut Butter, where a
-- brand choice was made based on this same kind of figure.
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

  -- Reverted: the coach checked the real websites directly — Aldi's regular Sweet Chilli Sauce is
  -- actually 200 kcal/100g (not the ~131 a calorie-tracker site had it at), and the Tesco-listed
  -- product (Blue Dragon Reduced Sugar) is 156/100g — genuinely the closer match to this
  -- ingredient's 136/100g figure, confirmed against the actual site rather than a tracker app.
  update ingredients set product_name = 'Reduced Sugar Sweet Chilli Dipping Sauce', product_brand = 'Blue Dragon',
    product_url = 'https://www.sainsburys.co.uk/gol-ui/product/blue-dragon-reduced-sugar-thai-sweet-chilli-sauce-380g-7759308-p'
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

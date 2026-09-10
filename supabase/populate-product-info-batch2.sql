-- Product info for the ingredients checked in the second verification sweep (beyond the original
-- 12-ingredient pilot). Only sets product_name/product_brand/product_url — no macro changes here.
-- Same sourcing caveat as the pilot file: these come from web search (which pulls from
-- third-party calorie trackers), this environment can't fetch tesco.com/aldi.co.uk directly to
-- verify. Genuinely generic items with no single "the" product (Feta, Halloumi, Chorizo, Gammon,
-- Panko Breadcrumbs, Salsa, Full Fat Greek Yogurt, Reduced Pesto, Reduced Caesar Dressing) are
-- left without product info — there's no one brand that's "the" answer for these, and they're
-- visually self-evident anyway.
--
-- Safe to re-run.

do $$
declare
  v_coach_id uuid := (select id from profiles where email = 'annabelatherton@gmail.com');
begin
  update ingredients set product_name = 'Weetabix', product_brand = 'Weetabix'
  where coach_id = v_coach_id and name = 'Weetabix';

  update ingredients set product_name = 'Nutella', product_brand = 'Ferrero'
  where coach_id = v_coach_id and name = 'Nutella';

  update ingredients set product_name = 'Biscoff Smooth Spread', product_brand = 'Lotus'
  where coach_id = v_coach_id and name = 'Biscoff Spread';

  update ingredients set product_name = 'Mince', product_brand = 'Quorn',
    product_url = 'https://www.tesco.com/groceries/en-GB/products/251352757'
  where coach_id = v_coach_id and name = 'Quorn Mince';

  update ingredients set product_name = 'Chicken Pieces', product_brand = 'Quorn'
  where coach_id = v_coach_id and name = 'Quorn Chicken Pieces';

  -- Real figure is ~88 kcal/slice (yours was 64) — flagged in chat, worth double-checking you've
  -- updated the macros for this one already.
  update ingredients set product_name = 'Medium Sliced Wholemeal', product_brand = 'Hovis'
  where coach_id = v_coach_id and name = 'Hovis Medium Wholemeal';

  update ingredients set product_name = 'No.9 Wholemeal Sourdough', product_brand = 'Jason''s Sourdough'
  where coach_id = v_coach_id and name = 'Jason''s No.9 Wholemeal Sourdough';

  update ingredients set product_name = 'Oat Drink Barista Edition', product_brand = 'Oatly'
  where coach_id = v_coach_id and name = 'Oatly Barista';

  update ingredients set product_name = 'Peri-Peri Sauce', product_brand = 'Nando''s'
  where coach_id = v_coach_id and name = 'Nandos Peri Peri Sauce';

  update ingredients set product_name = 'Reggae Reggae Sauce', product_brand = 'Levi Roots'
  where coach_id = v_coach_id and name = 'Reggae Reggae Sauce';

  update ingredients set product_name = 'Twirl', product_brand = 'Cadbury'
  where coach_id = v_coach_id and name = 'Twirl Bar (43g)';

  update ingredients set product_name = 'Coco Pops', product_brand = 'Kellogg''s'
  where coach_id = v_coach_id and name = 'Coco Pops';

  update ingredients set product_name = 'Corn Flakes', product_brand = 'Kellogg''s'
  where coach_id = v_coach_id and name = 'Corn Flakes';

  update ingredients set product_name = 'Frosties', product_brand = 'Kellogg''s'
  where coach_id = v_coach_id and name = 'Frosties';

  update ingredients set product_name = 'Rice Krispies', product_brand = 'Kellogg''s'
  where coach_id = v_coach_id and name = 'Rice Crispies';

  update ingredients set product_name = 'Rice Krispies Squares', product_brand = 'Kellogg''s'
  where coach_id = v_coach_id and name = 'Rice Crispies Squares Bar';

  update ingredients set product_name = 'Lightest', product_brand = 'Philadelphia'
  where coach_id = v_coach_id and name = 'Lightest Philadelphia';

  update ingredients set product_name = 'Beetroot Veggie Cakes', product_brand = 'Kallo',
    product_url = 'https://www.tesco.com/shop/en-GB/products/310180473'
  where coach_id = v_coach_id and name = 'Kallo Beetroot Veggie Cake';

  -- Matches the "No Added Sugar & Salt" variant (~45 kcal/100g), not the "50% Less" variant
  -- (~64 kcal/100g) — worth checking which one you actually use.
  update ingredients set product_name = 'Tomato Ketchup No Added Sugar & Salt', product_brand = 'Heinz'
  where coach_id = v_coach_id and name = 'Reduced Ketchup';

  update ingredients set product_name = 'Reduced Salt Gravy Granules', product_brand = 'Bisto'
  where coach_id = v_coach_id and name = 'Reduced Gravy Granules';
end $$;

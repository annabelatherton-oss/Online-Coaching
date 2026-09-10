-- Product info for the third verification-sweep batch. Only sets product_name/product_brand/
-- product_url — no macro changes here. Same web-search sourcing caveat as the earlier files.
--
-- Stir Fry Sauce and Burger Sauce are deliberately left out of this file:
--  - Stir Fry Sauce is stored as "1 unit" (a sachet) with no gram weight recorded, so it can't be
--    checked against per-100g figures with any confidence — worth confirming what brand/sachet
--    size you actually use.
--  - Burger Sauce's figure (56 kcal / 5g fat per 15g) looks like a mayo-based sauce, not the
--    lighter ketchup-style "burger sauce" that came up in search (~29 kcal/15g) — likely just a
--    different product, not an error, but I can't confidently name the exact one.
--
-- Safe to re-run.

do $$
declare
  v_coach_id uuid := (select id from profiles where email = 'annabelatherton@gmail.com');
begin
  update ingredients set product_name = 'Curry Sauce', product_brand = 'Mayflower'
  where coach_id = v_coach_id and name = 'Mayflower Curry Sauce';

  update ingredients set product_name = 'Oyster Sauce', product_brand = 'Blue Dragon'
  where coach_id = v_coach_id and name = 'Oyster Sauce';
end $$;

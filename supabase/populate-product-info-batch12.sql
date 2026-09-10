-- Product info for the biscuits/chocolate/Quorn batch of the verification sweep. Kinder Bar,
-- Beef Stock Cube, Chicken Stock Cube, Chocolate Chips and Baking Powder are left unbranded -
-- see chat (Kinder Bar's figure looks like it means the small Kinder Chocolate bar rather than
-- Kinder Bueno; both stock cubes run noticeably higher than Oxo's real figures).
--
-- Safe to re-run.

do $$
declare
  v_coach_id uuid := (select id from profiles where email = 'annabelatherton@gmail.com');
begin
  update ingredients set product_name = 'Digestive Biscuits', product_brand = 'McVitie''s'
  where coach_id = v_coach_id and name = 'Digestive Biscuit';

  update ingredients set product_name = 'Dairy Milk Little Bar', product_brand = 'Cadbury'
  where coach_id = v_coach_id and name = 'Dairy Milk Little Bar';

  update ingredients set product_name = 'Meat Free Sausages', product_brand = 'Quorn'
  where coach_id = v_coach_id and name = 'Quorn Sausages';

  update ingredients set product_name = 'Vegetarian Ham Slices', product_brand = 'Quorn'
  where coach_id = v_coach_id and name = 'Quorn Ham Slices';
end $$;

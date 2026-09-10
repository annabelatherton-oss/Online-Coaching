-- Product info for the seasonings/sauces batch of the verification sweep. Red Pesto, Red Wine
-- Stock Pot, Taco Seasoning and Tomato Mascarpone Sauce are flagged in chat as worth a closer
-- look, so no product name is set for them yet.
--
-- Safe to re-run.

do $$
declare
  v_coach_id uuid := (select id from profiles where email = 'annabelatherton@gmail.com');
begin
  update ingredients set product_name = 'Fajita Seasoning Mix', product_brand = 'Old El Paso'
  where coach_id = v_coach_id and name = 'Fajita Seasoning';

  update ingredients set product_name = 'Sweet Chilli Jam', product_brand = 'Nando''s'
  where coach_id = v_coach_id and name = 'Nandos Sweet Chilli Jam';

  update ingredients set product_name = 'Spreadable Lighter Slightly Salted', product_brand = 'Lurpak'
  where coach_id = v_coach_id and name = 'Spreadable Butter (Lighter)';
end $$;

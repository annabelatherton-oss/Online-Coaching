-- Product info for the cereals/flour batch of the verification sweep. Crumpets, Crumpet Thin and
-- Plain Flour got exact matches. Cream of Rice and Self-Raising Flour are generic commodity items
-- (no meaningful brand-to-brand calorie difference) so are left unbranded on purpose. Spaghetti
-- Hoops is flagged in chat - no product name set until the figure is confirmed.
--
-- Safe to re-run.

do $$
declare
  v_coach_id uuid := (select id from profiles where email = 'annabelatherton@gmail.com');
begin
  update ingredients set product_name = 'Crumpets', product_brand = 'Warburtons'
  where coach_id = v_coach_id and name = 'Crumpets';

  update ingredients set product_name = 'Crumpet Thins', product_brand = 'Warburtons'
  where coach_id = v_coach_id and name = 'Crumpet Thin';

  update ingredients set product_name = 'Plain Flour', product_brand = 'Tesco'
  where coach_id = v_coach_id and name = 'Plain Flour';
end $$;

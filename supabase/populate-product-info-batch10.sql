-- Product info for the fats/spreads/condiments batch of the verification sweep. Chia Seeds,
-- Flaxseeds, Garlic and Herb Butter and Granola are left unbranded - generic items with no single
-- "the" product, and close enough to real-world figures once you allow for net-carb vs total-carb
-- counting (seeds look carb-light here because fibre is being excluded, not because a macro is
-- wrong).
--
-- Safe to re-run.

do $$
declare
  v_coach_id uuid := (select id from profiles where email = 'annabelatherton@gmail.com');
begin
  update ingredients set product_name = 'Light Cream Cheese', product_brand = 'Philadelphia'
  where coach_id = v_coach_id and name = 'Light cream Cheese';

  update ingredients set product_name = 'Lite Soy Sauce', product_brand = 'Kikkoman'
  where coach_id = v_coach_id and name = 'Light Soy Sauce';

  update ingredients set product_name = 'Lighter than Light Mayonnaise', product_brand = 'Hellmann''s'
  where coach_id = v_coach_id and name = 'Lighter than Light Mayo';

  update ingredients set product_name = 'Wholegrain Mustard', product_brand = 'Tesco'
  where coach_id = v_coach_id and name = 'Mustard (Wholegrain)';
end $$;

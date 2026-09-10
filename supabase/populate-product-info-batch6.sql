-- Product info for the small wraps / taco / gluten free batch of the verification sweep. Only
-- Small Wrap, Taco Shells and Gluten Free Wrap got confident matches - see chat for the rest
-- (Sweet Potato Wrap, Gluten Free Bagel, Gluten Free Bun, Gluten Free Wrap (Small), Gluten Free
-- Pita), which are inconclusive or worth a closer look, so no product name is set for them yet.
--
-- Safe to re-run.

do $$
declare
  v_coach_id uuid := (select id from profiles where email = 'annabelatherton@gmail.com');
begin
  update ingredients set product_name = 'Plain Mini Tortilla Wraps', product_brand = 'Tesco'
  where coach_id = v_coach_id and name = 'Small Wrap';

  update ingredients set product_name = 'Crunchy Taco Shells', product_brand = 'Old El Paso'
  where coach_id = v_coach_id and name = 'Taco Shells';

  update ingredients set product_name = 'Gluten Free White Wraps', product_brand = 'Warburtons'
  where coach_id = v_coach_id and name = 'Gluten Free Wrap';
end $$;

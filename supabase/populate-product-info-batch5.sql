-- Product info for the breads/wraps batch of the verification sweep. Only Pita Bread and
-- Wholemeal Bap got confident matches - see chat for the others (Warbutons NAS Wholemeal, White
-- Bap, Tortilla Wrap, Wholemeal Sourdough) which are inconclusive or worth a closer look, so no
-- product name is set for them yet.
--
-- Safe to re-run.

do $$
declare
  v_coach_id uuid := (select id from profiles where email = 'annabelatherton@gmail.com');
begin
  update ingredients set product_name = 'Plain Pitta Bread', product_brand = 'Tesco'
  where coach_id = v_coach_id and name = 'Pita Bread';

  update ingredients set product_name = 'Wholemeal Rolls (56g)', product_brand = 'Warburtons'
  where coach_id = v_coach_id and name = 'Wholemeal Bap';
end $$;

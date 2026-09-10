-- Product info for the deli/tinned batch of the verification sweep. Turkey Slice is deliberately
-- left out - its stored macros (21 kcal but 0g protein/carbs/fat) don't add up (21 kcal can't come
-- from nothing), flagged in chat as a data entry issue worth fixing before adding a product match.
--
-- Safe to re-run.

do $$
declare
  v_coach_id uuid := (select id from profiles where email = 'annabelatherton@gmail.com');
begin
  update ingredients set product_name = 'Beanz', product_brand = 'Heinz'
  where coach_id = v_coach_id and name = 'Baked Beans';

  update ingredients set product_name = 'Tuna Chunks in Spring Water', product_brand = 'John West'
  where coach_id = v_coach_id and name = 'Tuna';

  update ingredients set product_name = 'Wafer Thin Honey Roast Ham', product_brand = 'Tesco'
  where coach_id = v_coach_id and name = 'Wafer Thin Honey Roast Ham';

  update ingredients set product_name = 'Wafer Thin Roast Chicken', product_brand = 'Tesco'
  where coach_id = v_coach_id and name = 'Roast Chicken Wafer Thin Slices';

  update ingredients set product_name = 'British Chicken Sausages', product_brand = 'Tesco'
  where coach_id = v_coach_id and name = 'Chicken Sausages';
end $$;

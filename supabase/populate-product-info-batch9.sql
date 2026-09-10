-- Product info for the beans/fresh protein batch of the verification sweep. Sirloin Steak, Salmon
-- Fillet and Egg White are fresh/generic items (no meaningful brand difference) so are left
-- unbranded on purpose. Protein Mousse and Protein Yogurt (Pouch) are flagged in chat as worth a
-- closer look - too many differing branded options to confidently match one.
--
-- Safe to re-run.

do $$
declare
  v_coach_id uuid := (select id from profiles where email = 'annabelatherton@gmail.com');
begin
  update ingredients set product_name = 'Red Kidney Beans', product_brand = 'Napolina'
  where coach_id = v_coach_id and name = 'Kidney Beans';

  update ingredients set product_name = 'Red Kidney Beans in Chilli Sauce', product_brand = 'Tesco'
  where coach_id = v_coach_id and name = 'Kidney Beans In Chilli Sauce';

  update ingredients set product_name = 'Cooked Chicken', product_brand = 'Tesco'
  where coach_id = v_coach_id and name = 'Ready Cooked Chicken';

  update ingredients set product_name = 'Beanz', product_brand = 'Heinz'
  where coach_id = v_coach_id and name = 'Tin of Beans';
end $$;

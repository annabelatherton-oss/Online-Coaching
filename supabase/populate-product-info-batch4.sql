-- Product info for the rice cakes batch of the verification sweep. Only Salted Rice Cakes got a
-- confident brand match - Caramel, Chocolate and Salt and Vinegar are flagged in chat as worth a
-- macro check first, so no product name is set for them until the figures are confirmed.
--
-- Safe to re-run.

do $$
declare
  v_coach_id uuid := (select id from profiles where email = 'annabelatherton@gmail.com');
begin
  update ingredients set product_name = 'Lightly Salted Rice Cakes', product_brand = 'Kallo'
  where coach_id = v_coach_id and name = 'Salted Rice Cakes';
end $$;

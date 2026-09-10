-- Cleans up repetition across the meals added this session: several near-identical snacks were
-- created once per diet tag (e.g. "Rice Cakes & Peanut Butter" existed 4 times — once each for
-- vegetarian/vegan/gluten-free/dairy-free — even though it's literally the same recipe and
-- qualifies for all four). This keeps ONE copy of each and tags it with every diet it actually
-- satisfies, deleting the redundant copies. It also removes a few Standard-batch meals that
-- turned out to duplicate a dish already in your library (e.g. "Smash Burger Bowl" vs your
-- existing "Smash Burger").
--
-- Safe to run once. Deleting a meal cascades to its own ingredients/calorie-tier versions only;
-- any 50-week slot that already used one of these just reverts to empty rather than breaking.

do $$
declare
  v_coach_id uuid := (select id from profiles where email = 'annabelatherton@gmail.com');
begin

  -- Rice Cakes & Peanut Butter — keep the vegetarian one, tag it for every diet it satisfies.
  update meals set diet_tags = array['vegetarian','vegan','gluten_free','dairy_free']
  where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Rice Cakes & Peanut Butter'));
  delete from meals where coach_id = v_coach_id and lower(trim(name)) in (
    lower(trim('Rice Cakes & Peanut Butter (GF)')),
    lower(trim('Rice Cakes & Peanut Butter (Dairy-Free)')),
    lower(trim('Rice Cakes & Peanut Butter (Vegan)'))
  );

  -- Apple & Peanut Butter
  update meals set name = 'Apple & Peanut Butter', diet_tags = array['vegetarian','vegan','gluten_free','dairy_free']
  where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Apple & Peanut Butter (GF)'));
  delete from meals where coach_id = v_coach_id and lower(trim(name)) in (
    lower(trim('Apple & Peanut Butter (Dairy-Free)')),
    lower(trim('Apple & Peanut Butter (Vegan)'))
  );

  -- Banana & Peanut Butter Rice Cakes
  update meals set diet_tags = array['vegetarian','vegan','gluten_free','dairy_free']
  where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Banana & Peanut Butter Rice Cakes'));
  delete from meals where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Banana & Peanut Butter Rice Cakes (Vegan)'));

  -- Dates & Almonds
  update meals set diet_tags = array['vegetarian','vegan','gluten_free','dairy_free']
  where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Dates & Almonds'));
  delete from meals where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Dates & Almonds (Vegan)'));

  -- Bacon & Eggs / Bacon, Eggs & Tomato — identical recipe
  update meals set diet_tags = array['gluten_free','dairy_free']
  where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Bacon & Eggs'));
  delete from meals where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Bacon, Eggs & Tomato'));

  -- Salmon, Sweet Potato & Greens / Salmon & New Potatoes — near-identical, keep the clearer name
  update meals set diet_tags = array['gluten_free','dairy_free']
  where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Salmon, Sweet Potato & Greens'));
  delete from meals where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Salmon & New Potatoes'));

  -- Chicken, Rice & Broccoli / Chicken, Rice & Veg (Dairy-Free) — near-identical
  update meals set diet_tags = array['gluten_free','dairy_free']
  where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken, Rice & Broccoli'));
  delete from meals where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Chicken, Rice & Veg (Dairy-Free)'));

  -- Cottage Cheese & Cucumber — redundant with the untagged "Cottage Cheese & Everything Bagel
  -- Style", which already qualifies for gluten-free on its own ingredients (no gluten keyword hit).
  delete from meals where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cottage Cheese & Cucumber'));

  -- Cottage Cheese & Fruit Bowl — the exact pair you flagged. Redundant with "High-Protein
  -- Cottage Cheese Bowl" (Standard), which already qualifies for vegetarian on its own ingredients
  -- (no meat/fish) and is the more deliberately macro-balanced of the two.
  delete from meals where coach_id = v_coach_id and lower(trim(name)) = lower(trim('Cottage Cheese & Fruit Bowl'));

  -- Standard-batch meals that turned out to duplicate a dish already in your library:
  --   Smash Burger Bowl                    ~= Smash Burger
  --   Garlic Butter Steak Bites & Potatoes ~= Steak and Poatoes
  --   High-Protein Chicken Alfredo         ~= Creamy Chicken Pasta
  --   Chorizo & Chicken One-Pot Rice       ~= Chicken and Chorizo Rice
  --   Bagel & Peanut Butter                ~= Peanut Butter Bagel Thin
  delete from meals where coach_id = v_coach_id and lower(trim(name)) in (
    lower(trim('Smash Burger Bowl')),
    lower(trim('Garlic Butter Steak Bites & Potatoes')),
    lower(trim('High-Protein Chicken Alfredo')),
    lower(trim('Chorizo & Chicken One-Pot Rice')),
    lower(trim('Bagel & Peanut Butter'))
  );

end $$;

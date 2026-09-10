-- Two changes, per your decision to make diet tags non-exclusive:
--
-- 1. Adds `standard_eligible` — false only for meals built around a meat/dairy substitute
--    (Quorn, tofu, tempeh, a "Vegan ..." product) that a general Standard client wouldn't expect
--    to see. This is now what keeps those meals out of the Standard plan — diet_tags no longer does.
-- 2. Recomputes diet_tags for EVERY meal in your library from its actual ingredients, using the
--    exact same keyword rules as src/lib/diets.js and src/lib/mealSwaps.js (including this
--    session's fixes: noodles, lasagne, Parmesan, Halloumi, mayo, Nutella, Corn Flour, etc). A tag
--    now means "safe for this diet" — it no longer removes the meal from Standard or any other diet.
--
-- Safe to re-run — it always recomputes from what's actually in meal_ingredients right now.

alter table meals add column if not exists standard_eligible boolean not null default true;

do $$
declare
  v_coach_id uuid := (select id from profiles where email = 'annabelatherton@gmail.com');
  r record;
  v_tags text[];
  v_veg boolean;
  v_vegan boolean;
  v_gf boolean;
  v_df boolean;
  -- Plain substring matches (no word boundaries), exactly mirroring how ALLERGEN_KEYWORDS /
  -- MEAT_KEYWORDS are matched in the app (ingName.toLowerCase().includes(keyword)).
  meat_fish_shellfish constant text :=
    '(chicken|turkey|beef|steak|mince|pork|lamb|bacon|sausage|chorizo|gammon|ham|salami|pepperoni|duck|venison|meatball' ||
    '|salmon|tuna|cod|haddock|tilapia|sea bass|mackerel|trout|anchovy|sardine|halibut|basa|pollock|plaice|herring' ||
    '|prawn|shrimp|crab|lobster|scallop|clam|mussel|oyster|crayfish|langoustine|squid|octopus)';
  dairy_kw constant text :=
    '(milk|cheese|yogurt|yoghurt|cream|butter|whey|casein|lactose|cheddar|mozzarella|feta|brie|ricotta|mascarpone' ||
    '|skyr|creme|quark|fromage|parmesan|halloumi|philadelphia)';
  egg_kw constant text := '(egg|mayo)';
  gluten_kw constant text :=
    '(wheat|flour|bread|pasta|oat|barley|rye|semolina|spelt|couscous|bulgur|wrap|tortilla|bagel|sourdough' ||
    '|naan|pita|cracker|biscuit|malt|noodle|lasagne|spaghetti|macaroni|linguine|tagliatelle|rigatoni|fusilli' ||
    '|orzo|penne|panko|breadcrumb|bun|ciabatta|cibatta|crumpet|bap|panini|weetabix|hovis|warb)';
  -- Exception patterns DO use word boundaries (\y), matching src/lib/diets.js's
  -- DIET_SAFE_EXCEPTIONS exactly (VEGAN_LABELLED, PLANT_MILK etc).
  plant_milk constant text := '\y(oat|almond|soy|soya|coconut|rice|cashew)\s*milk\y';
begin
  for r in select id from meals where coach_id = v_coach_id loop

    -- Vegetarian: no meat/fish/shellfish ingredient, except Quorn/"Vegan ..." substitute products.
    v_veg := not exists (
      select 1 from meal_ingredients mi
      where mi.meal_id = r.id
        and mi.name !~* '^(quorn|vegan)\y'
        and mi.name ~* meat_fish_shellfish
    );

    -- Vegan: as vegetarian, plus no dairy/egg/honey, except "Vegan ..." products and plant milks.
    v_vegan := not exists (
      select 1 from meal_ingredients mi
      where mi.meal_id = r.id
        and mi.name !~* '^vegan\y'
        and mi.name !~* plant_milk
        and (mi.name ~* meat_fish_shellfish or mi.name ~* dairy_kw or mi.name ~* egg_kw or mi.name ~* 'honey')
    );

    -- Gluten-free: no gluten-containing ingredient, except products explicitly labelled "gluten
    -- free", and Corn Flour (contains "flour" but is actually gluten-free). No plant-milk
    -- exception here on purpose — a generic "Oat Milk" isn't guaranteed GF-certified.
    v_gf := not exists (
      select 1 from meal_ingredients mi
      where mi.meal_id = r.id
        and mi.name !~* 'gluten[\s-]?free'
        and mi.name !~* 'corn\s*flour'
        and mi.name ~* gluten_kw
    );

    -- Dairy-free: no dairy ingredient, except "Vegan ..." products, plant milks, and products
    -- explicitly labelled "dairy free".
    v_df := not exists (
      select 1 from meal_ingredients mi
      where mi.meal_id = r.id
        and mi.name !~* '^vegan\y'
        and mi.name !~* plant_milk
        and mi.name !~* 'dairy[\s-]?free'
        and mi.name ~* dairy_kw
    );

    v_tags := array[]::text[];
    if v_veg   then v_tags := v_tags || 'vegetarian'; end if;
    if v_vegan then v_tags := v_tags || 'vegan';       end if;
    if v_gf    then v_tags := v_tags || 'gluten_free'; end if;
    if v_df    then v_tags := v_tags || 'dairy_free';  end if;

    update meals set diet_tags = v_tags where id = r.id;
  end loop;

  -- Keep meat/dairy-substitute-based meals out of the Standard plan; everything else (tagged or
  -- not) stays eligible.
  update meals set standard_eligible = false
  where coach_id = v_coach_id
    and exists (
      select 1 from meal_ingredients mi
      where mi.meal_id = meals.id
        and (mi.name ~* '^(quorn|vegan)\y' or mi.name in ('Firm Tofu', 'Tempeh', 'Unsweetened Soy Milk'))
    );
  update meals set standard_eligible = true
  where coach_id = v_coach_id
    and not exists (
      select 1 from meal_ingredients mi
      where mi.meal_id = meals.id
        and (mi.name ~* '^(quorn|vegan)\y' or mi.name in ('Firm Tofu', 'Tempeh', 'Unsweetened Soy Milk'))
    );
end $$;

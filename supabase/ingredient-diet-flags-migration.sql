-- Adds explicit per-ingredient diet flags (Vegan / Gluten-Free / Dairy-Free) alongside the
-- existing is_vegetarian checkbox, so every ingredient in the library has its own tick boxes for
-- all four — matching the coach's app-side prediction (src/lib/diets.js's
-- predictIngredientDietFlags), which now pre-fills these when a new ingredient is added.
--
-- Backfills every EXISTING ingredient by the same name-keyword rules the app already uses
-- elsewhere (mirrors auto-tag-all-meals-migration.sql's keyword lists). Deliberately does NOT
-- touch is_vegetarian — that column already exists and may carry manual corrections the coach has
-- made; only the three new columns are backfilled here.
--
-- Safe to re-run — it always recomputes the three new flags from each ingredient's current name.

alter table ingredients add column if not exists is_vegan boolean not null default true;
alter table ingredients add column if not exists is_gluten_free boolean not null default true;
alter table ingredients add column if not exists is_dairy_free boolean not null default true;

do $$
declare
  v_coach_id uuid := (select id from profiles where email = 'annabelatherton@gmail.com');
  r record;
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
  plant_milk constant text := '\y(oat|almond|soy|soya|coconut|rice|cashew)\s*milk\y';
begin
  for r in select id, name from ingredients where coach_id = v_coach_id loop
    update ingredients set
      is_vegan = case
        when r.name ~* '^vegan\y' or r.name ~* plant_milk then true
        when r.name ~* meat_fish_shellfish or r.name ~* dairy_kw or r.name ~* egg_kw or r.name ~* 'honey' then false
        else true
      end,
      is_gluten_free = case
        when r.name ~* 'gluten[\s-]?free' or r.name ~* 'corn\s*flour' then true
        when r.name ~* gluten_kw then false
        else true
      end,
      is_dairy_free = case
        when r.name ~* '^vegan\y' or r.name ~* plant_milk or r.name ~* 'dairy[\s-]?free' then true
        when r.name ~* dairy_kw then false
        else true
      end
    where id = r.id;
  end loop;
end $$;

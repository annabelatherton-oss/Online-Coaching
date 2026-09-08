-- Lets each ingredient be explicitly marked vegetarian or not, shown and editable in the
-- Ingredient Library, instead of only being guessed from the ingredient's name wherever a diet
-- is checked. Defaults to true since most foods in a typical library are vegetarian; the coach
-- can untick it for anything that genuinely isn't.
alter table ingredients add column if not exists is_vegetarian boolean not null default true;

-- Backfill: mark the existing library's genuine meat/fish/shellfish items as not vegetarian.
-- Everything else already in the library (all the Carbohydrates/Fats/Vegetables/Toppings/Snacks,
-- plus the vegetarian-friendly Protein items like eggs/yogurt/cottage cheese/beans/chickpeas, and
-- the Quorn range) is left at the true default.
update ingredients
set is_vegetarian = false
where coach_id = (select id from profiles where email = 'annabelatherton@gmail.com')
  and name in (
    '5% Fat Chicken Mince (raw)',
    '5% Fat Mince (Uncooked)',
    'Bacon Medallions',
    'Chicken (Cooked)',
    'Chicken (Raw)',
    'Chicken Chipolata Sausages',
    'Chicken Sausages',
    'Cooked Chicken',
    'Chorizo',
    'Gammon',
    'Roast Chicken Wafer Thin Slices',
    'Ready Cooked Chicken',
    'Salmon Fillet',
    'Sirloin Steak (Raw)',
    'Turkey Slice',
    'Tuna',
    'Wafer Thin Honey Roast Ham',
    'Beef Stock Cube',
    'Chicken Stock Cube',
    'Oyster Sauce'
  );

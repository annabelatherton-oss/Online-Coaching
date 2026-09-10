-- Lets you mark two ingredients as interchangeable once, on the Ingredient Library itself
-- (e.g. Bagel <-> Bagel Thin), instead of adding the swap on every recipe that uses them.
-- Stored as a symmetric pair — the app always writes both directions when you add a swap in
-- the Ingredients Library, so it doesn't matter which of the two ingredients you set it on.
--
-- Calorie-tier generation (src/lib/calorieTierScaling.js) automatically picks these up for any
-- meal that includes either ingredient, alongside any meal-specific swaps you've set in the Meal
-- Editor — the two are combined, not either/or.

create table if not exists ingredient_swaps (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid references profiles(id) on delete cascade not null,
  ingredient_id uuid references ingredients(id) on delete cascade not null,
  alternative_ingredient_id uuid references ingredients(id) on delete cascade not null,
  created_at timestamptz default now(),
  check (ingredient_id <> alternative_ingredient_id),
  unique (ingredient_id, alternative_ingredient_id)
);

alter table ingredient_swaps enable row level security;

create policy "Coaches manage own ingredient swaps"
on ingredient_swaps for all
to authenticated
using (coach_id = auth.uid())
with check (coach_id = auth.uid());

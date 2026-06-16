-- Ingredient library
create table if not exists ingredients (
  id uuid default gen_random_uuid() primary key,
  coach_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  serving_size numeric(8,2) default 100 not null,
  serving_unit text default 'g' not null,
  calories_per_serving numeric(8,2) default 0 not null,
  protein_per_serving numeric(8,2) default 0 not null,
  carbs_per_serving numeric(8,2) default 0 not null,
  fat_per_serving numeric(8,2) default 0 not null,
  created_at timestamptz default now()
);

alter table ingredients enable row level security;

create policy "Coaches manage own ingredients"
on ingredients for all
to authenticated
using (coach_id = auth.uid())
with check (coach_id = auth.uid());

-- Add optional link from meal_ingredients to the library
alter table meal_ingredients
  add column if not exists ingredient_id uuid references ingredients(id) on delete set null;

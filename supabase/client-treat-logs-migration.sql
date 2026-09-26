-- Lets a client log an "off plan" treat/snack they've eaten (a chocolate bar, a beer, etc.) so it
-- gets tracked and weighed against their remaining calories/macros for the day, without it being
-- part of their actual meal plan slots. Kept as its own log table rather than reusing
-- client_everyday_meals (that table is exactly one fixed meal per named plan slot — the opposite
-- shape of an unbounded, timestamped, ad-hoc list of extras) or client_week_meals (that's the plan
-- itself). Macros are snapshotted onto the row at log time (same pattern as meal_ingredients) so a
-- later edit/delete of the underlying ingredient never changes what a past day's log says was eaten.
create table if not exists client_treat_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  coach_id uuid references profiles(id),
  ingredient_id uuid references ingredients(id) on delete set null,
  name text not null,
  servings numeric(8,2) not null default 1,
  calories numeric(8,2) not null default 0,
  protein_g numeric(8,2) not null default 0,
  carbs_g numeric(8,2) not null default 0,
  fat_g numeric(8,2) not null default 0,
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists client_treat_logs_client_logged_idx on client_treat_logs (client_id, logged_at desc);

alter table client_treat_logs enable row level security;

drop policy if exists "client_treat_logs_client_all" on client_treat_logs;
create policy "client_treat_logs_client_all" on client_treat_logs
  for all
  using (client_id in (select id from clients where profile_id = auth.uid()))
  with check (client_id in (select id from clients where profile_id = auth.uid()));

drop policy if exists "client_treat_logs_coach_all" on client_treat_logs;
create policy "client_treat_logs_coach_all" on client_treat_logs
  for all
  using (client_id in (select id from clients where coach_id = auth.uid()))
  with check (client_id in (select id from clients where coach_id = auth.uid()));

-- ─── Seed a handful of common treats/chocolate bars into the ingredient library ─────────────────
-- A few "snacks" already existed (Digestive Biscuit, Kinder Bar, Dairy Milk Little Bar, Twirl Bar)
-- — these add more variety so there's a decent list to log against straight away. Safe to re-run:
-- unique (coach_id, name) means anything already present by that exact name is left untouched.
insert into ingredients (coach_id, name, category, serving_size, serving_unit, calories_per_serving, protein_per_serving, carbs_per_serving, fat_per_serving)
select (select id from profiles where email = 'annabelatherton@gmail.com'), v.name, 'snacks', v.serving_size, v.serving_unit, v.calories, v.protein, v.carbs, v.fat
from (values
  ('Snickers Bar (48g)', 1, 'bar', 250, 4.7, 27.2, 12.3),
  ('Mars Bar (51g)', 1, 'bar', 228, 2.2, 33.5, 8.9),
  ('Twix Bar (2 Finger, 50g)', 1, 'bar', 245, 2.4, 32.4, 12.0),
  ('Galaxy Bar (42g)', 1, 'bar', 224, 3.0, 24.3, 12.7),
  ('Maltesers (37g Bag)', 1, 'bag', 188, 2.5, 22.8, 9.3),
  ('Walkers Ready Salted Crisps (25g)', 1, 'bag', 133, 1.4, 12.9, 8.4),
  ('Doritos Chilli Heatwave (30g)', 1, 'bag', 152, 1.9, 17.4, 7.8),
  ('Jaffa Cake', 1, 'cake', 46, 0.5, 9.1, 0.7),
  ('Oreo Biscuit', 1, 'biscuit', 53, 0.5, 7.6, 2.3),
  ('Ben & Jerry''s Ice Cream (100g)', 100, 'g', 249, 3.7, 24.0, 15.0),
  ('Glass of Red Wine (175ml)', 175, 'ml', 160, 0.1, 4.5, 0),
  ('Pint of Lager (568ml, 4%)', 568, 'ml', 222, 2.0, 17.0, 0),
  ('Gin & Slimline Tonic (single)', 1, 'drink', 61, 0, 0.2, 0)
) as v(name, serving_size, serving_unit, calories, protein, carbs, fat)
on conflict (coach_id, name) do nothing;

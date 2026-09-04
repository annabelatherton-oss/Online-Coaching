-- Ingredient dislike/swap system + "everyday meals" (same meals every day) feature.
--
-- Dislikes themselves stay on clients.dislikes (text[], unchanged schema) — the
-- picker UI now sources its options from the ingredients library instead of free
-- text, but still writes exact ingredient names into that same column, so all
-- existing conflict-matching logic (name substring match) keeps working.
--
-- What's new here is what happens once a dislike is flagged: a coach can define
-- either a global "always swap this ingredient for that one" rule, or a
-- meal-specific "standard swap" that only applies inside one particular meal.
-- Both are then applied automatically wherever that client's plan is shown.

-- ─── Global ingredient swap (macro-matched, applies to every meal) ────────────
create table if not exists client_ingredient_swaps (
  id                uuid        primary key default gen_random_uuid(),
  client_id         uuid        not null references clients(id) on delete cascade,
  dislike_name      text        not null,
  to_ingredient_id  uuid        not null references ingredients(id) on delete cascade,
  created_at        timestamptz not null default now(),
  unique (client_id, dislike_name)
);

alter table client_ingredient_swaps enable row level security;

drop policy if exists "client_ingredient_swaps_coach_all" on client_ingredient_swaps;
create policy "client_ingredient_swaps_coach_all" on client_ingredient_swaps
  for all
  using (client_id in (select id from clients where coach_id = auth.uid()))
  with check (client_id in (select id from clients where coach_id = auth.uid()));

drop policy if exists "client_ingredient_swaps_client_select" on client_ingredient_swaps;
create policy "client_ingredient_swaps_client_select" on client_ingredient_swaps
  for select
  using (client_id in (select id from clients where profile_id = auth.uid()));

-- ─── Per-meal "standard swap" (reusable across clients, lazily created) ───────
-- Not populated until a coach actually needs one for a specific meal + dislike
-- combination; from then on it's offered as the ready-made fix for any other
-- client who hits the same combination.
create table if not exists meal_swap_options (
  id            uuid        primary key default gen_random_uuid(),
  meal_id       uuid        not null references meals(id) on delete cascade,
  dislike_name  text        not null,
  label         text,
  ingredients   jsonb       not null default '[]',
  created_at    timestamptz not null default now(),
  unique (meal_id, dislike_name)
);

alter table meal_swap_options enable row level security;

drop policy if exists "meal_swap_options_coach_all" on meal_swap_options;
create policy "meal_swap_options_coach_all" on meal_swap_options
  for all
  using (meal_id in (select id from meals where coach_id = auth.uid()))
  with check (meal_id in (select id from meals where coach_id = auth.uid()));

drop policy if exists "meal_swap_options_client_select" on meal_swap_options;
create policy "meal_swap_options_client_select" on meal_swap_options
  for select
  using (meal_id in (
    select m.id from meals m
    join clients c on c.coach_id = m.coach_id
    where c.profile_id = auth.uid()
  ));

-- ─── Coach notification tracking ──────────────────────────────────────────────
-- One row per (client, meal, dislike): 'meal_swap'/'ingredient_swap' means a rule
-- resolved it automatically ("this meal was changed"), 'needs_review' means the
-- client dislikes something in this meal but no rule exists yet ("this meal needs
-- changing"). Lets the dashboard flag either case until the coach checks it off.
create table if not exists client_meal_swap_acks (
  id             uuid        primary key default gen_random_uuid(),
  client_id      uuid        not null references clients(id) on delete cascade,
  meal_id        uuid        not null references meals(id) on delete cascade,
  dislike_name   text        not null,
  resolution     text        not null check (resolution in ('meal_swap', 'ingredient_swap', 'needs_review')),
  acknowledged   boolean     not null default false,
  created_at     timestamptz not null default now(),
  unique (client_id, meal_id, dislike_name)
);

alter table client_meal_swap_acks enable row level security;

drop policy if exists "client_meal_swap_acks_coach_all" on client_meal_swap_acks;
create policy "client_meal_swap_acks_coach_all" on client_meal_swap_acks
  for all
  using (client_id in (select id from clients where coach_id = auth.uid()))
  with check (client_id in (select id from clients where coach_id = auth.uid()));

drop policy if exists "client_meal_swap_acks_client_all" on client_meal_swap_acks;
create policy "client_meal_swap_acks_client_all" on client_meal_swap_acks
  for all
  using (client_id in (select id from clients where profile_id = auth.uid()))
  with check (client_id in (select id from clients where profile_id = auth.uid()));

-- ─── Everyday meals: a client-picked set of meals they eat every day ─────────
-- This is a separate, always-available section on the client's meal plan —
-- not a mode that replaces their weekly rotating plan. Breakfast/lunch/dinner
-- are picked directly by the client from the coach's meal database; the coach
-- can then adjust quantities. Pre-workout and evening snack can only be
-- *requested* by the client (requested_meal_id) — the coach approves or
-- declines before it takes effect (meal_id).
alter table clients add column if not exists everyday_meals_enabled boolean not null default false;

create table if not exists client_everyday_meals (
  id                    uuid        primary key default gen_random_uuid(),
  client_id             uuid        not null references clients(id) on delete cascade,
  slot_type             meal_slot_type not null,
  meal_id               uuid        references meals(id) on delete set null,
  requested_meal_id     uuid        references meals(id) on delete set null,
  ingredient_overrides  jsonb       not null default '{}',
  needs_coach_review    boolean     not null default false,
  updated_at            timestamptz not null default now(),
  unique (client_id, slot_type)
);

alter table client_everyday_meals add column if not exists requested_meal_id uuid references meals(id) on delete set null;

alter table client_everyday_meals enable row level security;

drop policy if exists "client_everyday_meals_coach_all" on client_everyday_meals;
create policy "client_everyday_meals_coach_all" on client_everyday_meals
  for all
  using (client_id in (select id from clients where coach_id = auth.uid()))
  with check (client_id in (select id from clients where coach_id = auth.uid()));

drop policy if exists "client_everyday_meals_client_all" on client_everyday_meals;
create policy "client_everyday_meals_client_all" on client_everyday_meals
  for all
  using (client_id in (select id from clients where profile_id = auth.uid()))
  with check (client_id in (select id from clients where profile_id = auth.uid()));

-- ─── Fix: clients could never save their own meal swaps ──────────────────────
-- client_week_meals only ever had a SELECT policy for clients (coaches had
-- full access) — a pre-existing bug unrelated to this feature that meant a
-- client tapping "Swap" on their own meal plan and hitting Save silently
-- failed. Needed now regardless, since the dislike-swap and everyday-meals
-- features both rely on clients being able to persist their own plan edits.
drop policy if exists "clients view own week meals" on client_week_meals;
drop policy if exists "clients manage own week meals" on client_week_meals;
create policy "clients manage own week meals" on client_week_meals
  for all
  using (client_id in (select id from clients where profile_id = auth.uid()))
  with check (client_id in (select id from clients where profile_id = auth.uid()));

-- Lets a client pick, per day, which of their meal options they're actually following — Option A,
-- Option B, or their fixed "Everyday meals" set (see client_everyday_meals) — on the My Daily Plan
-- page (ClientTodoList.jsx), rather than the app assuming every plan meal is eaten every day.
create table if not exists client_daily_meal_choice (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  log_date date not null,
  choice text not null check (choice in ('a', 'b', 'everyday')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, log_date)
);

create index if not exists client_daily_meal_choice_client_date_idx on client_daily_meal_choice (client_id, log_date);

alter table client_daily_meal_choice enable row level security;

drop policy if exists "client_daily_meal_choice_client_all" on client_daily_meal_choice;
create policy "client_daily_meal_choice_client_all" on client_daily_meal_choice
  for all
  using (client_id in (select id from clients where profile_id = auth.uid()))
  with check (client_id in (select id from clients where profile_id = auth.uid()));

drop policy if exists "client_daily_meal_choice_coach_all" on client_daily_meal_choice;
create policy "client_daily_meal_choice_coach_all" on client_daily_meal_choice
  for all
  using (client_id in (select id from clients where coach_id = auth.uid()))
  with check (client_id in (select id from clients where coach_id = auth.uid()));

-- client_daily_meal_log (see client-daily-meal-log-migration.sql) originally stored just an
-- eaten/not-eaten flag per slot for the Meal Plan tab; it's moved to the My Daily Plan page and now
-- needs a serving multiplier instead, so a client can scale a meal up or down that day (e.g. eating
-- less of dinner to make room for a treat) without touching their standing weekly plan. 0 means
-- skipped entirely, 1 is a normal full serving.
alter table client_daily_meal_log add column if not exists quantity_multiplier numeric not null default 1;

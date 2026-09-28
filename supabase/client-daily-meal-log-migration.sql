-- Lets a client mark, for today only, which of their planned meals (Breakfast A/B, Lunch A/B,
-- Dinner A/B) they actually ate — so "remaining macros" (see client_treat_logs) reflects reality
-- rather than always assuming the full day's plan was eaten. Unchecking a meal here never touches
-- the client's actual weekly plan (client_week_meals) — it's purely a per-day, resets-tomorrow log,
-- same pattern as client_treat_logs' logged_at-scoped rows.
create table if not exists client_daily_meal_log (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  log_date date not null,
  slot_key text not null,
  eaten boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, log_date, slot_key)
);

create index if not exists client_daily_meal_log_client_date_idx on client_daily_meal_log (client_id, log_date);

alter table client_daily_meal_log enable row level security;

drop policy if exists "client_daily_meal_log_client_all" on client_daily_meal_log;
create policy "client_daily_meal_log_client_all" on client_daily_meal_log
  for all
  using (client_id in (select id from clients where profile_id = auth.uid()))
  with check (client_id in (select id from clients where profile_id = auth.uid()));

drop policy if exists "client_daily_meal_log_coach_all" on client_daily_meal_log;
create policy "client_daily_meal_log_coach_all" on client_daily_meal_log
  for all
  using (client_id in (select id from clients where coach_id = auth.uid()))
  with check (client_id in (select id from clients where coach_id = auth.uid()));

-- Add per-client measurement collection flag
alter table clients add column if not exists collect_measurements boolean default false not null;

-- Weekly check-in submissions
create table if not exists client_checkins (
  id              uuid        primary key default gen_random_uuid(),
  client_id       uuid        references clients(id) on delete cascade not null,
  coach_id        uuid        not null,
  week_number     int         not null,
  submitted_at    timestamptz default now() not null,
  updated_at      timestamptz default now() not null,
  weight_kg       numeric,
  waist_cm        numeric,
  hips_cm         numeric,
  energy_level    int         check (energy_level between 1 and 5),
  sleep_quality   int         check (sleep_quality between 1 and 5),
  adherence       int         check (adherence between 1 and 5),
  notes           text,
  unique(client_id, week_number)
);

alter table client_checkins enable row level security;

-- Clients can read and write their own check-ins
create policy "client_checkins_client_all" on client_checkins
  for all
  using  (client_id in (select id from clients where profile_id = auth.uid()))
  with check (client_id in (select id from clients where profile_id = auth.uid()));

-- Coaches can read check-ins for their clients
create policy "client_checkins_coach_select" on client_checkins
  for select
  using (coach_id = auth.uid());

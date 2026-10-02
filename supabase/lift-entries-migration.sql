-- Manual lift log entries — lets a coach backfill a client's previous lift history (weight/reps on
-- a given date) independently of an actual submitted check-in, the same way weight_entries already
-- lets a past body weight be logged without one. Mirrors weight_entries' table shape and RLS.
create table if not exists lift_entries (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references clients(id) on delete cascade,
  lift_name    text not null,
  weight_kg    numeric(6,2) not null,
  reps         int not null,
  recorded_at  date not null default current_date,
  created_at   timestamptz not null default now()
);

alter table lift_entries enable row level security;

create policy "Coach can manage client lift entries"
  on lift_entries for all
  using (exists (select 1 from clients c where c.id = lift_entries.client_id and c.coach_id = auth.uid()))
  with check (exists (select 1 from clients c where c.id = lift_entries.client_id and c.coach_id = auth.uid()));

create policy "Client can manage own lift entries"
  on lift_entries for all
  using (exists (select 1 from clients c where c.id = lift_entries.client_id and c.profile_id = auth.uid()))
  with check (exists (select 1 from clients c where c.id = lift_entries.client_id and c.profile_id = auth.uid()));

create index if not exists idx_lift_entries_client on lift_entries (client_id, recorded_at);

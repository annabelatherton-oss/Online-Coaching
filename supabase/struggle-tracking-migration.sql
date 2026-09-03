-- Tracks each client's check-in "struggles" over time so the coach can see
-- how long an issue has been going on, read the client's weekly progress
-- comment against it, and get notified once the client says they're ok
-- with it now.

-- Per-week free-text update against each ongoing struggle (keyed by the
-- struggle label, e.g. {"Snacking between meals": "Better this week..."}).
alter table client_checkins
  add column if not exists struggle_comments jsonb not null default '{}'::jsonb;

create table if not exists client_struggle_tracking (
  id               uuid        primary key default gen_random_uuid(),
  client_id        uuid        references clients(id) on delete cascade not null,
  coach_id         uuid        not null,
  label            text        not null,
  status           text        not null default 'open' check (status in ('open', 'resolved')),
  first_checkin_id uuid        references client_checkins(id) on delete set null,
  resolved_at      timestamptz,
  coach_seen_resolved boolean  not null default false,
  created_at       timestamptz default now() not null,
  updated_at       timestamptz default now() not null
);

-- Only one open row per client+label at a time — resolving and later
-- re-selecting the same struggle starts a fresh open row (a new instance).
create unique index if not exists client_struggle_tracking_open_unique
  on client_struggle_tracking (client_id, label)
  where status = 'open';

alter table client_struggle_tracking enable row level security;

create policy "client_struggle_tracking_client_all" on client_struggle_tracking
  for all
  using  (client_id in (select id from clients where profile_id = auth.uid()))
  with check (client_id in (select id from clients where profile_id = auth.uid()));

create policy "client_struggle_tracking_coach_select" on client_struggle_tracking
  for select
  using (coach_id = auth.uid());

-- Lets the coach acknowledge a "they're ok with it now" notification
-- (sets coach_seen_resolved = true).
create policy "client_struggle_tracking_coach_update" on client_struggle_tracking
  for update
  using (coach_id = auth.uid());

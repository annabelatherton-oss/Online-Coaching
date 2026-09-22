-- Logs client-initiated changes worth surfacing to the coach — the coach gets a push straight
-- away (see send-day-preference-notification), and every log row also shows up attached to
-- whichever check-in the client submits next (see CheckinsTab in CoachClientProfile.jsx), so
-- nothing gets missed even if the coach doesn't act on the push right away.
--
-- Deliberately generic (client_id/coach_id/message/created_at) rather than one column per change
-- type, so other client-editable fields can log into it the same way later — today only training
-- availability (day_preferences) writes to it.
create table if not exists client_activity_log (
  id         uuid        primary key default gen_random_uuid(),
  client_id  uuid        references clients(id) on delete cascade not null,
  coach_id   uuid        not null,
  message    text        not null,
  created_at timestamptz default now() not null
);

create index if not exists client_activity_log_client_idx on client_activity_log (client_id, created_at);

alter table client_activity_log enable row level security;

-- A client may only log against their own client row, and only with their own actual coach_id
-- (looked up server-side from that same row) — never an arbitrary one they pass in.
create policy "client_activity_log_client_insert" on client_activity_log
  for insert
  with check (
    client_id in (select id from clients where profile_id = auth.uid())
    and coach_id = (select coach_id from clients where id = client_activity_log.client_id)
  );

create policy "client_activity_log_client_select" on client_activity_log
  for select
  using (client_id in (select id from clients where profile_id = auth.uid()));

create policy "client_activity_log_coach_select" on client_activity_log
  for select
  using (coach_id = auth.uid());

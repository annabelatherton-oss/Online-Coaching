-- Logs every time a client's calorie target actually changes, so a coach can see how long they
-- were on each number rather than only ever seeing the current one. Written from the single shared
-- writeCalorieTarget() helper every screen already goes through to change it (Overview, Meal Plan
-- tab, check-in responses), so this captures every real change in one place regardless of which
-- screen it came from — not just a per-table trigger that would miss some of them.
create table if not exists client_calorie_history (
  id             uuid primary key default gen_random_uuid(),
  client_id      uuid not null references clients(id) on delete cascade,
  calorie_target integer,
  changed_at     timestamptz not null default now()
);

create index if not exists client_calorie_history_client_idx on client_calorie_history(client_id, changed_at);

alter table client_calorie_history enable row level security;

create policy "Coach manages calorie history for own clients"
  on client_calorie_history for all
  using (exists (select 1 from clients c where c.id = client_calorie_history.client_id and c.coach_id = auth.uid()))
  with check (exists (select 1 from clients c where c.id = client_calorie_history.client_id and c.coach_id = auth.uid()));

create policy "Client reads own calorie history"
  on client_calorie_history for select
  using (client_id in (select id from clients where profile_id = auth.uid()));

-- Backfill: seed one history row per client from weekly_deliveries (every past check-in response
-- or plan assignment already recorded the calorie_target delivered that week), so existing clients
-- get a real history instead of starting from a blank slate. Only the first delivery of each
-- distinct calorie_target in chronological order is kept (consecutive repeats collapse to one row,
-- same as how the live code only logs on an actual change).
insert into client_calorie_history (client_id, calorie_target, changed_at)
select client_id, calorie_target, delivered_at
from (
  select
    client_id, calorie_target, delivered_at,
    lag(calorie_target) over (partition by client_id order by delivered_at) as prev_target
  from weekly_deliveries
  where calorie_target is not null
) d
where prev_target is null or prev_target is distinct from calorie_target
order by client_id, delivered_at;

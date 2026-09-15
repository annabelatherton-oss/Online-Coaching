-- Tracks the meal combination that was actually live (current_week) for each calorie tier of a
-- plan group, at the moment the coach moved off that week — i.e. "what a client on this tier
-- actually received." Only the latest snapshot per (plan_group, tier, week) is kept: enough to
-- tell whether that week's meals today still match what was last sent (safe to reuse as-is) or
-- have changed since (worth a check before the rotation reaches it again).
create table if not exists plan_week_sends (
  id               uuid        primary key default gen_random_uuid(),
  plan_group_id    uuid        not null references plan_groups(id) on delete cascade,
  calorie_tier     integer     not null,
  week_number      integer     not null,
  meal_combination jsonb       not null,
  sent_at          timestamptz not null default now(),
  unique (plan_group_id, calorie_tier, week_number)
);

alter table plan_week_sends enable row level security;

create policy "plan_week_sends_coach_all" on plan_week_sends
  for all
  using (plan_group_id in (select id from plan_groups where coach_id = auth.uid()))
  with check (plan_group_id in (select id from plan_groups where coach_id = auth.uid()));

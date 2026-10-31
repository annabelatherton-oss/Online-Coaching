-- Diagnoses "week shows as 1 for Maddie" — the app computes her week number from
-- clients.start_date (calendar weeks elapsed since then), falling back to just counting her
-- actual check-in submissions only if start_date is missing or looks wrong (e.g. set to a date
-- after some of her check-ins were actually submitted) — that fallback is almost certainly what's
-- showing "Week 1" here. Run this and send back what it prints.

select
  p.full_name,
  c.id as client_id,
  c.start_date,
  c.is_active,
  c.is_paused
from clients c
join profiles p on p.id = c.profile_id
where p.full_name ilike '%maddie%';

-- Her active plan assignment + plan group's own current_week/cycle
select
  a.id as assignment_id,
  a.week_override,
  a.plan_group_id,
  a.calorie_target,
  a.active,
  g.current_week as group_current_week,
  g.cycle as group_cycle
from client_plan_assignments a
join clients c on c.id = a.client_id
join profiles p on p.id = c.profile_id
left join plan_groups g on g.id = a.plan_group_id
where p.full_name ilike '%maddie%' and a.active = true;

-- Every real check-in she's submitted, oldest first, with the date the app's week math actually
-- uses (submitted_at, falling back to updated_at)
select
  ci.week_number,
  ci.submitted_at,
  ci.updated_at,
  coalesce(ci.submitted_at, ci.updated_at) as date_used_for_week_calc
from client_checkins ci
join clients c on c.id = ci.client_id
join profiles p on p.id = c.profile_id
where p.full_name ilike '%maddie%'
order by ci.week_number asc;

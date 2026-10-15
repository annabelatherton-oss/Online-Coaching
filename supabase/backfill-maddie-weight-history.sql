-- Backfills Maddie's weight history (weeks 0-5) and the calorie targets that went with them, from:
--   Week  Weight(kg)  Calories
--   0     51.2        1900
--   1     51.9        1800
--   2     52.2        1800
--   3     52.2        1800
--   4     51.9        1900
--   5     51.7        2000
--
-- Dates are computed from her own start_date + (week_number * 7 days), same convention the app
-- uses everywhere else for turning a week number into a calendar date. Safe to re-run — each
-- insert is guarded so it won't create a duplicate if it's already there.

do $$
declare
  v_coach_id   uuid;
  v_client_id  uuid;
  v_start_date date;
begin
  select id into v_coach_id from profiles where email = 'annabelatherton@gmail.com' limit 1;
  if v_coach_id is null then raise exception 'Coach not found'; end if;

  select c.id, c.start_date into v_client_id, v_start_date
  from clients c join profiles p on p.id = c.profile_id
  where c.coach_id = v_coach_id and (p.full_name ilike 'Madison%' or p.full_name ilike 'Maddie%')
  limit 1;
  if v_client_id is null then raise exception 'Maddie/Madison not found under this coach'; end if;

  -- Weight history
  insert into weight_entries (client_id, weight_kg, week_number, recorded_at, from_checkin)
  select v_client_id, w.weight_kg, w.week_number, v_start_date + (w.week_number * interval '7 days'), false
  from (values (0, 51.2),(1, 51.9),(2, 52.2),(3, 52.2),(4, 51.9),(5, 51.7)) as w(week_number, weight_kg)
  where not exists (
    select 1 from weight_entries we
    where we.client_id = v_client_id and we.week_number = w.week_number and we.weight_kg = w.weight_kg
  );

  -- Calorie history — one row per actual change (1900 -> 1800 at week 1, 1800 -> 1900 at week 4,
  -- 1900 -> 2000 at week 5), same as how the live app logs it, not one row per week.
  insert into client_calorie_history (client_id, calorie_target, changed_at)
  select v_client_id, c.calorie_target, v_start_date + (c.week_number * interval '7 days')
  from (values (0, 1900),(1, 1800),(4, 1900),(5, 2000)) as c(week_number, calorie_target)
  where not exists (
    select 1 from client_calorie_history h
    where h.client_id = v_client_id and h.calorie_target = c.calorie_target
      and h.changed_at::date = (v_start_date + (c.week_number * interval '7 days'))::date
  );
end $$;

-- Preview the result
select 'weight' as kind, week_number::text, weight_kg::text as value, recorded_at::date::text as date
from weight_entries where client_id = (select c.id from clients c join profiles p on p.id = c.profile_id where (p.full_name ilike 'Madison%' or p.full_name ilike 'Maddie%') and c.coach_id = (select id from profiles where email = 'annabelatherton@gmail.com') limit 1)
union all
select 'calories', null, calorie_target::text, changed_at::date::text
from client_calorie_history where client_id = (select c.id from clients c join profiles p on p.id = c.profile_id where (p.full_name ilike 'Madison%' or p.full_name ilike 'Maddie%') and c.coach_id = (select id from profiles where email = 'annabelatherton@gmail.com') limit 1)
order by date;

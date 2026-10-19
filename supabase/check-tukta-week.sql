-- Tukta's account is showing Week 1 somewhere even though her last check-in was for Week 5 and
-- she should be on Week 5/6 now. Several different things can drive "what week" for a client —
-- her own start_date, a personal override on her plan assignment, the shared plan group's current
-- week, and her actual check-in history — so this pulls all of them to see which one is stuck.

select 'client' as what, c.id::text as val1, c.start_date::text as val2, null as val3
from clients c
join profiles p on p.id = c.profile_id
where p.full_name ilike 'Tukta%'

union all

select 'assignment', a.id::text, a.week_override::text, a.plan_group_id::text
from client_plan_assignments a
join clients c on c.id = a.client_id
join profiles p on p.id = c.profile_id
where p.full_name ilike 'Tukta%' and a.active = true

union all

select 'plan_group', pg.id::text, pg.current_week::text, pg.name
from plan_groups pg
where pg.id in (
  select a.plan_group_id from client_plan_assignments a
  join clients c on c.id = a.client_id
  join profiles p on p.id = c.profile_id
  where p.full_name ilike 'Tukta%' and a.active = true
)

union all

select 'checkin ' || ck.week_number::text, ck.id::text, ck.submitted_at::text, ck.updated_at::text
from client_checkins ck
join clients c on c.id = ck.client_id
join profiles p on p.id = c.profile_id
where p.full_name ilike 'Tukta%'

order by what;

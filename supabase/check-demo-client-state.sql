-- Before seeding fake progress data for the demo/video client account, check what's already there
-- so the backfill doesn't duplicate or clash with anything real.

select c.id as client_id, c.coach_id, c.start_date, c.top_lifts, p.full_name, p.email
from clients c
join profiles p on p.id = c.profile_id
where p.email = 'annabelatherton+client@gmail.com';

select 'checkin' as kind, week_number::text, weight_kg::text, lift_results::text, submitted_at::text
from client_checkins
where client_id = (select c.id from clients c join profiles p on p.id = c.profile_id where p.email = 'annabelatherton+client@gmail.com')
union all
select 'weight_entry', week_number::text, weight_kg::text, null, recorded_at::text
from weight_entries
where client_id = (select c.id from clients c join profiles p on p.id = c.profile_id where p.email = 'annabelatherton+client@gmail.com')
order by kind, week_number;

-- The "How was this week?" 1-5 ratings are deliberately hidden on a client's very first-ever
-- check-in (week_number = 0, the "Starting Check-in") — ratings don't make sense before any week
-- has actually happened yet. So missing ratings there is expected, not a bug.
--
-- This lists every check-in with any rating missing, split into those two cases: week_number = 0
-- (expected — nothing to fix) vs week_number > 0 (should be impossible, since submission is
-- blocked without all 4 ratings for a real week — if any of these show up, that's a real bug worth
-- flagging back).
select
  p.full_name as client_name,
  cc.week_number,
  case when cc.week_number = 0 then 'expected (starting check-in)' else 'unexpected — investigate' end as status,
  cc.energy_level, cc.sleep_quality, cc.food_adherence, cc.gym_adherence,
  cc.submitted_at, cc.updated_at
from client_checkins cc
join clients c on c.id = cc.client_id
join profiles p on p.id = c.profile_id
where cc.energy_level is null or cc.sleep_quality is null or cc.food_adherence is null or cc.gym_adherence is null
order by (cc.week_number > 0) desc, client_name, cc.week_number;

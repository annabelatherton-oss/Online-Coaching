-- What every other tier (and the shared Standard template) has in Breakfast A for week 4 of
-- Danielle's plan group — normally the same meal is used across every tier for a given week/slot,
-- just scaled differently, so whatever shows up consistently here is almost certainly what her
-- 2000kcal tier is missing.
select
  coalesce(wt.calorie_tier::text, 'Standard') as tier,
  m.name as breakfast_a_meal,
  tms.meal_id
from weekly_templates wt
join template_meal_slots tms on tms.template_id = wt.id and tms.slot_type = 'breakfast1'
left join meals m on m.id = tms.meal_id
where wt.plan_group_id = (select plan_group_id from weekly_templates where id = '4016070e-4640-42e2-8f81-b34424d5afdd')
  and wt.week_number = 4
order by wt.calorie_tier nulls first;

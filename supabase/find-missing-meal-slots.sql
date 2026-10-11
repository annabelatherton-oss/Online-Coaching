-- Finds every currently-assigned client/week/tier whose weekly template is missing a meal for one
-- of the 6 "Option A/B" slots (breakfast1/2, lunch1/2, dinner1/2) — either the slot row doesn't
-- exist at all, or it exists with meal_id left null. A client viewing a week like that only sees
-- one option for that meal (or none) with no indication anything's missing, which is what showed
-- up for Danielle's breakfast. Run this to see whether it's isolated to her or wider.

with expected_slots(slot_type) as (
  values ('breakfast1'), ('breakfast2'), ('lunch1'), ('lunch2'), ('dinner1'), ('dinner2')
),
active_client_weeks as (
  -- Every active client's CURRENT week/tier (the one they'd actually see right now) — not every
  -- week ever templated, since an old/future week being incomplete is lower urgency.
  select
    c.id as client_id,
    p.full_name as client_name,
    cpa.plan_group_id,
    coalesce(cpa.week_override, pg.current_week) as week_number,
    cpa.calorie_target as tier
  from clients c
  join profiles p on p.id = c.profile_id
  join client_plan_assignments cpa on cpa.client_id = c.id and cpa.active = true
  join plan_groups pg on pg.id = cpa.plan_group_id
  where c.is_paused = false and c.is_archived = false
)
select
  acw.client_name,
  acw.week_number,
  acw.tier,
  es.slot_type as missing_slot,
  wt.id as template_id,
  wt.calorie_tier as template_tier
from active_client_weeks acw
cross join expected_slots es
left join weekly_templates wt
  on wt.plan_group_id = acw.plan_group_id
  and wt.week_number = acw.week_number
  and (
    -- tier-specific template if this client's tier has its own, else the shared Standard one
    wt.calorie_tier = acw.tier
    or (wt.calorie_tier is null and not exists (
      select 1 from weekly_templates wt2
      where wt2.plan_group_id = acw.plan_group_id and wt2.week_number = acw.week_number and wt2.calorie_tier = acw.tier
    ))
  )
left join template_meal_slots tms
  on tms.template_id = wt.id and tms.slot_type = es.slot_type
where tms.id is null or tms.meal_id is null
order by acw.client_name, acw.week_number, es.slot_type;

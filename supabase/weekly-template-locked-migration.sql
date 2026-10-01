-- Marks a specific (week, calorie tier) combination as approved by the coach and frozen — once
-- locked, nothing (manual edits, "Optimise combinations", fill-blank-slots) can change its meal
-- choices, and its ingredient amounts are pinned via template_meal_slots.ingredient_overrides so a
-- later change to the underlying meal's recipe can't silently alter it either. Set only by the
-- "Approve" button in the Plan Group editor (src/pages/coach/PlanGroupEditor.jsx approveWeek) —
-- never automatically, since only the coach can judge a week's combination is actually good.
alter table weekly_templates add column if not exists locked boolean not null default false;

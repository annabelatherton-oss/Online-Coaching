-- A plan group never recorded which diet it was built for — "Create a diet variant" in Generate
-- Templates only used that choice once, transiently, to pick substitute meals while cloning, then
-- threw it away. Without it, every meal picker in Plan Group Editor (the per-slot dropdown, the
-- "Swap with…" picker) had no way to filter out meals that don't belong in that diet, so a coach
-- editing a vegetarian plan could freely assign a meat-based meal to it.
alter table plan_groups add column if not exists diet_key text;

-- Backfill for existing plan groups created before this column existed: infer the diet from the
-- plan's own name, which "Create a diet variant" always sets to "<Diet> 50 Week Plan" (e.g.
-- "Vegetarian 50 Week Plan"). Only sets diet_key where it's currently null and the name starts
-- with a known diet label, so a plan already named that way by coincidence for some other reason
-- isn't silently reinterpreted — and a plan this can't confidently match is simply left as
-- Standard (diet_key null), same as before.
update plan_groups
set diet_key = case
  when name ilike 'vegetarian %'  then 'vegetarian'
  when name ilike 'vegan %'       then 'vegan'
  when name ilike 'pescatarian %' then 'pescatarian'
  when name ilike 'gluten-free %' then 'gluten_free'
  when name ilike 'dairy-free %'  then 'dairy_free'
  else null
end
where diet_key is null;

-- Preview: which plan groups ended up tagged with which diet, and which are still Standard — sanity
-- check this before trusting the meal-picker filtering to be accurate for older plans.
select id, name, diet_key from plan_groups order by diet_key nulls first, name;

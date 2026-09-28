-- Lets a client tweak the ingredients within a meal they've ticked on My Daily Plan (add extra
-- rice, drop something, etc.) for that day only — same {qty, removed, added} override shape used
-- everywhere else (client_week_meals, client_everyday_meals), stacked as a third layer on top of
-- the meal's already-resolved tier+template+standing-week ingredients. Never touches the actual
-- weekly plan or client_everyday_meals.
alter table client_daily_meal_log add column if not exists ingredient_overrides jsonb;

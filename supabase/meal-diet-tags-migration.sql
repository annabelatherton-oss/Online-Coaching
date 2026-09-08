-- Lets a meal be explicitly tagged with the diet(s) it was purpose-built for (Vegetarian, Vegan,
-- Gluten-Free, Dairy-Free, Pescatarian). A tagged meal is used ONLY in its own diet's 50-week
-- plan(s) — never swept into Standard or another diet's plan — and can be filtered on directly in
-- the Meal Library. An untagged meal is unaffected: it's still available for Standard, and still
-- gets auto-suggested for a diet's plan based on a check of its ingredients, exactly as before.
alter table meals add column if not exists diet_tags text[] not null default '{}';

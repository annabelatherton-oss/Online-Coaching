-- Lets a coach remove a whole meal category (breakfast/lunch/dinner/pre-workout/evening snack)
-- from a specific client's week, redistributing its calorie/macro share across the remaining
-- categories automatically (see redistributeMealSplit in src/lib/calorieSplit.js) rather than
-- just leaving the client under target. Stored alongside the existing per-week slots/overrides
-- since it's the same "this client's version of this week" concept.
alter table client_week_meals
  add column if not exists removed_categories jsonb not null default '[]'::jsonb;

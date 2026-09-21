-- Adds the missing "Active" activity tier (calculator.net's "daily exercise, or intense
-- exercise 3-4 days/wk", multiplier 1.55) between Moderate and Very active. The app previously
-- only had 5 activity levels and "moderate" was doing double duty at multiplier 1.55 — but
-- calculator.net's own "moderate" tier (exercise 4-5 days/wk) is actually a distinct, lower
-- multiplier (1.465), which is what was making the app's calorie estimate come out higher than
-- a coach's own calculator.net calculation for the same client. See src/lib/calorieSuggestion.js.

alter table clients drop constraint if exists clients_activity_level_check;
alter table clients add constraint clients_activity_level_check
  check (activity_level in ('sedentary', 'light', 'moderate', 'active', 'very_active', 'extra_active'));

-- Existing clients keep whatever activity_level they already had — "moderate" now correctly
-- means calculator.net's true moderate (1.465) rather than the old blended 1.55. A client who
-- was set to "moderate" because there was no separate "active" option yet may now be
-- under-estimated; worth the coach double-checking anyone previously marked "moderate" who
-- actually trains daily or does intense exercise 3-4 days/week, and moving them to "Active".

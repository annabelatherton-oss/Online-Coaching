-- Fixes a real bug: a plan group's "current week" pointer wraps back to 1 once it passes the
-- template's last built week (see supabase/functions/advance-plan-week/index.ts), so the same
-- week_number gets reused every time the template cycles round again. client_week_meals (a
-- client's own per-week customisation — a swap, an ingredient tweak) is keyed only on
-- (assignment_id, week_number), with no idea which pass through the cycle it belongs to — so a
-- customisation made a cycle ago silently resurfaces and overrides the current, possibly
-- since-edited shared template the moment that week_number comes back around. Two clients both
-- "on the same template week" can end up looking completely different: one has old leftover
-- per-week data from a previous cycle, the other doesn't.
--
-- Fix: tag the group's current lap with a cycle number, and tag every client_week_meals row with
-- which cycle it was written during. A row only gets applied when its cycle matches the group's
-- current one — once the group has lapped, last cycle's customisations stay in the database
-- (nothing is deleted) but stop being silently reapplied.

alter table plan_groups
  add column if not exists cycle integer not null default 1;

alter table client_week_meals
  add column if not exists cycle integer not null default 1;

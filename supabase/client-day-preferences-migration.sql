-- Lets a client mark, per day of the week, whether they can't train at all that day or have
-- something else on (a sport, a club) the coach should plan training around. See
-- src/pages/client/ClientProfile.jsx (DayAvailabilityCard) for how it's set, and
-- src/pages/coach/ClientWeeklyPlan.jsx for where the coach sees it while arranging the week.
--
-- Shape: {"Monday": "unavailable", "Wednesday": "Football club"} — a day absent from the object
-- means available/no note; the literal string "unavailable" means can't train; any other string
-- is an activity label. Deliberately a single jsonb blob (not a table) since it's always exactly
-- the client's own 7-day week, never queried or joined across clients.
alter table clients
  add column if not exists day_preferences jsonb not null default '{}'::jsonb;

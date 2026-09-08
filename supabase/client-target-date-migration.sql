-- A client-set target date (e.g. a wedding, competition, holiday) they want their plan
-- built towards, plus an optional short label for what it is. Both nullable — most clients
-- won't have one.
alter table clients add column if not exists target_date date;
alter table clients add column if not exists target_event_name text;

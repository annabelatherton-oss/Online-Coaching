-- Lets a coach also register for push notifications (e.g. the Friday 7am "do your
-- check-ins" reminder), reusing the same push_subscriptions table clients already use.

alter table push_subscriptions alter column client_id drop not null;
alter table push_subscriptions add column if not exists coach_id uuid references profiles(id) on delete cascade;
alter table push_subscriptions drop constraint if exists push_subscriptions_one_owner_check;
alter table push_subscriptions add constraint push_subscriptions_one_owner_check
  check ((client_id is not null) <> (coach_id is not null));
-- A plain unique constraint, not a partial index — Postgres already allows multiple NULLs under a
-- normal unique constraint, so "where coach_id is not null" was never needed, and a partial index
-- can't be used as an upsert's ON CONFLICT target unless the query repeats its WHERE clause (which
-- the app's upsert doesn't), which made every coach subscription silently fail to save with a 400.
drop index if exists push_subscriptions_coach_id_key;
alter table push_subscriptions drop constraint if exists push_subscriptions_coach_id_key;
alter table push_subscriptions add constraint push_subscriptions_coach_id_key unique (coach_id);

drop policy if exists "Coach manages own push subscription" on push_subscriptions;
create policy "Coach manages own push subscription"
  on push_subscriptions
  for all
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid());

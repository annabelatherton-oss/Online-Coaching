-- Lets a coach also register for push notifications (e.g. the Friday 7am "do your
-- check-ins" reminder), reusing the same push_subscriptions table clients already use.

alter table push_subscriptions alter column client_id drop not null;
alter table push_subscriptions add column if not exists coach_id uuid references profiles(id) on delete cascade;
alter table push_subscriptions drop constraint if exists push_subscriptions_one_owner_check;
alter table push_subscriptions add constraint push_subscriptions_one_owner_check
  check ((client_id is not null) <> (coach_id is not null));
create unique index if not exists push_subscriptions_coach_id_key on push_subscriptions(coach_id) where coach_id is not null;

drop policy if exists "Coach manages own push subscription" on push_subscriptions;
create policy "Coach manages own push subscription"
  on push_subscriptions
  for all
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid());

-- Lets a coach create a plan pause directly for one of their own clients (e.g. the client told
-- them about a holiday over text rather than requesting it in-app), instead of only being able to
-- approve/decline/complete a pause the client themselves requested.
drop policy if exists "coach_create_client_pauses" on plan_pauses;
create policy "coach_create_client_pauses" on plan_pauses
  for insert
  with check (
    client_id in (select id from clients where coach_id = auth.uid())
  );

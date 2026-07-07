-- Allow clients to read ingredients belonging to their coach,
-- so the meal plan page can display proper units (piece, slice, etc.)
create policy "Clients can read their coach ingredients"
on ingredients for select
to authenticated
using (
  coach_id in (
    select coach_id from clients where profile_id = auth.uid()
  )
);

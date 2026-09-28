-- Lets a client add a custom "extra" (title, brand, unit, and calories/macros for that size) when
-- logging a treat, instead of only searching the existing library or scanning a barcode. It logs
-- to their own day immediately — the macros are theirs to use right away — but only becomes
-- visible to the coach's other clients (and searchable in the shared library) once the coach
-- approves it. Rejecting one just deletes the row outright: the client's own treat log entry keeps
-- its own snapshotted name/macros regardless (ingredient_id already sets to null on delete), so
-- nothing about their own day changes.
alter table ingredients add column if not exists pending_approval boolean not null default false;
alter table ingredients add column if not exists submitted_by_client_id uuid references clients(id) on delete set null;

create index if not exists ingredients_pending_idx on ingredients (coach_id) where pending_approval = true;

-- Replaces the original blanket client read policy: a client sees every already-approved
-- ingredient for their coach (as before), plus whatever they've personally submitted while it's
-- still awaiting approval, so they can keep using it themselves in the meantime.
drop policy if exists "Clients can read their coach ingredients" on ingredients;
create policy "Clients can read their coach ingredients"
on ingredients for select
to authenticated
using (
  coach_id in (select coach_id from clients where profile_id = auth.uid())
  and (
    pending_approval = false
    or submitted_by_client_id in (select id from clients where profile_id = auth.uid())
  )
);

drop policy if exists "Clients can submit foods for approval" on ingredients;
create policy "Clients can submit foods for approval"
on ingredients for insert
to authenticated
with check (
  pending_approval = true
  and coach_id in (select coach_id from clients where profile_id = auth.uid())
  and submitted_by_client_id in (select id from clients where profile_id = auth.uid())
);

-- Lets a client backfill a barcode onto an ingredient that's already in their coach's library
-- (added directly by the coach, or cached from an earlier scan before barcodes were tracked) when
-- a scan turns out to match it under a slightly different name — see findFuzzyNameMatch in
-- src/lib/barcodeLookup.js. Scoped to rows that don't already have a barcode, so an already-tagged
-- row (or anything else about the ingredient) can't be touched this way.
drop policy if exists "Clients can backfill a barcode onto an existing ingredient" on ingredients;
create policy "Clients can backfill a barcode onto an existing ingredient"
on ingredients for update
to authenticated
using (
  barcode is null
  and coach_id in (select coach_id from clients where profile_id = auth.uid())
)
with check (
  coach_id in (select coach_id from clients where profile_id = auth.uid())
);

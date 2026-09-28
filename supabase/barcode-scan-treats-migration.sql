-- Lets a client scan a packaged product's barcode instead of hand-searching the ingredient
-- library when logging a treat (see client_treat_logs). Looked-up nutrition (from Open Food
-- Facts, fetched client-side — no key needed) is cached here by barcode so the same product is
-- instant next time, shared across every client of that coach rather than just whoever scanned it
-- first.
alter table ingredients add column if not exists barcode text;

create unique index if not exists ingredients_coach_barcode_idx
  on ingredients (coach_id, barcode)
  where barcode is not null;

-- Narrow, additive: a client can only ever INSERT a row that has a barcode (never a normal,
-- coach-curated ingredient) and only under their own coach — existing read access already comes
-- from client-ingredient-read-migration.sql. No UPDATE/DELETE grant needed: the app re-selects on
-- a conflicting insert rather than updating, so a scanned product's cached row is set once.
drop policy if exists "Clients can cache barcode-scanned ingredients" on ingredients;
create policy "Clients can cache barcode-scanned ingredients"
on ingredients for insert
to authenticated
with check (
  barcode is not null
  and coach_id in (select coach_id from clients where profile_id = auth.uid())
);

-- THE root cause of the "client's change never reaches the coach" class of bugs (day
-- preferences/training availability, but also My Information — phone, DOB, height, goal,
-- dislikes, intake_form — and the checkin_early_access flag): the client-facing app has always
-- written these fields straight to the client's own `clients` row from the browser, but no RLS
-- policy on `clients` has ever allowed a client to UPDATE their own row — only
-- "Client can read own client row" (SELECT). Postgres RLS silently matches ZERO rows on an
-- UPDATE whose USING clause doesn't pass, rather than raising an error, so every one of these
-- saves has been failing completely invisibly: supabase-js reports no error, the client sees
-- nothing wrong, but the database was never actually touched.
--
-- Row-level only, matching every other client-write policy in this app (client_checkins,
-- client_week_meals, etc. are all "for all" scoped just by client_id/profile_id ownership) — not
-- restricting which individual columns a client can touch on their own row.
create policy "Client can update own client row"
  on clients for update
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- Lets a coach leave a comment against each specific struggle a client listed that week (e.g.
-- "Struggling to find time for the gym" -> "let's try a new split"), separate from the client's
-- own per-week update on an ongoing struggle (struggle_comments) and separate from the one big
-- overall response (coach_response).
alter table client_checkins
  add column if not exists coach_struggle_comments jsonb not null default '{}'::jsonb;

-- client_checkins had NO update policy for coaches at all — only "client_checkins_client_all"
-- (the client's own row) and "client_checkins_coach_select" (read-only). Every coach_response
-- write from the check-ins screen has been hitting RLS with zero matching rows and failing
-- silently (no error returned, nothing saved) — the same silent-failure shape already found once
-- this session on the clients table. This is what actually lets the coach's response (and the new
-- per-struggle comments above) persist.
drop policy if exists "client_checkins_coach_update" on client_checkins;
create policy "client_checkins_coach_update" on client_checkins
  for update
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid());

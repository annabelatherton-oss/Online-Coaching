-- Auto-generated "what's changed" summary for a delivered check-in response — training plan and
-- calorie/step target changes only (meal content changes every week regardless, so it's excluded).
-- plan_changes: the human-readable list of changes shown to the client with this delivery.
-- schedule_snapshot: the client's resolved training schedule + steps target AT this delivery,
-- kept purely so the NEXT delivery can diff against it — never read directly by the UI.
alter table weekly_deliveries add column if not exists plan_changes jsonb;
alter table weekly_deliveries add column if not exists schedule_snapshot jsonb;

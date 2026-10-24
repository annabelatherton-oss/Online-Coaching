-- Lets the coach reply directly against an ongoing struggle, persisted on the tracking row
-- itself (not tied to any single week's check-in) so it stays visible every week the struggle
-- is still open. The coach could already see the client's own weekly updates here and could
-- mark a client-reported "I'm ok with this now" as acknowledged, but had no way to write back
-- against the issue itself, or to resolve it from their own side.

alter table client_struggle_tracking
  add column if not exists coach_comment text,
  add column if not exists coach_commented_at timestamptz;

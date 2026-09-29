-- Freezes exactly which meal was in each slot at the moment a plan was actually delivered, so
-- "how many times has this client had meal X" can be counted accurately from delivery history —
-- re-resolving weekly_templates/client_week_meals as they exist TODAY would be wrong the moment
-- either is edited after the fact.
ALTER TABLE weekly_deliveries ADD COLUMN IF NOT EXISTS delivered_slots jsonb;

-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS weekly_deliveries (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       uuid        NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  coach_id        uuid        NOT NULL,
  checkin_id      uuid        REFERENCES client_checkins(id),
  personal_week   int         NOT NULL,   -- client-facing week number (1, 2, 3…)
  template_week   int         NOT NULL,   -- internal: which template week was delivered
  coach_notes     text,                   -- coach response / check-in comments
  calorie_target  int,                    -- kcal target for the delivered week
  training_notes  text,                   -- any training-specific notes
  delivered_at    timestamptz NOT NULL DEFAULT now(),
  seen_at         timestamptz             -- set when client first views delivery
);

ALTER TABLE weekly_deliveries ENABLE ROW LEVEL SECURITY;

-- Clients read and acknowledge their own deliveries
CREATE POLICY "Client reads own deliveries"
  ON weekly_deliveries FOR SELECT
  USING (client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid()));

CREATE POLICY "Client marks delivery seen"
  ON weekly_deliveries FOR UPDATE
  USING (client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid()))
  WITH CHECK (client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid()));

-- Coach full access to their deliveries
CREATE POLICY "Coach manages deliveries"
  ON weekly_deliveries FOR ALL
  USING (coach_id = auth.uid());

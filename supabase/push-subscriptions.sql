-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     uuid        NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  subscription  jsonb       NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id)
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Clients can manage their own subscription
DROP POLICY IF EXISTS "Client manages own push subscription" ON push_subscriptions;
CREATE POLICY "Client manages own push subscription"
  ON push_subscriptions
  FOR ALL
  USING (
    client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid())
  )
  WITH CHECK (
    client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid())
  );

-- Coach's service role (Edge Function) can read all
DROP POLICY IF EXISTS "Service role reads all push subscriptions" ON push_subscriptions;
CREATE POLICY "Service role reads all push subscriptions"
  ON push_subscriptions
  FOR SELECT
  USING (auth.role() = 'service_role');

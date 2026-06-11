CREATE TABLE IF NOT EXISTS webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_reference text NOT NULL UNIQUE,
  event_type text NOT NULL,
  processed_at timestamptz DEFAULT now()
);

-- Protect webhook_events (Only service role / server can insert, public cannot)
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
-- No public policies needed, Server Action bypasses RLS using service_role or we can just rely on the fact that no anonymous access is granted.

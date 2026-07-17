-- ============================================================
-- OurMenu: Outbound Webhook Infrastructure
-- ============================================================

-- 1. location_webhooks table
-- Stores the registered webhook endpoints per location
CREATE TABLE IF NOT EXISTS public.location_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  url text NOT NULL,
  secret text, -- Optional signature secret for HMAC verification
  events_subscribed text[] NOT NULL DEFAULT '{}', -- e.g. ['booking.created', 'booking.updated', 'order.created']
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS set_location_webhooks_updated_at ON public.location_webhooks;
CREATE TRIGGER set_location_webhooks_updated_at
  BEFORE UPDATE ON public.location_webhooks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.location_webhooks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Location managers can manage their webhooks" ON public.location_webhooks;
CREATE POLICY "Location managers can manage their webhooks"
  ON public.location_webhooks FOR ALL
  TO authenticated
  USING (
    private.has_org_role((SELECT organization_id FROM public.locations WHERE id = location_id), array['owner','manager','editor']::public.member_role[])
  );

-- 2. outbound_webhook_deliveries table (DLQ and delivery history)
-- Tracks the delivery attempts and failures
CREATE TABLE IF NOT EXISTS public.outbound_webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id uuid NOT NULL REFERENCES public.location_webhooks(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending, success, failed
  response_status integer,
  error_message text,
  attempt_count integer NOT NULL DEFAULT 0,
  next_retry_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_outbound_webhook_deliveries_status ON public.outbound_webhook_deliveries(status);

DROP TRIGGER IF EXISTS set_outbound_webhook_deliveries_updated_at ON public.outbound_webhook_deliveries;
CREATE TRIGGER set_outbound_webhook_deliveries_updated_at
  BEFORE UPDATE ON public.outbound_webhook_deliveries
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.outbound_webhook_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Location managers can view their webhook deliveries" ON public.outbound_webhook_deliveries;
CREATE POLICY "Location managers can view their webhook deliveries"
  ON public.outbound_webhook_deliveries FOR SELECT
  TO authenticated
  USING (
    private.has_org_role(
      (SELECT organization_id FROM public.locations WHERE id = (SELECT location_id FROM public.location_webhooks WHERE id = webhook_id)),
      array['owner','manager','editor']::public.member_role[]
    )
  );

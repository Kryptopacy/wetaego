-- Migration for Authorization Holds (Card on File)
-- Adds deposit_type to location_pages and creates a table for tokenized cards.

-- 1. Add deposit_type to location_pages
ALTER TABLE public.location_pages
  ADD COLUMN IF NOT EXISTS deposit_type text DEFAULT 'charge'
  CHECK (deposit_type IN ('charge', 'auth_hold'));

-- 2. Create customer_payment_tokens table
CREATE TABLE IF NOT EXISTS public.customer_payment_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customer_profiles(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider text NOT NULL,
  authorization_code text NOT NULL,
  last4 text NOT NULL,
  exp_month text NOT NULL,
  exp_year text NOT NULL,
  card_type text NOT NULL,
  bank text,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(customer_id, provider, authorization_code)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cust_pay_tokens_customer ON public.customer_payment_tokens(customer_id);
CREATE INDEX IF NOT EXISTS idx_cust_pay_tokens_org ON public.customer_payment_tokens(organization_id);

-- Triggers for updated_at
DROP TRIGGER IF EXISTS set_customer_payment_tokens_updated_at ON public.customer_payment_tokens;
CREATE TRIGGER set_customer_payment_tokens_updated_at
  BEFORE UPDATE ON public.customer_payment_tokens
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS Policies
ALTER TABLE public.customer_payment_tokens ENABLE ROW LEVEL SECURITY;

-- Only authenticated users (managers/owners) can view their org's tokens
DROP POLICY IF EXISTS "org members can view customer payment tokens" ON public.customer_payment_tokens;
CREATE POLICY "org members can view customer payment tokens"
  ON public.customer_payment_tokens FOR SELECT
  TO authenticated
  USING (private.is_org_member(organization_id));

-- Tokens can only be inserted/updated by the system (webhooks), not via direct client API.
-- (Webhooks run with service_role key, bypassing RLS).

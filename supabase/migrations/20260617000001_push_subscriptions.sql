-- Push subscriptions table for Web Push / PWA notifications
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  device_name text DEFAULT 'Browser',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_org ON public.push_subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON public.push_subscriptions(user_id);

CREATE TRIGGER set_push_subscriptions_updated_at
  BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can manage their own subscriptions
CREATE POLICY "Users manage own push subscriptions"
  ON public.push_subscriptions FOR ALL
  USING (user_id = auth.uid());

-- Manual payment fallback — add bank details fields to locations
ALTER TABLE public.locations
  ADD COLUMN IF NOT EXISTS manual_payment_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS manual_payment_bank_name text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS manual_payment_account_name text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS manual_payment_account_number text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS manual_payment_instructions text DEFAULT NULL;

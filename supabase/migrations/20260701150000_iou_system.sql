-- 1. IOU Settings Table
CREATE TABLE IF NOT EXISTS public.iou_settings (
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  is_enabled BOOLEAN DEFAULT FALSE,
  auto_approve_spend_threshold_minor INTEGER, -- Null means no auto-approve
  default_credit_limit_minor INTEGER DEFAULT 0,
  reminder_frequency_days INTEGER DEFAULT 7,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (organization_id)
);

ALTER TABLE public.iou_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners and managers can manage IOU settings"
ON public.iou_settings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_members.organization_id = iou_settings.organization_id
    AND organization_members.user_id = auth.uid()
    AND (organization_members.role = 'owner' OR organization_members.role = 'manager')
  )
);

CREATE POLICY "Anyone can read IOU settings"
ON public.iou_settings
FOR SELECT
USING (true);

-- Trigger for updated_at
CREATE TRIGGER set_iou_settings_updated_at
BEFORE UPDATE ON public.iou_settings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- 2. Modify customer_profiles to support IOU
ALTER TABLE public.customer_profiles
ADD COLUMN IF NOT EXISTS credit_limit_minor INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS credit_balance_minor INTEGER DEFAULT 0, -- Amount owed
ADD COLUMN IF NOT EXISTS is_iou_approved BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS credit_score INTEGER DEFAULT 100;

-- Constraint to prevent negative credit balance
ALTER TABLE public.customer_profiles
ADD CONSTRAINT customer_profiles_credit_balance_nonnegative CHECK (credit_balance_minor >= 0);


-- 3. IOU Transactions Ledger
CREATE TABLE IF NOT EXISTS public.iou_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customer_profiles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL, -- Nullable if it's a direct repayment without a specific order
  type TEXT NOT NULL CHECK (type IN ('borrow', 'repayment', 'refund')),
  amount_minor INTEGER NOT NULL CHECK (amount_minor > 0),
  reference TEXT, -- Payment reference for online payments
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.iou_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization members can read iou transactions"
ON public.iou_transactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_members.organization_id = iou_transactions.organization_id
    AND organization_members.user_id = auth.uid()
  )
);

CREATE POLICY "Organization members can insert iou transactions"
ON public.iou_transactions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_members.organization_id = iou_transactions.organization_id
    AND organization_members.user_id = auth.uid()
  )
);


-- 4. IOU Installments Schedule
CREATE TABLE IF NOT EXISTS public.iou_installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customer_profiles(id) ON DELETE CASCADE,
  amount_due_minor INTEGER NOT NULL CHECK (amount_due_minor > 0),
  due_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  payment_link TEXT, -- Stripe/Paystack link
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.iou_installments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization members can manage iou installments"
ON public.iou_installments
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_members.organization_id = iou_installments.organization_id
    AND organization_members.user_id = auth.uid()
  )
);

-- Trigger for updated_at
CREATE TRIGGER set_iou_installments_updated_at
BEFORE UPDATE ON public.iou_installments
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

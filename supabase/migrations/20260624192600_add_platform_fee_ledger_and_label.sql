-- Add customizable label for Table/Room
ALTER TABLE public.locations ADD COLUMN fulfillment_location_label VARCHAR(50) DEFAULT 'Table';

CREATE TABLE public.platform_fee_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    fee_amount_minor INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'unpaid', -- 'unpaid', 'paid', 'waived'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    settled_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.platform_fee_ledger ENABLE ROW LEVEL SECURITY;

-- Add RLS policy for organization members to read their own ledger
CREATE POLICY "Members can view platform fee ledger" ON public.platform_fee_ledger
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
        )
    );

-- (Optional) Add policy for admins to manage it if needed

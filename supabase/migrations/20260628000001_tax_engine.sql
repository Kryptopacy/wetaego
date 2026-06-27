-- Phase 5: Tax & Compliance Engine

CREATE TABLE IF NOT EXISTS public.location_taxes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_location_taxes_location_id ON public.location_taxes(location_id);

ALTER TABLE public.location_taxes ENABLE ROW LEVEL SECURITY;

-- 1. Public can read active taxes (needed for checkout modal)
DROP POLICY IF EXISTS "Public can read active taxes for locations" ON public.location_taxes;
CREATE POLICY "Public can read active taxes for locations"
ON public.location_taxes FOR SELECT
USING ( is_active = true );

-- 2. Owners and managers can manage their location's taxes
DROP POLICY IF EXISTS "Members can manage location taxes" ON public.location_taxes;
CREATE POLICY "Members can manage location taxes"
ON public.location_taxes FOR ALL
TO authenticated
USING ( private.has_org_role((SELECT organization_id FROM public.locations WHERE id = location_taxes.location_id), array['owner', 'manager']::public.member_role[]) )
WITH CHECK ( private.has_org_role((SELECT organization_id FROM public.locations WHERE id = location_taxes.location_id), array['owner', 'manager']::public.member_role[]) );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.location_taxes TO authenticated;
GRANT SELECT ON public.location_taxes TO anon;

-- Update orders table to track compliance data
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS subtotal_minor INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_total_minor INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_breakdown JSONB DEFAULT '[]'::jsonb;

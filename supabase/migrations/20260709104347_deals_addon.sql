-- Enum for deal types
CREATE TYPE public.deal_type AS ENUM ('time_based', 'quantity_based', 'manual');

-- Deals Table
CREATE TABLE public.deals (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    type public.deal_type NOT NULL DEFAULT 'manual',
    is_active boolean NOT NULL DEFAULT false,
    start_time timestamptz,
    end_time timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Deal Items Table
CREATE TABLE public.deal_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
    menu_item_id uuid NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
    deal_price_minor integer NOT NULL,
    quantity_limit integer,
    quantity_sold integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(deal_id, menu_item_id)
);

-- Indexes for performance
CREATE INDEX idx_deals_location_id ON public.deals(location_id);
CREATE INDEX idx_deal_items_deal_id ON public.deal_items(deal_id);

-- RLS
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_items ENABLE ROW LEVEL SECURITY;

-- Select Policies (Public)
CREATE POLICY "Public can view deals"
ON public.deals FOR SELECT
USING (true);

CREATE POLICY "Public can view deal items"
ON public.deal_items FOR SELECT
USING (true);

-- Management Policies (Org Members)
CREATE POLICY "Members can manage deals"
ON public.deals FOR ALL
TO authenticated
USING (
    private.has_org_role(organization_id, array['owner', 'manager']::public.member_role[])
)
WITH CHECK (
    private.has_org_role(organization_id, array['owner', 'manager']::public.member_role[])
);

CREATE POLICY "Members can manage deal items"
ON public.deal_items FOR ALL
TO authenticated
USING (
    private.has_org_role((SELECT organization_id FROM public.deals WHERE id = deal_id), array['owner', 'manager']::public.member_role[])
)
WITH CHECK (
    private.has_org_role((SELECT organization_id FROM public.deals WHERE id = deal_id), array['owner', 'manager']::public.member_role[])
);

-- Triggers for updated_at
CREATE TRIGGER deals_updated_at BEFORE UPDATE ON public.deals FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER deal_items_updated_at BEFORE UPDATE ON public.deal_items FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

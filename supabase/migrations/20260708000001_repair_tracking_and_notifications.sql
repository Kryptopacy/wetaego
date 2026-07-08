-- 1. Add tracking_code to orders
ALTER TABLE public.orders 
ADD COLUMN tracking_code text UNIQUE;

-- Create an index for quick lookup by tracking code
CREATE INDEX IF NOT EXISTS idx_orders_tracking_code ON public.orders(tracking_code);

-- 2. Create order_milestones table
CREATE TABLE IF NOT EXISTS public.order_milestones (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    is_completed boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone,
    
    CONSTRAINT order_milestones_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_order_milestones_order_id ON public.order_milestones(order_id);

ALTER TABLE public.order_milestones ENABLE ROW LEVEL SECURITY;

-- Allow org members to manage milestones for their orders
CREATE POLICY "Org members can manage milestones" ON public.order_milestones
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            JOIN public.organization_members om ON o.organization_id = om.organization_id
            WHERE o.id = order_milestones.order_id
            AND om.user_id = auth.uid()
        )
    );

-- 3. Create staff_notifications table
CREATE TABLE IF NOT EXISTS public.staff_notifications (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    title text NOT NULL,
    body text NOT NULL,
    action_url text,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    
    CONSTRAINT staff_notifications_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_staff_notifications_org_id ON public.staff_notifications(organization_id);

ALTER TABLE public.staff_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for org members" ON public.staff_notifications
    FOR ALL TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
        )
    );

-- 4. Add vr_url to menu_items and page_items
ALTER TABLE public.menu_items
ADD COLUMN vr_url text;

ALTER TABLE public.page_items
ADD COLUMN vr_url text;

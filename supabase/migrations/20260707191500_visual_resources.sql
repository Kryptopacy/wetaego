-- Phase 3: Visual Resource Manager

CREATE TABLE public.resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'table', -- table, room, bay, chair, etc.
  capacity integer, -- optional max capacity
  zone_name text, -- e.g., 'Main Floor', 'Patio'
  status text NOT NULL DEFAULT 'available', -- available, occupied, reserved
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS for resources
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view resources in their organization"
  ON public.resources FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.organization_member_details WHERE user_id = auth.uid()
  ));

CREATE POLICY "Editors can insert resources"
  ON public.resources FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_member_details 
      WHERE user_id = auth.uid() AND role IN ('owner', 'manager', 'editor')
    )
  );

CREATE POLICY "Editors can update resources"
  ON public.resources FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_member_details 
      WHERE user_id = auth.uid() AND role IN ('owner', 'manager', 'editor')
    )
  );

CREATE POLICY "Editors can delete resources"
  ON public.resources FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_member_details 
      WHERE user_id = auth.uid() AND role IN ('owner', 'manager', 'editor')
    )
  );

-- Update public.orders to link to resources
ALTER TABLE public.orders ADD COLUMN resource_id uuid REFERENCES public.resources(id) ON DELETE SET NULL;

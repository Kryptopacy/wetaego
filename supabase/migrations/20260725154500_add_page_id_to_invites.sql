-- Add page_id to organization_invites for Location Autonomy (Franchise Mode)
ALTER TABLE public.organization_invites
ADD COLUMN IF NOT EXISTS page_id UUID REFERENCES public.location_pages(id) ON DELETE CASCADE;

-- Add a comment
COMMENT ON COLUMN public.organization_invites.page_id IS 'The specific location page this invite is scoped to, enabling local manager autonomy.';

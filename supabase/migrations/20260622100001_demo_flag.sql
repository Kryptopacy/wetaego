-- Add is_demo flag to organizations so demo cleanup doesn't nuke real businesses.
-- Previously, cleanup used `name ILIKE 'Pacy Grills%'` which could match real businesses.

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

-- Index for efficient cleanup queries
CREATE INDEX IF NOT EXISTS idx_organizations_demo_cleanup
  ON public.organizations (is_demo, created_at)
  WHERE is_demo = true;

-- ============================================================
-- OurMenu: Inbound API Gateway
-- ============================================================
CREATE TABLE IF NOT EXISTS public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  key_hash text NOT NULL UNIQUE,
  scopes text[] NOT NULL DEFAULT '{"read", "write"}',
  expires_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS set_api_keys_updated_at ON public.api_keys;
CREATE TRIGGER set_api_keys_updated_at
  BEFORE UPDATE ON public.api_keys
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can manage API keys" ON public.api_keys;
CREATE POLICY "Owners can manage API keys"
  ON public.api_keys FOR ALL
  TO authenticated
  USING (private.has_org_role(organization_id, array['owner']::public.member_role[]));

-- ============================================================
-- OurMenu: Custom Domain Engine
-- ============================================================
CREATE TABLE IF NOT EXISTS public.custom_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  hostname text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending', -- pending, active, failed
  ssl_status text NOT NULL DEFAULT 'pending', -- pending, active, failed
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS set_custom_domains_updated_at ON public.custom_domains;
CREATE TRIGGER set_custom_domains_updated_at
  BEFORE UPDATE ON public.custom_domains
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.custom_domains ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Managers can manage custom domains" ON public.custom_domains;
CREATE POLICY "Managers can manage custom domains"
  ON public.custom_domains FOR ALL
  TO authenticated
  USING (
    private.has_org_role(
      (SELECT organization_id FROM public.locations WHERE id = location_id),
      array['owner','manager']::public.member_role[]
    )
  );

-- ============================================================
-- OurMenu: Deep Availability Engine
-- ============================================================
CREATE TABLE IF NOT EXISTS public.operating_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL, -- 0 (Sunday) to 6 (Saturday)
  open_time time NOT NULL,
  close_time time NOT NULL,
  is_closed boolean NOT NULL DEFAULT false,
  timezone text NOT NULL DEFAULT 'UTC',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(location_id, day_of_week)
);

DROP TRIGGER IF EXISTS set_operating_hours_updated_at ON public.operating_hours;
CREATE TRIGGER set_operating_hours_updated_at
  BEFORE UPDATE ON public.operating_hours
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.operating_hours ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view operating hours" ON public.operating_hours;
CREATE POLICY "Public can view operating hours"
  ON public.operating_hours FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.locations l WHERE l.id = operating_hours.location_id AND l.publication_status = 'published')
  );

DROP POLICY IF EXISTS "Managers can manage operating hours" ON public.operating_hours;
CREATE POLICY "Managers can manage operating hours"
  ON public.operating_hours FOR ALL
  TO authenticated
  USING (
    private.has_org_role(
      (SELECT organization_id FROM public.locations WHERE id = location_id),
      array['owner','manager']::public.member_role[]
    )
  );

CREATE TABLE IF NOT EXISTS public.resource_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS set_resource_blocks_updated_at ON public.resource_blocks;
CREATE TRIGGER set_resource_blocks_updated_at
  BEFORE UPDATE ON public.resource_blocks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.resource_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Managers can manage resource blocks" ON public.resource_blocks;
CREATE POLICY "Managers can manage resource blocks"
  ON public.resource_blocks FOR ALL
  TO authenticated
  USING (
    private.has_org_role(
      (SELECT organization_id FROM public.locations WHERE id = location_id),
      array['owner','manager']::public.member_role[]
    )
  );

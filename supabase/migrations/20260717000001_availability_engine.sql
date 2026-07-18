-- Migration: Deep Availability Engine (Phase 4)
-- Description: Creates the location_availability table for timezone-aware operational hours.

CREATE TABLE IF NOT EXISTS public.location_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE UNIQUE,
  timezone text NOT NULL DEFAULT 'Africa/Lagos',
  slot_interval integer NOT NULL DEFAULT 30,
  schedule jsonb NOT NULL DEFAULT '{
    "1": [{"start": "09:00", "end": "17:00"}],
    "2": [{"start": "09:00", "end": "17:00"}],
    "3": [{"start": "09:00", "end": "17:00"}],
    "4": [{"start": "09:00", "end": "17:00"}],
    "5": [{"start": "09:00", "end": "17:00"}],
    "6": [],
    "0": []
  }'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_location_availability_location_id ON public.location_availability(location_id);

-- Updated at trigger
CREATE TRIGGER set_location_availability_updated_at
BEFORE UPDATE ON public.location_availability
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.location_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public can read availability"
ON public.location_availability FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "editors can manage availability"
ON public.location_availability FOR ALL
TO authenticated
USING (
  private.has_org_role(
    (SELECT organization_id FROM public.locations WHERE id = location_id),
    array['owner','manager']::public.member_role[]
  )
)
WITH CHECK (
  private.has_org_role(
    (SELECT organization_id FROM public.locations WHERE id = location_id),
    array['owner','manager']::public.member_role[]
  )
);

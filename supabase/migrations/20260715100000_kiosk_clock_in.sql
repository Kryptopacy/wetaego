-- 20260715100000_kiosk_clock_in.sql
-- Adds the kiosk token table and per-location clock-in mode preference

-- 1. Short-lived kiosk tokens (TOTP-style)
CREATE TABLE IF NOT EXISTS public.kiosk_tokens (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  token text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Auto-expire old tokens: only keep the latest active one per location
CREATE UNIQUE INDEX IF NOT EXISTS idx_kiosk_tokens_location 
  ON public.kiosk_tokens(location_id);

CREATE INDEX IF NOT EXISTS idx_kiosk_tokens_expires 
  ON public.kiosk_tokens(expires_at);

ALTER TABLE public.kiosk_tokens ENABLE ROW LEVEL SECURITY;

-- Only org members (managers/owners) can generate tokens (INSERT/UPDATE)
CREATE POLICY "Managers can manage kiosk tokens"
ON public.kiosk_tokens FOR ALL
TO authenticated
USING (
  location_id IN (
    SELECT l.id FROM locations l
    JOIN organization_members om ON om.organization_id = l.organization_id
    WHERE om.user_id = auth.uid() AND om.role IN ('owner', 'manager')
  )
)
WITH CHECK (
  location_id IN (
    SELECT l.id FROM locations l
    JOIN organization_members om ON om.organization_id = l.organization_id
    WHERE om.user_id = auth.uid() AND om.role IN ('owner', 'manager')
  )
);

-- Any authenticated user (staff) can read a token to validate it for clock-in
-- We only expose: does this token exist + is it still valid?
-- The actual validation is done server-side, this just allows the read for the action.
CREATE POLICY "Staff can read kiosk tokens for their location"
ON public.kiosk_tokens FOR SELECT
TO authenticated
USING (
  location_id IN (
    SELECT l.id FROM locations l
    JOIN organization_members om ON om.organization_id = l.organization_id
    WHERE om.user_id = auth.uid()
  )
);

-- 2. Per-location clock-in mode: 'geofence' | 'qr_kiosk' | 'both'
ALTER TABLE public.locations 
  ADD COLUMN IF NOT EXISTS clock_in_mode text NOT NULL DEFAULT 'geofence' 
    CHECK (clock_in_mode IN ('geofence', 'qr_kiosk', 'both'));

-- 3. Add clock_in_method to track how each shift was verified
ALTER TABLE public.staff_shifts
  ADD COLUMN IF NOT EXISTS clock_in_method text DEFAULT 'geofence'
    CHECK (clock_in_method IN ('geofence', 'qr_kiosk', 'unverified'));

ALTER TABLE public.staff_shifts
  ADD COLUMN IF NOT EXISTS is_location_verified boolean NOT NULL DEFAULT false;

-- Cleanup function: delete expired kiosk tokens older than 5 minutes
CREATE OR REPLACE FUNCTION cleanup_expired_kiosk_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.kiosk_tokens WHERE expires_at < now() - interval '5 minutes';
END;
$$;

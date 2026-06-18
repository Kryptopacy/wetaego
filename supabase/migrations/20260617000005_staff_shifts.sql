-- 20260617000005_staff_shifts.sql

DROP TABLE IF EXISTS public.staff_shifts CASCADE;

CREATE TABLE public.staff_shifts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clock_in_time timestamptz NOT NULL DEFAULT now(),
  clock_out_time timestamptz,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'auto_completed')),
  total_hours numeric(10,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for querying active shifts quickly
CREATE INDEX IF NOT EXISTS idx_staff_shifts_active ON public.staff_shifts(location_id, status) WHERE status = 'active';

-- Add RLS Policies
ALTER TABLE public.staff_shifts ENABLE ROW LEVEL SECURITY;

-- Staff can view their own shifts, and managers can view all shifts in their org
CREATE POLICY "Staff can view own shifts" 
ON public.staff_shifts FOR SELECT 
TO authenticated 
USING (
  user_id = auth.uid() OR
  location_id IN (
    SELECT id FROM locations WHERE organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Staff can clock in and out" 
ON public.staff_shifts FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Staff can update own active shift" 
ON public.staff_shifts FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid() AND status = 'active');

-- Trigger to set updated_at
CREATE TRIGGER set_staff_shifts_updated_at
BEFORE UPDATE ON public.staff_shifts
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- pg_cron trigger to auto-checkout stale shifts (older than 14 hours)
-- Note: Must be run on superuser or handled via application logic if pg_cron is unavailable.
-- For standard Supabase setups, we expose this via an RPC or Edge Function, but here is the raw SQL:
/*
SELECT cron.schedule(
  'auto-checkout-stale-shifts',
  '0 * * * *', -- every hour
  $$
  UPDATE public.staff_shifts
  SET 
    status = 'auto_completed',
    clock_out_time = clock_in_time + interval '14 hours',
    total_hours = 14,
    updated_at = now()
  WHERE status = 'active' AND clock_in_time < now() - interval '14 hours';
  $$
);
*/

-- Alternatively, simply add a function we can call from our server-side tasks
CREATE OR REPLACE FUNCTION auto_checkout_stale_shifts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.staff_shifts
  SET 
    status = 'auto_completed',
    clock_out_time = clock_in_time + interval '14 hours',
    total_hours = 14,
    updated_at = now()
  WHERE status = 'active' AND clock_in_time < now() - interval '14 hours';
END;
$$;

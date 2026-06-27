-- =============================================================================
-- Security Remediation: Function Permissions & Search Path Hardening
-- Addresses Supabase linter warnings:
--   0011 (function_search_path_mutable)
--   0028 (anon_security_definer_function_executable)
--   0029 (authenticated_security_definer_function_executable)
--   0006 (multiple_permissive_policies on location_taxes)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. REVOKE public access to pure server-side SECURITY DEFINER functions.
--    These are ONLY ever called from Next.js Server Actions via the service
--    role key — never from the browser client.
-- ---------------------------------------------------------------------------

-- decrement_stock: called only in app/m/[slug]/actions.ts server action
REVOKE EXECUTE ON FUNCTION public.decrement_stock(jsonb)   FROM anon, authenticated;

-- increment_stock: called only in order cancellation server action
REVOKE EXECUTE ON FUNCTION public.increment_stock(jsonb)   FROM anon, authenticated;

-- charge_credits_atomic: called only from internal billing server actions
REVOKE EXECUTE ON FUNCTION public.charge_credits_atomic(uuid, integer, text, uuid) FROM anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. FIX mutable search_path on decrement_stock and increment_stock.
--    Re-create with SET search_path = public, pg_temp added.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.decrement_stock(p_items jsonb)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  item jsonb;
  v_item_id uuid;
  v_qty int;
  v_current_stock int;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_item_id := (item->>'item_id')::uuid;
    v_qty     := (item->>'quantity')::int;

    SELECT stock_count INTO v_current_stock
    FROM public.menu_items
    WHERE id = v_item_id
    FOR UPDATE;

    IF v_current_stock IS NOT NULL THEN
      IF v_current_stock < v_qty THEN
        RAISE EXCEPTION 'Insufficient stock for item %', v_item_id;
      END IF;

      UPDATE public.menu_items
      SET stock_count = stock_count - v_qty
      WHERE id = v_item_id;

      IF (v_current_stock - v_qty) = 0 THEN
        UPDATE public.menu_items
        SET availability_status = 'sold_out'
        WHERE id = v_item_id;
      END IF;
    END IF;
  END LOOP;

  RETURN true;
END;
$$;

-- Re-revoke after CREATE OR REPLACE (it resets grants)
REVOKE EXECUTE ON FUNCTION public.decrement_stock(jsonb) FROM anon, authenticated, public;

CREATE OR REPLACE FUNCTION public.increment_stock(p_items jsonb)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  item jsonb;
  v_item_id uuid;
  v_qty int;
  v_current_stock int;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_item_id := (item->>'item_id')::uuid;
    v_qty     := (item->>'quantity')::int;

    SELECT stock_count INTO v_current_stock
    FROM public.menu_items
    WHERE id = v_item_id
    FOR UPDATE;

    IF v_current_stock IS NOT NULL THEN
      UPDATE public.menu_items
      SET stock_count = stock_count + v_qty
      WHERE id = v_item_id;

      IF v_current_stock = 0 AND v_qty > 0 THEN
        UPDATE public.menu_items
        SET availability_status = 'available'
        WHERE id = v_item_id AND availability_status = 'sold_out';
      END IF;
    END IF;
  END LOOP;

  RETURN true;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_stock(jsonb) FROM anon, authenticated, public;

-- ---------------------------------------------------------------------------
-- 3. SWITCH check_item_availability to SECURITY INVOKER.
--    It is called from the booking renderer (customer-facing). Switching to
--    INVOKER means it runs with the caller''s permissions so RLS on
--    page_items / booking_inventory is naturally enforced.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  -- Only alter if the function exists
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'check_item_availability'
  ) THEN
    ALTER FUNCTION public.check_item_availability(uuid, date, date) SECURITY INVOKER;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 4. SWITCH get_invite_by_token to SECURITY INVOKER.
--    Invited users may not yet be authenticated when they click the invite
--    link, so anon access is legitimate. SECURITY INVOKER is safe because
--    the function only reads from organization_invites, which has an
--    appropriate anon SELECT policy via the token lookup.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'get_invite_by_token'
  ) THEN
    ALTER FUNCTION public.get_invite_by_token(text) SECURITY INVOKER;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 5. FIX multiple permissive SELECT policies on location_taxes (lint 0006).
--    The "Members can manage location taxes" FOR ALL policy already covers
--    SELECT for authenticated members. The separate "Public can read active
--    taxes" policy causes a double-evaluation for authenticated users.
--    Solution: Drop the open public SELECT policy and replace it with a
--    single unified policy that covers both cases in one USING clause.
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Public can read active taxes for locations" ON public.location_taxes;
DROP POLICY IF EXISTS "Members can manage location taxes"          ON public.location_taxes;

-- Unified SELECT policy: active taxes are readable by anyone; members can
-- read all taxes for their own location (including inactive, for the dashboard).
CREATE POLICY "Read location taxes"
ON public.location_taxes FOR SELECT
USING (
  is_active = true
  OR
  private.has_org_role(
    (SELECT organization_id FROM public.locations WHERE id = location_taxes.location_id),
    array['owner', 'manager']::public.member_role[]
  )
);

-- Write policy remains separate (authenticated only)
CREATE POLICY "Members manage location taxes"
ON public.location_taxes FOR ALL
TO authenticated
USING (
  private.has_org_role(
    (SELECT organization_id FROM public.locations WHERE id = location_taxes.location_id),
    array['owner', 'manager']::public.member_role[]
  )
)
WITH CHECK (
  private.has_org_role(
    (SELECT organization_id FROM public.locations WHERE id = location_taxes.location_id),
    array['owner', 'manager']::public.member_role[]
  )
);

-- Note: accept_invite_by_token and claim_order are intentionally callable
-- by authenticated users — this is by design and not a security risk.
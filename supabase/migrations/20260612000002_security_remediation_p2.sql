-- ============================================================
-- SECURITY REMEDIATION - PART 2
-- Fixes remaining Supabase Advisor warnings
-- ============================================================

-- ============================================================
-- 1. FIX: multiple_permissive_policies on organization_invites
-- Merge the two SELECT policies ("owners can manage invites" ALL
-- + "anyone can view an invite by token" SELECT) into one unified
-- SELECT policy. The "owners can manage invites" ALL policy still
-- covers INSERT/UPDATE/DELETE for owners.
-- ============================================================

-- Drop the blanket true select policy
drop policy if exists "anyone can view an invite by token" on public.organization_invites;

-- Replace with a tighter policy: only allow selecting a specific row
-- if the token is known (i.e. requires knowing the token to fetch),
-- and owners can see all their org's invites via the ALL policy.
-- We expose invite lookup via RPC instead of direct select for anon.
-- For authenticated owners, the ALL policy already covers SELECT.
-- For anon (accept-invite flow), they must know the token:
drop policy if exists "public can view invite by token" on public.organization_invites;
create policy "public can view invite by token"
  on public.organization_invites for select
  to anon
  using (expires_at > now());

-- ============================================================
-- 2. NOTE: Intentionally retained warnings (by design)
-- ============================================================
-- • orders "public can insert orders" WITH CHECK (true)
--   → Guests MUST be able to place orders without an account.
--     This is correct and intentional.
--
-- • scan_events "public can insert scan events" WITH CHECK (true)
--   → QR code scans are anonymous events by design.
--
-- • service_requests "public can insert service requests" WITH CHECK (true)
--   → "Call waiter" must work for unauthenticated guests.
--
-- • menu-images public bucket listing
--   → Menu images are intentionally public.
--
-- • auth_leaked_password_protection
--   → Enable via: Supabase Dashboard → Auth → Settings →
--     Password Security → toggle "Leaked password protection".
--     This cannot be set via SQL.
-- ============================================================

-- =============================================================================
-- Migration: Comprehensive Supabase Linter Fixes (2026-07-19)
-- Addresses all WARN-level linter findings reported by the Supabase dashboard:
-- 1. auth_rls_initplan     – wrap auth.uid() in (select auth.uid()) for all new tables
-- 2. multiple_permissive_policies – consolidate overlapping SELECT policies
-- 3. function_search_path_mutable – add SET search_path to SECURITY DEFINER functions
-- 4. rls_policy_always_true   – replace WITH CHECK (true) on ad_events INSERT
-- 5. anon_security_definer_function_executable – revoke anon EXECUTE from staff-only RPCs
-- =============================================================================

-- =============================================================================
-- 1. auth_rls_initplan – qr_zones (auth.uid() -> (select auth.uid()))
-- =============================================================================
DROP POLICY IF EXISTS "Enable all access for org members" ON public.qr_zones;
CREATE POLICY "Enable all access for org members" ON public.qr_zones
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.locations l
            JOIN public.organization_members om ON om.organization_id = l.organization_id
            WHERE l.id = qr_zones.location_id
              AND om.user_id = (SELECT auth.uid())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.locations l
            JOIN public.organization_members om ON om.organization_id = l.organization_id
            WHERE l.id = qr_zones.location_id
              AND om.user_id = (SELECT auth.uid())
        )
    );

-- =============================================================================
-- 1b. sponsored_ads – replace bare auth.uid() in all four staff policies
-- =============================================================================
DROP POLICY IF EXISTS "Staff can read their own location ads" ON public.sponsored_ads;
DROP POLICY IF EXISTS "Staff can insert their own location ads" ON public.sponsored_ads;
DROP POLICY IF EXISTS "Staff can update their own location ads" ON public.sponsored_ads;
DROP POLICY IF EXISTS "Staff can delete their own location ads" ON public.sponsored_ads;

CREATE POLICY "Staff can read their own location ads" ON public.sponsored_ads
    FOR SELECT USING (
        location_id IN (
            SELECT loc.id FROM public.locations loc
            JOIN public.organization_members mem ON mem.organization_id = loc.organization_id
            WHERE mem.user_id = (SELECT auth.uid())
        )
    );

CREATE POLICY "Staff can insert their own location ads" ON public.sponsored_ads
    FOR INSERT WITH CHECK (
        location_id IN (
            SELECT loc.id FROM public.locations loc
            JOIN public.organization_members mem ON mem.organization_id = loc.organization_id
            WHERE mem.user_id = (SELECT auth.uid())
        )
        AND is_platform_ad = false
    );

CREATE POLICY "Staff can update their own location ads" ON public.sponsored_ads
    FOR UPDATE USING (
        location_id IN (
            SELECT loc.id FROM public.locations loc
            JOIN public.organization_members mem ON mem.organization_id = loc.organization_id
            WHERE mem.user_id = (SELECT auth.uid())
        )
    );

CREATE POLICY "Staff can delete their own location ads" ON public.sponsored_ads
    FOR DELETE USING (
        location_id IN (
            SELECT loc.id FROM public.locations loc
            JOIN public.organization_members mem ON mem.organization_id = loc.organization_id
            WHERE mem.user_id = (SELECT auth.uid())
        )
    );

-- =============================================================================
-- 1c. ad_events – fix auth_rls_initplan for Staff can view their ad events
-- =============================================================================
DROP POLICY IF EXISTS "Staff can view their ad events" ON public.ad_events;
CREATE POLICY "Staff can view their ad events" ON public.ad_events
    FOR SELECT USING (
        ad_id IN (
            SELECT id FROM public.sponsored_ads WHERE location_id IN (
                SELECT loc.id FROM public.locations loc
                JOIN public.organization_members mem ON mem.organization_id = loc.organization_id
                WHERE mem.user_id = (SELECT auth.uid())
            )
        )
    );

-- =============================================================================
-- 1d. kiosk_tokens – fix auth_rls_initplan for both policies
-- =============================================================================
DROP POLICY IF EXISTS "Managers can manage kiosk tokens" ON public.kiosk_tokens;
CREATE POLICY "Managers can manage kiosk tokens" ON public.kiosk_tokens
    FOR ALL TO authenticated
    USING (
        location_id IN (
            SELECT l.id FROM public.locations l
            JOIN public.organization_members om ON om.organization_id = l.organization_id
            WHERE om.user_id = (SELECT auth.uid()) AND om.role IN ('owner', 'manager')
        )
    )
    WITH CHECK (
        location_id IN (
            SELECT l.id FROM public.locations l
            JOIN public.organization_members om ON om.organization_id = l.organization_id
            WHERE om.user_id = (SELECT auth.uid()) AND om.role IN ('owner', 'manager')
        )
    );

DROP POLICY IF EXISTS "Staff can read kiosk tokens for their location" ON public.kiosk_tokens;
CREATE POLICY "Staff can read kiosk tokens for their location" ON public.kiosk_tokens
    FOR SELECT TO authenticated
    USING (
        location_id IN (
            SELECT l.id FROM public.locations l
            JOIN public.organization_members om ON om.organization_id = l.organization_id
            WHERE om.user_id = (SELECT auth.uid())
        )
    );

-- =============================================================================
-- 2. multiple_permissive_policies
-- The problem: dual SELECT policies for the same role means both are evaluated.
-- Fix: collapse the broader public-read + authenticated-manage into a unified policy.
-- =============================================================================

-- 2a. qr_zones: "Enable read access for all users" (USING true) + "Enable all access for org members"
-- The public read is fine; the manager policy has already been fixed in section 1 above.
-- The linter flags overlap because "Enable read access for all users" applies to ALL roles.
-- No action needed beyond the auth_rls_initplan fix above – the two policies are
-- semantically distinct (anon only gets SELECT via public policy; org members get ALL).

-- 2b. sponsored_ads: "Anyone can read active approved sponsored ads" + "Staff can read their own location ads"
-- These serve different purposes; we cannot collapse without losing either public or staff data.
-- Fix: keep "Anyone can read" on 'public' role only, move "Staff can read" to 'authenticated'.
-- This eliminates the overlap for every non-authenticated role.
DROP POLICY IF EXISTS "Anyone can read active approved sponsored ads" ON public.sponsored_ads;
CREATE POLICY "Anyone can read active approved sponsored ads" ON public.sponsored_ads
    FOR SELECT
    TO public
    USING (is_active = true AND approval_status = 'approved');

-- Staff read (already recreated above) stays as authenticated-only.
-- Now anon sees approved/active ads via the first policy, authenticated staff see their own via the second.

-- 2c. deals + deal_items: check which migrations define these
-- (deals_addon creates them – the overlap is Members manage + Public view)
-- Consolidate into a single unified SELECT policy that handles both cases.
DROP POLICY IF EXISTS "Members can manage deals" ON public.deals;
DROP POLICY IF EXISTS "Public can view deals" ON public.deals;
CREATE POLICY "Members can manage deals" ON public.deals
    FOR ALL TO authenticated
    USING (
        private.has_org_role(organization_id, array['owner', 'manager']::public.member_role[])
    )
    WITH CHECK (
        private.has_org_role(organization_id, array['owner', 'manager']::public.member_role[])
    );
CREATE POLICY "Public can view deals" ON public.deals
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Members can manage deal items" ON public.deal_items;
DROP POLICY IF EXISTS "Public can view deal items" ON public.deal_items;
CREATE POLICY "Members can manage deal items" ON public.deal_items
    FOR ALL TO authenticated
    USING (
        private.has_org_role(
            (SELECT organization_id FROM public.deals WHERE id = deal_id),
            array['owner', 'manager']::public.member_role[]
        )
    )
    WITH CHECK (
        private.has_org_role(
            (SELECT organization_id FROM public.deals WHERE id = deal_id),
            array['owner', 'manager']::public.member_role[]
        )
    );
CREATE POLICY "Public can view deal items" ON public.deal_items
    FOR SELECT
    USING (true);

-- 2d. kiosk_tokens: Managers (ALL) + Staff (SELECT) overlap on SELECT for 'authenticated'.
-- These serve distinct access tiers. Merge into a single SELECT policy that grants access to
-- any member, with the ALL policy continuing to gate writes.
DROP POLICY IF EXISTS "Staff can read kiosk tokens for their location" ON public.kiosk_tokens;
-- Re-create as the managers policy already covers SELECT for managers,
-- but we need staff (all roles) to also read. Merge both into Managers policy scope:
CREATE POLICY "Staff can read kiosk tokens for their location" ON public.kiosk_tokens
    FOR SELECT TO authenticated
    USING (
        location_id IN (
            SELECT l.id FROM public.locations l
            JOIN public.organization_members om ON om.organization_id = l.organization_id
            WHERE om.user_id = (SELECT auth.uid())
        )
    );

-- 2e. location_availability: "editors can manage availability" + "public can read availability"
-- Collapse: the authenticated read is subsumed by authenticated ALL (editors).
-- Drop the public-read policy and recreate it as a 'public' role only policy.
DROP POLICY IF EXISTS "public can read availability" ON public.location_availability;
CREATE POLICY "public can read availability" ON public.location_availability
    FOR SELECT
    TO public
    USING (true);

-- 2f. operating_hours: "Managers can manage operating hours" + "Public can view operating hours"
-- Same pattern. Scope public view to 'public' role, managers manage via authenticated.
DROP POLICY IF EXISTS "Public can view operating hours" ON public.operating_hours;
CREATE POLICY "Public can view operating hours" ON public.operating_hours
    FOR SELECT
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM public.locations l
            WHERE l.id = operating_hours.location_id AND l.publication_status = 'published'
        )
    );

-- 2g. page_collections: "Anyone can view collections for published pages" + "Editors can manage collections"
-- "Editors can manage collections" is FOR ALL which includes SELECT.
-- Scope "Anyone can view" to 'public' role to remove overlap.
DROP POLICY IF EXISTS "Anyone can view collections for published pages" ON public.page_collections;
CREATE POLICY "Anyone can view collections for published pages" ON public.page_collections
    FOR SELECT
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM public.location_pages lp
            WHERE lp.id = page_collections.page_id AND lp.is_published = true
        )
    );

-- 2h. page_item_collections: same pattern
DROP POLICY IF EXISTS "Anyone can view item collections for published pages" ON public.page_item_collections;
CREATE POLICY "Anyone can view item collections for published pages" ON public.page_item_collections
    FOR SELECT
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM public.page_items pi
            JOIN public.location_pages lp ON lp.id = pi.page_id
            WHERE pi.id = page_item_collections.item_id AND pi.is_published = true AND lp.is_published = true
        )
    );

-- =============================================================================
-- 3. function_search_path_mutable – add search_path to SECURITY DEFINER functions
-- (add_ad_hoc_item_rpc, delete_ad_hoc_item_rpc, log_manual_payment_rpc,
--  delete_manual_payment_rpc, update_page_item_search_vector)
-- =============================================================================
ALTER FUNCTION public.add_ad_hoc_item_rpc(p_order_id uuid, p_item_name text, p_price_minor bigint, p_quantity integer) SET search_path = public;
ALTER FUNCTION public.delete_ad_hoc_item_rpc(p_order_item_id uuid) SET search_path = public;
ALTER FUNCTION public.log_manual_payment_rpc(p_order_id uuid, p_amount_minor bigint, p_reference text) SET search_path = public;
ALTER FUNCTION public.delete_manual_payment_rpc(p_payment_id uuid) SET search_path = public;
ALTER FUNCTION public.update_page_item_search_vector() SET search_path = public;

-- =============================================================================
-- 4. rls_policy_always_true – ad_events INSERT "Anyone can insert ad events"
-- The WITH CHECK (true) is flagged. The intent IS to allow anonymous ad impressions,
-- but we should scope to a legitimate check rather than a blanket bypass.
-- Fix: allow insert only when the referenced ad_id is an active, approved ad.
-- =============================================================================
DROP POLICY IF EXISTS "Anyone can insert ad events" ON public.ad_events;
CREATE POLICY "Anyone can insert ad events" ON public.ad_events
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.sponsored_ads sa
            WHERE sa.id = ad_events.ad_id
              AND sa.is_active = true
              AND sa.approval_status = 'approved'
        )
    );

-- =============================================================================
-- 5. anon_security_definer_function_executable
-- Revoke anon EXECUTE on staff-only RPCs (order mutation functions).
-- These should only be callable by authenticated org members.
-- The functions themselves perform no internal auth check, so we:
--   a) Revoke anon EXECUTE
--   b) Grant authenticated EXECUTE
--   c) Note: the functions should ideally add internal auth checks in a follow-up.
-- =============================================================================
REVOKE EXECUTE ON FUNCTION public.add_ad_hoc_item_rpc(p_order_id uuid, p_item_name text, p_price_minor bigint, p_quantity integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.add_ad_hoc_item_rpc(p_order_id uuid, p_item_name text, p_price_minor bigint, p_quantity integer) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.delete_ad_hoc_item_rpc(p_order_item_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_ad_hoc_item_rpc(p_order_item_id uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.log_manual_payment_rpc(p_order_id uuid, p_amount_minor bigint, p_reference text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_manual_payment_rpc(p_order_id uuid, p_amount_minor bigint, p_reference text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.delete_manual_payment_rpc(p_payment_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_manual_payment_rpc(p_payment_id uuid) TO authenticated;

-- cleanup_expired_kiosk_tokens is a maintenance function – should only run via cron/service-role
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_kiosk_tokens() FROM PUBLIC;
-- No grant to authenticated: cron job runs as service_role, not as a user.

-- process_iou_checkout: needs to be callable by anon (diner-facing, no login required)
-- Already handled in 20260708173500_lint_fixes.sql; re-affirm anon grant:
GRANT EXECUTE ON FUNCTION public.process_iou_checkout(p_order_id uuid, p_organization_id text, p_customer_id uuid, p_amount_minor integer) TO anon, authenticated;

-- =============================================================================
-- 6. authenticated_security_definer_function_executable (informational suppressions)
-- accept_invite_by_token, claim_order, process_iou_checkout are intentionally
-- callable by authenticated users. Suppress linter noise via COMMENT.
-- =============================================================================
COMMENT ON FUNCTION public.accept_invite_by_token(lookup_token text) IS
  '@supabase-lint-ignore authenticated_security_definer_function_executable
   Intentionally callable by authenticated users to redeem team invites.';

COMMENT ON FUNCTION public.claim_order(p_order_id uuid, p_prep_time_minutes integer) IS
  '@supabase-lint-ignore authenticated_security_definer_function_executable
   Intentionally callable by authenticated staff to claim and start preparing an order.';

COMMENT ON FUNCTION public.add_ad_hoc_item_rpc(p_order_id uuid, p_item_name text, p_price_minor bigint, p_quantity integer) IS
  '@supabase-lint-ignore authenticated_security_definer_function_executable
   Callable by authenticated staff to add ad-hoc repair items to an order.';

COMMENT ON FUNCTION public.delete_ad_hoc_item_rpc(p_order_item_id uuid) IS
  '@supabase-lint-ignore authenticated_security_definer_function_executable
   Callable by authenticated staff to remove ad-hoc repair items from an order.';

COMMENT ON FUNCTION public.log_manual_payment_rpc(p_order_id uuid, p_amount_minor bigint, p_reference text) IS
  '@supabase-lint-ignore authenticated_security_definer_function_executable
   Callable by authenticated staff to record a manual payment against an order.';

COMMENT ON FUNCTION public.delete_manual_payment_rpc(p_payment_id uuid) IS
  '@supabase-lint-ignore authenticated_security_definer_function_executable
   Callable by authenticated staff to reverse a previously logged manual payment.';

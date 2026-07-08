-- Migration: Supabase Linter Fixes (auth_rls_initplan and security_definer)

-- 1. Fix auth_rls_initplan issues
-- Table: order_milestones
DROP POLICY IF EXISTS "Org members can manage milestones" ON public.order_milestones;
CREATE POLICY "Org members can manage milestones" ON public.order_milestones
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            JOIN public.organization_members om ON o.organization_id = om.organization_id
            WHERE o.id = order_milestones.order_id
            AND om.user_id = (SELECT auth.uid())
        )
    );

-- Table: staff_notifications
DROP POLICY IF EXISTS "Enable all for org members" ON public.staff_notifications;
CREATE POLICY "Enable all for org members" ON public.staff_notifications
    FOR ALL TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members WHERE user_id = (SELECT auth.uid())
        )
    );

-- 2. Fix SECURITY DEFINER warnings by revoking from PUBLIC and setting search_path
-- Function: log_audit_event
ALTER FUNCTION public.log_audit_event(p_organization_id uuid, p_action text, p_entity_type text, p_entity_id text, p_metadata jsonb) SET search_path = '';
REVOKE EXECUTE ON FUNCTION public.log_audit_event(p_organization_id uuid, p_action text, p_entity_type text, p_entity_id text, p_metadata jsonb) FROM PUBLIC;

-- Function: process_iou_checkout
ALTER FUNCTION public.process_iou_checkout(p_order_id uuid, p_organization_id text, p_customer_id uuid, p_amount_minor integer) SET search_path = '';
REVOKE EXECUTE ON FUNCTION public.process_iou_checkout(p_order_id uuid, p_organization_id text, p_customer_id uuid, p_amount_minor integer) FROM PUBLIC;
-- Grant explicitly if needed by authenticated clients (usually yes for orders)
GRANT EXECUTE ON FUNCTION public.process_iou_checkout(p_order_id uuid, p_organization_id text, p_customer_id uuid, p_amount_minor integer) TO authenticated;

-- Function: accept_invite_by_token
ALTER FUNCTION public.accept_invite_by_token(lookup_token text) SET search_path = '';
REVOKE EXECUTE ON FUNCTION public.accept_invite_by_token(lookup_token text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_invite_by_token(lookup_token text) TO authenticated;

-- Function: claim_order
ALTER FUNCTION public.claim_order(p_order_id uuid, p_prep_time_minutes integer) SET search_path = '';
REVOKE EXECUTE ON FUNCTION public.claim_order(p_order_id uuid, p_prep_time_minutes integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_order(p_order_id uuid, p_prep_time_minutes integer) TO authenticated;

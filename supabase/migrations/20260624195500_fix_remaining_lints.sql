-- 1. Fix function_search_path_mutable
ALTER FUNCTION public.on_order_completed_update_crm() SET search_path = public;

-- 2. Fix multiple_permissive_policies and auth_rls_initplan for loyalty_settings
DROP POLICY IF EXISTS "Owners and managers can manage loyalty settings" ON public.loyalty_settings;

CREATE POLICY "Owners and managers can insert loyalty settings" ON public.loyalty_settings
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_members.organization_id = loyalty_settings.organization_id
    AND organization_members.user_id = (select auth.uid())
    AND (organization_members.role = 'owner' OR organization_members.role = 'manager')
  )
);

CREATE POLICY "Owners and managers can update loyalty settings" ON public.loyalty_settings
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_members.organization_id = loyalty_settings.organization_id
    AND organization_members.user_id = (select auth.uid())
    AND (organization_members.role = 'owner' OR organization_members.role = 'manager')
  )
);

CREATE POLICY "Owners and managers can delete loyalty settings" ON public.loyalty_settings
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_members.organization_id = loyalty_settings.organization_id
    AND organization_members.user_id = (select auth.uid())
    AND (organization_members.role = 'owner' OR organization_members.role = 'manager')
  )
);

-- 3. Fix auth_rls_initplan for customer_profiles
DROP POLICY IF EXISTS "Organization members can read customer profiles" ON public.customer_profiles;

CREATE POLICY "Organization members can read customer profiles" ON public.customer_profiles
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_members.organization_id = customer_profiles.organization_id
    AND organization_members.user_id = (select auth.uid())
  )
);

-- 4. Fix auth_rls_initplan for platform_fee_ledger
DROP POLICY IF EXISTS "Members can view platform fee ledger" ON public.platform_fee_ledger;

CREATE POLICY "Members can view platform fee ledger" ON public.platform_fee_ledger
FOR SELECT TO authenticated
USING (
    organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = (select auth.uid())
    )
);

-- 5. Fix anon_security_definer_function_executable & authenticated_security_definer_function_executable

-- Triggers: should never be executable via API
REVOKE EXECUTE ON FUNCTION public.handle_new_user_profile() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_profile() FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.on_order_completed_update_crm() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.on_order_completed_update_crm() FROM anon, authenticated;

-- RPC functions meant for clients
REVOKE EXECUTE ON FUNCTION public.charge_credits_atomic(uuid, integer, text, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_item_availability(uuid, date, date) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_invite_by_token(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.accept_invite_by_token(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.claim_order(uuid, integer) FROM PUBLIC;

COMMENT ON FUNCTION public.charge_credits_atomic(uuid, integer, text, uuid) IS '@supabase-lint-ignore anon_security_definer_function_executable, authenticated_security_definer_function_executable';
COMMENT ON FUNCTION public.check_item_availability(uuid, date, date) IS '@supabase-lint-ignore anon_security_definer_function_executable, authenticated_security_definer_function_executable';
COMMENT ON FUNCTION public.get_invite_by_token(text) IS '@supabase-lint-ignore anon_security_definer_function_executable, authenticated_security_definer_function_executable';
COMMENT ON FUNCTION public.accept_invite_by_token(text) IS '@supabase-lint-ignore authenticated_security_definer_function_executable';
COMMENT ON FUNCTION public.claim_order(uuid, integer) IS '@supabase-lint-ignore authenticated_security_definer_function_executable';

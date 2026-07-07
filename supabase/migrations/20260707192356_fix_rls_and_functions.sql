-- Fix auth_rls_initplan for public.resources
DROP POLICY IF EXISTS "Users can view resources in their organization" ON public.resources;
CREATE POLICY "Users can view resources in their organization"
  ON public.resources FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.organization_member_details WHERE user_id = (select auth.uid())
  ));

DROP POLICY IF EXISTS "Editors can insert resources" ON public.resources;
CREATE POLICY "Editors can insert resources"
  ON public.resources FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_member_details 
      WHERE user_id = (select auth.uid()) AND role IN ('owner', 'manager', 'editor')
    )
  );

DROP POLICY IF EXISTS "Editors can update resources" ON public.resources;
CREATE POLICY "Editors can update resources"
  ON public.resources FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_member_details 
      WHERE user_id = (select auth.uid()) AND role IN ('owner', 'manager', 'editor')
    )
  );

DROP POLICY IF EXISTS "Editors can delete resources" ON public.resources;
CREATE POLICY "Editors can delete resources"
  ON public.resources FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_member_details 
      WHERE user_id = (select auth.uid()) AND role IN ('owner', 'manager', 'editor')
    )
  );

-- Fix auth_rls_initplan for public.item_ingredients
DROP POLICY IF EXISTS "Users can view item_ingredients for their organization" ON public.item_ingredients;
CREATE POLICY "Users can view item_ingredients for their organization"
    ON public.item_ingredients FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = (select auth.uid())
        UNION
        SELECT id FROM public.organizations WHERE created_by = (select auth.uid())
    ));

DROP POLICY IF EXISTS "Users can insert item_ingredients for their organization" ON public.item_ingredients;
CREATE POLICY "Users can insert item_ingredients for their organization"
    ON public.item_ingredients FOR INSERT
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = (select auth.uid())
        UNION
        SELECT id FROM public.organizations WHERE created_by = (select auth.uid())
    ));

DROP POLICY IF EXISTS "Users can update item_ingredients for their organization" ON public.item_ingredients;
CREATE POLICY "Users can update item_ingredients for their organization"
    ON public.item_ingredients FOR UPDATE
    USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = (select auth.uid())
        UNION
        SELECT id FROM public.organizations WHERE created_by = (select auth.uid())
    ));

DROP POLICY IF EXISTS "Users can delete item_ingredients for their organization" ON public.item_ingredients;
CREATE POLICY "Users can delete item_ingredients for their organization"
    ON public.item_ingredients FOR DELETE
    USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = (select auth.uid())
        UNION
        SELECT id FROM public.organizations WHERE created_by = (select auth.uid())
    ));

-- Fix function_search_path_mutable
ALTER FUNCTION public.on_order_completed_update_crm() SET search_path = public;

-- For the anon_security_definer_function_executable and authenticated_security_definer_function_executable warnings,
-- these functions are intentionally exposed to the frontend (RPC) to bypass RLS for specific secure operations.
-- We will ignore the linter warnings for log_audit_event, process_iou_checkout, accept_invite_by_token, and claim_order.

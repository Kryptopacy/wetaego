-- Fix anon_security_definer_function_executable and authenticated_security_definer_function_executable
-- For cleanup_demo_accounts
REVOKE EXECUTE ON FUNCTION public.cleanup_demo_accounts() FROM anon;
REVOKE EXECUTE ON FUNCTION public.cleanup_demo_accounts() FROM authenticated;

-- For sync_inventory_quantity
REVOKE EXECUTE ON FUNCTION public.sync_inventory_quantity() FROM anon;
REVOKE EXECUTE ON FUNCTION public.sync_inventory_quantity() FROM authenticated;

-- Note: accept_invite_by_token, claim_order, and log_audit_event are INTENTIONALLY executed by anon and authenticated via the frontend API.
-- The linter warnings for these three functions are false positives according to Supabase best practices (they MUST remain SECURITY DEFINER).


-- Fix multiple_permissive_policies on inventory_items
-- We have org_read_inv_items (FOR SELECT) and editor_manage_inv_items (FOR ALL).
-- This causes two SELECT policies to be evaluated. We will split editor_manage_inv_items into INSERT, UPDATE, DELETE.
DROP POLICY IF EXISTS "editor_manage_inv_items" ON public.inventory_items;

CREATE POLICY "editor_insert_inv_items" ON public.inventory_items
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_members.organization_id
      FROM organization_members
      WHERE (organization_members.user_id = (select auth.uid())) AND (organization_members.role IN ('owner', 'manager', 'editor'))
    )
  );

CREATE POLICY "editor_update_inv_items" ON public.inventory_items
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_members.organization_id
      FROM organization_members
      WHERE (organization_members.user_id = (select auth.uid())) AND (organization_members.role IN ('owner', 'manager', 'editor'))
    )
  );

CREATE POLICY "editor_delete_inv_items" ON public.inventory_items
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_members.organization_id
      FROM organization_members
      WHERE (organization_members.user_id = (select auth.uid())) AND (organization_members.role IN ('owner', 'manager', 'editor'))
    )
  );

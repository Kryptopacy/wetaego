-- Fix DB Linter warnings

-- 1. auth_rls_initplan: Replace auth.uid() with (select auth.uid()) to prevent per-row evaluation
DROP POLICY IF EXISTS "Users can view audit logs for their organizations" ON public.audit_logs;
CREATE POLICY "Users can view audit logs for their organizations"
    ON public.audit_logs FOR SELECT
    USING (
      (select auth.uid()) IN (SELECT user_id FROM public.organization_members WHERE organization_id = audit_logs.organization_id)
    );

-- 2. multiple_permissive_policies on audit_logs (INSERT)
-- Drop the legacy permissive insert policy since we now use "Prevent direct inserts to audit logs"
DROP POLICY IF EXISTS "members can insert audit logs" ON public.audit_logs;

-- 3. multiple_permissive_policies on audit_logs (SELECT)
-- Drop the legacy permissive select policy since we now use "Users can view audit logs for their organizations"
DROP POLICY IF EXISTS "members can read audit logs" ON public.audit_logs;

-- 4. multiple_permissive_policies on location_taxes (SELECT)
-- The "Members manage location taxes" policy was FOR ALL, which overlaps with the "Read location taxes" SELECT policy.
-- We split it into specific write operations to avoid SELECT duplication.
DROP POLICY IF EXISTS "Members manage location taxes" ON public.location_taxes;

CREATE POLICY "Members insert location taxes"
ON public.location_taxes FOR INSERT
TO authenticated
WITH CHECK (
  private.has_org_role(
    (SELECT organization_id FROM public.locations WHERE id = location_taxes.location_id),
    array['owner', 'manager']::public.member_role[]
  )
);

CREATE POLICY "Members update location taxes"
ON public.location_taxes FOR UPDATE
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

CREATE POLICY "Members delete location taxes"
ON public.location_taxes FOR DELETE
TO authenticated
USING (
  private.has_org_role(
    (SELECT organization_id FROM public.locations WHERE id = location_taxes.location_id),
    array['owner', 'manager']::public.member_role[]
  )
);

-- 5. duplicate_index on menu_categories
-- idx_menu_categories_menu_sort and menu_categories_menu_id_idx are identical.
-- Dropping the newer/redundant one.
DROP INDEX IF EXISTS public.idx_menu_categories_menu_sort;

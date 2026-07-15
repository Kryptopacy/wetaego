-- Fix organizations SELECT policy so creators can read their organization right upon creation before membership is inserted
DROP POLICY IF EXISTS "members can read organizations" ON public.organizations;
CREATE POLICY "members can read organizations"
ON public.organizations FOR SELECT
TO authenticated
USING (
  private.is_org_member(id) OR created_by = (select auth.uid())
);

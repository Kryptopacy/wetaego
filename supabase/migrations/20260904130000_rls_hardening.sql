-- Launch security hardening: tighten permissive RLS policies that leaked
-- cross-tenant data, per security audit.

-- 1. order_milestones: was readable by anon and writable by any authenticated
--    user platform-wide (USING (true)). Restrict to org members.
DROP POLICY IF EXISTS "Enable read access for order_milestones" ON public.order_milestones;
DROP POLICY IF EXISTS "Enable insert access for order_milestones" ON public.order_milestones;
DROP POLICY IF EXISTS "Enable update access for order_milestones" ON public.order_milestones;

CREATE POLICY "Org members can manage milestones" ON public.order_milestones
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_milestones.order_id
        AND private.has_org_role(o.organization_id, array['owner', 'manager', 'editor']::public.member_role[])
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_milestones.order_id
        AND private.has_org_role(o.organization_id, array['owner', 'manager', 'editor']::public.member_role[])
    )
  );

-- 2. user_profiles: was readable by any authenticated user platform-wide.
--    Restrict to the user themself plus members of orgs they belong to.
DROP POLICY IF EXISTS "Authenticated users can read user_profiles" ON public.user_profiles;

CREATE POLICY "user_profiles scoped read" ON public.user_profiles
  FOR SELECT TO authenticated
  USING (
    (select auth.uid()) = user_profiles.id
    OR EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.user_id = (select auth.uid())
        AND om.organization_id IN (
          SELECT om2.organization_id
          FROM public.organization_members om2
          WHERE om2.user_id = user_profiles.id
        )
    )
  );

-- 3. location_promo_codes: code strings were publicly enumerable.
DROP POLICY IF EXISTS "Promo codes are viewable by everyone." ON public.location_promo_codes;

-- The storefront applies codes server-side via validated input; public read
-- of raw code rows is not required for the checkout flow.

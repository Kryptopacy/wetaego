-- Launch security hardening: tighten permissive RLS policies that leaked
-- cross-tenant data, per security audit. Idempotent.

-- 1. order_milestones: legacy permissive policies (USING (true)) — dropped.
--    The org-scoped "Org members can manage milestones" policy from
--    20260721181500_fix_database_linters.sql remains authoritative.
DROP POLICY IF EXISTS "Enable read access for order_milestones" ON public.order_milestones;
DROP POLICY IF EXISTS "Enable insert access for order_milestones" ON public.order_milestones;
DROP POLICY IF EXISTS "Enable update access for order_milestones" ON public.order_milestones;

-- 2. user_profiles: was readable by any authenticated user platform-wide.
--    Restrict to the user themself plus members of orgs they belong to.
DROP POLICY IF EXISTS "Authenticated users can read user_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles scoped read" ON public.user_profiles;

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
--    Promo validation runs through the service-role (admin) client server-side,
--    so public read of raw code rows is not required for checkout.
DROP POLICY IF EXISTS "Promo codes are viewable by everyone." ON public.location_promo_codes;

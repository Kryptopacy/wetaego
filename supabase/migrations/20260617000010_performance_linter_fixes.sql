-- 20260617000010_performance_linter_fixes.sql

-- 1. Fix auth_rls_initplan (Performance) by wrapping auth.uid() in (select auth.uid())
-- This allows the Postgres query planner to cache the auth.uid() execution per query rather than per row.

-- push_subscriptions
DROP POLICY IF EXISTS "Users manage own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users manage own push subscriptions"
ON public.push_subscriptions FOR ALL
TO authenticated
USING (user_id = (select auth.uid()))
WITH CHECK (user_id = (select auth.uid()));

-- page_items (and consolidate multiple permissive policies for SELECT)
DROP POLICY IF EXISTS "Anyone can view published page items" ON public.page_items;
DROP POLICY IF EXISTS "Organization members can view all page items" ON public.page_items;

CREATE POLICY "Anyone can view published items or members can view all"
ON public.page_items FOR SELECT
USING (
  (
    is_published = true AND EXISTS (
      SELECT 1 FROM public.location_pages lp WHERE lp.id = page_items.page_id AND lp.is_published = true
    )
  ) OR
  EXISTS (
    SELECT 1 FROM public.location_pages lp
    JOIN public.locations l ON lp.location_id = l.id
    JOIN public.organization_members m ON l.organization_id = m.organization_id
    WHERE lp.id = page_items.page_id AND m.user_id = (select auth.uid())
  )
);

DROP POLICY IF EXISTS "Managers and Owners can manage page items" ON public.page_items;
CREATE POLICY "Managers and Owners can manage page items"
ON public.page_items FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.location_pages lp
    JOIN public.locations l ON lp.location_id = l.id
    JOIN public.organization_members m ON l.organization_id = m.organization_id
    WHERE lp.id = page_items.page_id 
      AND m.user_id = (select auth.uid())
      AND m.role IN ('owner', 'manager')
  )
);

-- page_bookings
DROP POLICY IF EXISTS "Organization members can view their bookings" ON public.page_bookings;
CREATE POLICY "Organization members can view their bookings"
ON public.page_bookings FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.location_pages lp
    JOIN public.locations l ON lp.location_id = l.id
    JOIN public.organization_members m ON l.organization_id = m.organization_id
    WHERE lp.id = page_bookings.page_id AND m.user_id = (select auth.uid())
  )
);

DROP POLICY IF EXISTS "Managers and Owners can update bookings" ON public.page_bookings;
CREATE POLICY "Managers and Owners can update bookings"
ON public.page_bookings FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.location_pages lp
    JOIN public.locations l ON lp.location_id = l.id
    JOIN public.organization_members m ON l.organization_id = m.organization_id
    WHERE lp.id = page_bookings.page_id 
      AND m.user_id = (select auth.uid())
      AND m.role IN ('owner', 'manager')
  )
);

-- page_inquiries
DROP POLICY IF EXISTS "Organization members can view inquiries" ON public.page_inquiries;
CREATE POLICY "Organization members can view inquiries"
ON public.page_inquiries FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.location_pages lp
    JOIN public.locations l ON lp.location_id = l.id
    JOIN public.organization_members m ON l.organization_id = m.organization_id
    WHERE lp.id = page_inquiries.page_id AND m.user_id = (select auth.uid())
  )
);

DROP POLICY IF EXISTS "Managers and Owners can update inquiries" ON public.page_inquiries;
CREATE POLICY "Managers and Owners can update inquiries"
ON public.page_inquiries FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.location_pages lp
    JOIN public.locations l ON lp.location_id = l.id
    JOIN public.organization_members m ON l.organization_id = m.organization_id
    WHERE lp.id = page_inquiries.page_id 
      AND m.user_id = (select auth.uid())
      AND m.role IN ('owner', 'manager')
  )
);

-- staff_shifts
DROP POLICY IF EXISTS "Staff can view own shifts" ON public.staff_shifts;
CREATE POLICY "Staff can view own shifts" 
ON public.staff_shifts FOR SELECT 
TO authenticated 
USING (
  user_id = (select auth.uid()) OR
  location_id IN (
    SELECT id FROM locations WHERE organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = (select auth.uid())
    )
  )
);

DROP POLICY IF EXISTS "Staff can clock in and out" ON public.staff_shifts;
CREATE POLICY "Staff can clock in and out" 
ON public.staff_shifts FOR INSERT 
TO authenticated 
WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Staff can update own active shift" ON public.staff_shifts;
CREATE POLICY "Staff can update own active shift" 
ON public.staff_shifts FOR UPDATE 
TO authenticated 
USING (user_id = (select auth.uid()) AND status = 'active');

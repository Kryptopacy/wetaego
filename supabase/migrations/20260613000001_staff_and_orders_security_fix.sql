-- ============================================================
-- PHASE 6.5: SECURITY FIXES FOR STAFF OPERATIONS
-- Restricts staff shifts, tips, and order reviews
-- ============================================================

-- ============================================================
-- 1. FIX: staff_shifts INSERT/UPDATE policy
-- Staff were able to clock into organizations they don't belong to.
-- ============================================================
drop policy if exists "Staff can manage their own shifts" on public.staff_shifts;

create policy "Staff can manage their own shifts" 
on public.staff_shifts for all 
to authenticated 
using (
  user_id = (select auth.uid()) 
  and private.is_org_member(organization_id)
) 
with check (
  user_id = (select auth.uid()) 
  and private.is_org_member(organization_id)
);

-- ============================================================
-- 2. FIX: staff_tips INSERT policy
-- Anyone could insert tips. Since tip distribution is handled
-- securely by the payment webhook, we drop the permissive public insert.
-- The service_role (backend webhook) bypasses RLS naturally.
-- ============================================================
drop policy if exists "Public can insert tips" on public.staff_tips;

-- ============================================================
-- 3. FIX: order_reviews INSERT policy
-- Anyone could insert reviews. We restrict this so that reviews
-- can only be inserted if the order actually exists, matches the org,
-- and is in a valid state for reviewing (paid, preparing, completed).
-- ============================================================
drop policy if exists "Public can insert reviews" on public.order_reviews;

create policy "Public can insert reviews" 
on public.order_reviews for insert 
to anon, authenticated 
with check (
  exists (
    select 1 from public.orders o
    where o.id = order_id
      and o.organization_id = order_reviews.organization_id
      and o.location_id = order_reviews.location_id
      and o.status in ('paid', 'preparing', 'completed')
  )
);

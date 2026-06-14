-- ============================================================
-- SECURITY HARDENING: RLS POLICIES & SECURITY DEFINER FIXES
-- Resolves warnings from Supabase DB Linter
-- ============================================================

-- ============================================================
-- 1. FIX: Permissive WITH CHECK (true) Policies
-- ============================================================

-- order_reviews (INSERT)
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

-- staff_tips (INSERT)
-- Tips are created securely via the payment webhook (service_role), so public insert is not needed.
drop policy if exists "Public can insert tips" on public.staff_tips;


-- ============================================================
-- 2. FIX: Consolidate Multiple Permissive Policies (Performance)
-- ============================================================

-- order_reviews (SELECT)
drop policy if exists "Managers can read all reviews" on public.order_reviews;
drop policy if exists "Staff can read their own reviews" on public.order_reviews;

create policy "Users can read order reviews"
on public.order_reviews for select
to authenticated
using (
  staff_id = (select auth.uid())
  or private.has_org_role(organization_id, array['owner','manager']::public.member_role[])
);

-- staff_shifts (SELECT)
drop policy if exists "Editors can read all shifts" on public.staff_shifts;
drop policy if exists "Staff can manage their own shifts" on public.staff_shifts;
drop policy if exists "Staff can read their own shifts" on public.staff_shifts;

create policy "Users can read staff shifts"
on public.staff_shifts for select
to authenticated
using (
  user_id = (select auth.uid())
  or private.has_org_role(organization_id, array['owner','manager','editor']::public.member_role[])
);

-- Since we dropped "Staff can manage their own shifts" (which was for ALL), 
-- we need to reinstate the INSERT/UPDATE/DELETE policies for staff managing their own shifts.
create policy "Staff can insert their own shifts"
on public.staff_shifts for insert
to authenticated
with check (
  user_id = (select auth.uid()) 
  and private.is_org_member(organization_id)
);

create policy "Staff can update their own shifts"
on public.staff_shifts for update
to authenticated
using (
  user_id = (select auth.uid()) 
  and private.is_org_member(organization_id)
)
with check (
  user_id = (select auth.uid()) 
  and private.is_org_member(organization_id)
);

create policy "Staff can delete their own shifts"
on public.staff_shifts for delete
to authenticated
using (
  user_id = (select auth.uid()) 
  and private.is_org_member(organization_id)
);


-- staff_tips (SELECT)
drop policy if exists "Managers can read all tips" on public.staff_tips;
drop policy if exists "Staff can read their own tips" on public.staff_tips;

create policy "Users can read staff tips"
on public.staff_tips for select
to authenticated
using (
  user_id = (select auth.uid())
  or private.has_org_role(organization_id, array['owner','manager']::public.member_role[])
);


-- ============================================================
-- 3. FIX: Restrict Public Bucket Listing
-- ============================================================

-- The menu-images bucket is public, so CDN links work automatically.
-- We drop the SELECT policies on storage.objects to prevent SDK listing/scraping.
drop policy if exists "Authenticated users can read menu images via SDK" on storage.objects;
drop policy if exists "Public can read menu images by path" on storage.objects;
drop policy if exists "Public Access" on storage.objects;


-- ============================================================
-- 4. FIX: Secure SECURITY DEFINER Functions
-- ============================================================

-- check_org_member_limit: Only used by DB triggers, no one needs to execute it.
revoke execute on function public.check_org_member_limit() from public;
revoke execute on function public.check_org_member_limit() from anon;
revoke execute on function public.check_org_member_limit() from authenticated;

-- claim_order: Only authenticated staff should execute this.
revoke execute on function public.claim_order(uuid, integer) from public;
revoke execute on function public.claim_order(uuid, integer) from anon;
grant execute on function public.claim_order(uuid, integer) to authenticated;

-- accept_invite_by_token: Only authenticated users should execute this (via server action).
revoke execute on function public.accept_invite_by_token(text) from public;
revoke execute on function public.accept_invite_by_token(text) from anon;
grant execute on function public.accept_invite_by_token(text) to authenticated;

-- get_invite_details: Redundant/unused.
drop function if exists public.get_invite_details(uuid);

-- get_invite_by_token(text):
-- INTENTIONAL EXCEPTION. This remains accessible to anon and authenticated
-- because unauthenticated users clicking an invite link need to see the organization 
-- details BEFORE they sign up or log in. The token acts as the security capability.

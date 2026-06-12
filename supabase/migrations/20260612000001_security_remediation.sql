-- ============================================================
-- SECURITY & PERFORMANCE REMEDIATION MIGRATION
-- Fixes all issues raised by the Supabase Database Advisor
-- ============================================================

-- ============================================================
-- 1. FIX: auth_users_exposed + security_definer_view
-- The old view joined auth.users directly and was accessible
-- to anon. Replace it with a SECURITY INVOKER view that only
-- exposes the user's own email via a stable helper function.
-- ============================================================

drop view if exists public.organization_member_details;

-- Re-create as SECURITY INVOKER (uses the querying user's permissions,
-- NOT the view creator's). This prevents auth.users bypass.
create or replace view public.organization_member_details
  with (security_invoker = true) -- explicitly not SECURITY DEFINER
as
select
  om.organization_id,
  om.user_id,
  om.role,
  om.created_at,
  -- Use auth.email() which each user can see for themselves;
  -- owners/managers of the org can use a separate RPC if they
  -- need member emails. This prevents leaking all auth.users.
  case
    when om.user_id = (select auth.uid()) then (select auth.email())
    else null
  end as email
from public.organization_members om
where
  -- Only allow owners/managers to see all org members
  private.has_org_role(om.organization_id, array['owner', 'manager']::public.member_role[])
  or
  -- Or any user to see their own row
  om.user_id = (select auth.uid());

-- Restrict grant to authenticated only (remove anon access)
revoke all on public.organization_member_details from anon;
grant select on public.organization_member_details to authenticated;


-- ============================================================
-- 2. FIX: function_search_path_mutable
-- Set a fixed search_path on all public trigger functions.
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ============================================================
-- 3. FIX: rls_enabled_no_policy on webhook_events
-- Add a safe default: only service role can read/write.
-- ============================================================
create policy "Only service role can access webhook events"
  on public.webhook_events for all
  to authenticated
  using (false)
  with check (false);


-- ============================================================
-- 4. FIX: auth_rls_initplan on location_pages and credit_transactions
-- Replace auth.uid() with (select auth.uid()) to prevent
-- per-row re-evaluation of the auth function.
-- ============================================================

-- Drop old policies on location_pages
drop policy if exists "Organization members can view all pages" on public.location_pages;
drop policy if exists "Managers and Owners can insert pages" on public.location_pages;
drop policy if exists "Managers and Owners can update pages" on public.location_pages;
drop policy if exists "Managers and Owners can delete pages" on public.location_pages;

-- Re-create with (select auth.uid()) and using private helpers
create policy "Organization members can view all pages"
  on public.location_pages for select
  to authenticated
  using (
    exists (
      select 1 from public.locations l
      join public.organization_members om on l.organization_id = om.organization_id
      where l.id = location_pages.location_id
        and om.user_id = (select auth.uid())
    )
  );

create policy "Managers and Owners can insert pages"
  on public.location_pages for insert
  to authenticated
  with check (
    exists (
      select 1 from public.locations l
      join public.organization_members om on l.organization_id = om.organization_id
      where l.id = location_pages.location_id
        and om.user_id = (select auth.uid())
        and om.role in ('owner', 'manager')
    )
  );

create policy "Managers and Owners can update pages"
  on public.location_pages for update
  to authenticated
  using (
    exists (
      select 1 from public.locations l
      join public.organization_members om on l.organization_id = om.organization_id
      where l.id = location_pages.location_id
        and om.user_id = (select auth.uid())
        and om.role in ('owner', 'manager')
    )
  );

create policy "Managers and Owners can delete pages"
  on public.location_pages for delete
  to authenticated
  using (
    exists (
      select 1 from public.locations l
      join public.organization_members om on l.organization_id = om.organization_id
      where l.id = location_pages.location_id
        and om.user_id = (select auth.uid())
        and om.role in ('owner', 'manager')
    )
  );

-- Drop and re-create credit_transactions policy
drop policy if exists "Org members can view credit transactions" on public.credit_transactions;

create policy "Org members can view credit transactions"
  on public.credit_transactions for select
  to authenticated
  using (
    private.is_org_member(organization_id)
  );


-- ============================================================
-- 5. FIX: multiple_permissive_policies
-- Merge the two SELECT policies on each affected table into one
-- unified policy to eliminate duplicate execution overhead.
-- ============================================================

-- locations: merge "public can read published" + "members can read"
drop policy if exists "public can read published locations" on public.locations;
drop policy if exists "members can read locations" on public.locations;
create policy "can read locations"
  on public.locations for select
  using (
    publication_status = 'published'
    or private.is_org_member(organization_id)
  );

-- menus: merge "public can read published" + "members can read"
drop policy if exists "public can read published menus" on public.menus;
drop policy if exists "members can read menus" on public.menus;
create policy "can read menus"
  on public.menus for select
  using (
    (
      publication_status = 'published'
      and exists (
        select 1 from public.locations l
        where l.id = location_id and l.publication_status = 'published'
      )
    )
    or private.is_org_member(organization_id)
  );

-- menu_categories: merge "public can read categories" + "members can read"
drop policy if exists "public can read categories for published menus" on public.menu_categories;
drop policy if exists "members can read categories" on public.menu_categories;
create policy "can read menu categories"
  on public.menu_categories for select
  using (
    exists (
      select 1
      from public.menus m
      join public.locations l on l.id = m.location_id
      where m.id = menu_id
        and m.publication_status = 'published'
        and l.publication_status = 'published'
    )
    or private.is_org_member(organization_id)
  );

-- menu_items: merge "public can read visible" + "members can read"
drop policy if exists "public can read visible items for published menus" on public.menu_items;
drop policy if exists "members can read items" on public.menu_items;
create policy "can read menu items"
  on public.menu_items for select
  using (
    (
      availability_status <> 'hidden'
      and exists (
        select 1
        from public.menu_categories c
        join public.menus m on m.id = c.menu_id
        join public.locations l on l.id = m.location_id
        where c.id = category_id
          and m.publication_status = 'published'
          and l.publication_status = 'published'
      )
    )
    or private.is_org_member(organization_id)
  );

-- qr_codes: merge "editors can manage" + "members can read"
-- The all-permissive policy already covers SELECT; drop the read-only one
drop policy if exists "members can read qr codes" on public.qr_codes;

-- location_pages: merge "Anyone can view published" + "Organization members can view all pages"
drop policy if exists "Anyone can view published pages" on public.location_pages;
-- The new "Organization members can view all pages" covers authenticated access.
-- Add a separate anon-only policy for public pages:
create policy "Public can view published pages"
  on public.location_pages for select
  to anon
  using (is_published = true);


-- ============================================================
-- 6. FIX: unindexed_foreign_keys
-- Add covering indexes for all FK columns flagged by the advisor.
-- ============================================================

create index if not exists idx_audit_logs_actor_id on public.audit_logs(actor_id);
create index if not exists idx_credit_transactions_org_id on public.credit_transactions(organization_id);
create index if not exists idx_credit_transactions_created_by on public.credit_transactions(created_by);
create index if not exists idx_media_assets_org_id on public.media_assets(organization_id);
create index if not exists idx_media_assets_uploaded_by on public.media_assets(uploaded_by);
create index if not exists idx_menu_categories_org_id on public.menu_categories(organization_id);
create index if not exists idx_menu_items_org_id on public.menu_items(organization_id);
create index if not exists idx_menus_org_id on public.menus(organization_id);
create index if not exists idx_order_items_order_id on public.order_items(order_id);
create index if not exists idx_order_items_item_id on public.order_items(item_id);
create index if not exists idx_orders_location_id on public.orders(location_id);
create index if not exists idx_org_invites_invited_by on public.organization_invites(invited_by) where exists (select 1 from information_schema.tables t where t.table_name = 'organization_invites' and t.table_schema = 'public');
create index if not exists idx_org_members_invited_by on public.organization_members(invited_by);
create index if not exists idx_organizations_created_by on public.organizations(created_by);
create index if not exists idx_qr_codes_org_id on public.qr_codes(organization_id);
create index if not exists idx_scan_events_org_id on public.scan_events(organization_id);
create index if not exists idx_scan_events_qr_code_id on public.scan_events(qr_code_id);
create index if not exists idx_service_requests_location_id on public.service_requests(location_id);
create index if not exists idx_system_settings_updated_by on public.system_settings(updated_by) where exists (select 1 from information_schema.tables t where t.table_name = 'system_settings' and t.table_schema = 'public');

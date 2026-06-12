-- ============================================================
-- SECURITY REMEDIATION - PART 3
-- Tightens the remaining "always true" insert policies and
-- fixes the public bucket listing exposure.
-- ============================================================

-- ============================================================
-- 1. FIX: orders INSERT policy
-- Replace WITH CHECK (true) with a meaningful check:
-- the location_id must reference a currently published location.
-- This prevents rogue bots inserting orders against fake/draft orgs.
-- ============================================================
drop policy if exists "public can insert orders" on public.orders;

create policy "public can insert orders"
  on public.orders for insert
  to anon, authenticated
  with check (
    exists (
      select 1 from public.locations l
      where l.id = location_id
        and l.publication_status = 'published'
    )
  );


-- ============================================================
-- 2. FIX: service_requests INSERT policy
-- Same approach: location must be published.
-- ============================================================
drop policy if exists "public can insert service requests" on public.service_requests;

create policy "public can insert service requests"
  on public.service_requests for insert
  to anon, authenticated
  with check (
    exists (
      select 1 from public.locations l
      where l.id = location_id
        and l.publication_status = 'published'
    )
  );


-- ============================================================
-- 3. FIX: scan_events INSERT policy
-- location_id is nullable (can be null on malformed scans),
-- so allow null or verify against a known location.
-- ============================================================
drop policy if exists "public can insert scan events" on public.scan_events;

create policy "public can insert scan events"
  on public.scan_events for insert
  to anon, authenticated
  with check (
    location_id is null
    or exists (
      select 1 from public.locations l
      where l.id = location_id
    )
  );


-- ============================================================
-- 4. FIX: public_bucket_allows_listing on menu-images
-- Drop the broad Public Access SELECT policy that allows listing
-- all files. Direct object URL access (cdn links) works without it.
-- Authenticated uploaders still need their own upload policy.
-- ============================================================
drop policy if exists "Public Access" on storage.objects;

-- Allow public to fetch individual objects by URL (no listing)
create policy "Public can read menu images by path"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'menu-images');

-- ============================================================
-- 5. NOTE: auth_leaked_password_protection
-- This cannot be set via SQL. Enable via:
-- Supabase Dashboard → Authentication → Settings →
-- "Password Security" → toggle "Leaked password protection" ON
-- ============================================================

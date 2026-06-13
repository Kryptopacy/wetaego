-- ============================================================
-- SECURITY REMEDIATION - AUDIT FIXES (PERFECTION)
-- Resolves remaining critical flaws found in previous migrations
-- ============================================================

-- ============================================================
-- 1. FIX: organization_invites complete token protection
-- Drop any anonymous select access. The previous fix still
-- allowed querying the whole table, exposing all tokens.
-- We replace this with a secure RPC.
-- ============================================================
drop policy if exists "anyone can view an invite by token" on public.organization_invites;
drop policy if exists "public can view invite by token" on public.organization_invites;

-- Secure RPC to fetch invite details without exposing the whole table
create or replace function public.get_invite_by_token(lookup_token text)
returns table (
  id uuid,
  organization_id uuid,
  email text,
  role public.member_role,
  token text,
  invited_by uuid,
  expires_at timestamptz,
  created_at timestamptz,
  organization_name text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select 
    i.id,
    i.organization_id,
    i.email,
    i.role,
    i.token,
    i.invited_by,
    i.expires_at,
    i.created_at,
    o.name as organization_name
  from public.organization_invites i
  join public.organizations o on o.id = i.organization_id
  where i.token = lookup_token
    and i.expires_at > now();
end;
$$;

-- Secure RPC to accept an invite. This bypasses RLS safely
-- since non-members don't have INSERT permission on members table
-- and cannot delete invites.
create or replace function public.accept_invite_by_token(lookup_token text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.organization_invites;
  v_user_id uuid;
  v_user_email text;
begin
  v_user_id := (select auth.uid());
  v_user_email := (select auth.email());

  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_invite from public.organization_invites 
  where token = lookup_token and expires_at > now();
  
  if v_invite is null then
    raise exception 'Invitation not found or expired';
  end if;

  if lower(v_invite.email) != lower(v_user_email) then
    raise exception 'This invitation was sent to %, but you are logged in as %. Please sign out and sign in with the correct account.', v_invite.email, v_user_email;
  end if;

  -- Insert member (ignore unique constraint if already member)
  insert into public.organization_members (organization_id, user_id, role, invited_by)
  values (v_invite.organization_id, v_user_id, v_invite.role, v_invite.invited_by)
  on conflict (organization_id, user_id) do update set role = excluded.role;

  -- Delete the used invite
  delete from public.organization_invites where id = v_invite.id;

  return true;
end;
$$;

-- Grant execute to public (PostgREST uses this for anon/authenticated)
grant execute on function public.get_invite_by_token(text) to public;
grant execute on function public.accept_invite_by_token(text) to authenticated;

-- ============================================================
-- 2. FIX: storage.objects complete listing protection
-- The previous policy `using (bucket_id = 'menu-images')` 
-- still allowed listing all objects in that bucket.
-- For a public bucket, NO select policy is needed for the CDN
-- to serve images. We remove the anon listing capability entirely.
-- ============================================================
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Public can read menu images by path" on storage.objects;

-- Only authenticated users can SELECT/read objects via the client SDK 
-- (e.g., download method). Anonymous users just use public URL CDN.
drop policy if exists "Authenticated users can read menu images via SDK" on storage.objects;
create policy "Authenticated users can read menu images via SDK"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'menu-images');

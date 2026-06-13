-- ============================================================
-- SECURE ORGANIZATION INVITES
-- Drops the insecure SELECT policy for anon users and
-- replaces it with a secure RPC function that explicitly
-- requires the token to be passed.
-- ============================================================

-- 1. Drop the insecure SELECT policy
drop policy if exists "public can view invite by token" on public.organization_invites;

-- 2. Create the secure RPC function
create or replace function public.get_invite_details(lookup_token uuid)
returns json
language plpgsql
security definer -- Runs with elevated privileges to bypass RLS
set search_path = public -- Secure search path
as $$
declare
  invite_record record;
begin
  -- Look up the invite by exact token, ensuring it hasn't expired
  select
    i.id,
    i.organization_id,
    i.email,
    i.role,
    i.token,
    i.expires_at,
    i.created_at,
    o.name as organization_name
  into invite_record
  from public.organization_invites i
  join public.organizations o on o.id = i.organization_id
  where i.token = lookup_token
    and i.expires_at > now();

  -- If not found or expired, return null
  if not found then
    return null;
  end if;

  -- Return as JSON
  return json_build_object(
    'id', invite_record.id,
    'organization_id', invite_record.organization_id,
    'email', invite_record.email,
    'role', invite_record.role,
    'token', invite_record.token,
    'expires_at', invite_record.expires_at,
    'created_at', invite_record.created_at,
    'organizations', json_build_object(
      'name', invite_record.organization_name
    )
  );
end;
$$;

-- 3. Ensure the RPC can be executed by anyone (anon or authenticated)
grant execute on function public.get_invite_details(uuid) to anon;
grant execute on function public.get_invite_details(uuid) to authenticated;

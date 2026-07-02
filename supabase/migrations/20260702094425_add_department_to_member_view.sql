-- Drop the view first to safely replace it with new columns
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
  om.department,
  om.created_at,
  -- Use auth.email() which each user can see for themselves;
  -- owners/managers of the org can use a separate RPC if they
  -- need member emails. This prevents leaking all auth.users.
  case
    when om.user_id = (select auth.uid()) then (select auth.email())
    else null
  end as email
from public.organization_members om;

-- Re-apply grants
revoke all on public.organization_member_details from anon;
grant select on public.organization_member_details to authenticated;

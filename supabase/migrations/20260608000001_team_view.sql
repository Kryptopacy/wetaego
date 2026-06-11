-- Create a secure view for organization members details
create or replace view public.organization_member_details as
select 
  om.organization_id,
  om.user_id,
  om.role,
  om.created_at,
  u.email
from public.organization_members om
join auth.users u on om.user_id = u.id
where (
  -- Only allow owners and managers to query this view for their organization
  private.has_org_role(om.organization_id, array['owner', 'manager']::public.member_role[])
  or
  -- Or allow any user to see their own membership details
  om.user_id = auth.uid()
);

-- Grant select permission to authenticated users
grant select on public.organization_member_details to authenticated;

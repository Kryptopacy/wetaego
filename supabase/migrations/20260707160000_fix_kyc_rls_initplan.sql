-- Drop existing policies
drop policy if exists "Organization members can view their own KYC" on public.organization_kyc;
drop policy if exists "Organization members can insert their own KYC" on public.organization_kyc;
drop policy if exists "Organization members can update their own KYC" on public.organization_kyc;

-- Recreate policies with (select auth.uid()) to fix auth_rls_initplan performance issue
create policy "Organization members can view their own KYC" on public.organization_kyc
  for select using (
    organization_id in (
      select organization_id from public.organization_members where user_id = (select auth.uid())
    )
  );

create policy "Organization members can insert their own KYC" on public.organization_kyc
  for insert with check (
    organization_id in (
      select organization_id from public.organization_members where user_id = (select auth.uid())
    )
  );

create policy "Organization members can update their own KYC" on public.organization_kyc
  for update using (
    organization_id in (
      select organization_id from public.organization_members where user_id = (select auth.uid())
    )
  );

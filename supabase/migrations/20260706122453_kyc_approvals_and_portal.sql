create type public.organization_status as enum ('pending_kyc', 'in_review', 'approved', 'suspended');
create type public.business_type as enum ('registered_business', 'individual');

-- Modify organizations table
alter table public.organizations 
  add column status public.organization_status not null default 'approved',
  add column portal_name text,
  add column portal_cover_image_url text,
  add column portal_theme_color text,
  add column portal_background_color text;

-- Create organization_kyc table
create table public.organization_kyc (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  business_type public.business_type not null,
  legal_name text not null,
  registration_number text not null, -- RC Number for registered, NIN/BVN for individuals
  document_urls jsonb not null default '[]'::jsonb, -- Array of strings
  status public.organization_status not null default 'in_review',
  submitted_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(organization_id)
);

-- Enable RLS
alter table public.organization_kyc enable row level security;

-- RLS Policies for organization_kyc
create policy "Organization members can view their own KYC" on public.organization_kyc
  for select using (
    organization_id in (
      select organization_id from public.organization_members where user_id = auth.uid()
    )
  );

create policy "Organization members can insert their own KYC" on public.organization_kyc
  for insert with check (
    organization_id in (
      select organization_id from public.organization_members where user_id = auth.uid()
    )
  );

create policy "Organization members can update their own KYC" on public.organization_kyc
  for update using (
    organization_id in (
      select organization_id from public.organization_members where user_id = auth.uid()
    )
  );

-- Superadmin overrides are handled by the global service role bypass or admin bypass

-- Add default settings to system_settings
insert into public.system_settings (key, value)
values ('require_kyc_to_publish', 'false'::jsonb)
on conflict (key) do nothing;

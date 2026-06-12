-- Phase 5 Expansion: Subscriptions, Dynamic QR Provisioning, and Invites

-- 1. Extend Organizations for SaaS Billing
alter table public.organizations
add column if not exists subscription_status text not null default 'trialing',
add column if not exists subscription_plan text not null default 'pro',
add column if not exists trial_ends_at timestamptz not null default (now() + interval '30 days'),
add column if not exists current_period_end timestamptz;

-- 2. Extend QR Codes for Dynamic Provisioning (Table Locking)
alter table public.qr_codes
add column if not exists table_identifier text,
add column if not exists is_active boolean not null default true;

-- 3. Staff Invites
create table if not exists public.organization_invites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  role public.member_role not null default 'viewer',
  invited_by uuid not null references auth.users(id) on delete cascade,
  token text not null unique default replace(gen_random_uuid()::text, '-', ''),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days')
);

create index if not exists organization_invites_org_idx on public.organization_invites(organization_id);

alter table public.organization_invites enable row level security;

create policy "owners can manage invites"
on public.organization_invites for all
to authenticated
using (private.has_org_role(organization_id, array['owner']::public.member_role[]))
with check (private.has_org_role(organization_id, array['owner']::public.member_role[]));

-- Allow public to query an invite by token (for accepting)
create policy "anyone can view an invite by token"
on public.organization_invites for select
to anon, authenticated
using (true);

-- 1. Add extended contact & social fields to locations
alter table public.locations
add column twitter_handle text,
add column facebook_handle text,
add column whatsapp_number text,
add column phone_number text,
add column google_maps_url text;

-- 2. Modify organizations to use the unified credit system
alter table public.organizations
drop column if exists extra_pages_purchased,
add column purchased_credits integer not null default 0,
add column monthly_free_credits_used integer not null default 0;

-- 3. We'll also add a history table for credit transactions
create table public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  amount integer not null, -- negative for spending, positive for purchasing
  reason text not null, -- e.g. "AI Cover Generation", "Extra Page Creation", "Purchased 100 Credits"
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.credit_transactions enable row level security;

create policy "Org members can view credit transactions"
  on public.credit_transactions for select
  using (
    exists (
      select 1 from public.organization_member_details m
      where m.organization_id = credit_transactions.organization_id
      and m.user_id = auth.uid()
    )
  );

-- Affiliate System & Billing Migration

-- 1. Create Affiliates Table
create table if not exists public.affiliates (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) not null,
    referral_code text unique not null,
    status text not null default 'active' check (status in ('active', 'suspended')),
    paystack_subaccount_code text,
    created_at timestamptz not null default now()
);

alter table public.affiliates enable row level security;

create policy "Users can read own affiliate record"
    on public.affiliates for select to authenticated
    using (user_id = auth.uid());

create policy "Users can update own affiliate record"
    on public.affiliates for update to authenticated
    using (user_id = auth.uid());

-- 2. Modify Organizations Table
alter table public.organizations
add column if not exists referred_by_affiliate_id uuid references public.affiliates(id);

-- 3. Create Billing Payments Table (SaaS subscription/credit payments)
create table if not exists public.billing_payments (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid references public.organizations(id) not null,
    amount_minor integer not null,
    currency text not null default 'NGN',
    payment_purpose text not null check (payment_purpose in ('subscription_lite', 'subscription_pro', 'credit_pack', 'subscription_enterprise')),
    provider_reference text unique not null,
    created_at timestamptz not null default now()
);

alter table public.billing_payments enable row level security;

create policy "Admins can read org billing payments"
    on public.billing_payments for select to authenticated
    using (
        exists (
            select 1 from public.organization_members
            where organization_members.organization_id = billing_payments.organization_id
            and organization_members.user_id = auth.uid()
            and organization_members.role in ('owner', 'manager')
        )
    );

-- 4. Create Affiliate Earnings Table
create table if not exists public.affiliate_earnings (
    id uuid primary key default gen_random_uuid(),
    affiliate_id uuid references public.affiliates(id) not null,
    organization_id uuid references public.organizations(id) not null,
    billing_payment_id uuid references public.billing_payments(id) not null,
    amount_minor integer not null,
    status text not null default 'pending' check (status in ('pending', 'paid')),
    created_at timestamptz not null default now()
);

alter table public.affiliate_earnings enable row level security;

create policy "Affiliates can read own earnings"
    on public.affiliate_earnings for select to authenticated
    using (
        exists (
            select 1 from public.affiliates
            where affiliates.id = affiliate_earnings.affiliate_id
            and affiliates.user_id = auth.uid()
        )
    );

-- 5. Update system settings to add default affiliate and exchange rates
insert into public.system_settings (key, value)
values (
    'affiliate',
    '{"default_percentage": 10}'
) on conflict (key) do update set value = excluded.value;

insert into public.system_settings (key, value)
values (
    'exchange_rates',
    '{"usd_to_ngn": 1500}'
) on conflict (key) do nothing;

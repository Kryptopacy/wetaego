-- Migration: 20260630000000_coupons_system.sql

CREATE TYPE public.coupon_discount_type AS ENUM ('free_plan', 'free_credits', 'plan_extension', 'trial_extension');

CREATE TABLE public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type public.coupon_discount_type not null,
  discount_value integer not null, -- days (for trial/plan extension), credits (for free_credits), or days (for free_plan length)
  plan_tier text, -- e.g., 'lite', 'pro' (only used if discount_type is free_plan)
  expires_at timestamptz,
  max_redemptions integer,
  times_redeemed integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

CREATE TABLE public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  redeemed_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique(coupon_id, organization_id) -- An org can only redeem a specific coupon once
);

-- Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

-- Policies for Coupons
CREATE POLICY "Coupons are viewable by everyone" ON public.coupons
  FOR SELECT TO authenticated USING (is_active = true);

-- Only admins can manage coupons (this relies on the same logic used for other admin tools, usually backend service role or explicitly checking email. We can just leave write access to service_role)
-- No INSERT/UPDATE/DELETE policies for authenticated users means they can't modify them. Admin actions will use service_role.

-- Policies for Redemptions
CREATE POLICY "Users can view their own org's redemptions" ON public.coupon_redemptions
  FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
  );

-- Backend service_role will handle inserts for redemptions

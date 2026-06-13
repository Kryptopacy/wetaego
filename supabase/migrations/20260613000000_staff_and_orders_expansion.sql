-- ============================================================
-- PHASE 6: STAFF OPERATIONS & POST-SERVICE TIPPING
-- Adds Staff Limits, Shifts, Tip Ledger, and Order Claiming
-- ============================================================

-- ============================================================
-- 1. EXTEND ORGANIZATIONS & ORDERS
-- ============================================================

alter table public.organizations 
add column if not exists max_concurrent_orders integer not null default 3;

alter table public.orders
add column if not exists assigned_staff_id uuid references auth.users(id) on delete set null,
add column if not exists tip_amount_minor integer not null default 0,
add column if not exists estimated_prep_time_minutes integer,
add column if not exists estimated_ready_at timestamptz;

create index if not exists idx_orders_assigned_staff on public.orders(assigned_staff_id);

-- ============================================================
-- 2. STAFF SHIFTS TABLE
-- ============================================================
create table if not exists public.staff_shifts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  check_in timestamptz not null default now(),
  check_out timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_staff_shifts_user on public.staff_shifts(user_id);
create index if not exists idx_staff_shifts_location on public.staff_shifts(location_id) where check_out is null;

alter table public.staff_shifts enable row level security;

drop policy if exists "Staff can read their own shifts" on public.staff_shifts;
create policy "Staff can read their own shifts" 
on public.staff_shifts for select 
to authenticated 
using (user_id = (select auth.uid()));

drop policy if exists "Editors can read all shifts" on public.staff_shifts;
create policy "Editors can read all shifts" 
on public.staff_shifts for select 
to authenticated 
using (private.has_org_role(organization_id, array['owner','manager','editor']::public.member_role[]));

drop policy if exists "Staff can manage their own shifts" on public.staff_shifts;
create policy "Staff can manage their own shifts" 
on public.staff_shifts for all 
to authenticated 
using (user_id = (select auth.uid())) 
with check (user_id = (select auth.uid()));

-- ============================================================
-- 3. STAFF TIPS LEDGER
-- ============================================================
create table if not exists public.staff_tips (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount_minor integer not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_staff_tips_user on public.staff_tips(user_id);
create index if not exists idx_staff_tips_org on public.staff_tips(organization_id);

alter table public.staff_tips enable row level security;

drop policy if exists "Staff can read their own tips" on public.staff_tips;
create policy "Staff can read their own tips" 
on public.staff_tips for select 
to authenticated 
using (user_id = (select auth.uid()));

drop policy if exists "Managers can read all tips" on public.staff_tips;
create policy "Managers can read all tips" 
on public.staff_tips for select 
to authenticated 
using (private.has_org_role(organization_id, array['owner','manager']::public.member_role[]));

drop policy if exists "Public can insert tips" on public.staff_tips;
create policy "Public can insert tips" 
on public.staff_tips for insert 
to anon, authenticated 
with check (true);

-- ============================================================
-- 4. ORDER REVIEWS (SERVICE FEEDBACK)
-- ============================================================
create table if not exists public.order_reviews (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  staff_id uuid references auth.users(id) on delete set null,
  rating integer not null check (rating >= 1 and rating <= 5),
  feedback text,
  created_at timestamptz not null default now()
);

create index if not exists idx_order_reviews_staff on public.order_reviews(staff_id);
create index if not exists idx_order_reviews_org on public.order_reviews(organization_id);

alter table public.order_reviews enable row level security;

drop policy if exists "Staff can read their own reviews" on public.order_reviews;
create policy "Staff can read their own reviews" 
on public.order_reviews for select 
to authenticated 
using (staff_id = (select auth.uid()));

drop policy if exists "Managers can read all reviews" on public.order_reviews;
create policy "Managers can read all reviews" 
on public.order_reviews for select 
to authenticated 
using (private.has_org_role(organization_id, array['owner','manager']::public.member_role[]));

drop policy if exists "Public can insert reviews" on public.order_reviews;
create policy "Public can insert reviews" 
on public.order_reviews for insert 
to anon, authenticated 
with check (true);

-- ============================================================
-- 5. STAFF TIER LIMITS (TRIGGER)
-- ============================================================
create or replace function public.check_org_member_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan text;
  v_count integer;
  v_limit integer;
begin
  select subscription_plan into v_plan from public.organizations where id = new.organization_id;
  
  if v_plan = 'free' then v_limit := 2;
  elsif v_plan = 'pro' then v_limit := 10;
  else v_limit := 999999;
  end if;

  select count(*) into v_count from public.organization_members where organization_id = new.organization_id;
  
  if v_count >= v_limit then
    raise exception 'Staff limit reached for the current plan (%). Please upgrade to add more members.', v_plan;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_check_org_member_limit on public.organization_members;
create trigger trg_check_org_member_limit
before insert on public.organization_members
for each row execute function public.check_org_member_limit();

-- ============================================================
-- 6. ATOMIC ORDER CLAIMING (RPC)
-- ============================================================
create or replace function public.claim_order(p_order_id uuid, p_prep_time_minutes int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_org_id uuid;
  v_max_concurrent int;
  v_current_active int;
  v_rows_updated int;
begin
  v_user_id := (select auth.uid());
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Get org ID to check limits
  select organization_id into v_org_id from public.orders where id = p_order_id;
  if v_org_id is null then
    raise exception 'Order not found';
  end if;

  -- Ensure staff member actually works here
  if not private.is_org_member(v_org_id) then
    raise exception 'Not authorized for this organization';
  end if;

  -- Check concurrency limits
  select max_concurrent_orders into v_max_concurrent from public.organizations where id = v_org_id;
  
  select count(*) into v_current_active 
  from public.orders 
  where assigned_staff_id = v_user_id 
    and status = 'preparing';
    
  if v_current_active >= v_max_concurrent then
    raise exception 'You cannot claim more than % orders at once. Please complete an active order first.', v_max_concurrent;
  end if;

  -- Atomic update
  update public.orders
  set 
    assigned_staff_id = v_user_id,
    status = 'preparing',
    estimated_prep_time_minutes = p_prep_time_minutes,
    estimated_ready_at = now() + (p_prep_time_minutes || ' minutes')::interval
  where id = p_order_id 
    and assigned_staff_id is null
    and status = 'paid';

  get diagnostics v_rows_updated = row_count;

  if v_rows_updated = 0 then
    -- Order was already claimed or is not paid
    return false;
  end if;

  return true;
end;
$$;

grant execute on function public.claim_order(uuid, int) to authenticated;

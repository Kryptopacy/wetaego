create type public.payment_provider as enum ('paystack', 'stripe');
create type public.order_status as enum ('pending', 'paid', 'preparing', 'completed', 'cancelled');
create type public.service_request_type as enum ('waiter', 'bill', 'cleanup');
create type public.service_request_status as enum ('pending', 'acknowledged', 'resolved');

create table public.organization_payment_settings (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  provider public.payment_provider not null default 'paystack',
  provider_account_id text,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  customer_name text,
  table_identifier text,
  status public.order_status not null default 'pending',
  total_amount_minor integer not null default 0,
  payment_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  item_id uuid references public.menu_items(id) on delete set null,
  item_name text not null,
  quantity integer not null default 1,
  price_minor integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.service_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  table_identifier text not null,
  request_type public.service_request_type not null default 'waiter',
  status public.service_request_status not null default 'pending',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

-- Triggers for updated_at
create trigger set_org_payment_settings_updated_at
before update on public.organization_payment_settings
for each row execute function public.set_updated_at();

create trigger set_orders_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

-- RLS Policies
alter table public.organization_payment_settings enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.service_requests enable row level security;

-- Payments: Only owners/managers can read/write
create policy "editors can manage payment settings"
on public.organization_payment_settings for all
to authenticated
using (private.has_org_role(organization_id, array['owner','manager']::public.member_role[]))
with check (private.has_org_role(organization_id, array['owner','manager']::public.member_role[]));

-- Orders: Public can insert, editors can read/update
create policy "public can insert orders"
on public.orders for insert
to anon, authenticated
with check (true);

create policy "editors can read orders"
on public.orders for select
to authenticated
using (private.has_org_role(organization_id, array['owner','manager','editor']::public.member_role[]));

create policy "editors can update orders"
on public.orders for update
to authenticated
using (private.has_org_role(organization_id, array['owner','manager','editor']::public.member_role[]))
with check (private.has_org_role(organization_id, array['owner','manager','editor']::public.member_role[]));

-- Order Items: Public can insert, editors can read
create policy "public can insert order items"
on public.order_items for insert
to anon, authenticated
with check (
  exists (
    select 1 from public.orders o 
    where o.id = order_id 
      and o.status = 'pending'
  )
);

create policy "editors can read order items"
on public.order_items for select
to authenticated
using (
  exists (
    select 1 from public.orders o
    where o.id = order_id
      and private.has_org_role(o.organization_id, array['owner','manager','editor']::public.member_role[])
  )
);

-- Service Requests: Public can insert, editors can read/update
create policy "public can insert service requests"
on public.service_requests for insert
to anon, authenticated
with check (true);

create policy "editors can read service requests"
on public.service_requests for select
to authenticated
using (private.has_org_role(organization_id, array['owner','manager','editor']::public.member_role[]));

create policy "editors can update service requests"
on public.service_requests for update
to authenticated
using (private.has_org_role(organization_id, array['owner','manager','editor']::public.member_role[]))
with check (private.has_org_role(organization_id, array['owner','manager','editor']::public.member_role[]));

-- Grant access to public tables
grant select, insert, update on public.orders, public.service_requests to anon;
grant select, insert on public.order_items to anon;
grant select, insert, update, delete on 
  public.organization_payment_settings,
  public.orders,
  public.order_items,
  public.service_requests
to authenticated;

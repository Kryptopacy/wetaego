create extension if not exists pgcrypto;

create schema if not exists private;

create type public.member_role as enum ('owner', 'manager', 'editor', 'viewer');
create type public.availability_status as enum ('available', 'low', 'sold_out', 'hidden');
create type public.publication_status as enum ('draft', 'published', 'archived');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  plan text not null default 'free',
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organizations_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.member_role not null default 'viewer',
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  slug text not null,
  tagline text,
  address text,
  phone text,
  currency_code char(3) not null default 'NGN',
  theme_color text not null default '#0f7b55',
  cover_image_url text,
  publication_status public.publication_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, slug),
  unique (slug),
  constraint locations_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint locations_currency_format check (currency_code ~ '^[A-Z]{3}$')
);

create table public.menus (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  name text not null,
  description text,
  publication_status public.publication_status not null default 'draft',
  starts_at timestamptz,
  ends_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  menu_id uuid not null references public.menus(id) on delete cascade,
  name text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  category_id uuid not null references public.menu_categories(id) on delete cascade,
  name text not null,
  description text,
  price_minor integer not null default 0,
  availability_status public.availability_status not null default 'available',
  is_featured boolean not null default false,
  image_url text,
  dietary_tags text[] not null default '{}',
  allergen_tags text[] not null default '{}',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint menu_items_price_nonnegative check (price_minor >= 0)
);

create table public.qr_codes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  label text not null default 'Main QR',
  destination_path text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.scan_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  location_id uuid references public.locations(id) on delete set null,
  qr_code_id uuid references public.qr_codes(id) on delete set null,
  user_agent text,
  referrer text,
  ip_hash text,
  created_at timestamptz not null default now()
);

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  uploaded_by uuid references auth.users(id) on delete set null,
  bucket text not null,
  object_path text not null,
  alt_text text,
  created_at timestamptz not null default now(),
  unique (bucket, object_path)
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_table text not null,
  entity_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index organization_members_user_id_idx on public.organization_members(user_id);
create index locations_organization_id_idx on public.locations(organization_id);
create index locations_public_slug_idx on public.locations(slug) where publication_status = 'published';
create index menus_location_id_idx on public.menus(location_id);
create index menus_public_idx on public.menus(location_id, sort_order) where publication_status = 'published';
create index menu_categories_menu_id_idx on public.menu_categories(menu_id, sort_order);
create index menu_items_category_id_idx on public.menu_items(category_id, sort_order);
create index menu_items_visible_idx on public.menu_items(category_id, sort_order) where availability_status <> 'hidden';
create index qr_codes_location_id_idx on public.qr_codes(location_id);
create index scan_events_location_created_idx on public.scan_events(location_id, created_at desc);
create index audit_logs_org_created_idx on public.audit_logs(organization_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.is_org_member(target_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = target_org_id
      and om.user_id = (select auth.uid())
  );
$$;

create or replace function private.has_org_role(target_org_id uuid, allowed_roles public.member_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = target_org_id
      and om.user_id = (select auth.uid())
      and om.role = any (allowed_roles)
  );
$$;

create trigger set_organizations_updated_at
before update on public.organizations
for each row execute function public.set_updated_at();

create trigger set_locations_updated_at
before update on public.locations
for each row execute function public.set_updated_at();

create trigger set_menus_updated_at
before update on public.menus
for each row execute function public.set_updated_at();

create trigger set_menu_categories_updated_at
before update on public.menu_categories
for each row execute function public.set_updated_at();

create trigger set_menu_items_updated_at
before update on public.menu_items
for each row execute function public.set_updated_at();

create trigger set_qr_codes_updated_at
before update on public.qr_codes
for each row execute function public.set_updated_at();

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.locations enable row level security;
alter table public.menus enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.qr_codes enable row level security;
alter table public.scan_events enable row level security;
alter table public.media_assets enable row level security;
alter table public.audit_logs enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.locations, public.menus, public.menu_categories, public.menu_items to anon;
grant select, insert, update, delete on
  public.organizations,
  public.organization_members,
  public.locations,
  public.menus,
  public.menu_categories,
  public.menu_items,
  public.qr_codes,
  public.media_assets
to authenticated;
grant select, insert on public.scan_events to anon, authenticated;
grant select, insert on public.audit_logs to authenticated;

create policy "members can read organizations"
on public.organizations for select
to authenticated
using (private.is_org_member(id));

create policy "authenticated users can create organizations"
on public.organizations for insert
to authenticated
with check ((select auth.uid()) is not null and created_by = (select auth.uid()));

create policy "owners and managers can update organizations"
on public.organizations for update
to authenticated
using (private.has_org_role(id, array['owner','manager']::public.member_role[]))
with check (private.has_org_role(id, array['owner','manager']::public.member_role[]));

create policy "members can read memberships"
on public.organization_members for select
to authenticated
using (private.is_org_member(organization_id));

create policy "creator can add initial owner membership"
on public.organization_members for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and role = 'owner'
  and exists (
    select 1
    from public.organizations o
    where o.id = organization_id
      and o.created_by = (select auth.uid())
  )
);

create policy "owners can manage memberships"
on public.organization_members for update
to authenticated
using (private.has_org_role(organization_id, array['owner']::public.member_role[]))
with check (private.has_org_role(organization_id, array['owner']::public.member_role[]));

create policy "owners can remove memberships"
on public.organization_members for delete
to authenticated
using (private.has_org_role(organization_id, array['owner']::public.member_role[]));

create policy "public can read published locations"
on public.locations for select
to anon, authenticated
using (publication_status = 'published');

create policy "members can read locations"
on public.locations for select
to authenticated
using (private.is_org_member(organization_id));

create policy "editors can insert locations"
on public.locations for insert
to authenticated
with check (private.has_org_role(organization_id, array['owner','manager','editor']::public.member_role[]));

create policy "editors can update locations"
on public.locations for update
to authenticated
using (private.has_org_role(organization_id, array['owner','manager','editor']::public.member_role[]))
with check (private.has_org_role(organization_id, array['owner','manager','editor']::public.member_role[]));

create policy "managers can delete locations"
on public.locations for delete
to authenticated
using (private.has_org_role(organization_id, array['owner','manager']::public.member_role[]));

create policy "public can read published menus"
on public.menus for select
to anon, authenticated
using (
  publication_status = 'published'
  and exists (
    select 1 from public.locations l
    where l.id = location_id
      and l.publication_status = 'published'
  )
);

create policy "members can read menus"
on public.menus for select
to authenticated
using (private.is_org_member(organization_id));

create policy "editors can insert menus"
on public.menus for insert
to authenticated
with check (private.has_org_role(organization_id, array['owner','manager','editor']::public.member_role[]));

create policy "editors can update menus"
on public.menus for update
to authenticated
using (private.has_org_role(organization_id, array['owner','manager','editor']::public.member_role[]))
with check (private.has_org_role(organization_id, array['owner','manager','editor']::public.member_role[]));

create policy "editors can delete menus"
on public.menus for delete
to authenticated
using (private.has_org_role(organization_id, array['owner','manager','editor']::public.member_role[]));

create policy "public can read categories for published menus"
on public.menu_categories for select
to anon, authenticated
using (
  exists (
    select 1
    from public.menus m
    join public.locations l on l.id = m.location_id
    where m.id = menu_id
      and m.publication_status = 'published'
      and l.publication_status = 'published'
  )
);

create policy "members can read categories"
on public.menu_categories for select
to authenticated
using (private.is_org_member(organization_id));

create policy "editors can insert categories"
on public.menu_categories for insert
to authenticated
with check (private.has_org_role(organization_id, array['owner','manager','editor']::public.member_role[]));

create policy "editors can update categories"
on public.menu_categories for update
to authenticated
using (private.has_org_role(organization_id, array['owner','manager','editor']::public.member_role[]))
with check (private.has_org_role(organization_id, array['owner','manager','editor']::public.member_role[]));

create policy "editors can delete categories"
on public.menu_categories for delete
to authenticated
using (private.has_org_role(organization_id, array['owner','manager','editor']::public.member_role[]));

create policy "public can read visible items for published menus"
on public.menu_items for select
to anon, authenticated
using (
  availability_status <> 'hidden'
  and exists (
    select 1
    from public.menu_categories c
    join public.menus m on m.id = c.menu_id
    join public.locations l on l.id = m.location_id
    where c.id = category_id
      and m.publication_status = 'published'
      and l.publication_status = 'published'
  )
);

create policy "members can read items"
on public.menu_items for select
to authenticated
using (private.is_org_member(organization_id));

create policy "editors can insert items"
on public.menu_items for insert
to authenticated
with check (private.has_org_role(organization_id, array['owner','manager','editor']::public.member_role[]));

create policy "editors can update items"
on public.menu_items for update
to authenticated
using (private.has_org_role(organization_id, array['owner','manager','editor']::public.member_role[]))
with check (private.has_org_role(organization_id, array['owner','manager','editor']::public.member_role[]));

create policy "editors can delete items"
on public.menu_items for delete
to authenticated
using (private.has_org_role(organization_id, array['owner','manager','editor']::public.member_role[]));

create policy "members can read qr codes"
on public.qr_codes for select
to authenticated
using (private.is_org_member(organization_id));

create policy "editors can manage qr codes"
on public.qr_codes for all
to authenticated
using (private.has_org_role(organization_id, array['owner','manager','editor']::public.member_role[]))
with check (private.has_org_role(organization_id, array['owner','manager','editor']::public.member_role[]));

create policy "public can insert scan events"
on public.scan_events for insert
to anon, authenticated
with check (true);

create policy "members can read scan events"
on public.scan_events for select
to authenticated
using (organization_id is not null and private.is_org_member(organization_id));

create policy "members can read media"
on public.media_assets for select
to authenticated
using (private.is_org_member(organization_id));

create policy "editors can insert media"
on public.media_assets for insert
to authenticated
with check (private.has_org_role(organization_id, array['owner','manager','editor']::public.member_role[]));

create policy "editors can update media"
on public.media_assets for update
to authenticated
using (private.has_org_role(organization_id, array['owner','manager','editor']::public.member_role[]))
with check (private.has_org_role(organization_id, array['owner','manager','editor']::public.member_role[]));

create policy "editors can delete media"
on public.media_assets for delete
to authenticated
using (private.has_org_role(organization_id, array['owner','manager','editor']::public.member_role[]));

create policy "members can read audit logs"
on public.audit_logs for select
to authenticated
using (private.is_org_member(organization_id));

create policy "members can insert audit logs"
on public.audit_logs for insert
to authenticated
with check (private.is_org_member(organization_id));

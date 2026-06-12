-- Update organizations with billing limits
alter table public.organizations
add column subscription_tier text not null default 'starter' check (subscription_tier in ('starter', 'pro', 'enterprise')),
add column extra_pages_purchased integer not null default 0;

-- Create location_pages table
create table public.location_pages (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations(id) on delete cascade,
  title text not null,
  slug text not null,
  content text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(location_id, slug),
  constraint location_pages_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

-- RLS for location_pages
alter table public.location_pages enable row level security;

-- Policies for location_pages
create policy "Anyone can view published pages"
  on public.location_pages for select
  using (is_published = true);

-- Organization members can view all pages for their locations
create policy "Organization members can view all pages"
  on public.location_pages for select
  using (
    exists (
      select 1 from public.locations l
      join public.organization_member_details m on l.organization_id = m.organization_id
      where l.id = location_pages.location_id
      and m.user_id = auth.uid()
    )
  );

-- Only Managers and Owners can insert/update/delete pages
create policy "Managers and Owners can insert pages"
  on public.location_pages for insert
  with check (
    exists (
      select 1 from public.locations l
      join public.organization_member_details m on l.organization_id = m.organization_id
      where l.id = location_pages.location_id
      and m.user_id = auth.uid()
      and m.role in ('owner', 'manager')
    )
  );

create policy "Managers and Owners can update pages"
  on public.location_pages for update
  using (
    exists (
      select 1 from public.locations l
      join public.organization_member_details m on l.organization_id = m.organization_id
      where l.id = location_pages.location_id
      and m.user_id = auth.uid()
      and m.role in ('owner', 'manager')
    )
  );

create policy "Managers and Owners can delete pages"
  on public.location_pages for delete
  using (
    exists (
      select 1 from public.locations l
      join public.organization_member_details m on l.organization_id = m.organization_id
      where l.id = location_pages.location_id
      and m.user_id = auth.uid()
      and m.role in ('owner', 'manager')
    )
  );

-- Function for updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger for updated_at
create trigger set_location_pages_updated_at
  before update on public.location_pages
  for each row execute function public.handle_updated_at();

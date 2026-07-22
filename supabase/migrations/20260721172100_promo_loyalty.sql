create table if not exists public.location_promo_codes (
  id uuid default gen_random_uuid() primary key,
  location_id uuid references public.locations(id) not null,
  code text not null,
  discount_type text not null check (discount_type in ('percentage', 'flat')),
  discount_value numeric not null,
  max_uses integer,
  current_uses integer default 0 not null,
  valid_until timestamp with time zone,
  is_active boolean default true not null,
  created_at timestamp with time zone default now() not null
);

create unique index if not exists location_promo_codes_code_idx on public.location_promo_codes (location_id, code);

alter table public.location_promo_codes enable row level security;

drop policy if exists "Promo codes are viewable by everyone." on public.location_promo_codes;
create policy "Promo codes are viewable by everyone."
  on public.location_promo_codes for select
  using (true);

drop policy if exists "Promo codes are insertable by location managers." on public.location_promo_codes;
create policy "Promo codes are insertable by location managers."
  on public.location_promo_codes for insert
  with check (
    exists (
      select 1 from public.organization_members om
      join public.locations l on l.organization_id = om.organization_id
      where l.id = location_promo_codes.location_id
      and om.user_id = auth.uid()
      and om.role in ('owner', 'manager')
    )
  );

drop policy if exists "Promo codes are updatable by location managers." on public.location_promo_codes;
create policy "Promo codes are updatable by location managers."
  on public.location_promo_codes for update
  using (
    exists (
      select 1 from public.organization_members om
      join public.locations l on l.organization_id = om.organization_id
      where l.id = location_promo_codes.location_id
      and om.user_id = auth.uid()
      and om.role in ('owner', 'manager')
    )
  );

drop policy if exists "Promo codes are deletable by location managers." on public.location_promo_codes;
create policy "Promo codes are deletable by location managers."
  on public.location_promo_codes for delete
  using (
    exists (
      select 1 from public.organization_members om
      join public.locations l on l.organization_id = om.organization_id
      where l.id = location_promo_codes.location_id
      and om.user_id = auth.uid()
      and om.role in ('owner', 'manager')
    )
  );

-- Function to increment loyalty points
create or replace function public.increment_loyalty_points(profile_id uuid, points integer)
returns void as $$
begin
  update public.customer_profiles
  set loyalty_points = coalesce(loyalty_points, 0) + points
  where id = profile_id;
end;
$$ language plpgsql security definer;

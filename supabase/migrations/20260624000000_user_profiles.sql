-- Migration to create user_profiles mapping user ids to full names

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;

-- All authenticated users can read profiles (since they need to see team members)
create policy "Authenticated users can read user_profiles"
on public.user_profiles for select
to authenticated
using (true);

-- Users can insert their own profile
create policy "Users can insert their own profile"
on public.user_profiles for insert
to authenticated
with check ((select auth.uid()) = id);

-- Users can update their own profile
create policy "Users can update their own profile"
on public.user_profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create trigger set_user_profiles_updated_at
before update on public.user_profiles
for each row execute function public.set_updated_at();

-- Trigger to automatically create a user profile from auth.users metadata if it exists
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.raw_user_meta_data->>'full_name' is not null then
    insert into public.user_profiles (id, full_name)
    values (new.id, new.raw_user_meta_data->>'full_name')
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user_profile();

-- Backfill existing users if they have a full_name in their metadata
insert into public.user_profiles (id, full_name)
select id, raw_user_meta_data->>'full_name'
from auth.users
where raw_user_meta_data->>'full_name' is not null
on conflict (id) do nothing;

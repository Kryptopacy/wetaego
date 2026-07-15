-- Sponsored Ads Table
create table public.sponsored_ads (
    id uuid default gen_random_uuid() primary key,
    location_id uuid references public.locations(id) on delete cascade null,
    is_platform_ad boolean default false not null,
    category text,
    title text not null,
    image_url text not null,
    target_link text not null,
    is_active boolean default true not null,
    approval_status text default 'pending' check (approval_status in ('pending', 'approved', 'rejected')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ad Events Table for scalable tracking
create table public.ad_events (
    id uuid default gen_random_uuid() primary key,
    ad_id uuid references public.sponsored_ads(id) on delete cascade not null,
    event_type text not null check (event_type in ('impression', 'click')),
    session_id text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table public.sponsored_ads enable row level security;
alter table public.ad_events enable row level security;

-- Sponsored Ads read policy: anyone can read active approved ads
create policy "Anyone can read active approved sponsored ads" on public.sponsored_ads
    for select using (is_active = true and approval_status = 'approved');

-- Owners/Managers can read their own location's ads
create policy "Staff can read their own location ads" on public.sponsored_ads
    for select using (
        location_id in (
            select loc.id from public.locations loc
            join public.organization_members mem on mem.organization_id = loc.organization_id
            where mem.user_id = auth.uid()
        )
    );

-- Owners/Managers can insert/update their own location's ads
create policy "Staff can insert their own location ads" on public.sponsored_ads
    for insert with check (
        location_id in (
            select loc.id from public.locations loc
            join public.organization_members mem on mem.organization_id = loc.organization_id
            where mem.user_id = auth.uid()
        )
        and is_platform_ad = false
    );

create policy "Staff can update their own location ads" on public.sponsored_ads
    for update using (
        location_id in (
            select loc.id from public.locations loc
            join public.organization_members mem on mem.organization_id = loc.organization_id
            where mem.user_id = auth.uid()
        )
    );

create policy "Staff can delete their own location ads" on public.sponsored_ads
    for delete using (
        location_id in (
            select loc.id from public.locations loc
            join public.organization_members mem on mem.organization_id = loc.organization_id
            where mem.user_id = auth.uid()
        )
    );

-- Ad events: anyone can insert (anonymous users trigger impressions)
create policy "Anyone can insert ad events" on public.ad_events
    for insert with check (true);

-- Staff can view ad events for their location's ads
create policy "Staff can view their ad events" on public.ad_events
    for select using (
        ad_id in (
            select id from public.sponsored_ads where location_id in (
                select loc.id from public.locations loc
                join public.organization_members mem on mem.organization_id = loc.organization_id
                where mem.user_id = auth.uid()
            )
        )
    );

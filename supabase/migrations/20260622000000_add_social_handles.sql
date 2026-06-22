-- Add X (Twitter) and TikTok handles to locations table
alter table public.locations 
add column if not exists x_handle text,
add column if not exists tiktok_handle text;

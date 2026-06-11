-- Add AI Configuration columns to locations
alter table public.locations
add column if not exists ai_enabled boolean not null default false,
add column if not exists ai_name text not null default 'AI Assistant',
add column if not exists ai_instructions text,
add column if not exists brand_knowledge text;

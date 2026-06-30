-- Add new structured AI Configuration columns to locations
alter table public.locations
add column if not exists ai_base_personality text not null default 'professional',
add column if not exists ai_escalation_contact text,
add column if not exists ai_faqs jsonb default '[]'::jsonb;

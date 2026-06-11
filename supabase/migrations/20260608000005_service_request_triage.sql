-- Add custom text and urgency tier to service requests
alter table public.service_requests
add column custom_request_text text,
add column urgency_tier text not null default 'standard';

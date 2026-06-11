-- 1. Create system settings table
create table public.system_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

-- 2. Insert default dynamic configuration
insert into public.system_settings (key, value) values
('pricing', '{"pro_monthly_ngn": 49000, "credits_10_ngn": 15000, "credits_50_ngn": 60000}'),
('credit_costs', '{"ai_cover": 5, "copywriter": 1, "translation_per_category": 2, "custom_page": 10}'),
('plan_limits', '{"starter": {"credits": 0, "pages": 0}, "pro": {"credits": 50, "pages": 1}, "enterprise": {"credits": 200, "pages": 100}}'),
('ai_models', '{"text_generation": "gemini-3.1-flash", "image_generation": "imagen-3.0-generate-001"}');

-- 3. Row Level Security
alter table public.system_settings enable row level security;

-- Everyone can read system settings
create policy "System settings readable by all authenticated users"
  on public.system_settings for select to authenticated using (true);

-- Updates are strictly protected by server actions which will verify email server-side.
-- We omit an RLS update policy for the client to enforce going through the backend.

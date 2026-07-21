-- Add advanced_rules to loyalty_settings
ALTER TABLE public.loyalty_settings ADD COLUMN IF NOT EXISTS advanced_rules jsonb DEFAULT '[]'::jsonb;

-- Add upsell_mode to location_pages ('auto' or 'curated')
ALTER TABLE public.location_pages ADD COLUMN IF NOT EXISTS upsell_mode text DEFAULT 'auto';

-- Add is_upsell_eligible to page_items
ALTER TABLE public.page_items ADD COLUMN IF NOT EXISTS is_upsell_eligible boolean DEFAULT false;

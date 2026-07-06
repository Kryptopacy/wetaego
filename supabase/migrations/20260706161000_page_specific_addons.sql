ALTER TABLE public.location_pages
ADD COLUMN IF NOT EXISTS global_discount_enabled boolean default false,
ADD COLUMN IF NOT EXISTS global_discount_percentage numeric,
ADD COLUMN IF NOT EXISTS global_discount_banner_text text,
ADD COLUMN IF NOT EXISTS spinner_enabled boolean default false,
ADD COLUMN IF NOT EXISTS spinner_config jsonb,
ADD COLUMN IF NOT EXISTS delivery_enabled boolean default false,
ADD COLUMN IF NOT EXISTS delivery_fee_minor integer,
ADD COLUMN IF NOT EXISTS delivery_minimum_order_minor integer,
ADD COLUMN IF NOT EXISTS delivery_note text,
ADD COLUMN IF NOT EXISTS ai_enabled boolean default false,
ADD COLUMN IF NOT EXISTS ai_name text,
ADD COLUMN IF NOT EXISTS ai_instructions text,
ADD COLUMN IF NOT EXISTS ai_base_personality text,
ADD COLUMN IF NOT EXISTS ai_escalation_contact text,
ADD COLUMN IF NOT EXISTS ai_faqs jsonb;

-- Migrate data from locations to the default/first location_pages
UPDATE public.location_pages lp
SET
  global_discount_enabled = l.global_discount_enabled,
  global_discount_percentage = l.global_discount_percentage,
  global_discount_banner_text = l.global_discount_banner_text,
  spinner_enabled = l.spinner_enabled,
  spinner_config = l.spinner_config,
  delivery_enabled = l.delivery_enabled,
  delivery_fee_minor = l.delivery_fee_minor,
  delivery_minimum_order_minor = l.delivery_minimum_order_minor,
  delivery_note = l.delivery_note,
  ai_enabled = l.ai_enabled,
  ai_name = l.ai_name,
  ai_instructions = l.ai_instructions,
  ai_base_personality = l.ai_base_personality,
  ai_escalation_contact = l.ai_escalation_contact,
  ai_faqs = l.ai_faqs
FROM public.locations l
WHERE lp.location_id = l.id;

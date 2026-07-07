-- Add JSONB metadata columns for core extensibility
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Add IOU reminder tracking to customer_profiles
ALTER TABLE public.customer_profiles ADD COLUMN IF NOT EXISTS last_iou_reminder_sent_at timestamptz;

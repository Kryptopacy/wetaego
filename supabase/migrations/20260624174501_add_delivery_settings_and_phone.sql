-- Add delivery settings to the business location
ALTER TABLE public.locations ADD COLUMN delivery_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.locations ADD COLUMN delivery_fee_minor INTEGER DEFAULT 0;
ALTER TABLE public.locations ADD COLUMN delivery_minimum_order_minor INTEGER DEFAULT 0;
ALTER TABLE public.locations ADD COLUMN delivery_note VARCHAR(255);

-- Add critical contact and fulfillment fields to the orders table
ALTER TABLE public.orders ADD COLUMN customer_phone VARCHAR(50);
ALTER TABLE public.orders ADD COLUMN fulfillment_type VARCHAR(20) DEFAULT 'table'; -- 'table', 'pickup', 'delivery'
ALTER TABLE public.orders ADD COLUMN delivery_instructions TEXT;

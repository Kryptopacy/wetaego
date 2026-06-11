-- Add customer_note to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_note text;

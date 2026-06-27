-- Add cancellation_reason to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS cancellation_reason text DEFAULT NULL;

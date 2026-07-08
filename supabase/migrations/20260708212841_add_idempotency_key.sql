-- Add idempotency_key to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS idempotency_key text UNIQUE;

-- Create an index for quick lookup
CREATE INDEX IF NOT EXISTS idx_orders_idempotency_key ON public.orders(idempotency_key);

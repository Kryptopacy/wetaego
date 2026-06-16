-- Add a 4-digit feedback PIN to orders for secure verification
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS feedback_pin text;

-- Backfill existing orders with a random 4-digit PIN
UPDATE public.orders 
SET feedback_pin = LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0')
WHERE feedback_pin IS NULL;

-- Make it NOT NULL for future
ALTER TABLE public.orders ALTER COLUMN feedback_pin SET NOT NULL;
ALTER TABLE public.orders ALTER COLUMN feedback_pin SET DEFAULT LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0');

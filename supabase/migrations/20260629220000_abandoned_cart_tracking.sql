-- Add tracking flag for abandoned cart recovery emails
ALTER TABLE public.orders ADD COLUMN abandoned_recovery_sent BOOLEAN DEFAULT FALSE;

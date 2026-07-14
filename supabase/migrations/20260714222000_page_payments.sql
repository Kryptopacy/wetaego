-- Add manual payment override columns to location_pages
ALTER TABLE location_pages 
ADD COLUMN IF NOT EXISTS manual_payment_bank_name text,
ADD COLUMN IF NOT EXISTS manual_payment_account_number text,
ADD COLUMN IF NOT EXISTS manual_payment_account_name text,
ADD COLUMN IF NOT EXISTS manual_payment_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS manual_payment_instructions text;

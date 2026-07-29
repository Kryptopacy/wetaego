-- Add Manager Protection Mode setting and expand service_requests

ALTER TABLE public.locations
ADD COLUMN IF NOT EXISTS ai_manager_protection_mode boolean NOT NULL DEFAULT false;

-- The ADD VALUE command must be executed outside a transaction block in some older PG versions, 
-- but Supabase migrations handle it.
COMMIT; -- Some PG versions require commit before altering type if inside a transaction
ALTER TYPE public.service_request_type ADD VALUE IF NOT EXISTS 'manager_escalation';
BEGIN;

-- Add a column to store the complaint/escalation details in service_requests
ALTER TABLE public.service_requests
ADD COLUMN IF NOT EXISTS customer_note text;


-- Add refund and void statuses to order_status enum
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'refunded';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'voided';

-- Add manager_pin to locations
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS manager_pin VARCHAR(10);

-- Add manager_pin to organization_members
ALTER TABLE public.organization_members ADD COLUMN IF NOT EXISTS manager_pin VARCHAR(10);

-- Add refund_policy to organizations
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS refund_policy TEXT;

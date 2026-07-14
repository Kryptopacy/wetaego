-- Add column to store separate Paystack plan code for annual billing
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS billing_plan_code_annual text;

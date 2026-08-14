-- Add design_tokens to locations for infinite storefront flexibility
ALTER TABLE locations ADD COLUMN IF NOT EXISTS design_tokens JSONB DEFAULT '{}'::jsonb;

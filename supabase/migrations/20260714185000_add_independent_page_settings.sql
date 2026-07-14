-- Add independent settings columns to location_pages
ALTER TABLE location_pages
ADD COLUMN IF NOT EXISTS operating_hours jsonb,
ADD COLUMN IF NOT EXISTS contact_email text,
ADD COLUMN IF NOT EXISTS contact_phone text,
ADD COLUMN IF NOT EXISTS wifi_network text,
ADD COLUMN IF NOT EXISTS wifi_password text,
ADD COLUMN IF NOT EXISTS address text;

-- Add page_id to organization_members for page-specific team assignments
ALTER TABLE organization_members
ADD COLUMN IF NOT EXISTS page_id uuid REFERENCES location_pages(id) ON DELETE SET NULL;

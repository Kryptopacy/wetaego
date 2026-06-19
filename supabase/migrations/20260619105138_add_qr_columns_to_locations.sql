-- Add QR configuration and logo fields to locations
ALTER TABLE locations ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS qr_text VARCHAR(2);
ALTER TABLE locations ADD COLUMN IF NOT EXISTS qr_color TEXT;

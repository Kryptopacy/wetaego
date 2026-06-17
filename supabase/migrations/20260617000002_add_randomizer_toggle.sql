ALTER TABLE locations ADD COLUMN IF NOT EXISTS randomizer_enabled BOOLEAN DEFAULT false;
ALTER TABLE location_pages ADD COLUMN IF NOT EXISTS randomizer_enabled BOOLEAN DEFAULT false;

-- Backfill existing locations to have it enabled if they are hospitality (already have menus)
UPDATE locations SET randomizer_enabled = true;

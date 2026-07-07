-- Add department column to page_items for KDS/Department Terminal routing
ALTER TABLE page_items ADD COLUMN department text;

-- Add index on department for faster filtering on KDS screens
CREATE INDEX IF NOT EXISTS idx_page_items_department ON page_items(department);

-- Add a comment explaining its use
COMMENT ON COLUMN page_items.department IS 'Maps this item to a specific staff department (e.g., Grill, Bar) for KDS routing';

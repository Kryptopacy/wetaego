ALTER TABLE orders ADD COLUMN IF NOT EXISTS page_id uuid REFERENCES location_pages(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_orders_page_id ON orders(page_id);

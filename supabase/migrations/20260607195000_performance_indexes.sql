-- Index for fast order lookups on the Live Dashboard
CREATE INDEX IF NOT EXISTS idx_orders_org_created_status ON orders(organization_id, status, created_at DESC);

-- Index for fast menu category and item lookups on the Public Menu
CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_categories_menu_id ON menu_categories(menu_id);

-- Index for service requests on the Live Dashboard
CREATE INDEX IF NOT EXISTS idx_service_requests_org_status ON service_requests(organization_id, status);

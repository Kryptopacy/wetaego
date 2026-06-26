-- Additional composite indexes for highly concurrent public menu reads

-- Menu reads
CREATE INDEX IF NOT EXISTS idx_location_pages_published ON public.location_pages(location_id, is_published);
CREATE INDEX IF NOT EXISTS idx_menu_categories_menu_sort ON public.menu_categories(menu_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_page_items_page_published ON public.page_items(page_id, is_published);

-- QR lookup
CREATE INDEX IF NOT EXISTS idx_qr_codes_location_active ON public.qr_codes(id, location_id) WHERE is_active = true;

-- Add composite indexes for high-read queries

-- 1. Orders by location and status (Dashboard active orders query)
CREATE INDEX IF NOT EXISTS idx_orders_location_status ON public.orders(location_id, status);

-- 2. Service Requests by location and status (Live Fulfillment Dashboard)
CREATE INDEX IF NOT EXISTS idx_service_requests_location_status ON public.service_requests(location_id, status);

-- 3. Inquiries by page id and status (Quotes dashboard)
CREATE INDEX IF NOT EXISTS idx_page_inquiries_page_status_created ON public.page_inquiries(page_id, status, created_at DESC);

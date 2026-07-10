-- Add quote_metadata and access_pin to page_bookings
ALTER TABLE public.page_bookings
ADD COLUMN quote_metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN access_pin VARCHAR(10);

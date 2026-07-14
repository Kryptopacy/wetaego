-- 1. Alter orders.status from public.order_status enum to text
ALTER TABLE public.orders ALTER COLUMN status DROP DEFAULT;
ALTER TABLE public.orders ALTER COLUMN status TYPE TEXT USING status::text;
ALTER TABLE public.orders ALTER COLUMN status SET DEFAULT 'pending';

-- 2. Add custom_milestones to locations table
-- This will store an object like:
-- {
--   "delivery": ["Order Placed", "Processing", "Out for Delivery", "Delivered"],
--   "pickup": ["Order Placed", "Processing", "Ready for Pickup", "Picked Up"]
-- }
ALTER TABLE public.locations ADD COLUMN custom_milestones JSONB DEFAULT NULL;

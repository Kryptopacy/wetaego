-- Add stock_count to menu_items table
ALTER TABLE public.menu_items
ADD COLUMN IF NOT EXISTS stock_count integer DEFAULT NULL;

-- Ensure stock_count cannot be negative
ALTER TABLE public.menu_items
ADD CONSTRAINT menu_items_stock_nonnegative CHECK (stock_count IS NULL OR stock_count >= 0);

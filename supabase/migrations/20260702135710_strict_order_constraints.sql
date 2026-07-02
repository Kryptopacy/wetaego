-- Add strict bounds to orders and order_items to prevent negative value exploits
ALTER TABLE public.orders
ADD CONSTRAINT check_positive_order_total CHECK (total_amount_minor >= 0);

ALTER TABLE public.order_items
ADD CONSTRAINT check_positive_order_item_quantity CHECK (quantity > 0),
ADD CONSTRAINT check_positive_order_item_price CHECK (price_minor >= 0);

-- Add current_order_id to resources table to allow any resource (Register, Table, Room) to be bound to an active order
ALTER TABLE public.resources 
ADD COLUMN IF NOT EXISTS current_order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL;

-- Create an index to quickly find the resource attached to an order
CREATE INDEX IF NOT EXISTS idx_resources_current_order_id ON public.resources(current_order_id);


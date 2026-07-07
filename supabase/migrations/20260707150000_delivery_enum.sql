-- Add out_for_delivery to order_status enum
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'out_for_delivery';

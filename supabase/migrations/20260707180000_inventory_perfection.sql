-- ==============================================================================
-- Migration: Inventory Perfection & Atomic Checkouts
-- Description: 
-- 1. Creates `process_iou_checkout` to prevent non-atomic IOU corruption.
-- 2. Rewrites `cleanup_stale_orders` to restore stock on abandoned carts/bookings.
-- ==============================================================================

-- 1. Atomic IOU Checkout RPC
CREATE OR REPLACE FUNCTION public.process_iou_checkout(
  p_order_id uuid,
  p_organization_id text,
  p_customer_id uuid,
  p_amount_minor int
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance int;
  v_limit int;
BEGIN
  -- Lock customer profile to prevent race conditions
  SELECT credit_balance_minor, credit_limit_minor 
  INTO v_current_balance, v_limit
  FROM public.customer_profiles
  WHERE id = p_customer_id 
    AND organization_id = p_organization_id
    AND is_iou_approved = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Customer is not approved for IOU or profile not found.';
  END IF;

  v_current_balance := COALESCE(v_current_balance, 0);
  v_limit := COALESCE(v_limit, 0);

  IF v_current_balance + p_amount_minor > v_limit THEN
    RAISE EXCEPTION 'Insufficient IOU credit limit.';
  END IF;

  -- 1. Deduct Balance
  UPDATE public.customer_profiles
  SET credit_balance_minor = v_current_balance + p_amount_minor
  WHERE id = p_customer_id;

  -- 2. Insert Transaction Log
  INSERT INTO public.iou_transactions (
    organization_id, customer_id, order_id, type, amount_minor, reference, status
  ) VALUES (
    p_organization_id, p_customer_id, p_order_id, 'purchase', p_amount_minor, p_order_id::text, 'completed'
  );

  -- 3. Mark Order as Paid
  UPDATE public.orders
  SET amount_paid_minor = p_amount_minor, status = 'paid'
  WHERE id = p_order_id;

  RETURN true;
END;
$$;

-- 2. Stale Order Cleanup with Inventory Restoration
CREATE OR REPLACE FUNCTION public.cleanup_stale_orders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_items_to_restore jsonb := '[]'::jsonb;
  v_booking_items_to_restore jsonb := '[]'::jsonb;
BEGIN
  -- Cancel un-paid standard_checkout orders older than 45 minutes
  WITH cancelled_orders AS (
    UPDATE public.orders o
    SET status = 'cancelled', updated_at = now()
    FROM public.location_pages lp
    WHERE o.location_id = lp.location_id
      AND o.status = 'pending'
      AND o.created_at < now() - interval '45 minutes'
      AND lp.billing_mode = 'standard_checkout'
    RETURNING o.id
  )
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object('item_id', oi.item_id, 'quantity', oi.quantity)
  ), '[]'::jsonb)
  INTO v_items_to_restore
  FROM public.order_items oi
  JOIN cancelled_orders co ON oi.order_id = co.id
  WHERE oi.item_id IS NOT NULL;

  IF jsonb_array_length(v_items_to_restore) > 0 THEN
    PERFORM public.increment_stock(v_items_to_restore);
  END IF;

  -- Cancel un-paid page_bookings older than 45 minutes (now that they decrement stock on creation)
  WITH cancelled_bookings AS (
    UPDATE public.page_bookings pb
    SET status = 'cancelled', updated_at = now()
    FROM public.location_pages lp
    WHERE pb.page_id = lp.id
      AND pb.status = 'pending'
      AND pb.payment_status = 'unpaid'
      AND pb.created_at < now() - interval '45 minutes'
      AND lp.billing_mode = 'standard_checkout'
    RETURNING pb.id, pb.item_id, pb.number_of_guests
  )
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object('item_id', cb.item_id, 'quantity', COALESCE(cb.number_of_guests, 1))
  ), '[]'::jsonb)
  INTO v_booking_items_to_restore
  FROM cancelled_bookings cb
  WHERE cb.item_id IS NOT NULL;

  IF jsonb_array_length(v_booking_items_to_restore) > 0 THEN
    PERFORM public.increment_stock(v_booking_items_to_restore);
  END IF;
END;
$$;

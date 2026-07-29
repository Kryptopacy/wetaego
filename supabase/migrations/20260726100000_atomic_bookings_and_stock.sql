-- ==============================================================================
-- Migration: Atomic Booking Reservations and Inventory Stock Decrement
-- Purpose: Guarantee 0% double-booking and race conditions via SELECT ... FOR UPDATE
-- ==============================================================================

-- 1. Atomic Booking Creation Function (with Row-Level Lock on page_items)
CREATE OR REPLACE FUNCTION public.create_booking_atomic(
  p_page_id uuid,
  p_item_id uuid DEFAULT NULL,
  p_customer_name text DEFAULT 'Guest',
  p_customer_email text DEFAULT NULL,
  p_customer_phone text DEFAULT NULL,
  p_booking_date date DEFAULT NULL,
  p_booking_end_date date DEFAULT NULL,
  p_booking_time text DEFAULT NULL,
  p_booking_end_time text DEFAULT NULL,
  p_number_of_guests integer DEFAULT 1,
  p_booking_notes text DEFAULT NULL,
  p_total_amount_minor integer DEFAULT 0,
  p_payment_status text DEFAULT 'unpaid'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_inv_count integer;
  v_item_title text;
  v_existing_count integer;
  v_booking_id uuid;
  v_end_date date;
BEGIN
  v_end_date := COALESCE(p_booking_end_date, p_booking_date);

  -- 1. If booking is for a specific page_item, acquire row lock on page_items
  IF p_item_id IS NOT NULL THEN
    SELECT inventory_count, title INTO v_inv_count, v_item_title
    FROM public.page_items
    WHERE id = p_item_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Booking item not found (id: %)', p_item_id;
    END IF;

    -- If inventory tracking is enabled for this item, check capacity under lock
    IF v_inv_count IS NOT NULL THEN
      IF v_inv_count <= 0 THEN
        RAISE EXCEPTION 'Item "%" is sold out.', v_item_title;
      END IF;

      IF p_booking_date IS NOT NULL THEN
        -- Check peak booking concurrency across the date range
        SELECT COALESCE(MAX(daily_booked), 0) INTO v_existing_count
        FROM (
          SELECT COUNT(*) AS daily_booked
          FROM generate_series(p_booking_date, v_end_date, '1 day'::interval) d(day)
          LEFT JOIN public.page_bookings pb ON pb.item_id = p_item_id
            AND pb.status IN ('confirmed', 'pending')
            AND pb.booking_date <= d.day::date
            AND (pb.booking_end_date IS NULL OR pb.booking_end_date >= d.day::date)
          GROUP BY d.day
        ) daily_counts;

        IF (v_existing_count + COALESCE(p_number_of_guests, 1)) > v_inv_count THEN
          RAISE EXCEPTION 'Not enough availability for "%" on selected dates.', v_item_title;
        END IF;
      END IF;
    END IF;
  END IF;

  -- 2. Insert the booking record atomically
  INSERT INTO public.page_bookings (
    page_id,
    item_id,
    customer_name,
    customer_email,
    customer_phone,
    booking_date,
    booking_end_date,
    booking_time,
    booking_end_time,
    number_of_guests,
    booking_notes,
    total_amount_minor,
    status,
    payment_status
  ) VALUES (
    p_page_id,
    p_item_id,
    p_customer_name,
    p_customer_email,
    p_customer_phone,
    p_booking_date,
    p_booking_end_date,
    p_booking_time,
    p_booking_end_time,
    COALESCE(p_number_of_guests, 1),
    p_booking_notes,
    COALESCE(p_total_amount_minor, 0),
    'pending',
    p_payment_status
  )
  RETURNING id INTO v_booking_id;

  RETURN jsonb_build_object(
    'id', v_booking_id,
    'status', 'pending'
  );
END;
$$;

-- 2. Upgraded Atomic Decrement Stock Function (Supports menu_items, page_items, and BOM ingredients)
CREATE OR REPLACE FUNCTION public.decrement_stock(
  p_items jsonb
) RETURNS boolean AS $$
DECLARE
  item jsonb;
  v_item_id uuid;
  v_qty int;
  v_current_stock int;
  v_is_menu_item boolean;
  ing RECORD;
BEGIN
  -- p_items is an array of objects: [{"item_id": "uuid", "quantity": 1}]
  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_item_id := (item->>'item_id')::uuid;
    v_qty := (item->>'quantity')::int;
    v_is_menu_item := false;
    
    -- Try locking in menu_items first
    SELECT stock_count INTO v_current_stock 
    FROM public.menu_items 
    WHERE id = v_item_id 
    FOR UPDATE;
    
    IF FOUND THEN
      v_is_menu_item := true;
      IF v_current_stock IS NOT NULL THEN
        IF v_current_stock < v_qty THEN
          RAISE EXCEPTION 'Insufficient stock for item %', v_item_id;
        END IF;
        
        UPDATE public.menu_items
        SET stock_count = stock_count - v_qty
        WHERE id = v_item_id;
        
        IF (v_current_stock - v_qty) = 0 THEN
          UPDATE public.menu_items
          SET availability_status = 'sold_out'
          WHERE id = v_item_id;
        END IF;
      END IF;
    ELSE
      -- Try locking in page_items
      SELECT inventory_count INTO v_current_stock 
      FROM public.page_items 
      WHERE id = v_item_id 
      FOR UPDATE;

      IF FOUND THEN
        IF v_current_stock IS NOT NULL THEN
          IF v_current_stock < v_qty THEN
            RAISE EXCEPTION 'Insufficient stock for item %', v_item_id;
          END IF;
          
          UPDATE public.page_items
          SET inventory_count = inventory_count - v_qty
          WHERE id = v_item_id;
          
          IF (v_current_stock - v_qty) = 0 THEN
            UPDATE public.page_items
            SET availability_status = 'sold_out'
            WHERE id = v_item_id;
          END IF;
        END IF;
      END IF;
    END IF;

    -- Also deduct BOM ingredients atomically if configured in item_ingredients
    FOR ing IN 
      SELECT inventory_item_id, quantity_required 
      FROM public.item_ingredients 
      WHERE (v_is_menu_item AND menu_item_id = v_item_id)
         OR (NOT v_is_menu_item AND page_item_id = v_item_id)
    LOOP
      UPDATE public.inventory_items
      SET stock_count = stock_count - (ing.quantity_required * v_qty)
      WHERE id = ing.inventory_item_id
        AND stock_count IS NOT NULL
        AND stock_count >= (ing.quantity_required * v_qty);
    END LOOP;

  END LOOP;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.create_booking_atomic TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.decrement_stock TO anon, authenticated, service_role;

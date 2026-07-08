-- Migration: Atomic RPCs for Repair Tracker

-- 1. Add Ad-Hoc Item
CREATE OR REPLACE FUNCTION add_ad_hoc_item_rpc(
    p_order_id uuid,
    p_item_name text,
    p_price_minor bigint,
    p_quantity int
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_increment bigint;
BEGIN
    v_total_increment := p_price_minor * p_quantity;

    -- Insert the item
    INSERT INTO public.order_items (
        order_id,
        item_name,
        price_minor,
        quantity,
        item_id
    ) VALUES (
        p_order_id,
        p_item_name,
        p_price_minor,
        p_quantity,
        null
    );

    -- Update the order total
    UPDATE public.orders
    SET total_amount_minor = COALESCE(total_amount_minor, 0) + v_total_increment
    WHERE id = p_order_id;
END;
$$;

-- 2. Delete Ad-Hoc Item
CREATE OR REPLACE FUNCTION delete_ad_hoc_item_rpc(
    p_order_item_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order_id uuid;
    v_total_decrement bigint;
    v_price_minor bigint;
    v_quantity int;
BEGIN
    -- Get item details
    SELECT order_id, price_minor, quantity INTO v_order_id, v_price_minor, v_quantity
    FROM public.order_items
    WHERE id = p_order_item_id;

    IF v_order_id IS NULL THEN
        RAISE EXCEPTION 'Item not found';
    END IF;

    v_total_decrement := v_price_minor * v_quantity;

    -- Delete the item
    DELETE FROM public.order_items
    WHERE id = p_order_item_id;

    -- Update the order total
    UPDATE public.orders
    SET total_amount_minor = GREATEST(COALESCE(total_amount_minor, 0) - v_total_decrement, 0)
    WHERE id = v_order_id;
END;
$$;

-- 3. Log Manual Payment
CREATE OR REPLACE FUNCTION log_manual_payment_rpc(
    p_order_id uuid,
    p_amount_minor bigint,
    p_reference text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total bigint;
    v_paid bigint;
    v_status text;
BEGIN
    -- Insert payment
    INSERT INTO public.order_payments (
        order_id,
        amount_minor,
        provider_reference
    ) VALUES (
        p_order_id,
        p_amount_minor,
        p_reference
    );

    -- Get current order totals
    SELECT total_amount_minor, COALESCE(amount_paid_minor, 0) + p_amount_minor, status 
    INTO v_total, v_paid, v_status
    FROM public.orders
    WHERE id = p_order_id;

    IF v_paid >= v_total AND v_status != 'completed' THEN
        v_status := 'paid';
    END IF;

    -- Update order
    UPDATE public.orders
    SET amount_paid_minor = v_paid,
        status = v_status
    WHERE id = p_order_id;
END;
$$;

-- 4. Delete Manual Payment
CREATE OR REPLACE FUNCTION delete_manual_payment_rpc(
    p_payment_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order_id uuid;
    v_amount bigint;
    v_total bigint;
    v_paid bigint;
    v_status text;
BEGIN
    -- Get payment details
    SELECT order_id, amount_minor INTO v_order_id, v_amount
    FROM public.order_payments
    WHERE id = p_payment_id;

    IF v_order_id IS NULL THEN
        RAISE EXCEPTION 'Payment not found';
    END IF;

    -- Delete payment
    DELETE FROM public.order_payments
    WHERE id = p_payment_id;

    -- Update order totals
    SELECT total_amount_minor, GREATEST(COALESCE(amount_paid_minor, 0) - v_amount, 0), status 
    INTO v_total, v_paid, v_status
    FROM public.orders
    WHERE id = v_order_id;

    -- If we fell below total, revert status to pending if it was paid
    IF v_paid < v_total AND v_status = 'paid' THEN
        v_status := 'pending';
    END IF;

    UPDATE public.orders
    SET amount_paid_minor = v_paid,
        status = v_status
    WHERE id = v_order_id;
END;
$$;

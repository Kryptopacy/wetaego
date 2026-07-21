-- 1. Fix the trigger to use FOR UPDATE to serialize concurrent payments
CREATE OR REPLACE FUNCTION update_order_payment_status()
RETURNS TRIGGER AS $$
DECLARE
    v_order_id uuid;
    total_paid integer;
    order_total integer;
BEGIN
    -- Determine the order ID based on operation
    IF TG_OP = 'DELETE' THEN
        v_order_id := OLD.order_id;
    ELSE
        v_order_id := NEW.order_id;
    END IF;

    -- LOCK the parent order to prevent race conditions during concurrent split payments
    SELECT total_amount_minor INTO order_total
    FROM public.orders
    WHERE id = v_order_id
    FOR UPDATE;

    -- Calculate exact total paid from ledger
    SELECT COALESCE(SUM(amount_minor), 0) INTO total_paid
    FROM public.order_payments
    WHERE order_id = v_order_id;

    -- Update order status and amount paid
    IF total_paid >= order_total THEN
        UPDATE public.orders
        SET amount_paid_minor = total_paid,
            status = CASE WHEN status != 'completed' THEN 'paid' ELSE status END
        WHERE id = v_order_id;
    ELSE
        UPDATE public.orders
        SET amount_paid_minor = total_paid,
            status = CASE WHEN status = 'paid' THEN 'pending' ELSE status END
        WHERE id = v_order_id;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Strip redundant UPDATE logic from manual payment RPCs to prevent double-counting
CREATE OR REPLACE FUNCTION log_manual_payment_rpc(
    p_order_id uuid,
    p_amount_minor bigint,
    p_reference text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Insert payment. The trigger update_order_payment_status() will automatically 
    -- lock the order row, recalculate the sum safely, and update the order totals.
    INSERT INTO public.order_payments (
        order_id,
        amount_minor,
        provider_reference
    ) VALUES (
        p_order_id,
        p_amount_minor,
        p_reference
    );
END;
$$;

CREATE OR REPLACE FUNCTION delete_manual_payment_rpc(
    p_payment_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Delete payment. The trigger update_order_payment_status() will automatically 
    -- lock the order row, recalculate the sum safely, and update the order totals.
    DELETE FROM public.order_payments
    WHERE id = p_payment_id;
END;
$$;

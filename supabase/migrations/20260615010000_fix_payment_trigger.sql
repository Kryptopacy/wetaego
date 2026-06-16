-- Fix race conditions in payment calculations by enforcing row-level locks
CREATE OR REPLACE FUNCTION update_order_payment_status()
RETURNS TRIGGER AS $$
DECLARE
    total_paid integer;
    order_total integer;
BEGIN
    -- 1. Lock the order row. This strictly serializes concurrent webhook transactions 
    -- trying to update the same order.
    PERFORM 1 FROM public.orders WHERE id = NEW.order_id FOR UPDATE;

    -- 2. Calculate the total paid across all payments for this order
    SELECT COALESCE(SUM(amount_minor), 0) INTO total_paid
    FROM public.order_payments
    WHERE order_id = NEW.order_id;

    -- 3. Get the order's required total amount
    SELECT total_amount_minor INTO order_total
    FROM public.orders
    WHERE id = NEW.order_id;

    -- 4. Update the order with the new total and conditionally set status to paid
    IF total_paid >= order_total THEN
        UPDATE public.orders
        SET amount_paid_minor = total_paid,
            status = 'paid'
        WHERE id = NEW.order_id AND status != 'completed';
    ELSE
        UPDATE public.orders
        SET amount_paid_minor = total_paid
        WHERE id = NEW.order_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

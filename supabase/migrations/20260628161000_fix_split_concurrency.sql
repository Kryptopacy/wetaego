-- Fix for Even/Uneven Bill Split Race Condition
-- Locks the parent order row BEFORE calculating the aggregate sum of payments to ensure concurrent webhook events are serialized correctly.

CREATE OR REPLACE FUNCTION update_order_payment_status()
RETURNS TRIGGER AS $$
DECLARE
    total_paid integer;
    order_total integer;
BEGIN
    -- 1. ACQUIRE PESSIMISTIC LOCK: Lock the order row first to serialize concurrent payments
    SELECT total_amount_minor INTO order_total
    FROM public.orders
    WHERE id = NEW.order_id
    FOR UPDATE;

    -- 2. CALCULATE SUM: Safely calculate total paid since we hold the lock on the parent order
    SELECT COALESCE(SUM(amount_minor), 0) INTO total_paid
    FROM public.order_payments
    WHERE order_id = NEW.order_id;

    -- 3. UPDATE STATUS
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

-- Create atomic increment function for page_bookings payments
CREATE OR REPLACE FUNCTION increment_booking_payment(
    p_booking_id uuid,
    p_amount_minor integer,
    p_payment_reference text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_total integer;
    v_paid integer;
BEGIN
    -- Lock the booking row
    SELECT total_amount_minor, COALESCE(amount_paid_minor, 0)
    INTO v_total, v_paid
    FROM public.page_bookings
    WHERE id = p_booking_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking not found';
    END IF;

    -- Calculate new paid amount
    v_paid := v_paid + p_amount_minor;

    -- Determine new status
    UPDATE public.page_bookings
    SET amount_paid_minor = v_paid,
        payment_status = CASE 
            WHEN v_total IS NOT NULL AND v_paid >= v_total THEN 'fully_paid'
            ELSE 'deposit_paid'
        END,
        payment_reference = p_payment_reference,
        status = 'confirmed'
    WHERE id = p_booking_id;
END;
$$;

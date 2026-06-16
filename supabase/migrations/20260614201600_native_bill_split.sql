-- Create native payments ledger for cross-device bill splitting

CREATE TABLE IF NOT EXISTS public.order_payments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
    amount_minor integer NOT NULL,
    provider_reference text UNIQUE NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for fast sum calculations
CREATE INDEX IF NOT EXISTS idx_order_payments_order_id ON public.order_payments(order_id);

-- Enable RLS
ALTER TABLE public.order_payments ENABLE ROW LEVEL SECURITY;

-- Add amount_paid_minor to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS amount_paid_minor integer DEFAULT 0;

-- Function to recalculate amount_paid_minor and update status
CREATE OR REPLACE FUNCTION update_order_payment_status()
RETURNS TRIGGER AS $$
DECLARE
    total_paid integer;
    order_total integer;
BEGIN
    -- Calculate total paid
    SELECT COALESCE(SUM(amount_minor), 0) INTO total_paid
    FROM public.order_payments
    WHERE order_id = NEW.order_id;

    -- Get order total
    SELECT total_amount_minor INTO order_total
    FROM public.orders
    WHERE id = NEW.order_id;

    -- Update order
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

-- Trigger to run the function after a payment is inserted
DROP TRIGGER IF EXISTS trigger_update_order_payment_status ON public.order_payments;
CREATE TRIGGER trigger_update_order_payment_status
AFTER INSERT OR UPDATE OR DELETE ON public.order_payments
FOR EACH ROW
EXECUTE FUNCTION update_order_payment_status();

-- Function to safely process an IOU repayment atomically
CREATE OR REPLACE FUNCTION public.process_iou_repayment(
  p_installment_id uuid,
  p_organization_id uuid,
  p_customer_id uuid,
  p_amount_minor int,
  p_reference text
) RETURNS boolean AS $$
DECLARE
  v_current_balance int;
BEGIN
  -- 1. Insert transaction
  INSERT INTO public.iou_transactions (
    organization_id,
    customer_id,
    type,
    amount_minor,
    reference
  ) VALUES (
    p_organization_id,
    p_customer_id,
    'repayment',
    p_amount_minor,
    p_reference
  );

  -- 2. Update installment status
  UPDATE public.iou_installments
  SET status = 'paid'
  WHERE id = p_installment_id;

  -- 3. Lock customer profile and decrement balance safely
  SELECT credit_balance_minor INTO v_current_balance
  FROM public.customer_profiles
  WHERE id = p_customer_id
  FOR UPDATE;

  IF v_current_balance IS NOT NULL THEN
    UPDATE public.customer_profiles
    SET credit_balance_minor = GREATEST(0, credit_balance_minor - p_amount_minor)
    WHERE id = p_customer_id;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Revoke execute from public to prevent arbitrary modifications
REVOKE EXECUTE ON FUNCTION public.process_iou_repayment(uuid, uuid, uuid, int, text) FROM public, anon, authenticated;

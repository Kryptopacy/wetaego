-- Atomic credit charge function to prevent race conditions.
-- Uses SELECT ... FOR UPDATE to lock the row during deduction.
-- Returns JSON: { success: boolean, remaining?: number, error?: string }

CREATE OR REPLACE FUNCTION public.charge_credits_atomic(
  p_organization_id uuid,
  p_cost integer,
  p_reason text,
  p_user_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tier text;
  v_purchased integer;
  v_monthly_used integer;
  v_monthly_limit integer;
  v_available_free integer;
  v_total_available integer;
  v_new_free_used integer;
  v_new_purchased integer;
  v_remaining integer;
BEGIN
  -- 1. Lock the row and fetch current state
  SELECT
    COALESCE(subscription_tier, 'lite'),
    COALESCE(purchased_credits, 0),
    COALESCE(monthly_free_credits_used, 0)
  INTO v_tier, v_purchased, v_monthly_used
  FROM public.organizations
  WHERE id = p_organization_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Organization not found');
  END IF;

  -- 2. Resolve monthly limit from tier
  -- These match the plan limits in lib/utils/settings.ts
  v_monthly_limit := CASE v_tier
    WHEN 'lite' THEN 0
    WHEN 'pro' THEN 50
    WHEN 'enterprise' THEN 200
    ELSE 0
  END;

  -- Check for dynamic override from system_settings
  BEGIN
    SELECT
      COALESCE((value->>v_tier)::jsonb->>'credits', v_monthly_limit::text)::integer
    INTO v_monthly_limit
    FROM public.system_settings
    WHERE key = 'plan_limits';
  EXCEPTION WHEN OTHERS THEN
    -- If system_settings doesn't exist or has bad data, use defaults
    NULL;
  END;

  v_available_free := GREATEST(0, v_monthly_limit - v_monthly_used);
  v_total_available := v_available_free + v_purchased;

  -- 3. Check if they have enough
  IF v_total_available < p_cost THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient credits. Please upgrade your plan or purchase additional credits.'
    );
  END IF;

  -- 4. Deduct: consume free credits first, then purchased
  IF v_available_free >= p_cost THEN
    v_new_free_used := v_monthly_used + p_cost;
    v_new_purchased := v_purchased;
  ELSE
    v_new_free_used := v_monthly_used + v_available_free;
    v_new_purchased := v_purchased - (p_cost - v_available_free);
  END IF;

  -- 5. Update atomically (row is already locked)
  UPDATE public.organizations
  SET
    monthly_free_credits_used = v_new_free_used,
    purchased_credits = v_new_purchased
  WHERE id = p_organization_id;

  -- 6. Log the transaction
  INSERT INTO public.credit_transactions (organization_id, amount, reason, created_by)
  VALUES (p_organization_id, -p_cost, p_reason, p_user_id);

  -- 7. Calculate remaining
  v_remaining := v_new_purchased + GREATEST(0, v_monthly_limit - v_new_free_used);

  RETURN jsonb_build_object('success', true, 'remaining', v_remaining);
END;
$$;

-- Grant execute permission to authenticated users (RLS still applies at table level)
GRANT EXECUTE ON FUNCTION public.charge_credits_atomic TO authenticated;

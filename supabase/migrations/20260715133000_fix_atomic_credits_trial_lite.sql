-- Fix atomic credit charge function to include trial, starter, and lite tiers
-- with correct fallback credits matching DEFAULT_PLAN_LIMITS in settings.ts.

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
  v_monthly_limit := CASE v_tier
    WHEN 'trial' THEN 50
    WHEN 'starter' THEN 10
    WHEN 'lite' THEN 10
    WHEN 'pro' THEN 50
    WHEN 'enterprise' THEN 200
    ELSE 10
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

  -- 4. Deduct: exhaust free credits first, then purchased credits
  IF v_available_free >= p_cost THEN
    v_new_free_used := v_monthly_used + p_cost;
    v_new_purchased := v_purchased;
  ELSE
    v_new_free_used := v_monthly_used + v_available_free;
    v_new_purchased := v_purchased - (p_cost - v_available_free);
  END IF;

  UPDATE public.organizations
  SET
    monthly_free_credits_used = v_new_free_used,
    purchased_credits = v_new_purchased
  WHERE id = p_organization_id;

  v_remaining := GREATEST(0, v_monthly_limit - v_new_free_used) + v_new_purchased;

  -- 5. Audit log
  BEGIN
    INSERT INTO public.credit_transactions (
      organization_id,
      user_id,
      amount,
      balance_after,
      transaction_type,
      description
    ) VALUES (
      p_organization_id,
      p_user_id,
      -p_cost,
      v_remaining,
      'usage',
      p_reason
    );
  EXCEPTION WHEN OTHERS THEN
    -- Don't block the transaction if audit log table structure differs
    NULL;
  END;

  RETURN jsonb_build_object(
    'success', true,
    'remaining', v_remaining
  );
END;
$$;

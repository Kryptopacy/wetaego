-- Atomic coupon redemption using row-level locking
CREATE OR REPLACE FUNCTION public.redeem_coupon_rpc(
  p_organization_id uuid,
  p_code text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_coupon RECORD;
  v_existing_redemption uuid;
  v_org RECORD;
  v_current_trial_end timestamp with time zone;
  v_base_date timestamp with time zone;
  v_new_trial_end timestamp with time zone;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1. Lock the coupon row
  SELECT * INTO v_coupon
  FROM public.coupons
  WHERE code = p_code AND is_active = true
  FOR UPDATE;

  IF v_coupon IS NULL THEN
    RAISE EXCEPTION 'Invalid or inactive promo code';
  END IF;

  -- 2. Check expiry
  IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at < now() THEN
    RAISE EXCEPTION 'Promo code has expired';
  END IF;

  -- 3. Check max redemptions
  IF v_coupon.max_redemptions IS NOT NULL AND v_coupon.times_redeemed >= v_coupon.max_redemptions THEN
    RAISE EXCEPTION 'Promo code redemption limit reached';
  END IF;

  -- 4. Check if already redeemed by this org
  SELECT id INTO v_existing_redemption
  FROM public.coupon_redemptions
  WHERE coupon_id = v_coupon.id AND organization_id = p_organization_id
  FOR UPDATE; -- Lock to prevent concurrent redemptions of same coupon by same org

  IF v_existing_redemption IS NOT NULL THEN
    RAISE EXCEPTION 'You have already redeemed this promo code';
  END IF;

  -- 5. Lock the organization row
  SELECT * INTO v_org
  FROM public.organizations
  WHERE id = p_organization_id
  FOR UPDATE;

  IF v_org IS NULL THEN
    RAISE EXCEPTION 'Organization not found';
  END IF;

  -- 6. Apply benefits
  IF v_coupon.discount_type = 'free_credits' THEN
    UPDATE public.organizations
    SET purchased_credits = COALESCE(purchased_credits, 0) + v_coupon.discount_value
    WHERE id = p_organization_id;
  ELSIF v_coupon.discount_type IN ('free_plan', 'plan_extension', 'trial_extension') THEN
    v_current_trial_end := COALESCE(v_org.trial_ends_at, now());
    IF v_current_trial_end > now() THEN
      v_base_date := v_current_trial_end;
    ELSE
      v_base_date := now();
    END IF;
    
    v_new_trial_end := v_base_date + (v_coupon.discount_value || ' days')::interval;

    IF v_coupon.discount_type = 'free_plan' AND v_coupon.plan_tier IS NOT NULL THEN
      UPDATE public.organizations
      SET trial_ends_at = v_new_trial_end,
          subscription_plan = v_coupon.plan_tier,
          subscription_status = 'active'
      WHERE id = p_organization_id;
    ELSE
      UPDATE public.organizations
      SET trial_ends_at = v_new_trial_end
      WHERE id = p_organization_id;
    END IF;
  END IF;

  -- 7. Insert redemption record
  INSERT INTO public.coupon_redemptions (
    coupon_id,
    organization_id,
    redeemed_by
  ) VALUES (
    v_coupon.id,
    p_organization_id,
    v_user_id
  );

  -- 8. Increment times_redeemed
  UPDATE public.coupons
  SET times_redeemed = times_redeemed + 1
  WHERE id = v_coupon.id;

  RETURN true;
END;
$$;

-- Grant execution specifically to authenticated users
REVOKE EXECUTE ON FUNCTION public.redeem_coupon_rpc(uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.redeem_coupon_rpc(uuid, text) TO authenticated;

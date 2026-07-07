-- Update the CRM trigger function to sync phone_number from orders

CREATE OR REPLACE FUNCTION public.on_order_completed_update_crm()
RETURNS trigger AS $$
DECLARE
  v_existing_profile RECORD;
  v_loyalty_settings RECORD;
  v_points_earned INT := 0;
BEGIN
  -- We only care when an order transitions to paid or is initially paid (e.g. offline payments)
  IF NEW.amount_paid_minor > 0 AND NEW.customer_email IS NOT NULL THEN
    -- Check if this was a transition (either insert with amount, or update from 0)
    IF (TG_OP = 'INSERT') OR (TG_OP = 'UPDATE' AND OLD.amount_paid_minor = 0) THEN
      
      -- Fetch organization's loyalty settings
      SELECT * INTO v_loyalty_settings
      FROM public.loyalty_settings
      WHERE organization_id = NEW.organization_id;
      
      -- Calculate points based on the settings (default 0 if loyalty is disabled or settings don't exist)
      IF v_loyalty_settings.is_enabled THEN
        -- Convert minor unit to major unit for points calculation (e.g. 5000 kobo / 100 = 50 NGN)
        v_points_earned := FLOOR((NEW.total_amount_minor / 100.0) * v_loyalty_settings.points_per_major_unit);
      END IF;

      -- Upsert the customer profile
      -- Check if exists
      SELECT * INTO v_existing_profile
      FROM public.customer_profiles
      WHERE organization_id = NEW.organization_id AND email = NEW.customer_email;

      IF FOUND THEN
        UPDATE public.customer_profiles
        SET 
          loyalty_points = loyalty_points + v_points_earned,
          total_orders = total_orders + 1,
          total_spend_minor = total_spend_minor + NEW.total_amount_minor,
          last_visit_at = NOW(),
          phone_number = COALESCE(NEW.customer_phone, phone_number),
          updated_at = NOW()
        WHERE id = v_existing_profile.id;
      ELSE
        INSERT INTO public.customer_profiles (
          organization_id,
          email,
          phone_number,
          loyalty_points,
          total_orders,
          total_spend_minor,
          last_visit_at
        ) VALUES (
          NEW.organization_id,
          NEW.customer_email,
          NEW.customer_phone,
          v_points_earned,
          1,
          NEW.total_amount_minor,
          NOW()
        );
      END IF;
      
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

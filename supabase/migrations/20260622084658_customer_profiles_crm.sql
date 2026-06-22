-- 1. Create loyalty_settings table
CREATE TABLE IF NOT EXISTS public.loyalty_settings (
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  is_enabled BOOLEAN DEFAULT FALSE,
  points_per_major_unit INTEGER DEFAULT 1,
  reward_threshold INTEGER DEFAULT 100,
  reward_discount_minor INTEGER DEFAULT 50000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (organization_id)
);

ALTER TABLE public.loyalty_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners and managers can manage loyalty settings"
ON public.loyalty_settings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_members.organization_id = loyalty_settings.organization_id
    AND organization_members.user_id = auth.uid()
    AND (organization_members.role = 'owner' OR organization_members.role = 'manager')
  )
);

CREATE POLICY "Anyone can read loyalty settings"
ON public.loyalty_settings
FOR SELECT
USING (true);


-- 2. Create customer_profiles table (shadow profiles)
CREATE TABLE IF NOT EXISTS public.customer_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  loyalty_points INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 1,
  total_spend_minor INTEGER DEFAULT 0,
  marketing_opt_in BOOLEAN DEFAULT FALSE,
  last_visit_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, email)
);

ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization members can read customer profiles"
ON public.customer_profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_members.organization_id = customer_profiles.organization_id
    AND organization_members.user_id = auth.uid()
  )
);

-- Note: No insert/update policies for users since this is managed by the DB trigger


-- 3. Create Trigger Function to update Customer Profiles on order complete
CREATE OR REPLACE FUNCTION public.on_order_completed_update_crm()
RETURNS TRIGGER AS $$
DECLARE
  v_loyalty_settings RECORD;
  v_points_earned INTEGER := 0;
  v_existing_profile RECORD;
BEGIN
  -- We only care about orders moving to 'completed' status
  -- (or if it is created directly as 'completed', but usually it moves to completed)
  IF NEW.status = 'completed' AND (TG_OP = 'INSERT' OR OLD.status != 'completed') THEN
    
    -- Check if the order has an email
    IF NEW.customer_email IS NOT NULL AND NEW.customer_email != '' THEN
      
      -- Fetch loyalty settings for this organization
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
          updated_at = NOW()
        WHERE id = v_existing_profile.id;
      ELSE
        INSERT INTO public.customer_profiles (
          organization_id,
          email,
          loyalty_points,
          total_orders,
          total_spend_minor,
          last_visit_at
        ) VALUES (
          NEW.organization_id,
          NEW.customer_email,
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


-- 4. Attach trigger to orders table
DROP TRIGGER IF EXISTS trigger_on_order_completed_update_crm ON public.orders;
CREATE TRIGGER trigger_on_order_completed_update_crm
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.on_order_completed_update_crm();

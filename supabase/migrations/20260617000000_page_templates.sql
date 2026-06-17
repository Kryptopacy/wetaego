-- ============================================================
-- OurMenu: Page Templates System Migration
-- Adds template_type, template_data, billing settings to
-- location_pages; creates page_items, page_bookings,
-- page_inquiries tables; adds business_type to organizations.
-- Backfills existing data safely.
-- ============================================================

-- 1. Add business_type to organizations
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS business_type text DEFAULT NULL;

-- 2. Extend location_pages with template system columns
ALTER TABLE public.location_pages
  ADD COLUMN IF NOT EXISTS template_type text NOT NULL DEFAULT 'info'
    CHECK (template_type IN ('catalog', 'booking', 'listing', 'rate_card', 'info', 'custom')),
  ADD COLUMN IF NOT EXISTS template_data jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_primary boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS billing_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS billing_mode text DEFAULT 'standard_checkout'
    CHECK (billing_mode IN ('table_service', 'standard_checkout', NULL)),
  ADD COLUMN IF NOT EXISTS deposit_percentage integer DEFAULT NULL
    CHECK (deposit_percentage IS NULL OR (deposit_percentage >= 0 AND deposit_percentage <= 100)),
  ADD COLUMN IF NOT EXISTS payment_mode text DEFAULT 'full'
    CHECK (payment_mode IN ('full', 'deposit')),
  ADD COLUMN IF NOT EXISTS page_images text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS business_type_preset text DEFAULT NULL;

-- 3. Backfill: existing pages default to info template (backward compat)
UPDATE public.location_pages
  SET template_type = 'info'
  WHERE template_type = 'info'; -- no-op but explicit

-- 4. Backfill: existing organizations that have a location get business_type = 'menu'
UPDATE public.organizations o
  SET business_type = 'menu'
  WHERE business_type IS NULL
    AND EXISTS (
      SELECT 1 FROM public.locations l WHERE l.organization_id = o.id
    );

-- ============================================================
-- page_items: rows for catalog items, booking services,
-- property listings, rate card services
-- ============================================================
CREATE TABLE IF NOT EXISTS public.page_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES public.location_pages(id) ON DELETE CASCADE,
  title text NOT NULL,
  subtitle text DEFAULT NULL,           -- e.g. "3 bed / 2 bath" for property
  description text DEFAULT NULL,
  price_minor integer DEFAULT NULL,      -- price in kobo/cents
  price_display text DEFAULT NULL,       -- override, e.g. "from ₦50,000" or "negotiable"
  currency text NOT NULL DEFAULT 'NGN',
  images text[] DEFAULT '{}',           -- Supabase storage URLs, max 5
  availability_status text NOT NULL DEFAULT 'available'
    CHECK (availability_status IN ('available', 'unavailable', 'sold_out', 'coming_soon', 'under_offer', 'let_agreed', 'sold')),
  item_data jsonb DEFAULT NULL,         -- template-specific extra fields (variants, specs, amenities, etc.)
  deposit_percentage integer DEFAULT NULL,
  payment_mode text DEFAULT 'full'
    CHECK (payment_mode IN ('full', 'deposit')),
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- page_items updated_at trigger
CREATE TRIGGER set_page_items_updated_at
  BEFORE UPDATE ON public.page_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- page_bookings: bookings made against booking template items
-- ============================================================
CREATE TABLE IF NOT EXISTS public.page_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES public.location_pages(id) ON DELETE CASCADE,
  item_id uuid REFERENCES public.page_items(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_email text DEFAULT NULL,
  customer_phone text DEFAULT NULL,
  booking_date date DEFAULT NULL,
  booking_time text DEFAULT NULL,        -- e.g. "14:00"
  booking_notes text DEFAULT NULL,
  number_of_guests integer DEFAULT 1,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
  payment_reference text DEFAULT NULL,   -- Paystack reference
  payment_status text NOT NULL DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid', 'deposit_paid', 'fully_paid', 'refunded')),
  amount_paid_minor integer NOT NULL DEFAULT 0,
  total_amount_minor integer DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_page_bookings_updated_at
  BEFORE UPDATE ON public.page_bookings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- page_inquiries: inquiries on listing/rate_card pages
-- ============================================================
CREATE TABLE IF NOT EXISTS public.page_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES public.location_pages(id) ON DELETE CASCADE,
  item_id uuid REFERENCES public.page_items(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_email text DEFAULT NULL,
  customer_phone text DEFAULT NULL,
  message text DEFAULT NULL,
  status text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'contacted', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- Performance indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_page_items_page_id ON public.page_items(page_id);
CREATE INDEX IF NOT EXISTS idx_page_items_availability ON public.page_items(page_id, availability_status);
CREATE INDEX IF NOT EXISTS idx_page_bookings_page_id ON public.page_bookings(page_id);
CREATE INDEX IF NOT EXISTS idx_page_bookings_status ON public.page_bookings(page_id, status);
CREATE INDEX IF NOT EXISTS idx_page_bookings_date ON public.page_bookings(page_id, booking_date);
CREATE INDEX IF NOT EXISTS idx_page_inquiries_page_id ON public.page_inquiries(page_id);
CREATE INDEX IF NOT EXISTS idx_page_inquiries_status ON public.page_inquiries(page_id, status);

-- ============================================================
-- RLS for page_items
-- ============================================================
ALTER TABLE public.page_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published page items"
  ON public.page_items FOR SELECT
  USING (
    is_published = true
    AND EXISTS (
      SELECT 1 FROM public.location_pages lp
      WHERE lp.id = page_items.page_id AND lp.is_published = true
    )
  );

CREATE POLICY "Organization members can view all page items"
  ON public.page_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.location_pages lp
      JOIN public.locations l ON l.id = lp.location_id
      JOIN public.organization_member_details m ON m.organization_id = l.organization_id
      WHERE lp.id = page_items.page_id AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Managers and Owners can manage page items"
  ON public.page_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.location_pages lp
      JOIN public.locations l ON l.id = lp.location_id
      JOIN public.organization_member_details m ON m.organization_id = l.organization_id
      WHERE lp.id = page_items.page_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner', 'manager')
    )
  );

-- ============================================================
-- RLS for page_bookings
-- ============================================================
ALTER TABLE public.page_bookings ENABLE ROW LEVEL SECURITY;

-- Anyone can INSERT a booking (public booking form)
CREATE POLICY "Anyone can create a booking"
  ON public.page_bookings FOR INSERT
  WITH CHECK (true);

-- Org members can read their own bookings
CREATE POLICY "Organization members can view their bookings"
  ON public.page_bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.location_pages lp
      JOIN public.locations l ON l.id = lp.location_id
      JOIN public.organization_member_details m ON m.organization_id = l.organization_id
      WHERE lp.id = page_bookings.page_id AND m.user_id = auth.uid()
    )
  );

-- Managers/Owners can update booking status
CREATE POLICY "Managers and Owners can update bookings"
  ON public.page_bookings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.location_pages lp
      JOIN public.locations l ON l.id = lp.location_id
      JOIN public.organization_member_details m ON m.organization_id = l.organization_id
      WHERE lp.id = page_bookings.page_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner', 'manager')
    )
  );

-- ============================================================
-- RLS for page_inquiries
-- ============================================================
ALTER TABLE public.page_inquiries ENABLE ROW LEVEL SECURITY;

-- Anyone can INSERT an inquiry (public inquiry form)
CREATE POLICY "Anyone can create an inquiry"
  ON public.page_inquiries FOR INSERT
  WITH CHECK (true);

-- Org members can read inquiries
CREATE POLICY "Organization members can view inquiries"
  ON public.page_inquiries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.location_pages lp
      JOIN public.locations l ON l.id = lp.location_id
      JOIN public.organization_member_details m ON m.organization_id = l.organization_id
      WHERE lp.id = page_inquiries.page_id AND m.user_id = auth.uid()
    )
  );

-- Managers/Owners can update inquiry status
CREATE POLICY "Managers and Owners can update inquiries"
  ON public.page_inquiries FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.location_pages lp
      JOIN public.locations l ON l.id = lp.location_id
      JOIN public.organization_member_details m ON m.organization_id = l.organization_id
      WHERE lp.id = page_inquiries.page_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner', 'manager')
    )
  );

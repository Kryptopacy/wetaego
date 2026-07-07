-- Migration: Feature Expansion (Discounts, CRM Phones)

-- 1. Add original_price_minor for discount badges
ALTER TABLE "public"."page_items" ADD COLUMN IF NOT EXISTS "original_price_minor" integer;
ALTER TABLE "public"."menu_items" ADD COLUMN IF NOT EXISTS "original_price_minor" integer;

-- 2. Add phone_number to customer_profiles for alternate contact
ALTER TABLE "public"."customer_profiles" ADD COLUMN IF NOT EXISTS "phone_number" text;

-- 3. Add images array to menu_items (page_items already has it) just in case
ALTER TABLE "public"."menu_items" ADD COLUMN IF NOT EXISTS "images" text[];

-- Optional: Comments for PostgREST / Supabase UI
COMMENT ON COLUMN "public"."page_items"."original_price_minor" IS 'If set and > price_minor, the UI will display a discount badge.';
COMMENT ON COLUMN "public"."customer_profiles"."phone_number" IS 'Optional phone number for CRM / orders.';

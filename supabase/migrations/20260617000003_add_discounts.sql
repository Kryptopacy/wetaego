-- Add discount fields to locations table
ALTER TABLE "public"."locations" 
ADD COLUMN "global_discount_enabled" boolean DEFAULT false,
ADD COLUMN "global_discount_percentage" integer DEFAULT 0,
ADD COLUMN "global_discount_banner_text" text;

-- Add discount tracking to orders table
ALTER TABLE "public"."orders"
ADD COLUMN "discount_amount_minor" integer DEFAULT 0;

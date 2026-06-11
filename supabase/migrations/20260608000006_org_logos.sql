-- Add logo_url to organizations table to allow brands to upload their logos
ALTER TABLE "public"."organizations"
ADD COLUMN "logo_url" text;

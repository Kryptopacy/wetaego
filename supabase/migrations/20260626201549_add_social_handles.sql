-- Add x_handle and tiktok_handle to locations table
ALTER TABLE "public"."locations"
ADD COLUMN IF NOT EXISTS "x_handle" text,
ADD COLUMN IF NOT EXISTS "tiktok_handle" text;

-- Add spinner fields to locations table
ALTER TABLE "public"."locations" 
ADD COLUMN "spinner_enabled" boolean DEFAULT false,
ADD COLUMN "spinner_config" jsonb DEFAULT '[{"label":"10% Off","value":10,"type":"win"},{"label":"Try Again","value":0,"type":"loss"},{"label":"5% Off","value":5,"type":"win"},{"label":"No Luck","value":0,"type":"loss"}]'::jsonb;

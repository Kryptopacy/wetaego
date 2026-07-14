-- Add spatial tracking fields to locations
ALTER TABLE locations ADD COLUMN latitude numeric;
ALTER TABLE locations ADD COLUMN longitude numeric;
ALTER TABLE locations ADD COLUMN geofence_radius_meters numeric DEFAULT 100;
ALTER TABLE locations ADD COLUMN place_id text;

-- Add geofencing fields to staff_shifts
ALTER TABLE staff_shifts ADD COLUMN clock_in_latitude numeric;
ALTER TABLE staff_shifts ADD COLUMN clock_in_longitude numeric;
ALTER TABLE staff_shifts ADD COLUMN clock_out_latitude numeric;
ALTER TABLE staff_shifts ADD COLUMN clock_out_longitude numeric;

-- Add tracking fields to orders
ALTER TABLE orders ADD COLUMN delivery_latitude numeric;
ALTER TABLE orders ADD COLUMN delivery_longitude numeric;
ALTER TABLE orders ADD COLUMN customer_eta_minutes integer;

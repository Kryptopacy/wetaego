-- Add inventory tracking to items
ALTER TABLE public.page_items 
ADD COLUMN IF NOT EXISTS inventory_count integer NULL;

-- Add end date/time to bookings for multi-day reservations
ALTER TABLE public.page_bookings
ADD COLUMN IF NOT EXISTS booking_end_date date NULL,
ADD COLUMN IF NOT EXISTS booking_end_time time NULL;

-- Create availability checking function
CREATE OR REPLACE FUNCTION public.check_item_availability(
  p_item_id uuid, 
  p_start_date date, 
  p_end_date date
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_inventory_count integer;
BEGIN
  -- Get item inventory count
  SELECT inventory_count INTO v_inventory_count
  FROM public.page_items
  WHERE id = p_item_id;

  -- If it has no inventory tracking, return true
  IF v_inventory_count IS NULL THEN
    RETURN true;
  END IF;

  -- If inventory_count is 0, it's globally sold out
  IF v_inventory_count <= 0 THEN
    RETURN false;
  END IF;

  -- Check max concurrency over the date range
  IF EXISTS (
    SELECT 1
    FROM generate_series(p_start_date, COALESCE(p_end_date, p_start_date), '1 day'::interval) d(day)
    WHERE (
      SELECT COUNT(*)
      FROM public.page_bookings
      WHERE item_id = p_item_id
        AND status IN ('confirmed', 'pending')
        AND booking_date <= d.day::date
        AND (booking_end_date IS NULL OR booking_end_date >= d.day::date)
    ) >= v_inventory_count
  ) THEN
    RETURN false; -- A day in this range is fully booked
  END IF;

  RETURN true;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.check_item_availability TO anon, authenticated;

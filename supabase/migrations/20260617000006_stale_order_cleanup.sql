-- ============================================================
-- Stale Order Cleanup Cron
-- Silently cancels abandoned fast-food orders/bookings after 45m
-- ============================================================

-- Function to cleanup stale orders
create or replace function public.cleanup_stale_orders()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Cancel un-paid standard_checkout orders older than 45 minutes
  update public.orders o
  set 
    status = 'cancelled',
    updated_at = now()
  from public.location_pages lp
  where o.location_id = lp.location_id
    and o.status = 'pending'
    and o.created_at < now() - interval '45 minutes'
    and lp.billing_mode = 'standard_checkout';

  -- Cancel un-paid page_bookings older than 45 minutes
  update public.page_bookings pb
  set 
    status = 'cancelled',
    updated_at = now()
  from public.location_pages lp
  where pb.page_id = lp.id
    and pb.status = 'pending'
    and pb.payment_status = 'unpaid'
    and pb.created_at < now() - interval '45 minutes'
    and lp.billing_mode = 'standard_checkout';
end;
$$;

-- Note: In a real environment, you need pg_cron extension:
-- select cron.schedule('cleanup-stale-orders', '*/15 * * * *', 'select public.cleanup_stale_orders();');
-- Since local environments might not have pg_cron enabled, we just define the function.

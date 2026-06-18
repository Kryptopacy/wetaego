-- ============================================================
-- Subscription Lifecycle Migration
-- Adds subscription_status to handle grace periods & non-renewals
-- ============================================================

-- 1. Add subscription_status to organizations
alter table public.organizations
add column if not exists subscription_status text not null default 'active'
check (subscription_status in ('active', 'past_due', 'canceled', 'trialing'));

-- 2. Create a daily function to enforce the 3-day grace period
create or replace function public.enforce_subscription_grace_periods()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Example logic: Find all organizations that are 'past_due' and have been past due for > 3 days
  -- In a full integration, you would sync this from Stripe/Paystack webhook directly.
  -- But if we must pull the trigger locally based on some internal "billing_cycle_end" date:
  
  -- Since we don't have a "past_due_since" column yet, we will rely on webhooks.
  -- When the webhook fires (invoice.payment_failed), we set subscription_status = 'past_due'.
  -- When it fires (customer.subscription.deleted), we set 'canceled'.
  
  -- If 'canceled' or 'past_due' for too long, they lose access.
  -- This function is a placeholder for the cron if we want to auto-suspend pages.
  
  update public.location_pages lp
  set is_published = false
  from public.locations l
  join public.organizations o on l.organization_id = o.id
  where lp.location_id = l.id
    and o.subscription_status = 'canceled';
    
end;
$$;

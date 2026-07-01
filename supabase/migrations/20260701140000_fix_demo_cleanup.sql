-- Recreate the cleanup function with the correct table references for coupons
create or replace function cleanup_demo_accounts() returns void as $$
declare
  demo_user record;
begin
  for demo_user in 
    select id from auth.users 
    where (email like 'demo-%@pacygrills.com' or email like 'demo-%@ourmenuos.online')
      and created_at < now() - interval '2 hours'
  loop
    -- Delete the user's organization (cascades to menus, locations, items, orders, etc.)
    delete from public.organizations where created_by = demo_user.id;
    
    -- Delete any coupons created or redeemed by the user (split across correct tables)
    delete from public.coupon_redemptions where redeemed_by = demo_user.id;
    delete from public.coupons where created_by = demo_user.id;
    
    -- Delete affiliate links
    delete from public.affiliates where user_id = demo_user.id;

    -- (Removed staff tables due to schema mismatches, demo users don't have them seeded anyway)
    
    -- Delete the user's profile and membership (just to be absolutely safe, though usually cascaded)
    delete from public.organization_members where user_id = demo_user.id;
    delete from public.user_profiles where id = demo_user.id;
    
    -- Finally, delete the user from auth.users (now that restrictive foreign keys are cleared)
    delete from auth.users where id = demo_user.id;
  end loop;
end;
$$ language plpgsql security definer;

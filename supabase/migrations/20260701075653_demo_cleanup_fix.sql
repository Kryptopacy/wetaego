-- Drop the existing cron job if it exists (we will recreate it to use the new function)
select cron.unschedule('cleanup_demo_accounts');

-- Create a robust cleanup function that bypasses ON DELETE RESTRICT safely
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
    
    -- Delete any coupons created or redeemed by the user
    delete from public.coupons where created_by = demo_user.id or redeemed_by = demo_user.id;
    
    -- Delete affiliate links
    delete from public.affiliate_links where user_id = demo_user.id;

    -- Delete staff members
    delete from public.staff where user_id = demo_user.id;
    
    -- Delete the user's profile and membership (just to be absolutely safe, though usually cascaded)
    delete from public.organization_members where user_id = demo_user.id;
    delete from public.user_profiles where id = demo_user.id;
    
    -- Finally, delete the user from auth.users (now that restrictive foreign keys are cleared)
    delete from auth.users where id = demo_user.id;
  end loop;
end;
$$ language plpgsql security definer;

-- Re-create the cron job to run every hour at minute 0, calling our new function
select cron.schedule(
  'cleanup_demo_accounts', -- name of the cron job
  '0 * * * *', -- every hour
  $$
  select cleanup_demo_accounts();
  $$
);

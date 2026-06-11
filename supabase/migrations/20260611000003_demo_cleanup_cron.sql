-- Enable pg_cron extension if not already enabled
create extension if not exists pg_cron;

-- Create the cron job to run every hour at minute 0
select cron.schedule(
  'cleanup_demo_accounts', -- name of the cron job
  '0 * * * *', -- every hour
  $$
  delete from auth.users 
  where email like 'demo-%@pacygrills.com' 
  and created_at < now() - interval '24 hours';
  $$
);

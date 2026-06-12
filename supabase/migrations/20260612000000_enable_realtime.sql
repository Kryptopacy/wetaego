-- Enable Replica Identity Full to send the OLD record on UPDATE/DELETE
alter table public.orders replica identity full;
alter table public.service_requests replica identity full;

-- Create the realtime publication if it doesn't exist
do $$ 
begin 
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then 
    create publication supabase_realtime; 
  end if; 
end $$;

-- Add tables to the realtime publication
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.service_requests;

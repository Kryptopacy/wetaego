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

-- Add tables to the realtime publication if not already present
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders') then
    execute 'alter publication supabase_realtime add table public.orders';
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'service_requests') then
    execute 'alter publication supabase_realtime add table public.service_requests';
  end if;
end $$;

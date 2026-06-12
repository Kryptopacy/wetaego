import { Client } from 'pg'

const sql = `
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
-- Using individual blocks in case they are already added
do $$ 
begin 
  alter publication supabase_realtime add table public.orders;
exception when others then 
end $$;

do $$ 
begin 
  alter publication supabase_realtime add table public.service_requests;
exception when others then 
end $$;
`;

async function main() {
  const client = new Client({
    connectionString: "postgresql://postgres.xtplllmegnsozginzpqh:Whytmattr001@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
  })

  try {
    await client.connect()
    console.log("Connected to DB")
    await client.query(sql)
    console.log("Migration executed successfully!")
  } catch (err) {
    console.error("Migration failed:", err)
  } finally {
    await client.end()
  }
}

main()

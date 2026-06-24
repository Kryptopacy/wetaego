const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.xtplllmegnsozginzpqh:Whyt3mattr001@aws-0-eu-west-1.pooler.supabase.com:5432/postgres'
});

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);
  console.log('Tables:', res.rows.map(r => r.table_name));
  await client.end();
}

run().catch(console.error);

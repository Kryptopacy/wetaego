const { Client } = require('pg')

async function run() {
  const client = new Client({
    connectionString: "postgresql://postgres.xtplllmegnsozginzpqh:Whyt3mattr001@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
  })

  await client.connect()
  console.log('Connected.')

  try {
    await client.query(`
      ALTER TABLE public.organizations 
      ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

      CREATE INDEX IF NOT EXISTS idx_organizations_demo_cleanup
      ON public.organizations (is_demo, created_at)
      WHERE is_demo = true;
    `)
    console.log('Added is_demo column!')
  } catch (err) {
    console.error('Error:', err)
  } finally {
    await client.end()
  }
}

run()

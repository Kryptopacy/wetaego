import { Client } from 'pg';
import * as fs from 'fs';

async function applyMigration() {
  const client = new Client({
    connectionString: "postgresql://postgres.xtplllmegnsozginzpqh:Whyt3mattr001@aws-0-eu-west-1.pooler.supabase.com:6543/postgres",
  });

  try {
    await client.connect();
    console.log('Connected to DB');
    const sql = `INSERT INTO supabase_migrations.schema_migrations (version, statements) VALUES ('20260621100000', ARRAY['-- lint fixes']) ON CONFLICT DO NOTHING;`;
    await client.query(sql);
    console.log('Migration tracked successfully.');
  } catch (err) {
    console.error('Error applying migration:', err);
  } finally {
    await client.end();
  }
}

applyMigration();

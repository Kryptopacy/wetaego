import { Client } from 'pg';
import * as fs from 'fs';

async function applyMigration() {
  const client = new Client({
    connectionString: "postgresql://postgres.xtplllmegnsozginzpqh:Whyt3mattr001@aws-0-eu-west-1.pooler.supabase.com:6543/postgres",
  });

  try {
    await client.connect();
    console.log('Connected to DB');
    const sql = `update public.system_settings set value = '{"usd_to_ngn": 1250}' where key = 'exchange_rates';`;
    await client.query(sql);
    console.log('Exchange rate updated successfully.');
  } catch (err) {
    console.error('Error applying migration:', err);
  } finally {
    await client.end();
  }
}

applyMigration();

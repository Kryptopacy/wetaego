import { Client } from 'pg';
import * as fs from 'fs';

async function applyMigration() {
  const client = new Client({
    connectionString: "postgresql://postgres.xtplllmegnsozginzpqh:Whyt3mattr001@aws-0-eu-west-1.pooler.supabase.com:6543/postgres",
  });

  try {
    await client.connect();
    console.log('Connected to DB');
    const sql = fs.readFileSync('supabase/migrations/20260621000000_affiliate_system.sql', 'utf8');
    await client.query(sql);
    console.log('Migration applied successfully.');
  } catch (err) {
    console.error('Error applying migration:', err);
  } finally {
    await client.end();
  }
}

applyMigration();

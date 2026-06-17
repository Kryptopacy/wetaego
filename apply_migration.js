import { Client } from 'pg';
import * as fs from 'fs';

async function applyMigration() {
  const client = new Client({
    connectionString: "postgresql://postgres.xtplllmegnsozginzpqh:Whytmattr001@aws-0-us-east-1.pooler.supabase.com:6543/postgres",
  });

  try {
    await client.connect();
    console.log('Connected to DB');
    const sql = fs.readFileSync('supabase/migrations/20260617000003_add_discounts.sql', 'utf8');
    await client.query(sql);
    console.log('Migration applied successfully.');
  } catch (err) {
    console.error('Error applying migration:', err);
  } finally {
    await client.end();
  }
}

applyMigration();

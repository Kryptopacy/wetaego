const fs = require('fs');
const { Client } = require('pg');

const dbUrl = "postgresql://postgres.xtplllmegnsozginzpqh:Whyt3mattr001@aws-0-us-east-1.pooler.supabase.com:6543/postgres";
const migrationPath = 'supabase/migrations/20260622084658_customer_profiles_crm.sql';

async function applyMigration() {
  const client = new Client({
    connectionString: dbUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('Connected to remote DB');
    
    const sql = fs.readFileSync(migrationPath, 'utf8');
    console.log('Read migration file, applying...');
    
    await client.query(sql);
    console.log('Migration applied successfully!');
  } catch (error) {
    console.error('Error applying migration:', error);
  } finally {
    await client.end();
  }
}

applyMigration();

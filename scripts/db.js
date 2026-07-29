/* eslint-disable @typescript-eslint/no-require-imports, no-console, @typescript-eslint/no-unused-vars */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const command = args[0];

if (!command) {
  console.error('Please specify a command: push, types, or migrate');
  process.exit(1);
}

const envLocalPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const dbUrl = process.env.SUPABASE_DB_URL;
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

if (!supabaseUrl || !dbUrl || !accessToken) {
  console.error('Missing required environment variables in .env.local: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_DB_URL, or SUPABASE_ACCESS_TOKEN');
  process.exit(1);
}

const projectId = new URL(supabaseUrl).hostname.split('.')[0];

async function fetchTypes() {
  console.log(`Fetching TypeScript types from Supabase Management API for project ${projectId}...`);
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectId}/types/typescript`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to fetch types (${res.status}): ${errText}`);
  }
  const rawText = await res.text();
  let typesContent = rawText;
  try {
    const parsed = JSON.parse(rawText);
    if (parsed && typeof parsed.types === 'string') {
      typesContent = parsed.types;
    }
  } catch {
    // If rawText is already pure typescript code, use rawText
  }

  const targetPath = path.join(__dirname, '../lib/supabase/types.ts');
  fs.writeFileSync(targetPath, typesContent);
  console.log(`Successfully generated lib/supabase/types.ts (${typesContent.length} bytes)`);
}


function pushMigrations() {
  console.log('Pushing database migrations to remote DB via pooler URL...');
  execSync(`npx supabase db push --db-url "${dbUrl}" --include-all --yes`, { stdio: 'inherit', env: process.env });
}

async function main() {
  try {
    if (command === 'push') {
      pushMigrations();
    } else if (command === 'types') {
      await fetchTypes();
    } else if (command === 'migrate') {
      pushMigrations();
      await fetchTypes();
    } else if (command === 'status') {
      execSync(`npx supabase migration list --db-url "${dbUrl}"`, { stdio: 'inherit', env: process.env });
    } else if (command === 'repair') {
      const version = args[1];
      if (!version) {
        console.error('Please specify a version to repair: node scripts/db.js repair <version>');
        process.exit(1);
      }
      execSync(`npx supabase migration repair --status reverted ${version} --db-url "${dbUrl}"`, { stdio: 'inherit', env: process.env });
    } else {
      console.error(`Unknown command: ${command}`);
      process.exit(1);
    }
  } catch (error) {
    console.error('Operation failed:', error.message || error);
    process.exit(1);
  }
}

main();


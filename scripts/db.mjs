import { execSync } from 'child_process'
import fs from 'fs'

const dbUrl = process.env.SUPABASE_DB_URL
const projectId = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0]
const token = process.env.SUPABASE_ACCESS_TOKEN

if (!dbUrl || !projectId || !token) {
  console.error("Missing required environment variables (SUPABASE_DB_URL, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_ACCESS_TOKEN)")
  process.exit(1)
}

const command = process.argv[2]

if (command === 'push') {
  console.log(`Preparing to push migrations for ${projectId}...`)
  try {
    const res = await fetch(`https://api.supabase.com/v1/projects/${projectId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`Failed to fetch project info: ${res.statusText}`);
    const projectInfo = await res.json();
    const region = projectInfo.region;

    const dbUrlParsed = new URL(dbUrl);
    const password = dbUrlParsed.password;
    const poolerUrl = `postgresql://postgres.${projectId}:${password}@aws-0-${region}.pooler.supabase.com:5432/postgres`;
    console.log(`Constructed pooler URL for region ${region} (Session Port 5432)`);

    const migrationsDir = './supabase/migrations';
    if (fs.existsSync(migrationsDir)) {
      const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
      for (const file of files) {
        const filePath = `${migrationsDir}/${file}`;
        let content = fs.readFileSync(filePath, 'utf8');
        if (content.charCodeAt(0) === 0xFEFF) {
          content = content.slice(1);
          fs.writeFileSync(filePath, content, 'utf8');
        }
      }
    }

    console.log(`Pushing migrations to remote database...`);
    execSync(`echo y | npx supabase db push --db-url "${poolerUrl}"`, { stdio: 'inherit' });
    console.log("Push successful!");
  } catch (e) {
    console.error("Migration failed:", e);
    process.exit(1);
  }
} else if (command === 'types') {
  console.log(`Fetching types for ${projectId}...`)
  try {
    const res = await fetch(`https://api.supabase.com/v1/projects/${projectId}/types/typescript`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (!res.ok) throw new Error(`Failed to fetch types: ${res.statusText}`);
    const raw = await res.text()
    // The Management API may return the TypeScript payload directly or as a
    // JSON envelope like {"types": "..."}. Handle both.
    let types = raw
    try {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed.types === 'string') {
        types = parsed.types
      }
    } catch {
      // Not JSON — raw TypeScript payload.
    }
    // Strip BOM if present
    if (types.charCodeAt(0) === 0xFEFF) {
      types = types.slice(1)
    }
    fs.writeFileSync('./lib/supabase/types.ts', types)
    console.log("Types written to lib/supabase/types.ts")
  } catch (e) {
    console.error("Failed to fetch types:", e);
    process.exit(1);
  }
} else {
  console.log("Usage: node scripts/db.mjs [push|types]")
}

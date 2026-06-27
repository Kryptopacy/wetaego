/* eslint-disable @typescript-eslint/no-require-imports, no-console */
const fs = require('fs');
const path = require('path');

const base = 'd:/pacy_labs/ourmenu/apps/web/app/api/ai';
const dirs = fs.readdirSync(base);

dirs.forEach(d => {
  const file = path.join(base, d, 'route.ts');
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    if (!content.includes('checkRateLimit')) {
      console.log(`Patching ${d}...`);
      content = `import { checkRateLimit } from '@/lib/upstash'\n` + content;
      
      const rateLimitCode = `\n    const { success: rlSuccess } = await checkRateLimit('ai_${d}');\n    if (!rlSuccess) {\n      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });\n    }\n`;
      
      // Insert after `export async function POST(req: Request) { \n  try {`
      content = content.replace(/(export async function POST\(.*?\) \{[\s\n]*try \{)/, `$1${rateLimitCode}`);
      fs.writeFileSync(file, content);
    }
  }
});

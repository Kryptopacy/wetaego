import { execSync } from 'child_process';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const SUPABASE_URL = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim().replace(/^"|"$/g, '');
const SUPABASE_ANON_KEY = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim().replace(/^"|"$/g, '');

(async () => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    const { data: loc } = await supabase.from('locations').select('slug').limit(1).single();
    if (!loc) {
      console.error('No location found');
      process.exit(1);
    }
    const slug = loc.slug;
    const url = `http://127.0.0.1:3000/m/${slug}`;

    console.log(`Taking screenshot of ${url}...`);
    execSync(`npx playwright screenshot "${url}" public/guest_menu_screen.png --viewport-size=390,844 --color-scheme=dark --wait-for-timeout=3000`, { stdio: 'inherit' });

    console.log('Screenshot captured successfully to public/guest_menu_screen.png!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();

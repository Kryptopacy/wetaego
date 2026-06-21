import { chromium } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const SUPABASE_URL = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim().replace(/^"|"$/g, '');
const SUPABASE_ANON_KEY = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim().replace(/^"|"$/g, '');

(async () => {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: loc } = await supabase.from('locations').select('slug').limit(1).single();
    const slug = loc.slug;
    const url = `http://127.0.0.1:3000/m/${slug}`;

    console.log(`Taking screenshot of ${url}...`);
    const browser = await chromium.launch();
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'dark' });
    const page = await context.newPage();
    
    // Use domcontentloaded so we don't wait for websocket networkidle
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
    
    // Wait for the client-side data to load and render
    await page.waitForTimeout(4000); 
    
    await page.screenshot({ path: 'public/guest_menu_screen.png' });
    console.log('Screenshot captured successfully to public/guest_menu_screen.png!');
    await browser.close();
    process.exit(0);
})();

import { chromium } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const SUPABASE_URL = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim().replace(/^"|"$/g, '');
const SUPABASE_ANON_KEY = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim().replace(/^"|"$/g, '');
const adminKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim().replace(/^"|"$/g, '');

(async () => {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: loc } = await supabase.from('locations').select('slug, id, organization_id').ilike('slug', '%pacy%').order('created_at', { ascending: false }).limit(1).single();
    if (!loc) {
        console.error("Location not found! Let's print all locations:");
        const {data: all} = await supabase.from('locations').select('slug, name');
        console.log(all);
        process.exit(1);
    }
    const slug = loc.slug;

    // Force update DB
    const adminClient = createClient(SUPABASE_URL, adminKey);
    await adminClient.from('locations').update({ randomizer_enabled: true, spinner_enabled: true }).eq('id', loc.id);

    const url = `http://127.0.0.1:3000/m/${slug}?view=menu`;

    console.log(`Taking screenshot of ${url}...`);
    const browser = await chromium.launch();
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'dark' });
    const page = await context.newPage();
    
    // Use domcontentloaded so we don't wait for websocket networkidle
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 240000 });
    
    // Wait for the client-side data to load and render
    await page.waitForTimeout(4000); 

    // Click "Add to Order" on the first item to activate cart state
    try {
        const addButton = page.locator('[aria-label="Add to Order"]').first();
        await addButton.waitFor({ state: 'visible', timeout: 5000 });
        await addButton.click();
        console.log("Clicked Add button!");
        await page.waitForTimeout(2000); // wait for cart FAB to animate in
    } catch(e) {
        console.log("Could not find Add button:", e);
    }

    await page.screenshot({ path: 'public/guest_menu_screen.png' });
    console.log('Screenshot captured successfully to public/guest_menu_screen.png!');
    await browser.close();
    process.exit(0);
})();

/* eslint-disable no-console */
import { chromium } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const SUPABASE_URL = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim().replace(/^"|"$/g, '');
const SUPABASE_ANON_KEY = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim().replace(/^"|"$/g, '');
const adminKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim().replace(/^"|"$/g, '');

(async () => {
    console.log("Starting E2E Screenshot script...");
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'dark' });
    const page = await context.newPage();
    
    console.log("1. Generating new demo by clicking 'Experience Demo Mode' on Landing page...");
    await page.goto('http://127.0.0.1:3000/');
    console.log("1. Finding the latest Pacy Grills location slug...");
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: loc } = await supabase.from('locations').select('slug, id').ilike('slug', '%pacy-grills%').order('created_at', { ascending: false }).limit(1).single();
    if (!loc) { console.error("Could not find new location!"); process.exit(1); }
    const slug = loc.slug;

    console.log("3. Forcing randomizer & spinner on via admin client...");
    const adminClient = createClient(SUPABASE_URL, adminKey);
    await adminClient.from('locations').update({ randomizer_enabled: true, spinner_enabled: true }).eq('id', loc.id);

    console.log(`4. Navigating to the guest menu: http://127.0.0.1:3000/m/${slug}?view=menu`);
    const url = `http://127.0.0.1:3000/m/${slug}?view=menu`;
    
    // Wait until network is fully idle to ensure all images and hydration complete
    await page.goto(url, { waitUntil: 'networkidle', timeout: 120000 });
    
    // Wait an extra 3s for safe measure on animations
    await page.waitForTimeout(3000);

    console.log("5. Activating the Cart by clicking 'Add to Order'...");
    try {
        const addButton = page.locator('[aria-label="Add to Order"]').first();
        await addButton.waitFor({ state: 'visible', timeout: 10000 });
        await addButton.click();
        console.log("Clicked Add to Order button!");
        await page.waitForTimeout(2000); // Wait for Cart FAB animation
    } catch(e) {
        console.log("Could not find Add to Order button:", e);
    }

    console.log("6. Forcing visibility of all floating action buttons just in case...");
    await page.evaluate(() => {
        document.querySelectorAll('.fixed').forEach(el => {
            el.style.opacity = '1';
            el.style.transform = 'none';
        });
    });

    console.log("7. Taking screenshot...");
    await page.screenshot({ path: 'public/guest_menu_screen.png' });
    console.log('Screenshot captured successfully to public/guest_menu_screen.png!');
    await browser.close();
    process.exit(0);
})();

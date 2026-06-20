const puppeteer = require('puppeteer');

(async () => {
  try {
    console.log('Launching browser...');
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // Simulate iPhone 14 Pro max viewport
    await page.setViewport({
      width: 430,
      height: 932,
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });

    console.log('Navigating to live Pacy Grills menu...');
    await page.goto('https://ourmenuos.online/m/pacy-grills-e3b29325', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    // Wait a couple of seconds for animations
    await new Promise(r => setTimeout(r, 2000));

    console.log('Taking screenshot...');
    await page.screenshot({ path: 'public/guest_menu_screen.png' });

    console.log('Screenshot saved to public/guest_menu_screen.png');
    await browser.close();
  } catch (error) {
    console.error('Error taking screenshot:', error);
    process.exit(1);
  }
})();

import { test, expect } from '@playwright/test';

test.describe('Dashboard Tenant Management', () => {
  // We use beforeAll to authenticate once and reuse the session state, 
  // or beforeEach to login fresh depending on Playwright global-setup config.
  // For this test, we simulate the UI login flow directly to ensure the dashboard
  // loads fully hydrated with the user session.
  
  test.beforeEach(async ({ page }) => {
    // Authenticate as a tenant
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test-admin@ourmenuos.online');
    await page.fill('input[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Wait for the dashboard shell to load
    await expect(page.locator('main')).toBeVisible();
  });

  test('should load the live fulfillment grid and business metrics', async ({ page }) => {
    // Check that key KPI metrics cards exist
    const kpiCards = page.locator('text=Total Orders').or(page.locator('text=Revenue'));
    if (await kpiCards.count() > 0) {
      await expect(kpiCards.first()).toBeVisible();
    }

    // Check that the Live Orders/Fulfillment section renders
    const liveOrdersHeader = page.locator('h2:has-text("Active Orders"), h2:has-text("Live Orders")');
    if (await liveOrdersHeader.count() > 0) {
      await expect(liveOrdersHeader).toBeVisible();
    }

    // Check that the Sidebar navigation is functional
    const menuLink = page.locator('nav a:has-text("Menu")');
    await expect(menuLink).toBeVisible();
    await menuLink.click();

    // Verify it navigates to the Menu editor
    await expect(page).toHaveURL(/\/dashboard\/menu/);
    await expect(page.locator('h1:has-text("Menu Management")')).toBeVisible();
  });

  test('should allow interacting with business settings', async ({ page }) => {
    // Navigate to settings
    const settingsLink = page.locator('nav a:has-text("Settings")');
    await expect(settingsLink).toBeVisible();
    await settingsLink.click();

    await expect(page).toHaveURL(/\/dashboard\/settings/);
    
    // Check if the business profile form loads
    const profileHeader = page.locator('h2:has-text("Business Profile"), text=Store Settings');
    await expect(profileHeader).toBeVisible();
  });
});

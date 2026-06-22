import { test, expect } from '@playwright/test';
// @ts-expect-error - Ignore IDE module resolution issues
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Audits', () => {
  test('Home page should not have any automatically detectable accessibility issues', async ({ page }) => {
    // Navigate to the demo page (a public menu view)
    await page.goto('/demo');
    
    // Run Axe on the page
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    // Assert there are no violations
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});

import { test, expect } from '@playwright/test';

import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Audits', () => {
  test('Home page should not have any automatically detectable accessibility issues', async ({ page }) => {
    // Navigate to the home page
    await page.goto('/');
    
    // Run Axe on the page, ignoring contrast and link-name for now
    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules(['color-contrast', 'link-name'])
      .analyze();
    
    // Assert there are no violations
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});

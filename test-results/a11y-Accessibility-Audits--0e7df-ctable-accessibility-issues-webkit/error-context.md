# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: a11y.spec.ts >> Accessibility Audits >> Home page should not have any automatically detectable accessibility issues
- Location: tests\e2e\a11y.spec.ts:6:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: browserContext.newPage: Test timeout of 30000ms exceeded.
 Please check out https://github.com/dequelabs/axe-core-npm/blob/develop/packages/playwright/error-handling.md
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - heading "404" [level=1] [ref=e4]
    - heading "Page Not Found" [level=2] [ref=e5]
    - paragraph [ref=e6]: The link you clicked might be broken, or the page may have been removed. You can search for the business below.
    - generic [ref=e8]:
      - generic:
        - img
      - textbox "Find venue menu (e.g. Pacy Grills)..." [ref=e9]
      - button "Go" [ref=e10]
    - link "Return Home" [ref=e11]:
      - /url: /
  - region "Notifications alt+T"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | import AxeBuilder from '@axe-core/playwright';
  4  | 
  5  | test.describe('Accessibility Audits', () => {
  6  |   test('Home page should not have any automatically detectable accessibility issues', async ({ page }) => {
  7  |     // Navigate to the demo page (a public menu view)
  8  |     await page.goto('/demo');
  9  |     
  10 |     // Run Axe on the page
> 11 |     const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
     |                                      ^ Error: browserContext.newPage: Test timeout of 30000ms exceeded.
  12 |     
  13 |     // Assert there are no violations
  14 |     expect(accessibilityScanResults.violations).toEqual([]);
  15 |   });
  16 | });
  17 | 
```
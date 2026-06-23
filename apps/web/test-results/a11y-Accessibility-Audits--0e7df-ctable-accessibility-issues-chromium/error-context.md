# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: a11y.spec.ts >> Accessibility Audits >> Home page should not have any automatically detectable accessibility issues
- Location: tests\e2e\a11y.spec.ts:6:7

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  -  1
+ Received  + 72

- Array []
+ Array [
+   Object {
+     "description": "Ensure the document has a main landmark",
+     "help": "Document should have one main landmark",
+     "helpUrl": "https://dequeuniversity.com/rules/axe/4.11/landmark-one-main?application=playwright",
+     "id": "landmark-one-main",
+     "impact": "moderate",
+     "nodes": Array [
+       Object {
+         "all": Array [
+           Object {
+             "data": null,
+             "id": "page-has-main",
+             "impact": "moderate",
+             "message": "Document does not have a main landmark",
+             "relatedNodes": Array [],
+           },
+         ],
+         "any": Array [],
+         "failureSummary": "Fix all of the following:
+   Document does not have a main landmark",
+         "html": "<html lang=\"en\" class=\"inter_e8413677-module__kC_w9a__variable geist_mono_8d43a2aa-module__8Li5zG__variable h-full antialiased\">",
+         "impact": "moderate",
+         "none": Array [],
+         "target": Array [
+           "html",
+         ],
+       },
+     ],
+     "tags": Array [
+       "cat.semantics",
+       "best-practice",
+     ],
+   },
+   Object {
+     "description": "Ensure all page content is contained by landmarks",
+     "help": "All page content should be contained by landmarks",
+     "helpUrl": "https://dequeuniversity.com/rules/axe/4.11/region?application=playwright",
+     "id": "region",
+     "impact": "moderate",
+     "nodes": Array [
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "isIframe": false,
+             },
+             "id": "region",
+             "impact": "moderate",
+             "message": "Some page content is not contained by landmarks",
+             "relatedNodes": Array [],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Some page content is not contained by landmarks",
+         "html": "<div class=\"min-h-screen flex items-center justify-center bg-[#050505] p-6 text-white text-center\">",
+         "impact": "moderate",
+         "none": Array [],
+         "target": Array [
+           ".min-h-screen",
+         ],
+       },
+     ],
+     "tags": Array [
+       "cat.keyboard",
+       "best-practice",
+       "RGAAv4",
+       "RGAA-9.2.1",
+     ],
+   },
+ ]
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - heading "404" [level=1] [ref=e4]
    - heading "Page Not Found" [level=2] [ref=e5]
    - paragraph [ref=e6]: The menu or page you are looking for doesn't exist or has been moved.
    - link "Return Home" [ref=e7] [cursor=pointer]:
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
  11 |     const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  12 |     
  13 |     // Assert there are no violations
> 14 |     expect(accessibilityScanResults.violations).toEqual([]);
     |                                                 ^ Error: expect(received).toEqual(expected) // deep equality
  15 |   });
  16 | });
  17 | 
```
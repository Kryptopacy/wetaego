# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: multi-business-flow.spec.ts >> Multi-Business Fulfillment Flow >> should allow navigating to dashboard and checking orders
- Location: tests\e2e\multi-business-flow.spec.ts:4:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=The ultimate digital menu')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=The ultimate digital menu')

```

```yaml
- main:
  - navigation:
    - img "OurMenu Logo"
    - link "OurMenu OS":
      - /url: /
    - link "Platform":
      - /url: /#features
    - link "Pricing":
      - /url: /#pricing
    - link "Customers":
      - /url: /#testimonials
    - link "Affiliates":
      - /url: /affiliates
    - link "Log in":
      - /url: /login
    - button "Try Demo"
    - button "Play Roulette 🎲"
    - link "Get Started":
      - /url: /login
  - img "Hero Background"
  - textbox "Find venue menu (e.g. Pacy Grills)..."
  - button "Go"
  - heading "The ultimate digital storefront. A complete operating layer." [level=1]
  - paragraph:
    - strong: OurMenu OS is the complete platform to build your online presence, manage operations, and engage clients.
    - text: Ditch expensive custom websites and terrible PDF links. Whether you are processing restaurant orders, booking salon appointments, selling retail inventory, or quoting consulting retainers, our dynamic templates instantly generate a stunning digital storefront. Delight your clients with an AI Digital Concierge that handles inquiries and processes payments, while your team stays flawlessly synced with the Live Fulfillment Dashboard.
  - link "Start Building":
    - /url: /login
  - button "Experience Demo Mode"
  - img "OurMenu guest menu interface"
  - text: ✓ Order received AI Table 7 ready to order Explore Platform
  - heading "Not just features. A complete business suite." [level=2]
  - paragraph: Everything your operation needs — from the client's first scan to the last Paystack payout.
  - button "Flexible Architecture"
  - button "Operations Hub"
  - button "Client Experience"
  - button "AI Intelligence"
  - button "Built for Growth"
  - button "Staff Operations"
  - text: Any business type Multi-template/Multibusiness
  - heading "Built for more than just restaurants." [level=3]
  - paragraph: Our multi-template architecture supports custom templates for restaurants, salons, consulting, and hotels. Your digital storefront adapts exactly to your business model.
  - text: Tailored to you Custom Flows & Structure
  - heading "Design your own operational flows." [level=3]
  - paragraph: Define varied data structures, custom checkout steps, and unique operational flows to match the precise way your team works.
  - text: Universal Architecture
  - heading "One Operating System. Every Business Type." [level=2]
  - paragraph: Our dynamic template builders instantly adapt the platform to fit your specific operational needs.
  - button "Hospitality Restaurants, Cafes, Bars & Food Trucks":
    - heading "Hospitality" [level=3]
    - paragraph: Restaurants, Cafes, Bars & Food Trucks
  - button "Retail & Boutiques Gadgets, Fashion, Pharmacies & Stores":
    - heading "Retail & Boutiques" [level=3]
    - paragraph: Gadgets, Fashion, Pharmacies & Stores
  - button "Salons & Services Spas, Therapists, Tutors & Barbers":
    - heading "Salons & Services" [level=3]
    - paragraph: Spas, Therapists, Tutors & Barbers
  - button "Consultants & Agencies Freelancers, Marketers & B2B":
    - heading "Consultants & Agencies" [level=3]
    - paragraph: Freelancers, Marketers & B2B
  - button "Real Estate & Auto Property Rentals & Dealerships":
    - heading "Real Estate & Auto" [level=3]
    - paragraph: Property Rentals & Dealerships
  - img "Hospitality"
  - heading "Hospitality" [level=3]
  - paragraph: Transform operations with live dine-in ordering, split payments, and a real-time fulfillment dashboard. Replace paper menus with dynamic, AI-translated catalogs.
  - text: ✓ Live Fulfillment ✓ Split Payments ✓ Table Mapping
  - heading "Pay for what you need." [level=2]
  - paragraph: No hidden fees. Cancel any time.
  - paragraph: Lite
  - text: ₦14,999 / per month
  - paragraph: Perfect for testing the platform at your venue. 30-day free trial included.
  - list:
    - listitem: Includes 10 Credits/mo
    - listitem: Customizable AI Assistant (guest-facing)
    - listitem: Edge Translator (40+ languages)
    - listitem: Up to 2 QR codes
    - listitem: 1 active location
    - listitem: 0 Extra Custom Pages (10 credits/page)
  - link "Start Free Trial":
    - /url: /dashboard
  - text: Most Popular
  - paragraph: Pro
  - text: ₦49,999 / per month
  - paragraph: For serious operators who want every edge.
  - list:
    - listitem: Everything in Lite
    - listitem: Includes 50 Credits/mo
    - listitem: AI Copywriter & Image Studio
    - listitem: Smart Request Triaging (KDS)
    - listitem: Demand Forecasting Engine
    - listitem: 1 Extra Custom Page (10 credits/page)
    - listitem: Priority WhatsApp support
  - link "Get Pro":
    - /url: /dashboard
  - paragraph: Enterprise
  - text: Custom / contact us
  - paragraph: For hotel chains and multi-location brands.
  - list:
    - listitem: Everything in Pro
    - listitem: Includes 200 Credits/mo
    - listitem: Dedicated AI model fine-tuning
    - listitem: Multi-location dashboard
    - listitem: API access for PMS integration
    - listitem: Unlimited Extra Custom Pages
    - listitem: Dedicated account manager
    - listitem: Custom SLA & onboarding
  - link "Contact Sales":
    - /url: /dashboard
  - heading "Need more power?" [level=3]
  - paragraph: Top up your workspace with credits. Credits never expire.
  - heading "10 Credits" [level=4]
  - text: "6000"
  - link "Buy Pack":
    - /url: /dashboard/billing
  - text: Most Popular
  - heading "25 Credits" [level=4]
  - text: "12000"
  - link "Buy Pack":
    - /url: /dashboard/billing
  - heading "50 Credits" [level=4]
  - text: "20000"
  - link "Buy Pack":
    - /url: /dashboard/billing
  - text: Partner Program
  - heading "Grow with us. Earn recurring revenue." [level=2]
  - paragraph: Join our affiliate program and earn a percentage of the revenue for every venue you refer. Rack up invites, track your conversions, and get paid out automatically via our transparent dashboard.
  - link "Learn about Affiliates":
    - /url: /affiliate
  - text: Get Started Today
  - heading "Your venue deserves better infrastructure." [level=2]
  - paragraph: Join forward-thinking venues running on OurMenu. Setup takes under 10 minutes.
  - link "Get Started Free":
    - /url: /login
  - button "Try Demo Mode"
  - img "OurMenu Logo"
  - text: OurMenu
  - paragraph: © 2026 OurMenu. A CruiseHQ concept.
  - link "Privacy":
    - /url: /privacy
  - link "Terms":
    - /url: /terms
  - link "Contact":
    - /url: mailto:support@ourmenuos.online
- region "Notifications alt+T"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Multi-Business Fulfillment Flow', () => {
  4  |   test('should allow navigating to dashboard and checking orders', async ({ page }) => {
  5  |     // Navigate to the demo app
  6  |     await page.goto('/');
  7  | 
  8  |     // Check that we're on the landing page
> 9  |     await expect(page.locator('text=The ultimate digital menu')).toBeVisible();
     |                                                                  ^ Error: expect(locator).toBeVisible() failed
  10 | 
  11 |     // Click "Start Building" or navigate to dashboard directly
  12 |     await page.goto('/dashboard');
  13 |     
  14 |     // In an actual test, we would log in here using a test account.
  15 |     // Since we're just checking that the dashboard route mounts and Playwright is wired:
  16 |     
  17 |     // Check that the live operations text is present or auth redirect happens
  18 |     const currentUrl = page.url();
  19 |     if (currentUrl.includes('/login')) {
  20 |       await expect(page.locator('text=Sign In')).toBeVisible();
  21 |     } else {
  22 |       await expect(page.locator('text=Live Operations')).toBeVisible();
  23 |     }
  24 |   });
  25 | });
  26 | 
```
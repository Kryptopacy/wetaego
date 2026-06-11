# Product Plan: OurMenu OS

Last updated: 2026-05-31

## 1. One-Line Concept

A live menu and availability platform for hospitality businesses, letting customers scan a QR code to see current items, prices, specials, and stock status without downloading an app.

## 2. Refined Positioning

We are not building a generic QR menu generator.

We are building a real-time customer-facing catalog for restaurants, lounges, cafes, bars, food trucks, and hospitality venues.

Core promise:

> Update what customers see in under 10 seconds.

## 3. Viability Score

Overall: 7.4/10

| Area | Score | Read |
| --- | ---: | --- |
| Problem clarity | 9/10 | Stale menus, wrong prices, and availability questions are obvious pain points. |
| Market demand | 8/10 | QR menus and digital menus are already mainstream. |
| Willingness to pay | 6.5/10 | Small operators are price-sensitive but will pay for time savings, accuracy, and sales lift. |
| Competition | 4.5/10 | The generic QR menu category is crowded. |
| MVP feasibility | 8.5/10 | A useful first version is very buildable. |
| Expansion potential | 8/10 | Ordering, payments, loyalty, analytics, and multi-location support can compound. |
| Defensibility | 5/10 | Weak as a menu tool; stronger as an operational layer with workflows and data. |

## 4. Best Initial Wedge

Start with businesses where availability changes often and where staff are repeatedly asked what is available.

Priority segments:

1. Lounges and bars: drinks, bottles, flavors, specials, happy hour, events.
2. Cafes and bakeries: items sell out throughout the day.
3. Food trucks: changing locations, short menus, daily availability.
4. Restaurants with specials or seasonal menus.
5. Hookah lounges: flavors, packages, add-ons, table service.
6. Event venues and hotel lounges: rotating packages and limited-time offers.

## 5. Target User Personas

### Owner / Operator

Wants fewer staff interruptions, fewer pricing mistakes, less printing cost, and a more modern customer experience.

### Manager

Needs to update sold-out items, prices, specials, and operating notes during service without touching a complicated system.

### Staff Member

Needs quick toggles and minimal permissions. Should not need to understand the whole dashboard.

### Customer

Wants a fast, readable, trustworthy menu that answers: what is available, what does it cost, what is popular, and what can I order now?

## 6. MVP Scope

The first shippable product should include:

- Business onboarding.
- Branded public menu page.
- Category and item management.
- Item name, description, price, photo, tags, and modifiers.
- In-stock, low-stock, sold-out, and hidden status.
- Featured specials.
- Dynamic QR code that does not need to change when the menu changes.
- Mobile-first customer view.
- Basic scan analytics.
- Staff roles: owner, manager, editor.
- Fast menu import from a manual form first, then image/PDF import later.

Explicitly not MVP unless discovery proves otherwise:

- Full online ordering.
- Payments.
- Deep POS integrations.
- Delivery integrations.
- Native mobile apps.

## 7. World-Class Differentiators

### Availability-first design

The menu should treat item status as a first-class concept, not an afterthought.

Statuses:

- Available
- Low stock
- Sold out
- Back soon
- Hidden
- Time-limited
- Staff pick

### Time-based menus

Menus can switch by time and day:

- Breakfast
- Lunch
- Dinner
- Late night
- Happy hour
- Brunch
- Event menu

### AI setup assistant

Future feature: upload a PDF, photo, spreadsheet, or website URL and generate the first structured menu automatically.

### WhatsApp/SMS updates

Future feature: managers can update menus by sending short commands, for example:

- `sold out mojito`
- `change suya platter to 28`
- `add special grilled snapper 32`

### Customer-respectful QR experience

The customer page must be fast, readable, searchable, and not just a PDF embedded on a phone.

Principles:

- No app download.
- No forced account.
- No tiny PDF zooming.
- Clear prices.
- Visible availability.
- Works in poor connectivity as much as possible.

### Revenue tools

The product should eventually help businesses sell more, not only update menus.

Potential features:

- Pairings and add-ons.
- Featured high-margin items.
- Popular tonight.
- Manager picks.
- Limited-time offers.
- Customer favorites.

## 8. Blind Spots And Fixes

| Blind Spot | Risk | Fix |
| --- | --- | --- |
| QR fatigue | Some customers dislike QR-only menus. | Support printable companion menus and beautiful table tents. |
| Setup burden | Owners abandon if setup is slow. | Offer guided setup, import tools, and done-for-you onboarding. |
| Staff adoption | Owners buy, staff forget to update. | Build ultra-fast toggles, roles, and mobile admin. |
| Bad mobile UX | QR menus often fail because they are slow PDFs. | Design the customer page as a real mobile product. |
| POS competition | POS vendors can bundle similar features. | Win through speed, simplicity, niche workflows, and better design. |
| Pricing pressure | Small businesses resist high SaaS fees. | Start affordable; upsell analytics, AI import, multi-location, and ordering. |
| Connectivity issues | Customers may have poor signal indoors. | Cache public pages and keep them lightweight. |
| Regulatory details | Allergens, taxes, and alcohol rules vary. | Add configurable disclaimers, allergen tags, and age-restricted item controls. |

## 9. Product Roadmap

### Phase 0: Discovery

- Interview 10 business owners/managers.
- Validate the highest-pain segment.
- Collect real menus from at least 5 businesses.
- Learn who actually performs stock/menu updates during service.
- Test pricing willingness.

### Phase 1: MVP

- Public menu pages.
- Admin dashboard.
- Item/category CRUD.
- Stock status updates.
- QR generation.
- Basic branding.
- Basic analytics.
- Manual onboarding.

### Phase 2: Operational Layer

- Time-based menus.
- Staff roles and activity log.
- Specials scheduling.
- Multi-menu support.
- Menu import from PDF/image/spreadsheet.
- Better analytics and item performance.

### Phase 3: Revenue Layer

- Upsells and pairings.
- Customer favorites.
- Loyalty capture.
- Promo campaigns.
- Reservation/event menu pages.
- Optional ordering flow.

### Phase 4: Platform Layer

- Multi-location management.
- POS integrations.
- Payments.
- White-label options.
- Agency/reseller portal.
- API and embeddable widgets.

## 10. Suggested Pricing

| Plan | Price | Buyer |
| --- | ---: | --- |
| Free | $0 | Testing, tiny businesses, lead capture. |
| Starter | $15-$25/mo | Single-location cafes, food trucks, small bars. |
| Pro | $39-$69/mo | Restaurants and lounges needing analytics, staff accounts, and richer branding. |
| Multi-location | $99+/mo | Hospitality groups, chains, agencies. |

Paid add-ons:

- Done-for-you setup.
- Printed QR table tents and stickers.
- AI menu import.
- Custom domain.
- Premium templates.
- Multi-language menus.
- Ordering and payments.

## 11. Technical Direction

Recommended starting stack:

- Frontend/app: Next.js with App Router.
- Styling: Tailwind CSS plus a restrained component system.
- Database: Postgres.
- Auth: Supabase Auth, Clerk, or Auth.js depending on deployment path.
- Storage: S3-compatible image storage or Vercel Blob.
- QR: dynamic QR codes pointing to stable public slugs.
- Analytics: first-party event table for scans and item interactions.

Core entities:

- Organization
- Location
- User
- Role
- Menu
- Category
- Item
- ItemVariant
- ModifierGroup
- Modifier
- AvailabilityStatus
- QRCode
- ScanEvent
- Theme
- MediaAsset
- AuditLog

## 12. Success Metrics

Early product metrics:

- Time to create first live menu.
- Time to update an item status.
- Number of menu updates per business per week.
- QR scans per location per day.
- Percent of scanned sessions that view item details.
- Retention after 30 days.
- Number of support requests during setup.

Business metrics:

- Free to paid conversion.
- Monthly recurring revenue.
- Churn by segment.
- Average revenue per account.
- Setup service attach rate.

## 13. Discovery Questions

Ask operators:

1. How often do your prices or availability change?
2. Who updates menus today?
3. What happens when an item sells out during service?
4. How often do customers ask staff about availability or price?
5. What do you currently spend on menu printing/design?
6. Would staff update a dashboard during service?
7. Would WhatsApp/SMS updates be easier?
8. What would make this worth paying for monthly?
9. Do you need ordering, or only menu visibility first?
10. Do you prefer customers use QR, physical menus, or both?

## 14. Near-Term Build Checklist

- [ ] Pick product name and brand direction.
- [ ] Define first vertical: lounge/bar, cafe/bakery, restaurant, or food truck.
- [ ] Create clickable customer menu prototype.
- [ ] Create admin dashboard prototype.
- [ ] Validate with 5 operators.
- [ ] Choose technical stack.
- [ ] Implement database schema.
- [ ] Build public menu pages.
- [ ] Build menu management dashboard.
- [ ] Build QR generation.
- [ ] Ship pilot with 1-3 real businesses.

## 15. Current Decision

We are proceeding, but with a sharper thesis:

> OurMenu OS wins if it becomes the fastest, clearest way for hospitality businesses to keep customer-facing availability accurate in real time.

## 16. MVP Build Status

Created on branch: `codex/live-menu-mvp`

The first working local product includes:

- Simulated sign-up/sign-in for business users.
- Guided onboarding after sign-in with vertical templates for lounge/bar, cafe/bakery, and restaurant demos.
- Clear separation between the business portal and customer-facing public menu.
- Admin dashboard with live operational metrics.
- Demo checklist and readiness notes for operator-facing walkthroughs.
- Menu manager with item creation, editing, deletion, search, filters, featured items, and availability toggles.
- Business setup for name, slug, phone, local currency, address, cover image, tagline, and brand color.
- Customer-facing public menu route at `/m/{business-slug}` with no business controls.
- Internal customer preview inside the business dashboard.
- Designed no-photo state for items without images.
- Dynamic QR preview that points at the public menu URL.
- QR link copy, QR image download, and printable table tent action.
- Local browser persistence through `localStorage`.
- Simulated scan tracking.

Important current limitations:

- Data is local to the browser; no database yet.
- Auth is simulated locally; real authentication and multi-user roles are not implemented yet.
- QR generation currently uses an external QR image service.
- Image uploads are URL-based only.
- Payments, ordering, loyalty, and POS integrations are intentionally out of the MVP.

Recommended next build sequence:

1. Convert the MVP into a production Next.js app.
2. Add Postgres schema for organizations, locations, menus, categories, items, QR codes, scan events, and audit logs.
3. Add real authentication, signup, invite flow, and roles.
4. Replace local storage with real persistence.
5. Add image upload/storage.
6. Generate QR codes server-side.
7. Add billing and plan enforcement.
8. Deploy a pilot version and onboard 1-3 real businesses.

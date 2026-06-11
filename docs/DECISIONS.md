# Decision Log

This file records major product and technical decisions as the project evolves.

## 2026-05-31: Product Direction

Decision: Build a live hospitality catalog system, not a generic QR menu generator.

Reasoning: Generic QR menus are crowded. The stronger wedge is real-time availability, fast staff updates, time-based menus, and a polished customer page.

Consequences:

- MVP prioritizes menu visibility and stock status over ordering/payments.
- Customer page performance and readability are core product quality, not polish.
- Staff update workflows must be extremely fast.

## 2026-05-31: MVP Implementation Path

Decision: Build the first working product as a dependency-free web app before introducing a full framework.

Reasoning: The local environment has Git and bundled Node available, but npm is not reliably available on PATH. A dependency-free MVP lets us prove the core workflow immediately: manage items, update availability, preview the customer menu, and produce a QR destination.

Consequences:

- `apps/web` currently uses plain HTML, CSS, and JavaScript.
- State persists in browser `localStorage`.
- The next production step is to migrate this working workflow into Next.js with real database persistence and auth.

## 2026-05-31: Separate Business And Customer Surfaces

Decision: The customer menu must be a standalone public surface, not another tab inside the business dashboard.

Reasoning: Business users manage stock, items, branding, QR links, and settings. Customers only need a fast, trustworthy menu after scanning a QR code. Mixing both surfaces makes the product feel less serious and creates confusion about roles.

Consequences:

- `/` is now the business portal and starts with sign-in/sign-up.
- `/m/{business-slug}` is the public customer menu and does not show business controls.
- The business dashboard can still include an internal preview, but it is explicitly a preview.
- Real backend auth remains the next production requirement.

## 2026-05-31: Local Currency And Optional Item Photos

Decision: Menu prices belong to the business locale, not a hardcoded platform currency. Item photos are optional and should degrade into a polished placeholder.

Reasoning: Nigeria is the first target market, so naira should be the default. The product should still support businesses in other countries without forcing a code change. Many small restaurants and lounges will not have clean item photography on day one, so the menu must still look intentional without photos.

Consequences:

- Business setup now includes a menu currency selector.
- The demo defaults to Nigerian naira.
- Public and internal menu prices use the selected currency.
- Blank item image URLs render a branded initials placeholder.

## 2026-06-01: Demo-Ready Guided Flow

Decision: Before migrating to production infrastructure, the local MVP should be fully demo-able with a guided path from sign-in to workspace launch to public QR menu.

Reasoning: A convincing operator demo needs a story, not just features. The product should quickly show how a business signs in, picks a vertical, launches a menu, updates stock, and shares a QR page.

Consequences:

- Business users now see onboarding after sign-in.
- Demo verticals include lounge/bar, cafe/bakery, and restaurant.
- The dashboard includes a demo checklist and readiness notes.
- QR actions now include copy link, download QR, simulate scan, and print table tent.
- The next major milestone remains production infrastructure: real auth, database, file storage, QR generation, billing, and deployment.

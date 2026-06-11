# Production Readiness

Last updated: 2026-06-01

## Current Stage

OurMenu OS is now a strong local demo. The next stage is converting the demo into a production SaaS with real authentication, tenant-safe data, file storage, deployment, billing, and monitoring.

## Target Production Stack

- App: Next.js App Router
- Database/Auth: Supabase Postgres + Supabase Auth
- Storage: Supabase Storage or Vercel Blob
- Hosting: Vercel
- Billing: Stripe
- Email: Resend
- QR: generated server-side and stored per location/table

## Production Data Model

The first Supabase migration lives in:

`supabase/migrations/20260601122843_initial_schema.sql`

It includes:

- organizations
- organization_members
- locations
- menus
- menu_categories
- menu_items
- qr_codes
- scan_events
- media_assets
- audit_logs

Security choices:

- RLS is enabled on every public table.
- Business users can only read/manage organizations where they are members.
- Owners/managers can manage organization-level settings and memberships.
- Editors can manage menus, categories, items, QR codes, and media.
- Anonymous customers can only read published locations, published menus, categories, and non-hidden items.
- Scan events can be inserted anonymously, but should be rate-limited at the edge before production launch.

## Environment Contract

See `.env.example`.

Rules:

- `SUPABASE_SERVICE_ROLE_KEY` must only be used server-side.
- Browser/client code should only receive the publishable Supabase key.
- Production public menu routes should not require auth.
- Business dashboard routes must require auth and membership checks.

## Migration From Local Demo

Current local state maps to production like this:

| Demo field | Production table |
| --- | --- |
| `business` | `organizations` + `locations` |
| `items[].category` | `menu_categories` |
| `items[]` | `menu_items` |
| `scanCount` | `scan_events` aggregate |
| QR destination | `qr_codes` |
| local demo auth | Supabase Auth + `organization_members` |

## Next Build Milestones

1. Create a Next.js app in `apps/web`.
2. Add Supabase client/server helpers.
3. Implement real signup/login/logout.
4. On signup, create organization, owner membership, first location, default menu, and QR code.
5. Replace `localStorage` persistence with database reads/writes.
6. Add media upload and image optimization.
7. Generate QR codes server-side.
8. Add Stripe billing and plan limits.
9. Deploy to Vercel.
10. Pilot with 1-3 real businesses.

## Production Demo Acceptance Criteria

Before calling the product production-demo ready:

- A new owner can sign up with a real account.
- The owner can create a business and location.
- The owner can add/edit/delete menu items.
- The owner can update availability in under 10 seconds.
- Public QR URL loads without auth.
- Hidden items do not appear publicly.
- Published menu prices show the selected local currency.
- QR code can be downloaded and printed.
- Scan events are recorded.
- A non-member cannot access another business dashboard.
- Public users cannot mutate menu data.

# Enterprise Fleet Management & RBAC

OurMenuOS provides intentional architectural boundaries for massive scale, allowing organizations to cleanly manage multiple venues and isolated sub-businesses from a single pane of glass.

## 1. Dynamic Branch Switcher
Organizations scaling across cities or countries operate from a unified dashboard. A dynamic branch switcher instantly swaps the active context, routing all subsequent API calls to the chosen location.

## 2. Independent Sub-Businesses (location_pages)
We built the `location_pages` architecture to solve the "Hotel Problem" (A hotel has a Spa, a Restaurant, and a Lobby Cafe, all requiring distinct management).
- **Absolute Isolation:** Each sub-page can override the parent organization's settings. A Spa can have custom Wi-Fi credentials, operating hours, contact numbers, and AI Chat Assistant rules entirely separate from the Restaurant.
- **Granular RBAC:** Staff members can be cryptographically assigned to specific `page_id`s. The Spa team can log into the dashboard and *only* see the Spa bookings and analytics.

## 3. Scoped Data Views & Encrypted Cookies
Operations, Menu Managers, and Analytics dashboards automatically filter down to the active location and sub-page. This is enforced via encrypted cookies and strict PostgreSQL Row Level Security (RLS) policies, making it impossible for a staff member to query data outside their scope.

## 4. Hardware Provisioning & Geofencing
- **Dummy QR Routing:** Print bulk "dummy" QR codes and deploy them physically. From the dashboard, securely map these QRs to specific sub-pages (e.g., Table 4 QR routes to the Restaurant; Room 101 QR routes to Room Service).
- **Geofenced Clock-In:** Staff shift clock-ins are strictly validated against customizable geospatial radii around the business location using HTML5 Geolocation and the Haversine formula, preventing off-site clock-ins while maintaining fallback tracking logs in `staff_shifts`.

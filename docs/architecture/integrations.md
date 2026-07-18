# Integrations & Fleet Management

OurMenuOS seamlessly interfaces with the outside world, acting as a true enterprise hub for multi-location brands.

## 1. Outbound Webhooks & Dead Letter Queue (DLQ)
Businesses must be able to export their data instantly to legacy POS systems, CRMs, or Zapier.
- **Delivery System:** Our system captures internal events (`order.created`, `booking.updated`) and fires them to registered endpoints.
- **Dead Letter Queue (DLQ):** If a webhook fails (e.g., the receiving server returns a 500 error), the delivery is queued. A Vercel Cron orchestrator automatically retries the delivery with exponential backoff.
- **Cryptographic Signatures:** Payloads are signed using auto-generated `whsec_` secrets, allowing external consumers to cryptographically verify that the payload originated from OurMenuOS.

## 2. Inbound API Gateway
Legacy point-of-sale systems and third-party CRMs can programmatically push inventory and orders *into* OurMenuOS via mathematically rate-limited, Bearer-token protected REST API endpoints.

## 3. Custom Domains & White-Labeling
A true multi-tenant middleware layer intercepts requests to custom domains (e.g., `menu.luxuryhotel.com`).
- Transparents maps requests to the correct location storefront without visible redirects.
- Organizations completely white-label the customer experience, keeping their branding at the forefront.

## 4. Hardware Provisioning & Smart Routing
Printing physical QR codes for hundreds of tables or rooms is expensive and static.
- **Dummy QR Deployment:** Businesses can print thousands of generic "dummy" QR codes in bulk and deploy them globally.
- **Smart Re-mapping:** Using the dashboard, QR codes can be dynamically routed to specific location pages (e.g., routing a QR code from the "Main Dining" page directly to the "Spa Bookings" sub-page) without ever reprinting the physical asset.

## 5. Automated SaaS Lifecycle
Integrated automated email sequences (powered by Resend and Vercel Cron) autonomously handle Trial Expirations, Subscription Activations, and precise Invoicing without requiring external CRM orchestration.

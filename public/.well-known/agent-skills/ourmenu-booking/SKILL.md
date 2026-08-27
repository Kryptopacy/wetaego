---
name: ourmenu-booking
description: Query availability calendars and schedule appointment bookings for salons, spas, clinics, and consultants with deposit processing.
version: 1.0.0
type: tool
---

# WETAEGO Booking Skill

This skill allows agents to inspect service schedules and book appointment slots.

## Parameters
- `locationId` (string, required): The target location UUID.
- `date` (string, required): Date in `YYYY-MM-DD` format.
- `serviceId` (string, optional): Target service UUID.

## Invocation
\`\`\`http
POST https://ourmenuos.online/api/bookings
Content-Type: application/json

{
  "locationId": "loc_demo",
  "date": "2026-08-25",
  "serviceId": "srv_spa_01"
}
\`\`\`

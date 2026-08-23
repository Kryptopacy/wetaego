---
name: ourmenu-catalog
description: Search, browse, and filter physical store catalogs, restaurant menus, and retail inventories with dietary and stock attributes.
version: 1.0.0
type: tool
---

# OurMenu OS Catalog Discovery Skill

This skill allows agents to search and inspect products, dishes, and services hosted on OurMenu OS venues.

## Parameters
- `locationId` (string, required): The target location UUID or slug.
- `query` (string, optional): Search keywords.
- `dietary` (string, optional): One of `vegan`, `halal`, `gluten_free`, `nut_free`, `keto`.

## Invocation
\`\`\`http
POST https://ourmenuos.online/api/chat
Content-Type: application/json

{
  "messages": [{ "role": "user", "content": "List all halal lunch options." }],
  "locationId": "loc_demo"
}
\`\`\`

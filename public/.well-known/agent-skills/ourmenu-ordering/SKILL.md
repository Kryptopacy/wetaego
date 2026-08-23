---
name: ourmenu-ordering
description: Submit and validate customer orders for restaurant dine-in, takeaway, or boutique retail pickup with item modifiers.
version: 1.0.0
type: tool
---

# OurMenu OS Ordering Skill

This skill allows agents to place and track customer transactions at OurMenu OS venues.

## Parameters
- `locationId` (string, required): The target location UUID.
- `tableIdentifier` (string, optional): Table number or room number.
- `items` (array, required): Array of `{ itemId, quantity, modifiers, notes }`.

## Invocation
\`\`\`http
POST https://ourmenuos.online/api/orders
Content-Type: application/json

{
  "locationId": "loc_demo",
  "tableIdentifier": "Table 4",
  "items": [{ "itemId": "item_123", "quantity": 2 }]
}
\`\`\`

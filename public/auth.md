# WETAEGO Agent Authentication Guide (Auth.md)

> **Specification**: [auth.md](https://workos.com/auth-md)  
> **Issuer**: `https://ourmenuos.online`  
> **API Docs**: `https://ourmenuos.online/docs`  
> **OAuth Protected Resource**: `https://ourmenuos.online/.well-known/oauth-protected-resource`  
> **OAuth Authorization Server**: `https://ourmenuos.online/.well-known/oauth-authorization-server`  

---

## 1. Agent Authentication Overview

Autonomous AI agents, background task runners, and client applications authenticate with WETAEGO APIs through three supported credential schemes:

1. **Merchant API Secret Key** (`om_live_...` or `om_test_...`): Recommended for backend server-to-server and merchant agent operations.
2. **Bearer JWT Token** (`Authorization: Bearer <JWT>`): Standard OAuth2 / Supabase session token obtained via `/api/auth/token` or client authentication.
3. **Agent DID & Client Assertion**: Decentralized identity assertion exchanging cryptographic claims for scoped session tokens.

---

## 2. Programmatic Agent Registration

Agents can register or request temporary workspace API credentials by submitting an onboarding request:

\`\`\`http
POST https://ourmenuos.online/api/auth/register-agent
Content-Type: application/json

{
  "agent_name": "Tego Concierge Agent",
  "identity_type": "client_assertion",
  "client_id": "agent_did_or_client_uuid",
  "requested_scopes": [
    "orders:read",
    "orders:write",
    "catalog:read",
    "bookings:read"
  ],
  "contact_email": "agent-ops@yourdomain.com"
}
\`\`\`

---

## 3. Scopes & Permissions

| Scope | Description |
|---|---|
| `catalog:read` | Read menu items, categories, pricing, stock levels, and dietary attributes. |
| `catalog:write` | Create or modify catalog items, upload cover images, and update modifier groups. |
| `orders:read` | Query existing guest orders, fulfillment statuses, and payment states. |
| `orders:write` | Submit new customer orders with table numbers and item selections. |
| `bookings:read` | Read appointment calendars, staff rosters, and service slots. |
| `bookings:write` | Schedule appointments and record deposit verifications. |

---

## 4. Making Authenticated Requests

Include the token or API key in the standard `Authorization` header:

\`\`\`http
GET https://ourmenuos.online/api/orders
Authorization: Bearer <TOKEN_OR_API_KEY>
Accept: application/json
\`\`\`

---

## 5. Revocation & Token Lifecycle

- **Token Revocation Endpoint**: `POST https://ourmenuos.online/api/auth/revoke`
- **JWKS Key Rotation URI**: `https://ourmenuos.online/api/auth/jwks`
- **Developer Support**: `dev@ourmenuos.online`

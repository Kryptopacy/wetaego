# Agent Authentication, OAuth Discovery & Protected Resource Metadata

This document outlines how autonomous agents establish identity, request scopes, discover OAuth 2.0 authorization servers, and authenticate against protected OurMenu OS endpoints.

---

## 1. WorkOS Auth.md Specification (`/auth.md`)

OurMenu OS publishes `/auth.md` at the site root with complete agent registration guidelines.

### Programmatic Registration Flow
```http
POST https://ourmenuos.online/api/auth/register-agent
Content-Type: application/json

{
  "agent_name": "Tego Concierge Agent",
  "identity_type": "client_assertion",
  "client_id": "agent_did_or_uuid",
  "requested_scopes": ["orders:read", "orders:write", "catalog:read", "bookings:read"],
  "contact_email": "agent-ops@yourdomain.com"
}
```

---

## 2. OpenID Connect Discovery (`/.well-known/openid-configuration`)

```json
{
  "issuer": "https://ourmenuos.online",
  "authorization_endpoint": "https://ourmenuos.online/login",
  "token_endpoint": "https://ourmenuos.online/api/auth/token",
  "userinfo_endpoint": "https://ourmenuos.online/api/auth/userinfo",
  "jwks_uri": "https://ourmenuos.online/api/auth/jwks",
  "response_types_supported": ["code", "token", "id_token"],
  "subject_types_supported": ["public"],
  "id_token_signing_alg_values_supported": ["RS256", "HS256"],
  "scopes_supported": [
    "openid",
    "profile",
    "email",
    "orders:read",
    "orders:write",
    "catalog:read",
    "catalog:write",
    "bookings:read",
    "bookings:write"
  ],
  "agent_auth": {
    "register_uri": "https://ourmenuos.online/auth.md",
    "supported_identity_types": ["agent_did", "client_assertion", "api_key"],
    "credential_types": ["bearer_token", "api_key"]
  }
}
```

---

## 3. RFC 9728 OAuth Protected Resource (`/.well-known/oauth-protected-resource`)

```json
{
  "resource": "https://ourmenuos.online/api",
  "authorization_servers": [
    "https://ourmenuos.online"
  ],
  "scopes_supported": [
    "orders:read",
    "orders:write",
    "catalog:read",
    "catalog:write",
    "bookings:read",
    "bookings:write"
  ],
  "bearer_methods_supported": [
    "header"
  ],
  "resource_documentation": "https://ourmenuos.online/docs"
}
```

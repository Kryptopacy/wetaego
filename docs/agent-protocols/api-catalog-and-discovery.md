# API Catalog, Link Headers & DNS-Based Discovery

This document details how autonomous agents discover OurMenu OS endpoints, documentation, OpenAPI schemas, and authoritative DNS zones.

---

## 1. RFC 9727 API Catalog (`/.well-known/api-catalog`)

OurMenu OS implements **RFC 9727** (Advertising API Catalogs in Linksets) using the **RFC 9264** `application/linkset+json` media type.

### Endpoint: `GET /.well-known/api-catalog`

```json
{
  "linkset": [
    {
      "anchor": "https://ourmenuos.online/api",
      "service-desc": [
        {
          "href": "https://ourmenuos.online/openapi.json",
          "type": "application/openapi+json"
        }
      ],
      "service-doc": [
        {
          "href": "https://ourmenuos.online/docs",
          "type": "text/html"
        }
      ],
      "status": [
        {
          "href": "https://ourmenuos.online/api/health",
          "type": "application/json"
        }
      ],
      "describedby": [
        {
          "href": "https://ourmenuos.online/llms.txt",
          "type": "text/plain"
        }
      ]
    }
  ]
}
```

---

## 2. RFC 8288 Link Response Headers

Every public HTTP response from OurMenu OS includes standardized `Link` headers pointing to machine-readable resources:

```http
Link: </.well-known/api-catalog>; rel="api-catalog",
      </docs>; rel="service-doc",
      </openapi.json>; rel="service-desc"; type="application/openapi+json",
      </llms.txt>; rel="describedby",
      </.well-known/oauth-authorization-server>; rel="oauth-authorization-server",
      </.well-known/oauth-protected-resource>; rel="oauth-protected-resource",
      </.well-known/ai-catalog.json>; rel="ai-catalog",
      </.well-known/agent-skills/index.json>; rel="agent-skills",
      </.well-known/mcp.json>; rel="mcp",
      </.well-known/ucp>; rel="ucp",
      </.well-known/acp.json>; rel="acp",
      </auth.md>; rel="author-doc"
```

---

## 3. DNS for AI Discovery (DNS-AID)

OurMenu OS implements the **DNS-AID** draft specification (`draft-mozleywilliams-dnsop-dnsaid` & **RFC 9460**) enabling DNS-based agent discovery.

### BIND Zone File Configuration
```zone
; DNS for AI Discovery (DNS-AID)
_index._agents.ourmenuos.online. 300 IN HTTPS 1 ourmenuos.online. (
  alpn="h2,h3"
  endpoint="https://ourmenuos.online/.well-known/ai-catalog.json"
  format="application/json"
)

_a2a._agents.ourmenuos.online. 300 IN HTTPS 1 ourmenuos.online. (
  alpn="h2,h3"
  endpoint="https://ourmenuos.online/api/chat"
  format="application/json"
)

_mcp._agents.ourmenuos.online. 300 IN HTTPS 1 ourmenuos.online. (
  alpn="h2,h3"
  endpoint="https://ourmenuos.online/.well-known/mcp.json"
  format="application/json"
)
```

---

## 4. Content Signals in `robots.txt`

Conforms to [contentsignals.org](https://contentsignals.org) declaring machine processing permissions:

```txt
# robots.txt
User-agent: *
Allow: /
Disallow: /dashboard/
Disallow: /api/

Content-Signal: ai-train=no, search=yes, ai-input=yes
```

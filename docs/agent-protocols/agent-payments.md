# Agent-Native Payment Protocols (x402, MPP, UCP, ACP)

OurMenu OS enables autonomous AI agents to initiate and settle transactions programmatically across four interoperable protocols.

---

## 1. Coinbase x402 Protocol (`/.well-known/x402.json` & `/api/x402`)

The **x402 protocol** leverages HTTP 402 Payment Required status codes to enable zero-human-intervention micro-settlement.

### Flow
1. Agent requests a paid resource (e.g. `/api/ai/live-token` or `/api/orders`).
2. Server responds with `HTTP 402` and payment requirements headers:
   ```http
   HTTP/1.1 402 Payment Required
   WWW-Authenticate: X402 token="USDC", network="base", address="0x87A8f8303e339F091F8402D3b934789518d6e9d6", amount="0.05", facilitator="https://ourmenuos.online/api/x402"
   X-402-Payment-Required: true
   ```
3. Agent signs or authorizes the transfer and resubmits with `X-Payment: <TX_HASH>`.
4. Server validates payment with the facilitator and unlocks the resource.

---

## 2. Machine Payment Protocol (MPP)

Defined in `public/openapi.json` via `x-payment-info` vendor extensions:

```json
{
  "/ai/live-token": {
    "post": {
      "x-payment-info": {
        "intent": "charge",
        "method": "crypto",
        "amount": 0.05,
        "currency": "USDC",
        "protocols": ["x402", "mpp"]
      }
    }
  }
}
```

---

## 3. Universal Commerce Protocol (UCP) (`/.well-known/ucp`)

```json
{
  "ucp": {
    "version": "1.0.0",
    "services": ["catalog", "checkout", "fulfillment", "inventory", "reservations"],
    "capabilities": ["table_ordering", "split_payments", "appointment_booking", "escpos_printing"]
  },
  "endpoints": {
    "catalog": "https://ourmenuos.online/api/chat",
    "checkout": "https://ourmenuos.online/api/orders",
    "bookings": "https://ourmenuos.online/api/bookings",
    "health": "https://ourmenuos.online/api/health"
  }
}
```

---

## 4. Agentic Commerce Protocol (ACP) (`/.well-known/acp.json`)

```json
{
  "protocol": {
    "name": "acp",
    "version": "1.0.0"
  },
  "api_base_url": "https://ourmenuos.online/api",
  "transports": ["https", "mcp", "websocket"],
  "capabilities": {
    "services": ["catalog_search", "cart_management", "order_checkout", "service_booking"],
    "settlement_methods": ["paystack", "bachs", "x402", "mpp", "crypto_usdc"]
  }
}
```

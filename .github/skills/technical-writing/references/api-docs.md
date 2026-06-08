# API Documentation Patterns

## What makes good API docs

1. **Every endpoint has a working example** — not a schema, not a description, a real `curl` command with a real response.
2. **Error responses are documented** — not just the happy path. Show 400, 401, 403, 404, 422 responses with the actual error body.
3. **Authentication is explained once, upfront** — don't repeat "add Bearer token" on every endpoint.
4. **Rate limits and pagination are clear** — these are the first things developers hit.

## Endpoint documentation template

```markdown
## Create an order

Creates a new order for a customer. The order starts in `pending` status.

### Request

`POST /api/orders`

**Headers:**
| Header | Value | Required |
|---|---|---|
| Authorization | Bearer {token} | Yes |
| Content-Type | application/json | Yes |
| Idempotency-Key | UUID | Recommended |

**Body:**
```json
{
  "customerId": "C-123",
  "currency": "EUR",
  "items": [
    {
      "productId": "P-456",
      "quantity": 2
    }
  ],
  "notes": "Gift wrapping requested"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| customerId | string | Yes | Customer identifier |
| currency | string (ISO 4217) | Yes | Three-letter currency code |
| items | array | Yes | At least 1 item |
| items[].productId | string | Yes | Product identifier |
| items[].quantity | integer | Yes | 1–100 |
| notes | string | No | Max 500 characters |

### Response

**201 Created**
```json
{
  "id": "ORD-789",
  "status": "pending",
  "customerId": "C-123",
  "currency": "EUR",
  "total": 59.98,
  "items": [
    {
      "productId": "P-456",
      "name": "Wireless Mouse",
      "quantity": 2,
      "unitPrice": 29.99,
      "lineTotal": 59.98
    }
  ],
  "createdAt": "2025-05-23T10:15:30Z"
}
```

### Errors

**400 Bad Request** — Validation failed
```json
{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.5.1",
  "title": "Validation error",
  "status": 400,
  "errors": {
    "items": ["Order must have at least one item"],
    "currency": ["'XYZ' is not a valid ISO 4217 currency code"]
  }
}
```

**401 Unauthorized** — Missing or invalid token
**404 Not Found** — Customer not found
**409 Conflict** — Duplicate idempotency key with different body

### Example

```bash
curl -X POST https://api.example.com/api/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $(uuidgen)" \
  -d '{
    "customerId": "C-123",
    "currency": "EUR",
    "items": [{"productId": "P-456", "quantity": 2}]
  }'
```
```

## Pagination documentation

```markdown
## Pagination

All list endpoints support cursor-based pagination.

### Parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| limit | integer | 20 | Items per page (1–100) |
| cursor | string | — | Cursor from previous response |

### Response

```json
{
  "items": [...],
  "pagination": {
    "nextCursor": "eyJpZCI6MTAwfQ==",
    "hasMore": true
  }
}
```

### Example: paginating through all orders

```bash
# First page
curl "https://api.example.com/api/orders?limit=10"

# Next page (use nextCursor from previous response)
curl "https://api.example.com/api/orders?limit=10&cursor=eyJpZCI6MTAwfQ=="
```

When `hasMore` is `false`, there are no more results.
```

## Authentication section

```markdown
## Authentication

All API requests require a Bearer token in the Authorization header.

### Getting a token

```bash
curl -X POST https://api.example.com/auth/token \
  -H "Content-Type: application/json" \
  -d '{"clientId": "YOUR_CLIENT_ID", "clientSecret": "YOUR_CLIENT_SECRET"}'
```

Response:
```json
{
  "accessToken": "eyJhbGciOiJSUzI1NiIs...",
  "expiresIn": 3600,
  "tokenType": "Bearer"
}
```

### Using the token

Include in every request:
```
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
```

Tokens expire after 1 hour. Request a new token when you receive a 401 response.

### Rate limits

| Plan | Rate limit | Burst |
|---|---|---|
| Free | 100 requests/minute | 10 concurrent |
| Pro | 1,000 requests/minute | 50 concurrent |
| Enterprise | Custom | Custom |

When rate limited, the API returns `429 Too Many Requests` with a `Retry-After` header.
```

## OpenAPI / Swagger

Generate from code annotations, but supplement with handwritten guides:

```
docs/
  api/
    openapi.yaml          # Auto-generated from code annotations
    getting-started.md    # Handwritten quickstart
    authentication.md     # Handwritten auth guide
    pagination.md         # Handwritten pagination guide
    webhooks.md           # Handwritten webhook setup
    errors.md             # Handwritten error handling guide
    changelog.md          # API version changelog
```

OpenAPI provides the reference. The handwritten docs provide the tutorials and how-to guides. Both are needed.

## SDK examples

If your API has SDKs, show examples in multiple languages:

````markdown
### Create an order

<details>
<summary>cURL</summary>

```bash
curl -X POST https://api.example.com/api/orders ...
```
</details>

<details>
<summary>C# (.NET)</summary>

```csharp
var order = await client.Orders.CreateAsync(new CreateOrderRequest
{
    CustomerId = "C-123",
    Currency = "EUR",
    Items = [new OrderItem("P-456", 2)]
});
```
</details>

<details>
<summary>TypeScript</summary>

```typescript
const order = await client.orders.create({
  customerId: "C-123",
  currency: "EUR",
  items: [{ productId: "P-456", quantity: 2 }],
});
```
</details>
````

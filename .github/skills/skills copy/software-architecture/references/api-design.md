# API Design

Source: Google API Design Guide, Microsoft REST API Guidelines, gRPC documentation, GraphQL specification.

## Choosing a protocol

| Criterion | REST (HTTP/JSON) | gRPC (HTTP/2 + Protobuf) | GraphQL |
|---|---|---|---|
| **Best for** | Public APIs, web clients, simplicity | Service-to-service, high throughput, streaming | Flexible queries, multiple frontends, BFF replacement |
| **Payload size** | Larger (JSON text) | Smaller (binary Protobuf) | Variable (request-shaped) |
| **Type safety** | OpenAPI spec (external) | Built-in (Protobuf IDL) | Built-in (schema + codegen) |
| **Streaming** | Limited (SSE, WebSocket) | Native (unary, server, client, bidirectional) | Subscriptions (WebSocket) |
| **Browser support** | Native | Requires gRPC-Web proxy | Native |
| **Caching** | HTTP caching built-in | No native HTTP caching | Requires client-side caching (Apollo, Relay) |
| **Learning curve** | Low | Medium | Medium-High |
| **Ecosystem** | Massive | Growing | Large (frontend-heavy) |
| **Versioning** | URL or header | Package/service versioning in proto | Schema evolution |

### Decision guide

- **External-facing API consumed by third parties** → REST. Universal, well-understood, cacheable.
- **Internal service-to-service, high throughput** → gRPC. Type-safe, fast, streaming.
- **Multiple frontends with different data needs** → GraphQL. One endpoint, flexible queries.
- **Simple CRUD, small team** → REST. Don't add complexity for no reason.

## REST API design

### URL structure

```
GET    /api/v1/orders              → List orders
GET    /api/v1/orders/{id}         → Get one order
POST   /api/v1/orders              → Create order
PUT    /api/v1/orders/{id}         → Full update
PATCH  /api/v1/orders/{id}         → Partial update
DELETE /api/v1/orders/{id}         → Delete order

GET    /api/v1/orders/{id}/items   → List items of an order (sub-resource)
```

### Rules

- **Nouns, not verbs.** `/orders` not `/getOrders`. The HTTP method IS the verb.
- **Plural nouns.** `/orders` not `/order`. Consistency.
- **Kebab-case or snake_case.** Pick one, be consistent. Google uses camelCase in JSON bodies, kebab-case in URLs.
- **No deeper than 2 levels.** `/orders/{id}/items` is fine. `/orders/{id}/items/{itemId}/variants/{variantId}` is not — flatten it.
- **Filtering via query parameters.** `GET /orders?status=late&since=2024-01-01`.
- **Pagination.** Cursor-based (`?cursor=abc&limit=50`) is better than offset-based (`?page=3&per_page=50`) for large datasets. Always return `next_cursor` in the response.

### HTTP status codes (use correctly)

| Code | Meaning | When |
|---|---|---|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST that creates a resource |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation error, malformed input |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Authenticated but not authorized |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate creation, optimistic locking failure |
| 422 | Unprocessable Entity | Valid JSON but business rule violation |
| 429 | Too Many Requests | Rate limited |
| 500 | Internal Server Error | Unexpected server failure |
| 503 | Service Unavailable | Planned maintenance, circuit breaker open |

### Error response format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Order quantity must be between 1 and 1000.",
    "details": [
      {
        "field": "quantity",
        "constraint": "range",
        "min": 1,
        "max": 1000,
        "actual": 0
      }
    ],
    "traceId": "abc-123-def-456"
  }
}
```

### Versioning strategies

| Strategy | Pros | Cons | Example |
|---|---|---|---|
| **URL path** | Simple, explicit, cacheable | Multiple code paths | `/api/v1/orders` |
| **Header** | Clean URLs, content negotiation | Less discoverable | `Accept: application/vnd.api.v2+json` |
| **Query param** | Easy to test | Muddies query params | `/api/orders?version=2` |

Recommendation: **URL path** for public APIs (simplicity wins). **Header** for internal APIs if the team is disciplined.

### Contract-first design

Always design the contract (OpenAPI spec) BEFORE writing code:

1. Write the OpenAPI spec.
2. Review with consumers (Frontend, mobile, third parties).
3. Generate server stubs and client SDKs from the spec.
4. Implement the server.
5. Run contract tests to verify implementation matches spec.

## gRPC design

### Proto file structure

```protobuf
syntax = "proto3";

package orders.v1;

service OrderService {
  rpc GetOrder(GetOrderRequest) returns (Order);
  rpc ListOrders(ListOrdersRequest) returns (ListOrdersResponse);
  rpc CreateOrder(CreateOrderRequest) returns (Order);
  rpc StreamOrderUpdates(StreamOrderUpdatesRequest) returns (stream OrderUpdate);
}

message Order {
  string id = 1;
  string customer_id = 2;
  repeated OrderItem items = 3;
  OrderStatus status = 4;
  google.protobuf.Timestamp created_at = 5;
}
```

### gRPC rules

- **Package versioning.** `package orders.v1;` — bump the package version for breaking changes.
- **Never reuse field numbers.** Deleted fields should be `reserved`, not reused.
- **Use `google.protobuf.Timestamp`** for dates, not string or int64.
- **Streaming for real-time.** Server streaming for feeds, bidirectional for chat-like patterns.
- **Deadlines, not timeouts.** gRPC propagates absolute deadlines across services, preventing cascade.

## API contract rules (applies to all protocols)

1. **Contracts are immutable once published.** Breaking changes require a new version.
2. **Additive changes are safe.** Adding a new field is non-breaking. Removing or renaming a field is breaking.
3. **Consumers must ignore unknown fields.** Robustness principle (Postel's Law): be liberal in what you accept.
4. **Every endpoint has a documented SLO.** P50, P95, P99 latency. Error budget. Rate limits.
5. **Idempotency keys for mutations.** POST/PUT with an `Idempotency-Key` header prevents duplicate processing on retries.
6. **Correlation ID in every request.** `X-Correlation-Id` header propagated across services for tracing.

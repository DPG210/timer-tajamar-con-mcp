# Distributed Tracing — Patterns and Context Propagation

## What a trace looks like

```
Trace: abc123 (user clicks "Place Order")
├── Span: POST /api/orders (API Gateway) ────── 450ms
│   ├── Span: ValidateOrder (Order Service) ─── 20ms
│   ├── Span: SELECT inventory (DB) ─────────── 35ms
│   ├── Span: POST /payments (Payment Svc) ──── 350ms
│   │   ├── Span: Stripe API call ───────────── 300ms
│   │   └── Span: INSERT payment (DB) ──────── 15ms
│   └── Span: Publish OrderCreated (Queue) ──── 5ms
└── Span: OrderCreated handler (Worker) ──────── 100ms (async)
    └── Span: SendEmail (Email Service) ──────── 80ms
```

One trace = one user request, across all services. Each span = one operation.

## Span naming conventions

```
Format: {verb} {target}

HTTP client:  GET /api/users/{id}
HTTP server:  POST /api/orders
Database:     SELECT orders
Cache:        GET cache:user:123
Queue:        PUBLISH order.created
Queue:        PROCESS order.created
gRPC:         grpc.payment.v1.PaymentService/Charge
External:     Stripe CreatePaymentIntent
```

Rules:
- Use the route template, not the actual URL (`/api/users/{id}` not `/api/users/abc123`).
- Verb first for consistency.
- Keep names low-cardinality (finite set of unique names).

## Span attributes (tags)

### Standard semantic conventions (OpenTelemetry):

```
http.request.method = "POST"
http.route = "/api/orders"
http.response.status_code = 201
url.full = "https://api.myapp.com/api/orders"

db.system = "mssql"
db.name = "OrdersDb"
db.statement = "SELECT * FROM Orders WHERE Id = @p0"

messaging.system = "rabbitmq"
messaging.destination.name = "order.created"
messaging.operation = "publish"
```

### Custom business attributes:

```
order.id = "ORD-12345"
order.total = 99.50
order.item_count = 3
customer.tier = "premium"
payment.method = "credit_card"
```

**Rule:** Add attributes that help you filter and debug. Don't add PII (emails, names, full addresses).

## Context propagation

### HTTP (automatic with OTel instrumentation):

```
Request headers (W3C Trace Context):
  traceparent: 00-abc123def456-span789-01
  tracestate: vendor=value

→ All downstream services join the same trace automatically
```

### Message queues (manual propagation):

```csharp
// Producer: inject context into message headers
var propagator = Propagators.DefaultTextMapPropagator;
var context = new PropagationContext(Activity.Current!.Context, Baggage.Current);

var headers = new Dictionary<string, string>();
propagator.Inject(context, headers, (carrier, key, value) => carrier[key] = value);

// Publish message with headers
await bus.PublishAsync(new OrderCreatedEvent { ... }, headers);

// Consumer: extract context from message headers
var parentContext = propagator.Extract(default, message.Headers, 
    (carrier, key) => carrier.TryGetValue(key, out var v) ? new[] { v } : Array.Empty<string>());

using var activity = ActivitySource.StartActivity("PROCESS order.created", 
    ActivityKind.Consumer, parentContext.ActivityContext);
```

### Background jobs:

```csharp
// When enqueuing: capture current trace context
var traceParent = Activity.Current?.Id;
await queue.EnqueueAsync(new Job { TraceParent = traceParent, ... });

// When processing: restore context
using var activity = ActivitySource.StartActivity("ProcessJob", 
    ActivityKind.Consumer, 
    ActivityContext.Parse(job.TraceParent, null));
```

## Sampling strategies

| Strategy | Description | Use when |
|----------|-------------|----------|
| AlwaysOn | Trace everything | Dev/staging, low traffic (<100 rps) |
| TraceIdRatio(0.1) | 10% random sample | High traffic, general observability |
| ParentBased + Ratio | Respect parent's sampling decision | Multi-service (consistent traces) |
| AlwaysOff + Error sampling | Only trace errors | Cost-sensitive, error debugging only |

```csharp
// Production recommendation: parent-based with 10% ratio
.WithTracing(tracing => tracing
    .SetSampler(new ParentBasedSampler(new TraceIdRatioBasedSampler(0.1)))
    // ... instrumentations
)
```

**Always sample 100% of errors** regardless of ratio:

```csharp
// Custom sampler that always samples errors
public class ErrorAlwaysSampler : Sampler
{
    private readonly Sampler _inner;
    
    public override SamplingResult ShouldSample(in SamplingParameters parameters)
    {
        // Check if parent has error status → always sample
        if (parameters.ParentContext.TraceFlags.HasFlag(ActivityTraceFlags.Recorded))
            return new SamplingResult(SamplingDecision.RecordAndSample);
        
        return _inner.ShouldSample(parameters);
    }
}
```

## Span events and links

```csharp
// Events: notable moments within a span
activity?.AddEvent(new ActivityEvent("RetryAttempt", tags: new()
{
    { "attempt", 2 },
    { "reason", "timeout" }
}));

// Links: relate to another trace (e.g., batch job triggered by multiple requests)
var link = new ActivityLink(triggerTraceContext);
using var activity = ActivitySource.StartActivity("BatchProcess", 
    ActivityKind.Consumer, links: new[] { link });
```

## Common anti-patterns

- **Tracing every method call** → Thousands of spans per request. Only trace boundaries (HTTP, DB, queue, cache).
- **No context propagation in queues** → Async operations disconnect from the original trace. Always propagate.
- **Span name with high cardinality** → `/api/users/abc123` instead of `/api/users/{id}` = unusable aggregations.
- **PII in span attributes** → Emails, passwords, credit cards in traces = compliance violation.
- **No sampling in production** → Full tracing at 10K rps = terabytes/day = massive cost.
- **Ignoring error spans** → Errors sampled away mean you can't debug production issues.
- **No span status on errors** → Trace viewer can't highlight failures without `SetStatus(Error)`.

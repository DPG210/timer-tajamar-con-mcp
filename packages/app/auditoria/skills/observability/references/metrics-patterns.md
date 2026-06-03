# Metrics Patterns — RED, USE, Golden Signals

## The RED Method (for request-driven services)

| Metric | What it measures | Alert when |
|--------|-----------------|------------|
| **R**ate | Requests per second | Sudden drop (traffic loss) or spike (DDoS/runaway client) |
| **E**rrors | Failed requests per second (or error %) | Error rate > 1% sustained for 5 min |
| **D**uration | Latency distribution (P50, P95, P99) | P99 > SLO threshold for 5 min |

```
http_server_request_duration_seconds (histogram)
  Labels: method, route, status_code

http_server_active_requests (gauge)
  Labels: method, route
```

## The USE Method (for infrastructure/resources)

| Metric | What it measures | Alert when |
|--------|-----------------|------------|
| **U**tilization | % of resource capacity used | CPU > 80% sustained, Memory > 85% |
| **S**aturation | Work queued/waiting | Thread pool queue > 0, DB connection pool exhausted |
| **E**rrors | Resource errors | Disk I/O errors, network drops |

## Golden Signals (Google SRE)

1. **Latency** — Time to serve a request (separate success from error latency).
2. **Traffic** — Demand on the system (requests/sec, concurrent users).
3. **Errors** — Rate of failed requests (explicit 5xx + implicit timeout).
4. **Saturation** — How "full" the system is (queue depth, memory pressure).

## Custom business metrics

```csharp
// Counter: things that only go up
private static readonly Counter<long> OrdersPlaced = 
    Meter.CreateCounter<long>("app.orders.placed", "orders");

// Histogram: distribution of values
private static readonly Histogram<double> PaymentDuration = 
    Meter.CreateHistogram<double>("app.payment.duration", "ms");

// Gauge: current value (via ObservableGauge)
Meter.CreateObservableGauge("app.queue.depth", () => _queue.Count);

// Usage with dimensions (labels)
OrdersPlaced.Add(1, 
    new("payment_method", "credit_card"),
    new("region", "eu-west"));
```

## Histogram bucket boundaries

Choose boundaries that match your SLOs:

```csharp
// For HTTP latency (SLO: P99 < 500ms)
var boundaries = new[] { 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000 };

// For batch job duration (SLO: < 5 minutes)
var boundaries = new[] { 1000, 5000, 15000, 30000, 60000, 120000, 300000 };
```

## Metric naming conventions (OpenTelemetry)

```
{namespace}.{target}.{action}[.{unit}]

Examples:
  http.server.request.duration        (auto-instrumented)
  http.server.active_requests         (auto-instrumented)
  db.client.connections.usage         (auto-instrumented)
  app.orders.placed                   (custom)
  app.payment.processing.duration     (custom)
  app.cache.hit_ratio                 (custom)
  app.queue.messages.pending          (custom)
```

Rules:
- Lowercase, dot-separated namespace.
- Underscore for multi-word within a segment.
- Unit in the metric name only if ambiguous.
- Avoid high-cardinality labels (no user_id, no request_id).

## Label cardinality rules

| Label | Cardinality | OK? |
|-------|------------|-----|
| `method` (GET/POST/PUT/DELETE) | 5 | Yes |
| `status_code` (200/201/400/404/500) | ~10 | Yes |
| `route` (/api/orders, /api/users) | ~50 | Yes |
| `region` (eu-west, us-east) | ~5 | Yes |
| `customer_id` | 100,000+ | NO — use traces |
| `request_id` | infinite | NO — use traces |
| `email` | infinite | NO — PII, never |

**Rule:** If a label has >100 unique values, it doesn't belong in metrics. Use traces instead.

## Alerting patterns

### Multi-window burn rate (recommended for SLO-based alerts)

```
SLO: 99.9% availability (error budget: 0.1% = 43 min/month)

Fast burn (2% budget in 1 hour):
  alert: rate(errors[5m]) / rate(requests[5m]) > 14.4 * 0.001
  for: 2m
  severity: page

Slow burn (5% budget in 6 hours):  
  alert: rate(errors[30m]) / rate(requests[30m]) > 6 * 0.001
  for: 15m
  severity: ticket
```

### Symptom-based (what users feel):
```yaml
# Good: Users experiencing errors
- alert: HighErrorRate
  expr: sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) > 0.01
  for: 5m

# Good: Users experiencing slowness
- alert: HighLatency
  expr: histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m])) > 2
  for: 5m
```

### Cause-based (what's wrong internally):
```yaml
# Supplementary: helps diagnosis but don't page on these alone
- alert: DatabaseConnectionPoolExhausted
  expr: db_connections_active / db_connections_max > 0.9
  for: 2m

- alert: DiskSpaceRunningLow
  expr: node_filesystem_avail_bytes / node_filesystem_size_bytes < 0.1
  for: 10m
```

## Common anti-patterns

- **Alerting on CPU/memory without business context** → CPU at 80% might be fine. Alert on user-facing symptoms.
- **No histogram, only averages** → Averages hide P99 spikes. Always use histograms for latency.
- **High-cardinality labels** → `user_id` as a metric label = millions of time series = cost explosion.
- **Alert on every metric** → Alert fatigue. Only alert on what requires human intervention.
- **No "for" duration on alerts** → Single spike triggers page. Use `for: 5m` minimum.
- **Metrics without units** → Is `duration: 500` milliseconds or seconds? Always include units.
- **Custom metrics for what auto-instrumentation covers** → OTel already gives you HTTP, DB, runtime metrics. Don't duplicate.

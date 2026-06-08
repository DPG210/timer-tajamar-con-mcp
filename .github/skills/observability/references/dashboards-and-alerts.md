# Dashboards and Alerts — Design Patterns

## Dashboard hierarchy

```
Level 1: Service Overview (SRE/on-call)
  → Are users happy? (error rate, latency, availability)
  → Is anything burning? (alerts firing, error budget consumption)

Level 2: Service Deep Dive (developers)
  → Where's the bottleneck? (latency breakdown by dependency)
  → What's saturated? (pools, queues, connections)

Level 3: Infrastructure (platform team)
  → Resource utilization (CPU, memory, disk, network)
  → Capacity planning (growth trends)
```

## Service Overview dashboard (Level 1)

Every service gets this. Four panels, golden signals:

```
┌─────────────────────────────────────────────────────┐
│  SERVICE: Order API                  SLO: 99.9%     │
├──────────────────────┬──────────────────────────────┤
│  Request Rate        │  Error Rate                  │
│  [line chart]        │  [line chart]                │
│  Current: 450 rps    │  Current: 0.02%              │
│  Avg: 380 rps        │  Budget remaining: 89%       │
├──────────────────────┼──────────────────────────────┤
│  Latency (P50/P95/P99)│  Saturation                │
│  [line chart]         │  [gauge panels]             │
│  P50: 45ms P99: 230ms│  DB pool: 34% | Queue: 12  │
│                       ��  Memory: 62% | CPU: 28%    │
└──────────────────────┴──────────────────────────────┘
```

## Alert design principles

### Alert on symptoms, investigate causes

```
GOOD ALERT (symptom):
  "Order API error rate > 1% for 5 minutes"
  → On-call investigates: is it DB? Payment provider? Deploy?

BAD ALERT (cause without impact):
  "CPU > 80%"
  → Is it affecting users? Maybe not. Alert fatigue.
```

### Every alert needs a runbook

```yaml
- alert: OrderApiHighErrorRate
  expr: |
    sum(rate(http_server_requests_total{service="order-api",status=~"5.."}[5m]))
    / sum(rate(http_server_requests_total{service="order-api"}[5m])) > 0.01
  for: 5m
  labels:
    severity: page
    team: backend
  annotations:
    summary: "Order API error rate is {{ $value | humanizePercentage }}"
    runbook: "https://wiki.internal/runbooks/order-api-high-errors"
    dashboard: "https://grafana.internal/d/order-api"
```

### Severity levels

| Severity | Response | Example |
|----------|----------|---------|
| page | Wake someone up, immediate action | SLO burned >5% in 1 hour |
| ticket | Fix during business hours | Slow degradation, non-critical service |
| info | Log for awareness, no action needed | Deployment completed, scaling event |

### Alert fatigue prevention

1. **Deduplicate:** Same alert from multiple instances → one notification.
2. **Group:** Related alerts bundled → one message.
3. **Silence known issues:** Scheduled maintenance → silence alerts.
4. **Threshold review:** If an alert fires > 3x/week without action, fix or remove it.
5. **Escalation:** If not acknowledged in 10 min → escalate to secondary.

## Dashboard anti-patterns

| Anti-pattern | Problem | Fix |
|-------------|---------|-----|
| 50 panels on one dashboard | Can't find anything | Split into levels (overview → deep dive) |
| Only averages shown | P99 spikes invisible | Always show P50, P95, P99 |
| No time selector context | "Since when?" unknown | Default to last 6h, allow zoom |
| Raw counters (not rates) | Ever-increasing lines mean nothing | Use `rate()` or `increase()` |
| No annotations for deploys | Can't correlate changes with behavior | Add deploy markers |
| CPU/memory without business metrics | Infra health ≠ user health | Lead with golden signals |

## Deployment annotations

```yaml
# After successful deploy, annotate Grafana:
- name: Annotate deployment
  run: |
    curl -X POST "${{ vars.GRAFANA_URL }}/api/annotations" \
      -H "Authorization: Bearer ${{ secrets.GRAFANA_TOKEN }}" \
      -H "Content-Type: application/json" \
      -d '{
        "text": "Deploy ${{ github.sha }} to production",
        "tags": ["deploy", "order-api"],
        "time": '$(date +%s000)'
      }'
```

This creates a vertical line on all dashboards, making it trivial to correlate "things broke" with "we deployed."

## SLO dashboard pattern

```
┌─────────────────────────────────────────────────────┐
│  SLO: Order API Availability = 99.9%               │
├─────────────────────────────────────────────────────┤
│  Current (30d rolling): 99.94%  ✅                  │
│  Error budget remaining: 67% (28 minutes left)      │
│  Burn rate: 0.3x (healthy)                          │
│                                                     │
│  [timeline: budget consumption over 30 days]        │
│  [markers: incidents that consumed budget]          │
└─────────────────────────────────────────────────────┘
```

## Common anti-patterns

- **Dashboard-per-developer instead of per-service** → Shared service dashboards with consistent layout.
- **Alerts without `for` duration** → Transient spike pages you at 3am. Use `for: 5m` minimum.
- **No runbook linked** → On-call opens alert, has no idea what to do. Every alert = runbook.
- **Alerting on trailing indicators** → "Monthly error budget < 20%" fires too late. Use burn rate.
- **Separate dashboards for traces/metrics/logs** → Correlate! Click from metric panel → filtered traces → specific logs.
- **No deploy annotations** → "When did it start?" becomes a 10-minute git log investigation.

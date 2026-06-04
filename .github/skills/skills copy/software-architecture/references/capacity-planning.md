# Capacity Planning and Sizing

Source: Google SRE Book (Chapter 18), Little's Law, universal scalability law, back-of-envelope estimation.

## Why capacity planning before architecture sign-off

If the architecture can't handle the expected load, the architecture is wrong. Capacity planning validates architectural decisions with arithmetic — not hope.

## Core formulas

### Throughput

```
Throughput (RPS) = Concurrent Users × Requests per User per Second
```

Or from the other side:

```
Throughput (RPS) = (1000 / Avg Latency in ms) × Concurrency (threads/workers)
```

Example: 50ms average latency, 20 worker threads → (1000/50) × 20 = 400 RPS per instance.

### Little's Law

```
L = λ × W

L = average number of items in the system (queue depth, concurrent requests)
λ = arrival rate (requests per second)
W = average time each item spends in the system (latency)
```

Example: 200 RPS, 100ms average latency → L = 200 × 0.1 = 20 concurrent requests in flight. If your connection pool has 20 connections, you're at capacity. Add headroom.

### Storage growth

```
Daily storage = Records per day × Average record size
Monthly storage = Daily × 30
Yearly storage = Daily × 365
Include indexes: multiply by 1.3–2x depending on index count
```

### Bandwidth

```
Bandwidth = Throughput (RPS) × Average Response Size
```

Example: 500 RPS × 10 KB average response = 5 MB/s = 40 Mbps.

## Headroom rules

| Metric | Headroom | Why |
|---|---|---|
| CPU | ≤ 60% at expected peak | Spikes above expected happen. No headroom = queueing = latency spikes |
| Memory | ≤ 70% at expected peak | GC pressure, memory leaks, OS overhead |
| Disk I/O | ≤ 50% of max IOPS | Sequential vs. random mix varies; leave room |
| Network | ≤ 50% of bandwidth | Burst traffic, retransmissions |
| Connection pools | ≤ 70% of max connections | Prevent pool exhaustion under load |
| Queue depth | Monitor, alert at 80% of max | Full queue = dropped messages or backpressure |

## Sizing template

```markdown
# Capacity Estimate — <System/Service Name>

## Traffic assumptions
- **Expected users:** <number>
- **Peak concurrent users:** <number> (based on <source: analytics, business estimate>)
- **Requests per user per session:** <number>
- **Peak RPS:** <calculation>
- **Growth projection:** <% per quarter/year>

## Compute sizing
- **Latency target:** P50 = <ms>, P95 = <ms>, P99 = <ms>
- **Throughput per instance:** <RPS, based on benchmark or estimate>
- **Instances needed at peak:** <peak RPS / throughput per instance, rounded up>
- **Headroom instances:** <+50% for headroom>
- **Auto-scaling range:** min=<X>, max=<Y>
- **Instance type:** <CPU/memory/network spec>

## Database sizing
- **Read/write ratio:** <e.g., 80/20>
- **Read IOPS at peak:** <number>
- **Write IOPS at peak:** <number>
- **Storage at launch:** <GB>
- **Storage at 1 year:** <GB>
- **Storage at 3 years:** <GB>
- **Read replicas needed:** <number, if read-heavy>
- **Connection pool size:** <per instance × number of instances ≤ max DB connections>

## Cache sizing
- **Hit rate target:** <e.g., 95%>
- **Working set size:** <GB — data that needs to be in cache>
- **Memory per cache node:** <GB>
- **Nodes needed:** <working set / memory per node, +1 for failover>
- **TTL:** <seconds/minutes>

## Queue / Messaging sizing
- **Message rate at peak:** <messages/second>
- **Average message size:** <KB>
- **Consumer processing rate:** <messages/second per consumer>
- **Consumers needed:** <message rate / processing rate>
- **Retention:** <hours/days>
- **DLQ monitoring:** <threshold for alerting>

## Network / Bandwidth
- **Egress at peak:** <Mbps>
- **Ingress at peak:** <Mbps>
- **Cross-AZ traffic:** <estimate if multi-AZ>

## Cost estimate
- **Compute:** <$/month>
- **Database:** <$/month>
- **Cache:** <$/month>
- **Messaging:** <$/month>
- **Network egress:** <$/month>
- **Storage:** <$/month>
- **Total:** <$/month>
- **Cost per user:** <$/user/month>
```

## Load testing validation

Capacity estimates are hypotheses. Load testing validates them.

### Load test types

| Type | Goal | How |
|---|---|---|
| **Baseline** | Establish current performance under normal load | Simulate expected traffic for 30 min |
| **Stress** | Find the breaking point | Ramp up until errors or latency SLO breach |
| **Spike** | Test sudden traffic surges | Jump from normal to 5-10× in seconds |
| **Soak** | Find memory leaks, resource exhaustion | Sustained load for 4-12 hours |
| **Capacity** | Validate the sizing estimate | Simulate expected peak + headroom |

### Load test checklist

- [ ] Test environment mirrors production (instance types, database, network).
- [ ] Test data is realistic (not 10 rows — representative volume).
- [ ] Monitoring is active during test (CPU, memory, latency percentiles, error rate, queue depth).
- [ ] Downstream dependencies are included (or stubbed with realistic latency).
- [ ] Results documented: max RPS before SLO breach, bottleneck identified, scaling behavior observed.

## Scaling strategies

| Strategy | How | When |
|---|---|---|
| **Vertical scaling** | Bigger instance (more CPU, RAM) | Single instance, quick fix, DB servers |
| **Horizontal scaling** | More instances behind load balancer | Stateless services, web/API tier |
| **Database read replicas** | Replicate writes, distribute reads | Read-heavy workloads |
| **Sharding** | Partition data across multiple databases | Write-heavy, single DB at IOPS limit |
| **Caching** | Cache computed/frequent results | Reduce DB load, reduce latency |
| **CDN** | Edge cache for static/public content | Global users, static assets |
| **Async processing** | Move work off the request path | Emails, reports, non-critical operations |

## Back-of-envelope estimation cheat sheet

| What | Rough number |
|---|---|
| QPS of a web server (simple JSON API) | 1,000-10,000 |
| QPS of a database (indexed queries) | 5,000-50,000 |
| Read latency: SSD random read | ~0.1ms |
| Read latency: HDD random read | ~10ms |
| Network round trip (same datacenter) | ~0.5ms |
| Network round trip (cross-region) | ~50-150ms |
| 1 GB of JSON records (~1KB each) | ~1,000,000 records |
| Daily writes for 1M users, 10 actions/day | ~115 writes/second average |
| 1 year of data at 115 writes/sec, 1KB each | ~3.6 TB |

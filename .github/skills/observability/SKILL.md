---
name: observability
description: Observability and monitoring knowledge using OpenTelemetry. Use this skill whenever the user asks for help instrumenting applications, setting up distributed tracing, configuring metrics collection, structured logging, creating dashboards, defining alerts, or troubleshooting production issues. Trigger on any mention of OpenTelemetry, OTel, tracing, spans, metrics, logs, observability, monitoring, Prometheus, Grafana, Jaeger, Application Insights, Datadog, structured logging, Serilog, correlation ID, distributed tracing, SLI, alerting, or dashboards. Also trigger when discussing production debugging, performance investigation, or "why is this slow/broken in production."
---

# Observability

A reference skill for instrumenting applications so you can answer "what's happening in production?" without guessing — following OpenTelemetry standards and the three pillars (traces, metrics, logs) unified by context.

This skill exists to keep two failure modes out of the output:

1. **Blind production** — No structured logging, no tracing, `Console.WriteLine` as the debugging strategy, metrics are "CPU and memory from the VM," alerts fire on symptoms not causes, incident response is "let me SSH into the box and check the logs."
2. **Observability theater** — 500 dashboards nobody looks at, every method traced (10,000 spans per request), log volume so high it costs more than the app itself, alerts on everything (alert fatigue → ignore all), custom metrics that measure nothing actionable.

The goal is to answer these questions in under 2 minutes during an incident: What's broken? Since when? Who's affected? What changed? Where's the bottleneck?

## Core principles — apply in order

1. **OpenTelemetry is the standard.** Vendor-neutral, wide language support, one SDK for traces + metrics + logs. Instrument once, export anywhere (Jaeger, Grafana, Datadog, Application Insights).

2. **Traces for request flow, metrics for aggregates, logs for details.** Don't use logs for what metrics should answer ("how many requests per second?"). Don't use metrics for what traces answer ("why was this specific request slow?").

3. **Correlation is king.** Every log line, every span, every metric point shares a `TraceId` and `SpanId`. Without correlation, you're grep-ing through millions of lines.

4. **Instrument boundaries, not internals.** Trace HTTP calls, database queries, message bus operations, cache hits/misses. Don't trace every private method — that's profiling, not observability.

5. **Structured logs, never string concatenation.** `logger.LogInformation("Order {OrderId} placed by {UserId}", orderId, userId)` — searchable, filterable, parseable. Not `$"Order {orderId} placed"`.

6. **Alerts on symptoms that affect users.** Alert on error rate > 1%, latency P99 > 2s, success rate dropping. Not on CPU > 70% (that might be fine).

7. **Dashboards answer questions.** Every dashboard panel should answer one specific question. "Is the system healthy?" (golden signals). "Where's the bottleneck?" (latency breakdown). "What's the capacity?" (saturation).

8. **Budget your telemetry.** Sampling for high-volume traces (1% of successful requests, 100% of errors). Aggregation for metrics (not per-request metrics). Log levels respected (Debug only in dev).

9. **Context propagation across services.** W3C Trace Context header (`traceparent`) propagated through HTTP, gRPC, and message queues. One trace per user request, spanning all services.

10. **Observability is code, not config.** Instrument in application code, export configuration via environment variables. The instrumentation is part of the application, not an afterthought.

## The three pillars + their purpose

| Pillar | Answers | Cardinality | Cost | Example |
|--------|---------|-------------|------|---------|
| Traces | Why was this request slow? What path did it take? | High (per-request) | High (sample!) | Request → API → DB → Cache → Response |
| Metrics | How many? How fast? How full? | Low (aggregated) | Low | request_count, latency_p99, queue_depth |
| Logs | What exactly happened at this moment? | High (per-event) | Medium | "Order 123 failed: insufficient stock for SKU-456" |

## References

See the `references/` folder for detailed guidance on:

- **dotnet-instrumentation.md** — OpenTelemetry setup for .NET 8, auto-instrumentation, custom spans, Serilog.
- **metrics-patterns.md** — RED/USE methods, custom metrics, histograms, exemplars, alerting rules.
- **tracing-patterns.md** — Distributed tracing, context propagation, sampling, span naming conventions.
- **dashboards-and-alerts.md** — Dashboard design, golden signals, alert fatigue prevention, runbook linking.

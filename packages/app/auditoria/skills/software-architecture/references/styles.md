# Architecture Styles

Source: Mark Richards & Neal Ford (Fundamentals of Software Architecture), Sam Newman (Building Microservices), Martin Fowler.

## Decision framework — which style fits

| Driver | Monolith | Modular Monolith | Microservices | Serverless | Event-Driven |
|---|---|---|---|---|---|
| Team size | 1-10 | 5-25 | 15+ (multiple teams) | 1-10 | 10+ |
| Deployment independence | Not needed | Partial | Critical | Per-function | Per-service |
| Data consistency | Strong (ACID) | Strong within modules | Eventual by default | Eventual | Eventual |
| Operational complexity | Low | Low-Medium | High | Medium | High |
| Time to first feature | Fast | Fast | Slow (infra overhead) | Fast | Medium |
| Scalability ceiling | Medium | Medium-High | Very High | Very High | Very High |
| Cost at low traffic | Low | Low | High (overhead per service) | Very Low (pay-per-use) | Medium |
| Cost at high traffic | Medium | Medium | Medium (scale independently) | Can be high (per-invocation) | Medium |

## Monolith

### When to use

- Single team (≤10 engineers).
- Early-stage product (pre-PMF).
- Strong consistency requirements across the domain.
- Simple deployment needs.
- You want to move fast and discover the domain boundaries.

### Structure

```
┌─────────────────────────────────────┐
│           Monolith                  │
│  ┌─────────┐ ┌──────────┐         │
│  │ Module A │ │ Module B │  ...    │
│  └─────────┘ └──────────┘         │
│  ┌──────────────────────────┐      │
│  │    Shared Database       │      │
│  └──────────────────────────┘      │
└─────────────────────────────────────┘
```

### Risks to manage

- **Big Ball of Mud.** Without discipline, modules blur and dependencies become circular. Enforce module boundaries with linting rules (ArchUnit, Roslyn analyzers, NDepend).
- **Scaling limitations.** You scale the entire application even if only one module is hot. Acceptable until traffic demands otherwise.
- **Deployment coupling.** A bug in Module B blocks deployment of Module A. Manage with feature flags and good test coverage.

## Modular Monolith

### When to use

- Team is growing (5-25) but not yet justifying microservices operational cost.
- You want domain boundaries enforced in code but single deployment simplicity.
- You anticipate extracting services LATER and want clean boundaries when you do.

### Structure

```
┌───────────────────────────────────────────┐
│             Modular Monolith              │
│  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │ Orders   │  │ Inventory│  │ Users  │ │
│  │ ─────── │  │ ─────── │  │ ────── │ │
│  │ API      │  │ API      │  │ API    │ │
│  │ Domain   │  │ Domain   │  │ Domain │ │
│  │ Data     │  │ Data     │  │ Data   │ │
│  └──────────┘  └──────────┘  └────────┘ │
│       │              │             │      │
│  ┌────┴──────────────┴─────────────┴──┐  │
│  │     Shared Database (schema-per-   │  │
│  │     module or separate schemas)    │  │
│  └────────────────────────────────────┘  │
└───────────────────────────────────────────┘
```

### Key rules

- Modules communicate through **public APIs** (interfaces), never by reaching into another module's internals.
- Each module owns its **data** — other modules access it through the API, not by querying the table directly.
- Use **schema-per-module** or at minimum table-naming conventions to enforce data ownership.
- If Module A needs data from Module B, it calls Module B's API. Cross-module JOINs are forbidden.
- Enforce boundaries with **architectural fitness functions**: static analysis that fails the build on cross-module violations.

### Evolution path to microservices

1. Identify the module with the most independent scaling/deployment need.
2. Extract it behind a network boundary (HTTP/gRPC).
3. Migrate its data to a separate database.
4. Repeat for the next candidate. Stop when the benefit of extraction no longer exceeds the cost.

## Microservices

### When to use

- Multiple teams (15+) needing independent deployment.
- Different parts of the system have different scaling profiles.
- Different parts need different technology stacks.
- Organizational maturity for distributed systems operations (monitoring, tracing, incident response).

### Key decisions

| Decision | Options | Criteria |
|---|---|---|
| Service granularity | Bounded context / aggregate | Too fine = distributed monolith; too coarse = modular monolith |
| Communication | Sync (HTTP/gRPC) vs. Async (events) | Sync for queries; async for commands and decoupling |
| Data ownership | Database per service (strict) vs. shared read replicas | Strict ownership enables independence; shared reads are a pragmatic concession |
| Service discovery | DNS / service mesh / API gateway | Complexity vs. operational needs |
| Consistency | Saga / eventual / compensating transactions | Business requirements drive this, not preference |

### Microservices prerequisites (do NOT skip)

Before adopting microservices, verify:

- [ ] CI/CD pipeline can deploy services independently.
- [ ] Distributed tracing is in place (OpenTelemetry, Jaeger, Zipkin).
- [ ] Centralized logging aggregation exists.
- [ ] Health checks and readiness probes are standard.
- [ ] Team has experience operating distributed systems.
- [ ] Service mesh or equivalent for mTLS, retries, circuit breaking.
- [ ] Contract testing (Pact) is adopted.
- [ ] On-call rotation can handle multi-service incidents.

If more than 3 items are unchecked, you're not ready for microservices.

## Serverless (FaaS + Managed Services)

### When to use

- Event-driven workloads with variable traffic (spiky or infrequent).
- Small team wanting to minimize operational overhead.
- Functions with clear input/output and short execution time.
- Cost optimization for low/sporadic traffic.

### When NOT to use

- Long-running processes (>15 min execution).
- Stateful workloads requiring persistent connections.
- High and constant traffic (cost can exceed containers/VMs).
- Cold start sensitivity (real-time latency requirements <100ms).

### Key considerations

- **Vendor lock-in.** Serverless functions are tightly coupled to cloud provider APIs. Mitigate with hexagonal architecture (business logic independent of trigger mechanism).
- **Cold starts.** Provisioned concurrency helps but adds cost. Measure before committing.
- **Observability.** Harder than containers. Invest in structured logging and distributed tracing from day 1.
- **Testing.** Local emulation is imperfect. Integration tests against real cloud services are essential.

## Event-Driven Architecture (EDA)

### When to use

- Multiple consumers need to react to the same event.
- Producers shouldn't know about consumers (decoupling).
- Eventual consistency is acceptable for the business case.
- Audit trail / event sourcing requirements.
- Real-time processing needs (stream processing).

### Patterns

| Pattern | Description | Use when |
|---|---|---|
| **Event Notification** | Producer emits event, consumers react. Event contains minimal data (ID + type). | Decoupling producers from consumers |
| **Event-Carried State Transfer** | Event contains the full state change. Consumers don't need to call back to the producer. | Reducing coupling AND reducing synchronous calls |
| **Event Sourcing** | State is derived from a sequence of events. No current-state table — only the event log. | Audit requirements, temporal queries, complex domain |
| **CQRS** | Separate models for reading and writing. Often combined with Event Sourcing. | Read patterns differ significantly from write patterns |

### Event-driven risks

- **Debugging complexity.** An event chain across 5 services is harder to trace than a synchronous call stack. Correlation IDs and distributed tracing are mandatory.
- **Ordering guarantees.** Events may arrive out of order. Design consumers to be idempotent and order-agnostic, or use partitioned queues with ordering guarantees.
- **Schema evolution.** Events are contracts. Breaking changes to event schemas break consumers. Use schema registry and versioning.
- **Eventual consistency confusion.** Users see stale data. Design the UX to communicate this (optimistic UI, "processing" states).

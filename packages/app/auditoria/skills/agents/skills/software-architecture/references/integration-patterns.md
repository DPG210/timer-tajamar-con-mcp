# Integration Patterns

Source: Gregor Hohpe & Bobby Woolf (Enterprise Integration Patterns), Sam Newman (Building Microservices), Chris Richardson (Microservices Patterns).

## Synchronous vs Asynchronous

| Aspect | Synchronous (Request/Reply) | Asynchronous (Event/Message) |
|---|---|---|
| **Coupling** | Temporal coupling — caller waits | No temporal coupling — fire and forget |
| **Latency** | Sum of all hops in the chain | Not on the critical path |
| **Error handling** | Immediate — caller gets error response | Deferred — dead letter queue, retry |
| **Consistency** | Easy to reason about (request-response) | Eventual consistency, harder to reason about |
| **Debugging** | Call stack visible in traces | Event chains require correlation IDs |
| **Best for** | Queries, real-time responses | Commands, notifications, cross-service side effects |

### Decision guide

- **User is waiting for the response** → Synchronous.
- **Action triggers side effects in other services** → Asynchronous.
- **Query across services** → Synchronous (API call or BFF aggregation).
- **Command that other services need to know about** → Asynchronous (publish event).

## Choreography vs Orchestration

### Choreography (event-driven)

Each service reacts to events independently. No central coordinator.

```
Order Service → publishes "OrderCreated"
  ↓ listens
Payment Service → processes payment → publishes "PaymentCompleted"
  ↓ listens
Inventory Service → reserves stock → publishes "StockReserved"
  ↓ listens
Shipping Service → creates shipment
```

**Pros:** Loose coupling, services are autonomous, easy to add new consumers.
**Cons:** Hard to see the full flow, debugging requires distributed tracing, error recovery is complex.

### Orchestration (saga coordinator)

A central orchestrator directs the flow.

```
Saga Orchestrator:
  1. Call Payment Service → process payment
  2. Call Inventory Service → reserve stock
  3. Call Shipping Service → create shipment
  If any step fails → compensate previous steps
```

**Pros:** Flow is visible in one place, error handling is explicit, easier to debug.
**Cons:** Orchestrator becomes a single point of knowledge, risk of becoming a god service.

### When to use which

| Scenario | Recommended |
|---|---|
| 2-3 services, simple flow | Choreography |
| 4+ services, complex business rules | Orchestration |
| Long-running process (days/weeks) | Orchestration (with state machine) |
| Fire-and-forget notifications | Choreography |
| Strict ordering requirements | Orchestration |
| Need to add consumers dynamically | Choreography |

## Saga pattern

For distributed transactions across services (when you can't use a single database transaction):

### Types

| Type | How compensations work | Best for |
|---|---|---|
| **Choreography saga** | Each service listens for failure events and compensates | Simple flows, few services |
| **Orchestration saga** | Orchestrator calls compensating actions on failure | Complex flows, many services |

### Saga design rules

1. **Every action has a compensating action.** `CreatePayment` → compensate: `RefundPayment`. `ReserveStock` → compensate: `ReleaseStock`.
2. **Compensations are idempotent.** Running the compensation twice produces the same result as running it once.
3. **No two-phase commit.** Sagas use eventual consistency, not distributed locks.
4. **Semantic locks.** Flag resources as "pending" during the saga to prevent concurrent modification.
5. **Timeout and escalation.** If a step doesn't complete within the deadline, escalate (retry, compensate, alert).

## API Gateway

### Responsibilities

| Function | Description |
|---|---|
| **Routing** | Route requests to the correct backend service |
| **Authentication** | Validate tokens, API keys at the edge |
| **Rate limiting** | Protect backends from traffic spikes |
| **Load balancing** | Distribute traffic across service instances |
| **SSL termination** | Handle TLS at the edge |
| **Request transformation** | Modify headers, rewrite paths |
| **Response caching** | Cache GET responses at the edge |
| **Circuit breaking** | Fail fast when backend is unhealthy |

### Gateway anti-patterns

- **Business logic in the gateway.** The gateway is infrastructure, not application. If you're writing if/else based on request body content, it belongs in a service.
- **Gateway as BFF.** The gateway should not aggregate multiple backend calls. That's a Backend-for-Frontend (BFF) pattern — a separate service.
- **Single gateway for everything.** Different clients (web, mobile, internal) have different needs. Consider separate gateways or BFFs.

## Messaging systems comparison

| System | Type | Ordering | Retention | Best for |
|---|---|---|---|---|
| **RabbitMQ** | Message broker (queue) | Per-queue FIFO | Until consumed | Task queues, work distribution |
| **Apache Kafka** | Event log (append-only) | Per-partition | Configurable (days/forever) | Event streaming, audit log, replay |
| **Azure Service Bus** | Message broker (queue + topic) | Per-session FIFO | Configurable | Enterprise integration, .NET ecosystem |
| **Amazon SQS** | Queue | Best-effort (FIFO optional) | 14 days max | Simple queue, serverless triggers |
| **Amazon SNS** | Pub/sub fan-out | No ordering | No retention (immediate delivery) | Fan-out to multiple consumers |
| **Google Pub/Sub** | Pub/sub + queue hybrid | Per-key ordering | 31 days | GCP ecosystem, flexible delivery |

### Choosing a messaging system

- **Task distribution (one consumer per message)** → RabbitMQ or SQS.
- **Event streaming (multiple consumers, replay needed)** → Kafka.
- **Fan-out notifications** → SNS + SQS, or Kafka with consumer groups.
- **.NET enterprise** → Azure Service Bus.
- **Simple cloud-native** → SQS (AWS) or Cloud Pub/Sub (GCP).

## Resilience patterns for integration

| Pattern | What it does | When to use |
|---|---|---|
| **Retry with backoff** | Retries failed calls with increasing delay | Transient errors (network blips, 503) |
| **Circuit breaker** | Stops calling a failing service, fails fast | Service is down for extended period |
| **Bulkhead** | Isolates resources per integration (thread pools, connections) | Prevent one slow integration from starving others |
| **Timeout** | Caps wait time for external calls | Always — no call should wait indefinitely |
| **Fallback** | Returns cached/default value when call fails | Read paths where stale data is acceptable |
| **Dead letter queue** | Routes failed messages to a separate queue for inspection | Async messaging — messages that can't be processed |
| **Idempotency** | Same request processed multiple times produces same result | All write operations that may be retried |

### Timeout strategy

```
Rule: external call timeout < client-facing request timeout

Client → API Gateway (30s timeout)
  → Service A (10s timeout)
    → Service B (3s timeout)
      → Database (1s timeout)
```

Each hop has a shorter timeout than its caller. This prevents cascading timeouts where the client waits 30s for a chain of services that are all waiting for each other.

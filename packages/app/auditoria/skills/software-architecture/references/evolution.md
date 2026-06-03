# Evolution and Migration

Source: Sam Newman (Monolith to Microservices), Martin Fowler (Strangler Fig), Michael Feathers (Working Effectively with Legacy Code).

## Principles of architectural evolution

1. **Evolve, don't rewrite.** Big-bang rewrites fail more often than they succeed. Evolutionary architecture changes the system incrementally while it continues to serve users.
2. **Trigger-based evolution.** Don't evolve because it's "time." Evolve because a measurable trigger was hit: latency SLO breached, deployment frequency limited by coupling, team size exceeds Conway threshold.
3. **Prove the new before killing the old.** The new component must demonstrate it works at production scale before the old one is decommissioned. Running both in parallel (with traffic shifting) is the safe path.

## Evolution triggers

| Trigger | What it signals | Likely evolution |
|---|---|---|
| Deployment frequency limited by coupling | Two teams stepping on each other | Extract a bounded context to a separate service |
| Single component is scaling bottleneck | One module handles 80% of traffic | Extract and scale independently |
| Team exceeded cognitive load for the monolith | New engineers take months to be productive | Modular monolith or extraction |
| Different SLA requirements for different parts | One module needs 99.99%, rest needs 99.9% | Separate service with independent SLA |
| Technology mismatch | Part of system needs ML/Python, rest is .NET | Polyglot via service extraction |
| Compliance boundary | Part of system handles PCI data | Isolate into compliant enclave |

## Strangler Fig pattern

Replace a legacy system incrementally by routing specific functionality to the new system while the old system continues to handle everything else.

```
Phase 1: All traffic → Legacy System

Phase 2: 
  /orders/* → New Orders Service
  Everything else → Legacy System

Phase 3:
  /orders/* → New Orders Service
  /customers/* → New Customer Service
  Everything else → Legacy System

Phase N:
  All traffic → New System
  Legacy System → decommissioned
```

### Implementation

1. **Put a proxy/router in front of both systems.** API gateway or reverse proxy.
2. **Identify the first slice to migrate.** Choose the slice with: clearest boundaries, fewest dependencies, most business value from migration, smallest scope.
3. **Build the new implementation** behind the proxy.
4. **Route traffic incrementally** (feature flag, % rollout, canary).
5. **Verify with production data.** Compare responses from old and new (shadow traffic or A/B).
6. **Cut over.** Route 100% to new. Keep old running for rollback.
7. **Decommission old** after confidence period (2-4 weeks of clean operation).
8. **Repeat** for the next slice.

### Strangler Fig pitfalls

- **Data migration lag.** The new service needs data that's in the old database. Plan data migration or dual-write carefully.
- **Shared state.** If old and new need to read/write the same state, you need a synchronization strategy.
- **Scope creep.** "While we're at it, let's add features." No. Migrate first, enhance later.

## Monolith decomposition

### Step 1: Identify bounded contexts

Map the monolith's modules to domain concepts. Look for:
- Modules with different rates of change.
- Modules owned by different teams.
- Modules with different scaling needs.
- Modules with distinct data ownership.

### Step 2: Enforce boundaries in the monolith first

Before extracting a service, enforce module boundaries within the monolith:
- No cross-module database queries (use APIs).
- No shared mutable state between modules.
- Explicit interfaces between modules.
- Separate schemas per module.

This is the "modular monolith" step. Many teams find this is sufficient and don't need to extract to microservices.

### Step 3: Extract (if boundary enforcement isn't enough)

1. Copy the module to a new service.
2. Set up the network boundary (HTTP/gRPC).
3. Migrate data to a separate database.
4. Route traffic to the new service.
5. Remove the module from the monolith.

### Extraction order heuristic

Extract in this order (highest value, lowest risk first):

1. **Leaf services** — modules with no inbound dependencies from other modules. Easiest to extract.
2. **High-churn modules** — modules that change most frequently. Extraction gives the most deployment independence.
3. **Scaling bottlenecks** — modules that need different scaling characteristics.
4. **Core domain** — extract LAST, not first. It has the most dependencies and the highest risk.

## Database migration strategies

| Strategy | How | Risk | Best for |
|---|---|---|---|
| **Dual-write** | Write to both old and new DB; read from new | Data inconsistency between DBs | Short migration window |
| **Change Data Capture (CDC)** | Capture changes from old DB, replay to new | CDC lag | Large datasets, different DB technologies |
| **Export/Import** | Dump old DB, transform, load to new | Downtime during migration | Small datasets, acceptable downtime window |
| **Expand-Contract** | Add new columns/tables, migrate data, remove old | Requires backward compatibility | Schema evolution within the same DB |

### Expand-Contract pattern (for schema migrations)

```
Phase 1 (Expand):
  - Add new column/table alongside old
  - Application writes to BOTH old and new
  - Backfill historical data to new column

Phase 2 (Migrate):
  - Application reads from new column
  - Application still writes to both
  - Verify data integrity

Phase 3 (Contract):
  - Application writes ONLY to new column
  - Remove old column
  - Clean up
```

This enables zero-downtime schema migrations and is the ONLY safe way to do database changes in systems with continuous deployment.

## Feature flags for evolution

Use feature flags to control the migration:

```
if (featureFlag.isEnabled("new-orders-service")) {
    // Route to new service
} else {
    // Route to legacy
}
```

Feature flags enable:
- **Gradual rollout** (1% → 5% → 25% → 100%).
- **Instant rollback** (flip the flag, traffic goes back to legacy).
- **A/B comparison** (route subset to new, compare metrics).
- **Dark launching** (new service processes requests but responses are discarded).

## Migration checklist

- [ ] Migration trigger documented (why are we doing this?).
- [ ] Bounded contexts identified and validated with domain experts.
- [ ] Boundaries enforced in monolith BEFORE extraction.
- [ ] Proxy/gateway in place for traffic routing.
- [ ] Data migration strategy chosen and tested.
- [ ] Feature flags configured for gradual rollout.
- [ ] Monitoring/alerting covers both old and new paths.
- [ ] Rollback procedure documented and tested.
- [ ] Performance benchmarks established (old system = baseline).
- [ ] Confidence period defined (how long both systems run in parallel).
- [ ] Decommission plan for legacy (who, when, cleanup steps).

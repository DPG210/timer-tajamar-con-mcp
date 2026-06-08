# Data Architecture

Source: Martin Kleppmann (Designing Data-Intensive Applications), CAP theorem (Eric Brewer), Pat Helland.

## Database selection

| Type | Best for | Examples | Not for |
|---|---|---|---|
| **Relational (RDBMS)** | Transactional data, complex queries, referential integrity | PostgreSQL, SQL Server, MySQL | Unstructured data, horizontal write scaling |
| **Document** | Semi-structured data, schema flexibility, nested objects | MongoDB, CosmosDB, DynamoDB | Complex joins, strict referential integrity |
| **Key-Value** | Caching, session storage, simple lookups | Redis, Memcached, DynamoDB | Complex queries, relationships |
| **Column-family** | Write-heavy workloads, time-series at scale | Cassandra, ScyllaDB, HBase | Ad-hoc queries, strong consistency |
| **Graph** | Relationship-heavy queries (social, recommendations, fraud) | Neo4j, Neptune, CosmosDB (Gremlin) | Simple CRUD, large scans |
| **Time-series** | Metrics, IoT, logs, financial ticks | TimescaleDB, InfluxDB, QuestDB | General-purpose transactional data |
| **Search** | Full-text search, faceted search, log analysis | Elasticsearch, OpenSearch, Meilisearch | Primary data storage, transactions |
| **Columnar (OLAP)** | Analytics, BI, aggregations over large datasets | BigQuery, Snowflake, ClickHouse, Redshift | OLTP transactions, low-latency writes |

### Decision process

1. **What is the data model?** Relational (tables, foreign keys) → RDBMS. Document-shaped (nested JSON) → Document DB. Graph-shaped (nodes + edges) → Graph DB.
2. **What are the access patterns?** Mostly reads → optimize for read. Write-heavy → consider column-family or time-series. Complex queries → RDBMS or search.
3. **What consistency is required?** ACID → RDBMS. Eventual consistency acceptable → distributed NoSQL.
4. **What scale is expected?** Single-node can handle it → RDBMS (almost always). Needs horizontal scaling → distributed NoSQL.
5. **What is the team's expertise?** Familiar with SQL → start with RDBMS. Exotic databases require operational expertise.

## Consistency models

### CAP Theorem (simplified)

In a distributed system under network partition, you can choose:
- **CP:** Consistency + Partition tolerance. System rejects writes during partition to maintain consistency. (PostgreSQL replicas, ZooKeeper)
- **AP:** Availability + Partition tolerance. System accepts writes during partition, reconciles later. (Cassandra, DynamoDB)

In practice, most systems are not purely CP or AP — they make trade-offs per operation.

### ACID vs BASE

| ACID | BASE |
|---|---|
| **A**tomicity — all or nothing | **B**asically **A**vailable — system is available |
| **C**onsistency — data is valid after transaction | **S**oft state — state may change without input (eventual sync) |
| **I**solation — concurrent transactions don't interfere | **E**ventual consistency — will be consistent eventually |
| **D**urability — committed data survives crashes | |

Use ACID when: financial transactions, inventory management, user account operations.
Use BASE when: analytics, recommendations, activity feeds, search indexes.

### Consistency decision matrix

| Scenario | Consistency needed | Model |
|---|---|---|
| Bank transfer | Strong | ACID (same DB transaction) |
| Order + Payment | Strong across services | Saga with compensating transactions |
| Inventory count | Strong for writes, eventual for reads | Write to RDBMS, async replicate to read cache |
| Product search | Eventual | Index async from source DB to search engine |
| Activity feed | Eventual | Event-driven, fan-out on write or read |
| Analytics dashboard | Eventual | ETL/ELT pipeline on schedule |

## CQRS (Command Query Responsibility Segregation)

Separate the read model from the write model:

```
Commands (writes) → Write Model (normalized, ACID)
                         ↓ (events / projections)
Queries (reads) → Read Model (denormalized, optimized for queries)
```

### When to use CQRS

- Read patterns differ significantly from write patterns (different data shapes, different scale).
- You need multiple read projections (list view, detail view, search, analytics).
- Write throughput and read throughput need independent scaling.

### When NOT to use CQRS

- Simple CRUD where reads and writes have the same shape.
- Small dataset that fits in a single table with adequate indexes.
- Team doesn't have experience with eventual consistency.

## Event Sourcing

Instead of storing current state, store the sequence of events that produced the current state:

```
Event Log:
  1. OrderCreated { id: "abc", items: [...], total: 150 }
  2. OrderPaymentReceived { id: "abc", amount: 150 }
  3. OrderShipped { id: "abc", trackingNumber: "XYZ" }

Current State (derived):
  Order { id: "abc", status: "shipped", total: 150, trackingNumber: "XYZ" }
```

### When to use Event Sourcing

- Audit requirements (financial, healthcare, compliance).
- Need to answer "what was the state at time T?" (temporal queries).
- Complex domain with behaviors that are hard to model as CRUD.
- Event-driven architecture already in place.

### When NOT to use Event Sourcing

- Simple CRUD with no audit requirements.
- Team unfamiliar with the pattern (steep learning curve).
- No need for temporal queries or event replay.

### Event Sourcing risks

- **Event schema evolution.** Old events must remain readable forever. Use upcasting or versioned event schemas.
- **Projection lag.** Read models are eventually consistent with the event store. UX must handle this.
- **Event store growth.** Snapshotting reduces read-time rebuild cost, but snapshots must be maintained.
- **Debugging.** State bugs require replaying events — harder than inspecting a row in a table.

## Data partitioning strategies

| Strategy | How it works | When to use |
|---|---|---|
| **Range partitioning** | Partition by value range (dates, IDs) | Time-series data, sequential access |
| **Hash partitioning** | Partition by hash of key | Uniform distribution, random access |
| **Geographic partitioning** | Partition by region/country | Data residency compliance, latency optimization |
| **Functional partitioning** | Different data types in different stores | Polyglot persistence |

### Partitioning pitfalls

- **Hot partitions.** If one key receives disproportionate writes (celebrity problem, popular product), that partition becomes a bottleneck. Use composite keys or sub-partitioning.
- **Cross-partition queries.** Queries that span partitions are expensive. Design partitions around the most common access pattern.
- **Rebalancing cost.** Adding/removing partitions requires data movement. Plan for it.

## Caching architecture

| Layer | What | Technology | TTL guidance |
|---|---|---|---|
| **CDN** | Static assets, public API responses | CloudFront, Akamai, Fastly | Hours to days |
| **Application cache** | Computed results, session data | Redis, Memcached | Minutes to hours |
| **Database cache** | Query results | Built-in query cache, materialized views | Seconds to minutes |
| **Client cache** | API responses, assets | HTTP Cache-Control headers | Varies |

### Cache invalidation strategies

| Strategy | How | Pros | Cons |
|---|---|---|---|
| **TTL-based** | Cache expires after fixed time | Simple | Stale data during TTL window |
| **Write-through** | Write to cache AND database on every write | Always fresh | Higher write latency |
| **Write-behind** | Write to cache first, async write to DB | Low write latency | Risk of data loss |
| **Cache-aside** | App reads cache; on miss, reads DB and populates cache | Simple, flexible | Cache stampede risk |
| **Event-driven invalidation** | DB change event triggers cache invalidation | Near real-time freshness | Complexity, eventual consistency |

Cache stampede protection: mutex/lock on cache miss, or probabilistic early expiration.

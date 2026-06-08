# Pipeline Architecture

## Batch vs Stream vs Hybrid

| Factor | Batch | Stream | Hybrid |
|---|---|---|---|
| Latency | Minutes to hours | Seconds to sub-second | Varies by layer |
| Complexity | Low | High (state, ordering, exactly-once) | Medium-High |
| Cost | Predictable (scheduled compute) | Variable (always-on infra) | Mixed |
| Reprocessing | Easy (re-run the batch) | Hard (replay from offset, manage state) | Batch backfill + stream forward |
| Best for | Analytics, reporting, ML training | Fraud detection, real-time dashboards, alerting | Most production systems |

### Decision rule

Use **batch** unless the business requires action within minutes. "Real-time dashboard" usually means "refreshed every 15 minutes" — that's batch with short intervals, not streaming.

Use **streaming** when: fraud detection (must block in <1s), live operational dashboards (logistics, trading), event-driven architectures where downstream systems react to events immediately.

Use **hybrid (Lambda/Kappa)** when: you need both real-time operational views AND historical batch analytics on the same data.

## ELT architecture (modern standard)

```
Sources → Extract+Load (raw) → Transform (warehouse) → Serve (marts)
           Fivetran/Airbyte       dbt                     BI/API
```

### Three-layer model

| Layer | Purpose | Naming | Example |
|---|---|---|---|
| **Staging (raw)** | 1:1 copy of source data, no transformations | `stg_<source>__<entity>` | `stg_stripe__payments` |
| **Intermediate** | Business logic, joins, deduplication | `int_<entity>_<verb>` | `int_payments_deduplicated` |
| **Marts** | Business-facing models, dimensional | `fct_<entity>`, `dim_<entity>` | `fct_orders`, `dim_customers` |

Rules:
1. **Never transform during extraction.** Land raw data as-is. You can always re-transform; you can't recover raw data you never stored.
2. **Staging models are views** — no materialization cost, always reflect latest raw data.
3. **Marts are the API** — downstream consumers (BI, APIs, ML) only read from marts.
4. **Intermediate models are implementation details** — not exposed to consumers.

## Streaming architecture patterns

### Event sourcing pipeline

```
Producers → Kafka Topics → Stream Processors → Sinks
  (apps)      (events)       (Flink/Spark)      (DB/warehouse/cache)
```

### Key concepts

**Exactly-once semantics:** Consumer processes each event exactly once. Kafka supports this with idempotent producers + transactional consumers. Without it, you get duplicates or data loss.

**Watermarks:** A mechanism to track event-time progress. Tells the system "all events up to time T have arrived." Needed for windowed aggregations (e.g., "count events per hour"). Late arrivals after the watermark are either dropped or sent to a side output.

**State management:** Stream processors maintain state (running totals, session windows, joins). State must be checkpointed and recoverable. Flink manages state internally; Kafka Streams uses changelog topics.

### Consumer group patterns

```
Topic: orders (6 partitions)

Consumer Group A (analytics):
  Consumer 1 → partitions 0, 1
  Consumer 2 → partitions 2, 3
  Consumer 3 → partitions 4, 5

Consumer Group B (notifications):
  Consumer 1 → all 6 partitions
```

Each consumer group gets all messages independently. Within a group, partitions are distributed across consumers. More consumers than partitions = idle consumers.

## Partitioning strategies

### Warehouse table partitioning

| Strategy | When | Example |
|---|---|---|
| **Date-based** | Time-series data, most analytics queries filter by date | `PARTITION BY DATE(created_at)` |
| **Hash** | Even distribution across nodes, no natural partition key | `PARTITION BY HASH(user_id)` |
| **Range** | Ordered data with range queries | `PARTITION BY RANGE(amount)` |
| **List** | Categorical data with known values | `PARTITION BY LIST(country)` |

### Partition sizing rules

- Target **100MB–1GB per partition** in columnar formats (Parquet).
- Too many small partitions → metadata overhead, slow listing.
- Too few large partitions → no pruning benefit.
- Partition by the column most commonly used in `WHERE` clauses.

## Incremental processing

### High-water mark pattern

```sql
-- Track the last processed timestamp
SELECT MAX(updated_at) AS hwm FROM target_table;

-- Process only new/changed records
SELECT * FROM source_table
WHERE updated_at > :hwm;

-- Merge into target (upsert)
MERGE INTO target USING staged_new_records
ON target.id = staged_new_records.id
WHEN MATCHED THEN UPDATE SET ...
WHEN NOT MATCHED THEN INSERT ...;
```

### Change Data Capture (CDC)

Captures row-level changes (INSERT, UPDATE, DELETE) from the source database's transaction log — no need to poll.

| Tool | Source | How |
|---|---|---|
| Debezium | PostgreSQL, MySQL, SQL Server, MongoDB | Reads WAL/binlog, publishes to Kafka |
| Fivetran | Most databases | Managed CDC, loads into warehouse |
| AWS DMS | Any to AWS targets | Managed migration + ongoing replication |

CDC advantages: captures deletes (polling misses them), lower latency than polling, lower load on source database.

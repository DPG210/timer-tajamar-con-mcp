# Anti-patterns and Code Smells

Patterns to flag during review. Symptom, why it's a problem, and the fix — specific to data engineering.

## Pipeline anti-patterns

### Full table refresh when incremental is possible

**Symptom:** `DROP TABLE; CREATE TABLE AS SELECT * FROM source;` runs daily for a 100M row table.

**Why:** Wastes compute, increases cost linearly with data growth, creates a window where the table is empty (downstream queries fail or return zero results).

**Fix:** Incremental models with MERGE/upsert. For dbt: `materialized='incremental'` with `unique_key`. For partitioned tables: `insert_overwrite` on the partition.

### Non-idempotent pipelines

**Symptom:** `INSERT INTO target SELECT * FROM staging;` — running twice doubles the data.

**Why:** If a pipeline fails halfway and is retried, data is duplicated. Backfills produce wrong results. Debugging requires understanding how many times the pipeline ran.

**Fix:** MERGE/upsert on a unique key, or DELETE+INSERT on the partition before inserting. Every pipeline should be safe to re-run.

### Using `datetime.now()` instead of logical date

**Symptom:** `WHERE created_at >= NOW() - INTERVAL '1 day'` in an Airflow task.

**Why:** If the DAG runs late (2am instead of midnight), you miss data. If you backfill, every historical run processes "today's" data instead of the correct historical date. Results depend on when the pipeline runs, not what data period it processes.

**Fix:** Use Airflow's `ds` (execution date) or pass the logical date as a parameter. The pipeline should be deterministic given its input date.

### Fire-and-forget extractions (no verification)

**Symptom:** Extract data, load it, move on. No row count check, no schema validation.

**Why:** Silent data loss. The API returned 0 rows because of an auth failure, but the pipeline "succeeded." Nobody notices until a dashboard shows flat lines days later.

**Fix:** After extraction, validate: row count > 0, row count within expected range, schema matches contract, key columns not null.

### Data in XCom / task arguments

**Symptom:** Passing DataFrames, large JSON, or query results through Airflow XCom or function arguments.

**Why:** XCom is stored in Airflow's metadata database (usually PostgreSQL). Large payloads slow the scheduler, bloat the database, and hit size limits.

**Fix:** Write data to cloud storage (S3, GCS) or a staging table. Pass the file path or table name through XCom.

## Modeling anti-patterns

### One Big Table (OBT) as the only model

**Symptom:** A single 200-column table that joins everything — orders, customers, products, payments, shipping — used by all consumers.

**Why:** Expensive to compute, impossible to maintain, slow to query, mixes different grains (order-level with customer-level metrics in the same row), and any change affects all consumers.

**Fix:** Dimensional model with separate fact and dimension tables. Create specific marts per use case.

### Missing grain definition

**Symptom:** A fact table where nobody can explain what one row represents. Some rows are order-level, some are item-level, some are duplicated because of a bad join.

**Why:** Every query on this table gives different results depending on how you aggregate. Analysts will report wrong numbers and not know why.

**Fix:** Define the grain explicitly: "one row per order item." Validate with a uniqueness test on the grain columns.

### Snowflaking dimensions excessively

**Symptom:** `dim_customers` → `dim_cities` → `dim_states` → `dim_countries` — normalized dimension chain.

**Why:** Every analytical query requires 4 joins instead of 1. The whole point of dimensional modeling is denormalization for query simplicity.

**Fix:** Denormalize into `dim_customers` with `city`, `state`, `country` as flat columns. Exception: very large shared dimensions (geographic reference data used by 10+ fact tables).

## SQL anti-patterns

### SELECT * in production models

**Symptom:** `SELECT * FROM {{ ref('stg_orders') }}` in a dbt model.

**Why:** Schema changes upstream silently add columns. A new column with PII passes through to the mart unnoticed. Column ordering changes break INSERT statements.

**Fix:** Explicitly list every column. New columns require a conscious decision to include.

### Not filtering before joining

**Symptom:** Join two large tables, then filter the result.

```sql
-- BAD
SELECT * FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
WHERE o.order_date = '2025-01-01';

-- GOOD (filter before join — CTE or subquery)
WITH today_orders AS (
    SELECT * FROM orders WHERE order_date = '2025-01-01'
)
SELECT * FROM today_orders o
JOIN customers c ON o.customer_id = c.customer_id;
```

Modern query optimizers often handle this, but being explicit helps readability and ensures optimal plans.

### Using DISTINCT to mask duplicates

**Symptom:** `SELECT DISTINCT` on a query that shouldn't produce duplicates. Added to "fix" the results without understanding why there are duplicates.

**Why:** Hides a bad join (fanout), a missing deduplication step, or a grain mismatch. The duplicates will appear somewhere else.

**Fix:** Find and fix the root cause: wrong join condition, missing deduplication, or incorrect grain.

## Infrastructure anti-patterns

### Spark for small data

**Symptom:** Spinning up a Spark cluster to process 1GB of data.

**Why:** Spark's overhead (cluster startup, job scheduling, shuffle) makes it slower than a single-node solution for small datasets. A laptop can process 1GB in seconds with pandas or DuckDB.

**Fix:** Use Spark for >10GB, especially >100GB. For smaller datasets: DuckDB, pandas, or just SQL in the warehouse.

### No staging environment

**Symptom:** dbt models and Airflow DAGs are tested in production. "I'll just run it on a copy of the data."

**Why:** Broken pipeline → broken dashboards → broken trust. Schema changes to production tables affect downstream consumers immediately.

**Fix:** Separate staging schema/dataset (`analytics_dev`, `analytics_staging`, `analytics_prod`). CI runs dbt in staging against a subset of production data.

### Secrets in DAG code or config files

**Symptom:** `connection_string = "postgresql://user:password@host:5432/db"` in the Airflow DAG.

**Fix:** Airflow Connections, environment variables, or a secrets manager (Vault, AWS Secrets Manager). Never commit credentials.

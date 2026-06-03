# Data Quality and Testing

## Data quality dimensions

| Dimension | Question | How to check |
|---|---|---|
| **Completeness** | Are all expected records present? | Row count vs source, NOT NULL checks, date gap analysis |
| **Uniqueness** | Are there duplicates? | UNIQUE tests on primary keys, COUNT vs COUNT DISTINCT |
| **Validity** | Are values within expected ranges? | Range checks, enum validation, regex for formats |
| **Accuracy** | Do values match reality? | Cross-reference with source, spot checks, reconciliation |
| **Freshness** | Is the data up to date? | Timestamp of latest record vs current time |
| **Consistency** | Do related tables agree? | Referential integrity, cross-table sum validation |

## Testing layers

### Layer 1: Source validation (on ingestion)

```sql
-- Schema drift detection: compare expected vs actual columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'raw_orders'
EXCEPT
SELECT column_name, data_type
FROM expected_schema.orders;

-- Row count within expected range
WITH counts AS (
    SELECT COUNT(*) AS cnt,
           COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '1 day') AS today_cnt
    FROM raw_orders
)
SELECT * FROM counts
WHERE today_cnt = 0  -- Alert: no records for today
   OR today_cnt > 2 * (SELECT AVG(daily_count) FROM historical_counts);  -- Anomaly
```

### Layer 2: Transformation validation (after dbt)

dbt tests cover this layer:

```yaml
models:
  - name: fct_revenue
    tests:
      - dbt_utils.recency:
          datepart: hour
          field: updated_at
          interval: 24
    columns:
      - name: order_id
        tests:
          - unique
          - not_null
      - name: revenue
        tests:
          - not_null
          - dbt_utils.accepted_range:
              min_value: 0
              max_value: 500000
      - name: customer_key
        tests:
          - relationships:
              to: ref('dim_customers')
              field: customer_key
```

### Layer 3: Consumption validation (before serving)

```sql
-- Reconciliation: mart totals match source totals
WITH mart_total AS (
    SELECT SUM(revenue) AS total FROM fct_revenue WHERE order_date = CURRENT_DATE - 1
),
source_total AS (
    SELECT SUM(amount) AS total FROM stg_stripe__payments
    WHERE created_at::DATE = CURRENT_DATE - 1 AND status = 'succeeded'
)
SELECT
    ABS(m.total - s.total) AS difference,
    ABS(m.total - s.total) / NULLIF(s.total, 0) * 100 AS pct_difference
FROM mart_total m, source_total s
WHERE ABS(m.total - s.total) / NULLIF(s.total, 0) > 0.01;  -- >1% = alert
```

## Great Expectations integration

For pipelines outside dbt, Great Expectations provides a framework for data validation:

```python
import great_expectations as gx

context = gx.get_context()

# Define expectations
suite = context.add_expectation_suite("orders_suite")
suite.add_expectation(
    gx.expectations.ExpectColumnValuesToNotBeNull(column="order_id")
)
suite.add_expectation(
    gx.expectations.ExpectColumnValuesToBeUnique(column="order_id")
)
suite.add_expectation(
    gx.expectations.ExpectColumnValuesToBeBetween(
        column="revenue", min_value=0, max_value=500000
    )
)
suite.add_expectation(
    gx.expectations.ExpectTableRowCountToBeBetween(min_value=100, max_value=100000)
)

# Validate
result = context.run_checkpoint(checkpoint_name="orders_checkpoint")
if not result.success:
    raise ValueError(f"Data quality check failed: {result.to_json_dict()}")
```

## Freshness monitoring

```sql
-- Data freshness dashboard query
SELECT
    table_name,
    MAX(updated_at) AS latest_record,
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - MAX(updated_at))) / 3600 AS hours_since_update,
    CASE
        WHEN MAX(updated_at) > CURRENT_TIMESTAMP - INTERVAL '1 hour' THEN 'FRESH'
        WHEN MAX(updated_at) > CURRENT_TIMESTAMP - INTERVAL '6 hours' THEN 'STALE'
        ELSE 'CRITICAL'
    END AS freshness_status
FROM (
    SELECT 'fct_revenue' AS table_name, MAX(updated_at) AS updated_at FROM fct_revenue
    UNION ALL
    SELECT 'fct_orders', MAX(updated_at) FROM fct_orders
    UNION ALL
    SELECT 'dim_customers', MAX(updated_at) FROM dim_customers
) t
GROUP BY table_name;
```

## Anomaly detection patterns

### Volume anomaly (Z-score)

```sql
WITH daily_counts AS (
    SELECT order_date, COUNT(*) AS row_count
    FROM fct_orders
    WHERE order_date >= CURRENT_DATE - 30
    GROUP BY order_date
),
stats AS (
    SELECT AVG(row_count) AS mean, STDDEV(row_count) AS stddev
    FROM daily_counts
    WHERE order_date < CURRENT_DATE  -- exclude today
)
SELECT
    dc.order_date,
    dc.row_count,
    (dc.row_count - s.mean) / NULLIF(s.stddev, 0) AS z_score
FROM daily_counts dc, stats s
WHERE ABS((dc.row_count - s.mean) / NULLIF(s.stddev, 0)) > 3;  -- > 3 sigma = anomaly
```

### Distribution shift

Check if a categorical column's distribution has changed significantly:

```sql
WITH current_dist AS (
    SELECT status, COUNT(*)::FLOAT / SUM(COUNT(*)) OVER () AS pct
    FROM fct_orders WHERE order_date = CURRENT_DATE - 1
    GROUP BY status
),
historical_dist AS (
    SELECT status, COUNT(*)::FLOAT / SUM(COUNT(*)) OVER () AS pct
    FROM fct_orders WHERE order_date BETWEEN CURRENT_DATE - 31 AND CURRENT_DATE - 2
    GROUP BY status
)
SELECT
    COALESCE(c.status, h.status) AS status,
    h.pct AS historical_pct,
    c.pct AS current_pct,
    ABS(COALESCE(c.pct, 0) - COALESCE(h.pct, 0)) AS drift
FROM current_dist c
FULL OUTER JOIN historical_dist h ON c.status = h.status
WHERE ABS(COALESCE(c.pct, 0) - COALESCE(h.pct, 0)) > 0.1;  -- >10% shift = flag
```

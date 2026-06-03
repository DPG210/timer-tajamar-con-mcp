# Dimensional Modeling

Source: Kimball Group — The Data Warehouse Toolkit.

## Core concepts

### Grain

The grain defines what a single row represents. **Every fact table must have a clearly stated grain.** This is the single most important decision in dimensional modeling.

Examples:
- `fct_orders`: One row per order.
- `fct_order_items`: One row per item within an order.
- `fct_daily_sales`: One row per product per store per day.
- `fct_page_views`: One row per page view event.

If you can't state the grain in one sentence, the model is wrong.

### Fact tables

Contain the **measurements** of business processes — things you count, sum, or average.

| Fact type | Description | Example |
|---|---|---|
| **Transaction** | One row per event at the most granular level | `fct_orders` (one row per order) |
| **Periodic snapshot** | One row per entity per period, showing cumulative state | `fct_monthly_account_balance` |
| **Accumulating snapshot** | One row per entity lifecycle, updated as milestones are reached | `fct_order_fulfillment` (columns: ordered_at, shipped_at, delivered_at) |

#### Fact table rules

1. Facts are **numeric and additive** (revenue, quantity, cost). Semi-additive (balance — can sum across customers but not across time). Non-additive (ratio, percentage — never sum, always recalculate).
2. **Foreign keys to dimensions**, not the dimensional attributes themselves.
3. **No text in fact tables** except degenerate dimensions (order number, invoice number).
4. **Null facts are fine** — null foreign keys are NOT fine (use "Unknown" dimension rows).

### Dimension tables

Contain the **context** for facts — the who, what, where, when, why, how.

```sql
CREATE TABLE dim_customers (
    customer_key        INT PRIMARY KEY,     -- surrogate key
    customer_id         VARCHAR(50),         -- natural/business key
    name                VARCHAR(200),
    email               VARCHAR(200),
    segment             VARCHAR(50),
    acquisition_channel VARCHAR(100),
    first_order_date    DATE,
    is_current          BOOLEAN,
    valid_from          TIMESTAMP,
    valid_to            TIMESTAMP
);
```

#### Dimension table rules

1. **Surrogate keys** (integer, auto-increment) — never use natural keys as the primary key. Natural keys change, get recycled, or differ across source systems.
2. **Denormalized** — keep all attributes flat in one table. Don't normalize dimensions into snowflake schema unless there's a compelling reason (very large shared dimension).
3. **Include "Unknown" and "Not Applicable" rows** — for facts that can't join to a dimension, FK points to the unknown row (never NULL FK).
4. **Human-readable attributes** — store "Active" not 1, "California" not "CA" (or store both).

## Slowly Changing Dimensions (SCD)

When a dimension attribute changes (customer moves to a new city), how do you handle it?

| Type | Name | Behavior | When to use |
|---|---|---|---|
| **Type 0** | Fixed | Never changes | Birth date, original acquisition channel |
| **Type 1** | Overwrite | Replace old value with new | Corrections (typos), attributes where history doesn't matter |
| **Type 2** | Add row | New row with versioning (valid_from, valid_to, is_current) | When historical accuracy matters (customer segment at time of order) |
| **Type 3** | Add column | `current_city`, `previous_city` columns | When you only need one prior value |

### SCD Type 2 implementation

```sql
-- Current customer: is_current = true, valid_to = '9999-12-31'
-- When customer moves:
-- 1. Close the current row
UPDATE dim_customers
SET is_current = FALSE, valid_to = CURRENT_TIMESTAMP
WHERE customer_id = 'C-123' AND is_current = TRUE;

-- 2. Insert new row
INSERT INTO dim_customers (customer_key, customer_id, name, city, is_current, valid_from, valid_to)
VALUES (next_key, 'C-123', 'Alice', 'New York', TRUE, CURRENT_TIMESTAMP, '9999-12-31');
```

In dbt:
```sql
-- models/dim_customers.sql
{{
  config(
    materialized='snapshot',
    unique_key='customer_id',
    strategy='timestamp',
    updated_at='updated_at'
  )
}}

SELECT customer_id, name, city, segment, updated_at
FROM {{ source('app', 'customers') }}
```

### Joining facts to SCD Type 2 dimensions

```sql
-- Point-in-time join: what was the customer's segment when the order was placed?
SELECT
    f.order_id,
    f.order_date,
    d.segment AS segment_at_order_time
FROM fct_orders f
JOIN dim_customers d
    ON f.customer_key = d.customer_key
    AND f.order_date BETWEEN d.valid_from AND d.valid_to;
```

## Date dimension

Every warehouse needs a date dimension. Generate it once, reference everywhere.

```sql
CREATE TABLE dim_date (
    date_key           INT PRIMARY KEY,      -- YYYYMMDD format
    date_actual        DATE,
    day_of_week        SMALLINT,             -- 1 = Monday
    day_name           VARCHAR(10),          -- 'Monday'
    day_of_month       SMALLINT,
    day_of_year        SMALLINT,
    week_of_year       SMALLINT,
    month_number       SMALLINT,
    month_name         VARCHAR(10),
    quarter            SMALLINT,
    year               SMALLINT,
    is_weekend         BOOLEAN,
    is_holiday         BOOLEAN,
    fiscal_quarter     SMALLINT,
    fiscal_year        SMALLINT
);
```

Pre-populate 20+ years. Never compute date attributes at query time — always join to `dim_date`.

## Star schema example

```
                    dim_customers
                        |
dim_products --- fct_order_items --- dim_date
                        |
                    dim_stores
```

```sql
-- Typical analytical query
SELECT
    d.year,
    d.quarter,
    p.category,
    c.segment,
    SUM(f.quantity) AS total_units,
    SUM(f.revenue) AS total_revenue,
    COUNT(DISTINCT f.order_id) AS order_count
FROM fct_order_items f
JOIN dim_date d ON f.order_date_key = d.date_key
JOIN dim_products p ON f.product_key = p.product_key
JOIN dim_customers c ON f.customer_key = c.customer_key
WHERE d.year = 2025
GROUP BY d.year, d.quarter, p.category, c.segment
ORDER BY total_revenue DESC;
```

Star schemas perform well because: few joins (fact to dimension, never dimension to dimension), filters push down to dimension tables first, BI tools understand the pattern natively.

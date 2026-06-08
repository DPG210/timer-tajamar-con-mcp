# dbt Patterns

Source: docs.getdbt.com — Best practices, Style guide, dbt project structure.

## Project structure

```
dbt_project/
  models/
    staging/           # 1:1 with source tables, cleaning only
      stripe/
        _stripe__sources.yml
        _stripe__models.yml
        stg_stripe__payments.sql
        stg_stripe__customers.sql
      app_db/
        _app_db__sources.yml
        stg_app_db__orders.sql
    intermediate/      # Business logic, joins, deduplication
      int_payments_pivoted_to_orders.sql
    marts/             # Business-facing dimensional models
      finance/
        fct_revenue.sql
        dim_customers.sql
        _finance__models.yml
      marketing/
        fct_campaigns.sql
  tests/
    generic/
    singular/
  macros/
  seeds/               # Small reference data (country codes, mapping tables)
  snapshots/           # SCD Type 2 tracking
```

## Naming conventions

| Layer | Pattern | Example |
|---|---|---|
| Source | `{{ source('stripe', 'payments') }}` | — |
| Staging | `stg_<source>__<entity>` | `stg_stripe__payments` |
| Intermediate | `int_<entity>_<verb>` | `int_payments_pivoted_to_orders` |
| Fact | `fct_<entity>` | `fct_revenue` |
| Dimension | `dim_<entity>` | `dim_customers` |

## Staging models

One staging model per source table. Purpose: rename columns, cast types, basic cleaning. No joins, no business logic.

```sql
-- models/staging/stripe/stg_stripe__payments.sql
WITH source AS (
    SELECT * FROM {{ source('stripe', 'payments') }}
),

renamed AS (
    SELECT
        id              AS payment_id,
        orderid         AS order_id,
        paymentmethod    AS payment_method,
        amount / 100.0  AS amount,         -- cents to dollars
        status,
        created::TIMESTAMP AS created_at
    FROM source
)

SELECT * FROM renamed
```

Configuration:
```yaml
# models/staging/stripe/_stripe__models.yml
models:
  - name: stg_stripe__payments
    config:
      materialized: view  # staging = always view
    columns:
      - name: payment_id
        tests:
          - unique
          - not_null
```

## Intermediate models

Business logic that transforms staging into usable shapes. Not exposed to end users.

```sql
-- models/intermediate/int_payments_pivoted_to_orders.sql
WITH payments AS (
    SELECT * FROM {{ ref('stg_stripe__payments') }}
    WHERE status = 'succeeded'
),

pivoted AS (
    SELECT
        order_id,
        SUM(CASE WHEN payment_method = 'credit_card' THEN amount ELSE 0 END) AS credit_card_amount,
        SUM(CASE WHEN payment_method = 'bank_transfer' THEN amount ELSE 0 END) AS bank_transfer_amount,
        SUM(amount) AS total_amount,
        COUNT(*) AS payment_count
    FROM payments
    GROUP BY order_id
)

SELECT * FROM pivoted
```

## Marts (facts and dimensions)

```sql
-- models/marts/finance/fct_revenue.sql
{{
    config(
        materialized='incremental',
        unique_key='order_id',
        incremental_strategy='merge'
    )
}}

WITH orders AS (
    SELECT * FROM {{ ref('stg_app_db__orders') }}
    {% if is_incremental() %}
    WHERE updated_at > (SELECT MAX(updated_at) FROM {{ this }})
    {% endif %}
),

payments AS (
    SELECT * FROM {{ ref('int_payments_pivoted_to_orders') }}
),

final AS (
    SELECT
        o.order_id,
        o.customer_id,
        o.order_date,
        o.status AS order_status,
        p.total_amount AS revenue,
        p.payment_count,
        p.credit_card_amount,
        p.bank_transfer_amount,
        o.updated_at
    FROM orders o
    LEFT JOIN payments p ON o.order_id = p.order_id
)

SELECT * FROM final
```

## Incremental models

### Strategies

| Strategy | How | When |
|---|---|---|
| `append` | INSERT new rows | Event/log data, no updates |
| `merge` | UPSERT on unique_key | Data with updates (orders, users) |
| `delete+insert` | Delete matching rows, insert new | When merge isn't supported or is slow |
| `insert_overwrite` | Replace entire partitions | Large partitioned tables |

### Incremental with partition overwrite (BigQuery)

```sql
{{
    config(
        materialized='incremental',
        incremental_strategy='insert_overwrite',
        partition_by={
            'field': 'order_date',
            'data_type': 'date',
            'granularity': 'day'
        }
    )
}}

SELECT * FROM {{ ref('stg_app_db__orders') }}
{% if is_incremental() %}
WHERE order_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 DAY)
{% endif %}
```

The 3-day lookback handles late-arriving data — rows that arrive after their logical date.

## Testing

### Built-in generic tests

```yaml
models:
  - name: fct_revenue
    columns:
      - name: order_id
        tests:
          - unique
          - not_null
      - name: revenue
        tests:
          - not_null
          - dbt_expectations.expect_column_values_to_be_between:
              min_value: 0
              max_value: 100000
      - name: customer_id
        tests:
          - not_null
          - relationships:
              to: ref('dim_customers')
              field: customer_id
```

### Singular tests (custom SQL)

```sql
-- tests/singular/assert_revenue_not_negative.sql
-- This query should return 0 rows to pass
SELECT order_id, revenue
FROM {{ ref('fct_revenue') }}
WHERE revenue < 0
```

### Source freshness

```yaml
# models/staging/stripe/_stripe__sources.yml
sources:
  - name: stripe
    freshness:
      warn_after: { count: 12, period: hour }
      error_after: { count: 24, period: hour }
    loaded_at_field: _etl_loaded_at
    tables:
      - name: payments
      - name: customers
```

Run with `dbt source freshness` — alerts when source data is stale.

## Macros (DRY SQL)

```sql
-- macros/cents_to_dollars.sql
{% macro cents_to_dollars(column_name) %}
    ({{ column_name }} / 100.0)::NUMERIC(12, 2)
{% endmacro %}

-- Usage
SELECT
    {{ cents_to_dollars('amount') }} AS amount_dollars
FROM {{ source('stripe', 'payments') }}
```

Use macros for: repeated SQL patterns across models. Don't use for: logic that's only in one model (just write SQL).

## Snapshots (SCD Type 2)

```sql
-- snapshots/snap_customers.sql
{% snapshot snap_customers %}
{{
    config(
        target_schema='snapshots',
        unique_key='customer_id',
        strategy='timestamp',
        updated_at='updated_at',
        invalidate_hard_deletes=True
    )
}}

SELECT * FROM {{ source('app_db', 'customers') }}

{% endsnapshot %}
```

Produces: `dbt_valid_from`, `dbt_valid_to`, `dbt_scd_id` columns. `dbt_valid_to = NULL` means current record.

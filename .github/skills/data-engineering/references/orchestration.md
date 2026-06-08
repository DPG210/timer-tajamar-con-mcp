# Orchestration

Source: Apache Airflow documentation, Dagster docs, Prefect docs.

## Airflow DAG design

### Anatomy of a well-designed DAG

```python
from airflow.decorators import dag, task
from airflow.providers.common.sql.operators.sql import SQLExecuteQueryOperator
from pendulum import datetime

@dag(
    dag_id="daily_order_pipeline",
    schedule="0 6 * * *",          # 6am UTC daily
    start_date=datetime(2025, 1, 1),
    catchup=False,                  # don't backfill on deploy
    max_active_runs=1,              # prevent concurrent runs
    default_args={
        "retries": 2,
        "retry_delay": timedelta(minutes=5),
        "retry_exponential_backoff": True,
        "execution_timeout": timedelta(hours=1),
    },
    tags=["orders", "daily"],
)
def daily_order_pipeline():

    @task()
    def extract_orders(ds=None):
        """Extract orders for the logical date (ds)."""
        # ds = execution date in YYYY-MM-DD format
        orders = api_client.get_orders(date=ds)
        return orders  # XCom

    @task()
    def load_raw(orders):
        """Load raw orders to staging."""
        warehouse.load("stg_orders", orders)

    @task()
    def run_dbt():
        """Run dbt transformations."""
        subprocess.run(["dbt", "run", "--select", "tag:orders"], check=True)

    @task()
    def run_dbt_tests():
        """Run dbt tests."""
        subprocess.run(["dbt", "test", "--select", "tag:orders"], check=True)

    # Define dependencies
    orders = extract_orders()
    load_raw(orders) >> run_dbt() >> run_dbt_tests()

daily_order_pipeline()
```

### DAG design rules

1. **One DAG per business process** — not one mega-DAG for everything. `daily_order_pipeline`, `hourly_inventory_sync`, `weekly_churn_model`.

2. **Idempotent tasks** — every task should produce the same result if run twice with the same input. Use `MERGE`/upsert, not `INSERT`. Use logical date (`ds`) to partition work.

3. **No data in XCom** — XCom is for metadata (row counts, file paths, status). Not for passing DataFrames between tasks. Use cloud storage or a staging table.

4. **Atomic tasks** — each task succeeds or fails as a unit. Don't put extract + transform + load in one task — if transform fails, you have to re-extract.

5. **Use logical date, not wall clock** — `ds` (execution date) represents the data period, not when the DAG runs. A DAG scheduled for midnight processes yesterday's data. Use `ds` for all date-based filtering.

6. **catchup=False for new DAGs** — unless you specifically need to backfill historical data. Otherwise, deploying a DAG that started in January will run every day from January to now.

### Sensor pattern (wait for external dependency)

```python
from airflow.sensors.sql_sensor import SqlSensor

wait_for_source = SqlSensor(
    task_id="wait_for_source_data",
    conn_id="source_db",
    sql="SELECT COUNT(*) FROM orders WHERE date = '{{ ds }}' AND _loaded = TRUE",
    mode="reschedule",      # release the worker slot while waiting
    poke_interval=300,      # check every 5 minutes
    timeout=3600,           # give up after 1 hour
)
```

**Always use `mode="reschedule"`** for sensors — `poke` mode holds a worker slot the entire time.

### Dynamic task generation

```python
@dag(...)
def multi_source_pipeline():
    sources = ["stripe", "shopify", "salesforce"]

    for source in sources:
        @task(task_id=f"extract_{source}")
        def extract(source_name=source):
            return extractor.run(source_name)

        @task(task_id=f"load_{source}")
        def load(data, source_name=source):
            loader.run(source_name, data)

        data = extract()
        load(data)
```

### Branching

```python
from airflow.operators.python import BranchPythonOperator

def choose_branch(**context):
    row_count = context["ti"].xcom_pull(task_ids="count_rows")
    if row_count > 0:
        return "process_data"
    return "skip_processing"

branch = BranchPythonOperator(
    task_id="branch_on_data",
    python_callable=choose_branch,
)
```

## Idempotency patterns

| Pattern | How | When |
|---|---|---|
| **Date-partitioned overwrite** | Delete + insert for the partition date | Daily/hourly batch loads |
| **MERGE/upsert on natural key** | INSERT if new, UPDATE if exists | CDC, API extractions |
| **Tombstone + dedup** | Mark old records, insert new, dedup on read | Event streams |
| **Snapshot isolation** | Full table swap (create temp → swap → drop old) | Small reference tables |

### Backfill

```bash
# Re-run a specific date range
airflow dags backfill daily_order_pipeline \
  --start-date 2025-01-01 \
  --end-date 2025-01-31 \
  --reset-dagruns
```

Backfill works because tasks are idempotent and use `ds` for date filtering. If tasks use `datetime.now()` instead of `ds`, backfill produces wrong results.

## Alerting

```python
from airflow.providers.slack.notifications.slack import send_slack_notification

@dag(
    on_failure_callback=send_slack_notification(
        slack_conn_id="slack",
        text="Pipeline failed: {{ dag.dag_id }} on {{ ds }}",
        channel="#data-alerts",
    ),
    sla_miss_callback=...,
)
```

Alert on: task failures (always), SLA misses (critical pipelines), source freshness (dbt source freshness), row count anomalies (sudden 0 rows or 10x normal).

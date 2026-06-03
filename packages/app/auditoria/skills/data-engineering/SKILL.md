---
name: data-engineering
description: Professional data engineering knowledge for building reliable data pipelines, data models, and analytical infrastructure. Use this skill whenever the user asks for help designing ETL/ELT pipelines, dimensional models, data warehouses, data lakes, streaming architectures, data quality frameworks, or orchestration workflows. Trigger on any mention of data pipelines, ETL, ELT, dbt, Airflow, Spark, Kafka, data warehouse, data lake, lakehouse, dimensional modeling, star schema, snowflake schema, slowly changing dimensions, data quality, data contracts, data lineage, partitioning strategies, or batch vs streaming architecture.
---

# Data Engineering

A reference skill for designing and building data systems that are reliable, testable, and maintainable — following the principles that have settled across the modern data stack.

This skill exists to keep two failure modes out of the output:

1. **Stale patterns** — hand-written SQL ETL scripts without version control or testing, monolithic stored procedures, CSV-file-based pipelines, writing Spark jobs for 10GB datasets, Hadoop-era patterns (MapReduce, Hive for everything), schema-on-read without any governance.
2. **Hype-driven patterns** — real-time streaming for daily batch reports, data mesh for a 3-person team, a lakehouse with 5 tables, ML feature stores before there are ML models, self-serve analytics platforms before there are analysts.

The goal is to build data systems the way experienced data engineers recommend: clear data models, tested transformations, observable pipelines, appropriate technology choices for the actual scale.

## Core principles — apply in order

1. **Understand the business question first.** Every pipeline exists to answer a question or enable a decision. If you can't state the question, you don't know what to build.

2. **Batch is the default. Stream when latency requires it.** Streaming adds operational complexity (exactly-once semantics, late arrivals, watermarks, state management). Most analytics are fine with hourly or daily refresh. Stream only when the business needs sub-minute latency.

3. **ELT over ETL in the modern stack.** Extract and load raw data first, transform in the warehouse with dbt or SQL. The warehouse is cheap and powerful. Don't transform before loading — you lose the raw data and can't reprocess.

4. **Dimensional modeling is not dead.** Star schemas, fact and dimension tables, slowly changing dimensions — these are the foundation of analytical data models. Kimball's patterns exist because they work for query performance and understandability.

5. **Data quality is a first-class concern, not an afterthought.** Test data at ingestion, after transformation, and before serving. Schema validation, row count checks, uniqueness, referential integrity, freshness monitoring.

6. **Idempotent pipelines.** Every pipeline run should produce the same result if run again with the same input. No append-only without deduplication. No side effects that can't be replayed.

7. **Partitioning and incremental processing.** Process only what changed. Full table scans on every run don't scale. Partition by date, use incremental models, track high-water marks.

8. **Version control and CI/CD for data.** SQL, dbt models, Airflow DAGs, schema migrations — all in git. Code review, automated testing, staging environments.

9. **Data contracts between producers and consumers.** Schema changes break downstream. Define contracts (schema, SLAs, ownership) between teams that produce data and teams that consume it.

10. **Observability: know when it breaks before users tell you.** Pipeline execution time, row counts, data freshness, schema drift, anomaly detection. Alert on meaningful thresholds, not every variation.

## Workflow — for any data engineering task

1. **Clarify the question.** What business question does this data answer? Who consumes it? How fresh does it need to be? What's the expected volume?

2. **Map the sources.** Where does the data come from? APIs, databases, files, streams? What's the schema? How often does it change? Who owns it?

3. **Choose the architecture.** Batch vs stream vs hybrid. Warehouse vs lake vs lakehouse. See the reference index.

4. **Design the data model.** Dimensional model for analytics. Normalized for operational. Define facts, dimensions, grain, slowly changing dimensions.

5. **Build transformations.** Incremental where possible. Tested. Documented. Idempotent.

6. **Implement quality checks.** Schema validation, freshness, uniqueness, custom business rules.

7. **Deploy with CI/CD.** Staging environment, automated tests, blue-green deployment for schema changes.

8. **Monitor.** Pipeline SLAs, data freshness dashboards, anomaly alerts.

## Reference index — load on demand

| Topic | File | When to read |
|---|---|---|
| Pipeline architecture (batch, stream, hybrid, ELT) | `references/pipeline-architecture.md` | Choosing between batch/stream, designing pipeline topology |
| Dimensional modeling (star schema, SCDs, grain) | `references/dimensional-modeling.md` | Designing warehouse tables, fact/dimension modeling |
| dbt patterns (models, tests, macros, incremental) | `references/dbt.md` | Writing or reviewing dbt projects |
| Orchestration (Airflow, DAG design, idempotency) | `references/orchestration.md` | Designing workflows, scheduling, dependency management |
| Data quality and testing | `references/data-quality.md` | Implementing quality checks, testing strategies |
| Data contracts and governance | `references/data-contracts.md` | Cross-team data dependencies, schema evolution |
| Anti-patterns and code smells | `references/anti-patterns.md` | Reviewing pipelines, refactoring legacy data systems |

## Output expectations

When the agent produces data engineering artifacts, they should:

- State the grain of every fact table explicitly.
- Use incremental processing by default (not full refreshes).
- Include data quality tests alongside transformations.
- Handle late-arriving data and schema evolution.
- Use idempotent pipeline designs (re-runnable without side effects).
- Partition large tables by the most common query predicate (usually date).
- Separate staging (raw), intermediate, and mart layers clearly.

When the agent reviews existing data engineering code, it should call out:

- Full table scans where incremental processing is possible.
- Missing data quality tests (uniqueness, not-null, referential integrity).
- Non-idempotent pipelines (append without deduplication).
- Hardcoded credentials or connection strings.
- Missing partitioning on tables >1M rows.
- Transformations that lose raw data (destructive ETL before landing raw).
- Orchestration without retry/alerting on failure.
- Missing documentation on grain, business definitions, or data lineage.

## Closing each response

1. **What was assumed** (data warehouse platform, orchestrator, transformation tool, scale).
2. **What was deliberately not included** and why.
3. **One follow-up question** on the most relevant adjacent topic.

---
name: sql-performance
description: SQL performance tuning for SQL Server and PostgreSQL. Use this skill whenever the user asks for help optimizing slow queries, designing indexes, reading execution plans, partitioning tables, diagnosing deadlocks, fixing N+1 problems, or tuning database performance. Trigger on any mention of slow query, query optimization, execution plan, index, indexing strategy, query plan, table scan, deadlock, lock contention, partitioning, database performance, EXPLAIN, query hints, statistics, parameter sniffing, or N+1 queries. Also trigger when the user has EF Core queries that are slow or when reviewing database schema for performance.
---

# SQL Performance

A reference skill for diagnosing and fixing database performance problems in SQL Server and PostgreSQL — the two most common databases in .NET and cloud-native stacks.

This skill exists to keep two failure modes out of the output:

1. **Index everything** — Adding indexes on every column "just in case," covering indexes with 8 included columns, ignoring write amplification, indexes that are never used but cost storage and slow inserts, treating indexes as a magic fix without reading the execution plan.
2. **Ignore until production burns** — No index strategy, scanning million-row tables on every request, N+1 queries hidden behind an ORM, no monitoring of query performance, "it works in dev with 100 rows" as the testing strategy.

The goal is databases that serve queries in milliseconds at production scale, with the minimum number of indexes that cover the actual access patterns, and queries that use those indexes efficiently.

## Core principles — apply in order

1. **Measure before optimizing.** Read the execution plan. Identify the actual bottleneck (scan, sort, lookup, join). Don't guess.

2. **The right index eliminates the scan.** An index on the columns you filter and sort by turns a table scan into a seek. One well-designed index > five poorly designed ones.

3. **Queries should drive schema, not the reverse.** Design indexes for your access patterns. Write your queries knowing what indexes exist.

4. **N+1 is the silent killer.** One query per row in a loop = 1000 queries for 1000 rows. Always batch. EF Core's `Include()` or explicit joins.

5. **Pagination must use the index.** `OFFSET 10000` scans 10,000 rows to discard them. Keyset pagination (WHERE Id > @lastId) uses the index.

6. **Statistics must be current.** The optimizer makes decisions based on statistics. Stale stats = bad plan choices.

7. **Lock contention is a design problem.** Long transactions, wide locks, hot rows. Fix the access pattern, not just the isolation level.

8. **Partitioning is for maintenance, not speed.** Partition for data lifecycle (archive old data) and maintenance windows (rebuild indexes on one partition). Not as a first resort for slow queries.

9. **The ORM is not the enemy, but watch it.** EF Core generates good SQL if you use it correctly. Use `.AsNoTracking()`, projections with `.Select()`, and monitor generated SQL.

10. **Test with production-scale data.** A query that takes 2ms on 100 rows might take 20 seconds on 10 million. Load test with realistic data volumes.

## References

See the `references/` folder for detailed guidance on:

- **indexing-strategy.md** — Index types, composite indexes, covering indexes, when to add/remove.
- **execution-plans.md** — Reading plans in SQL Server and PostgreSQL, common operators, cost interpretation.
- **common-pitfalls.md** — N+1, parameter sniffing, implicit conversions, missing indexes, deadlocks.
- **ef-core-performance.md** — EF Core query patterns, projections, tracking, batching, compiled queries.

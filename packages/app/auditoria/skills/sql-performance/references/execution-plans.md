# Execution Plans — Reading and Interpreting

## How to get the plan

### SQL Server:
```sql
-- Estimated plan (doesn't execute)
SET SHOWPLAN_XML ON;
GO
SELECT * FROM Orders WHERE CustomerId = 123;
GO
SET SHOWPLAN_XML OFF;

-- Actual plan (executes query, shows real row counts)
SET STATISTICS XML ON;
SELECT * FROM Orders WHERE CustomerId = 123;
SET STATISTICS XML OFF;

-- SSMS: Ctrl+L (estimated), Ctrl+M (include actual)
```

### PostgreSQL:
```sql
-- Estimated plan
EXPLAIN SELECT * FROM orders WHERE customer_id = 123;

-- Actual plan (executes query)
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) 
SELECT * FROM orders WHERE customer_id = 123;

-- JSON format (for pgAdmin visualization)
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) 
SELECT * FROM orders WHERE customer_id = 123;
```

## Key operators and what they mean

| Operator | Good/Bad | Meaning | Fix if bad |
|----------|----------|---------|-----------|
| Index Seek | Good | Directly finds rows via index | — |
| Index Scan | Depends | Reads entire index | Add better index or fix query |
| Table Scan / Seq Scan | Bad (usually) | Reads every row in table | Add index on filter columns |
| Key Lookup / Heap Fetch | Moderate | Goes to table for non-indexed columns | Add INCLUDE columns to index |
| Nested Loop | Good for small | Row-by-row join for small datasets | — |
| Hash Match | Good for large | Hash join for large unsorted datasets | — |
| Merge Join | Good for sorted | Merge join for pre-sorted data | — |
| Sort | Expensive | Sorts in memory/tempdb | Add ORDER BY columns to index |
| Hash Aggregate | Normal | GROUP BY via hashing | — |
| Spool (Eager/Lazy) | Warning | Temp storage of intermediate results | Simplify query or add index |
| Parallelism | Normal | Query uses multiple threads | OK for large queries, bad for OLTP |

## Reading SQL Server plans

```
Execution plan reads RIGHT to LEFT, BOTTOM to TOP.

Physical flow:
  Index Seek → Key Lookup → Nested Loop → Sort → SELECT

Cost percentages:
  Each operator shows % of total estimated cost.
  Focus on the highest-cost operators first.

Important properties (hover/click):
  - Estimated vs Actual Rows (mismatch = bad statistics)
  - Number of Executions (high = possible N+1)
  - Actual I/O Statistics (logical reads)
  - Warnings (implicit conversion, missing index, spill to tempdb)
```

## Reading PostgreSQL EXPLAIN output

```
                                     QUERY PLAN
─────────────────────────────────────────────────────────────────
 Index Scan using idx_orders_customer on orders  
   (cost=0.43..8.45 rows=5 width=120) 
   (actual time=0.023..0.025 rows=3 loops=1)
   Index Cond: (customer_id = 123)
   Buffers: shared hit=4
 Planning Time: 0.082 ms
 Execution Time: 0.045 ms
```

Key numbers:
- `cost=startup..total` — Estimated cost (unitless, relative).
- `rows=5` — Estimated rows. Compare with `actual rows=3`.
- `actual time=0.023..0.025` — Real milliseconds (start..end).
- `loops=1` — How many times this node executed (>1 = inside a loop).
- `Buffers: shared hit=4` — 4 pages read from cache. `read=X` means disk.

**Critical metric:** `actual time * loops` = true time cost.

## Red flags in plans

### 1. Estimated vs Actual row mismatch

```
Estimated: 1 row
Actual: 50,000 rows
```

→ Statistics are stale. Run `UPDATE STATISTICS` (SQL Server) or `ANALYZE` (PostgreSQL).

### 2. Table Scan on a large table

```
Seq Scan on orders (cost=0.00..45000.00 rows=1000000 ...)
  Filter: (status = 'pending')
  Rows Removed by Filter: 999000
```

→ Scanning 1M rows to find 1000. Add index on `status` (or filtered index if one value dominates).

### 3. Key Lookup with high cost

```
Index Seek (30%) → Key Lookup (65%) → Nested Loop
```

→ The lookup dominates. Add INCLUDE columns to the index to make it covering.

### 4. Sort with spill to tempdb/disk

```
Sort (actual rows=500000, memory=2048KB, spill to tempdb)
```

→ Too much data to sort in memory. Add sort columns to index so data comes pre-sorted.

### 5. Nested Loop with high loops count

```
Nested Loop (actual loops=10000)
  → Index Seek (actual loops=10000, actual rows=1 per loop)
```

→ N+1 pattern. The outer query returns 10,000 rows and for each, seeks once. Consider Hash Join or restructure query.

## Parameter sniffing (SQL Server)

```sql
-- First execution with @status = 'pending' (5 rows) → plan optimized for few rows (index seek)
-- Second execution with @status = 'completed' (5M rows) → reuses same plan → terrible performance

-- Fix: OPTIMIZE FOR UNKNOWN (or RECOMPILE for critical queries)
SELECT * FROM Orders WHERE Status = @status
OPTION (OPTIMIZE FOR UNKNOWN);

-- Or force recompile per execution (expensive but correct for variable distributions):
OPTION (RECOMPILE);
```

## Common anti-patterns

- **Not reading the actual plan** → Estimated plans guess. Actual plans prove. Always use ANALYZE/actual.
- **Optimizing based on cost percentage** → Cost is estimated. Look at actual time and actual rows.
- **Ignoring row estimate mismatches** → Bad estimates → bad plan choices. Fix statistics.
- **Adding indexes without checking existing plans** → The index might already exist but the query doesn't use it (implicit conversion, function on column, etc.).
- **Assuming parallelism = fast** → For OLTP (single row lookups), parallelism adds overhead. It's for analytical queries.
- **Never updating statistics** → Auto-update triggers at 20% change (SQL Server). Manual update needed for large tables with skewed distribution.

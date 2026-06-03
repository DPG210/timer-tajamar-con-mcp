# Indexing Strategy — What to Index and When

## Index types

| Type | SQL Server | PostgreSQL | Use when |
|------|-----------|------------|----------|
| B-tree (clustered) | `CREATE CLUSTERED INDEX` | Primary key (default) | Range queries, sorting, the "main" access path |
| B-tree (non-clustered) | `CREATE INDEX` | `CREATE INDEX` | Point lookups, secondary access patterns |
| Covering index | `INCLUDE (col1, col2)` | `INCLUDE (col1, col2)` | Eliminate key lookups (all needed columns in index) |
| Filtered index | `WHERE Status = 'Active'` | `WHERE status = 'active'` | Queries that always filter on a constant value |
| Hash index | Memory-optimized tables only | `USING HASH` | Exact-match lookups only (no ranges) |
| GIN/Full-text | Full-text index | `USING GIN` | Text search, JSONB, array contains |

## Composite index design — column order matters

```sql
-- Query:
SELECT * FROM Orders 
WHERE CustomerId = @cid AND Status = 'pending' 
ORDER BY CreatedAt DESC

-- Best index:
CREATE INDEX IX_Orders_Customer_Status_Created 
ON Orders (CustomerId, Status, CreatedAt DESC)
```

**Rule: Equality columns first, then range/sort columns.**

```
Index column order:
1. Equality filters (WHERE col = value)     ← first
2. Range filters (WHERE col > value)         ← second
3. ORDER BY columns                          ← last
```

## Covering indexes (eliminate key lookups)

```sql
-- Query only needs Id, Status, Total:
SELECT Id, Status, Total FROM Orders WHERE CustomerId = @cid

-- Without INCLUDE: index seek on CustomerId, then key lookup for Status and Total
-- With INCLUDE: index seek only (all data in the index)
CREATE INDEX IX_Orders_CustomerId 
ON Orders (CustomerId) 
INCLUDE (Status, Total)
```

**When to use:** When the execution plan shows "Key Lookup" consuming significant cost.

## Filtered indexes (partial indexes)

```sql
-- Only 5% of orders are 'pending', but 90% of queries filter on pending
CREATE INDEX IX_Orders_Pending 
ON Orders (CustomerId, CreatedAt) 
WHERE Status = 'pending'

-- PostgreSQL:
CREATE INDEX idx_orders_pending 
ON orders (customer_id, created_at) 
WHERE status = 'pending';
```

**When to use:** When queries consistently filter on a value that matches a small subset of rows.

## Index guidelines by table size

| Rows | Strategy |
|------|----------|
| < 1,000 | Probably no extra indexes needed. Scans are fast. |
| 1K - 100K | Index your WHERE and JOIN columns. Review occasionally. |
| 100K - 10M | Careful index design. Use covering indexes. Monitor unused indexes. |
| > 10M | Every index decision is a trade-off. Measure write amplification. Consider partitioning. |

## Write amplification — the hidden cost

Every INSERT/UPDATE/DELETE must update ALL indexes on the table.

```
Table with 8 indexes:
  INSERT 1 row = 1 table write + 8 index writes = 9 I/O operations

→ More indexes = slower writes
→ Only keep indexes that are actively used by queries
```

## Finding unused indexes

### SQL Server:
```sql
SELECT 
    i.name AS IndexName,
    s.user_seeks + s.user_scans + s.user_lookups AS Reads,
    s.user_updates AS Writes,
    CASE WHEN s.user_seeks + s.user_scans + s.user_lookups = 0 
         THEN 'UNUSED' ELSE 'USED' END AS Status
FROM sys.indexes i
JOIN sys.dm_db_index_usage_stats s ON i.object_id = s.object_id AND i.index_id = s.index_id
WHERE s.database_id = DB_ID()
ORDER BY Reads ASC;
```

### PostgreSQL:
```sql
SELECT schemaname, relname, indexrelname, idx_scan, idx_tup_read
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;
```

## Missing index recommendations

### SQL Server (DMV):
```sql
SELECT 
    d.statement AS TableName,
    d.equality_columns,
    d.inequality_columns,
    d.included_columns,
    s.avg_user_impact AS ImpactPercent,
    s.user_seeks + s.user_scans AS PotentialUses
FROM sys.dm_db_missing_index_details d
JOIN sys.dm_db_missing_index_groups g ON d.index_handle = g.index_handle
JOIN sys.dm_db_missing_index_group_stats s ON g.index_group_handle = s.group_handle
WHERE d.database_id = DB_ID()
ORDER BY s.avg_user_impact * (s.user_seeks + s.user_scans) DESC;
```

**Warning:** Don't blindly create every suggested index. Evaluate against write overhead and existing indexes.

## Common anti-patterns

- **Index on every column** → Write amplification kills INSERT/UPDATE performance. Index for access patterns.
- **Wrong column order in composite index** → `(CreatedAt, CustomerId)` when you filter on CustomerId = useless for that query.
- **No covering index when plan shows key lookups** → Easy 10x improvement missed.
- **Indexing low-cardinality columns alone** → Index on `Status` (3 values) = scan 33% of table. Not helpful alone.
- **Never reviewing/removing unused indexes** → Accumulate over years, slow writes, waste storage.
- **Missing index on FK columns** → JOINs and DELETE cascades scan the whole child table. Always index FKs.
- **Duplicate/overlapping indexes** → `IX_A (CustomerId)` and `IX_B (CustomerId, Status)` = IX_A is redundant (IX_B covers it).

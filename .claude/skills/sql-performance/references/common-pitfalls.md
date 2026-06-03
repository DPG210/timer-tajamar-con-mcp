# Common Pitfalls — Performance Killers

## N+1 Query Problem

The most common performance killer in applications using ORMs.

```csharp
// BAD: N+1 — 1 query for orders + N queries for customers
var orders = db.Orders.ToList();
foreach (var order in orders)
{
    Console.WriteLine(order.Customer.Name); // Lazy load = 1 query per order
}
// Result: 1 + 1000 queries for 1000 orders

// GOOD: Eager load with Include
var orders = db.Orders.Include(o => o.Customer).ToList();
// Result: 1 query with JOIN

// GOOD: Projection (even better — only fetches needed columns)
var orders = db.Orders
    .Select(o => new { o.Id, o.Total, CustomerName = o.Customer.Name })
    .ToList();
// Result: 1 query, minimal data transfer
```

### How to detect:
- SQL Server: Profiler/Extended Events showing 1000s of identical queries.
- PostgreSQL: `pg_stat_statements` showing a query with very high `calls` count.
- EF Core: Enable `EnableSensitiveDataLogging` + `LogTo(Console.WriteLine)` in dev.

## Implicit Conversions

When column type doesn't match parameter type, the DB converts every row → no index use.

```sql
-- Column: CustomerId NVARCHAR(50)
-- Parameter: @id VARCHAR(50)

-- BAD: Implicit conversion — scans entire index
SELECT * FROM Orders WHERE CustomerId = @id
-- Plan shows: Index SCAN + CONVERT_IMPLICIT warning

-- FIX: Match types exactly
DECLARE @id NVARCHAR(50) = N'CUST-123';
SELECT * FROM Orders WHERE CustomerId = @id;
```

### Common mismatches:
| Column type | Parameter type | Result |
|-------------|---------------|--------|
| NVARCHAR | VARCHAR | Implicit conversion, scan |
| INT | VARCHAR | Implicit conversion, scan |
| DATE | DATETIME | May cause scan depending on comparison |
| DECIMAL(18,2) | FLOAT | Precision mismatch |

### EF Core pitfall:
```csharp
// If DB column is NVARCHAR but C# sends VARCHAR:
// Fix in DbContext:
modelBuilder.Entity<Order>()
    .Property(o => o.CustomerId)
    .HasColumnType("nvarchar(50)");
```

## Functions on Indexed Columns

Wrapping a column in a function prevents index use.

```sql
-- BAD: Function on column — can't use index
SELECT * FROM Orders WHERE YEAR(CreatedAt) = 2024;
SELECT * FROM Users WHERE UPPER(Email) = 'TEST@EXAMPLE.COM';
SELECT * FROM Orders WHERE CAST(CreatedAt AS DATE) = '2024-01-15';

-- GOOD: Rewrite as range (index-friendly)
SELECT * FROM Orders 
WHERE CreatedAt >= '2024-01-01' AND CreatedAt < '2025-01-01';

-- GOOD: Use computed column or functional index (PostgreSQL)
-- PostgreSQL:
CREATE INDEX idx_users_email_lower ON users (LOWER(email));
SELECT * FROM users WHERE LOWER(email) = 'test@example.com';

-- SQL Server: Computed column + index
ALTER TABLE Users ADD EmailLower AS LOWER(Email) PERSISTED;
CREATE INDEX IX_Users_EmailLower ON Users (EmailLower);
```

## SELECT * (fetching unnecessary data)

```sql
-- BAD: Fetches all 50 columns, 2MB of BLOB data per row
SELECT * FROM Products WHERE CategoryId = 5;

-- GOOD: Only what you need
SELECT Id, Name, Price, StockCount FROM Products WHERE CategoryId = 5;
```

**Why it matters:**
- More data transferred = slower network.
- Wider rows = fewer fit in memory pages = more I/O.
- Prevents covering index optimization (needs all columns).
- BLOBs/large text columns are especially expensive.

## Missing Indexes on Foreign Keys

```sql
-- Orders.CustomerId references Customers.Id
-- Without index on Orders.CustomerId:

-- This scans entire Orders table:
DELETE FROM Customers WHERE Id = 123;  -- CASCADE checks all Orders

-- This scans entire Orders table:
SELECT * FROM Customers c JOIN Orders o ON o.CustomerId = c.Id;

-- FIX: Always index FK columns
CREATE INDEX IX_Orders_CustomerId ON Orders (CustomerId);
```

**Rule:** Every foreign key column gets an index. No exceptions.

## Deadlocks

### Common pattern:
```
Transaction A: UPDATE Orders SET ... WHERE Id = 1  (locks Order 1)
Transaction B: UPDATE Orders SET ... WHERE Id = 2  (locks Order 2)
Transaction A: UPDATE Orders SET ... WHERE Id = 2  (waits for B)
Transaction B: UPDATE Orders SET ... WHERE Id = 1  (waits for A → DEADLOCK)
```

### Prevention:
1. **Consistent lock ordering** — Always access tables/rows in the same order.
2. **Short transactions** — Get in, do work, get out. No user input inside transactions.
3. **Use row-level locking** — Avoid table locks (`NOLOCK` is NOT the answer).
4. **Read Committed Snapshot (SQL Server)** — `ALTER DATABASE SET READ_COMMITTED_SNAPSHOT ON`.
5. **PostgreSQL** — Uses MVCC by default (readers don't block writers).

## Large Transactions Holding Locks

```csharp
// BAD: Transaction holds locks for entire batch
using var transaction = await db.Database.BeginTransactionAsync();
foreach (var item in thousandItems) // Locks held for entire loop
{
    await db.Orders.AddAsync(item);
    await db.SaveChangesAsync();
}
await transaction.CommitAsync();

// GOOD: Batch in chunks
foreach (var chunk in thousandItems.Chunk(100))
{
    using var transaction = await db.Database.BeginTransactionAsync();
    db.Orders.AddRange(chunk);
    await db.SaveChangesAsync();
    await transaction.CommitAsync();
}
```

## OFFSET Pagination on Large Tables

```sql
-- BAD: Scans and discards 100,000 rows
SELECT * FROM Orders ORDER BY CreatedAt OFFSET 100000 ROWS FETCH NEXT 20 ROWS ONLY;
-- Gets progressively slower as OFFSET increases

-- GOOD: Keyset pagination (constant time regardless of page depth)
SELECT * FROM Orders 
WHERE CreatedAt < @lastSeenDate 
  OR (CreatedAt = @lastSeenDate AND Id < @lastSeenId)
ORDER BY CreatedAt DESC, Id DESC
FETCH NEXT 20 ROWS ONLY;
```

## Common anti-patterns summary

| Pitfall | Impact | Detection |
|---------|--------|-----------|
| N+1 queries | 100-1000x more queries than needed | Query count monitoring, ORM logging |
| Implicit conversion | Index scan instead of seek | Execution plan warnings |
| Function on column | Index scan instead of seek | Execution plan (missing index suggestion) |
| SELECT * | Unnecessary I/O and memory | Code review, query analysis |
| Missing FK indexes | Slow JOINs and CASCADE deletes | Missing index DMVs |
| Deadlocks | Transaction failures | Error logs, deadlock graphs |
| Large transactions | Lock contention | Blocking queries DMV |
| OFFSET pagination | O(N) per page fetch | Slow page loads at high page numbers |

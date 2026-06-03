# EF Core Performance — Query Patterns

## AsNoTracking (read-only queries)

```csharp
// BAD: Tracks all entities (allocates change tracker entries)
var orders = await db.Orders.ToListAsync();

// GOOD: No tracking overhead for read-only data
var orders = await db.Orders.AsNoTracking().ToListAsync();

// BEST: Set globally for read-heavy services
services.AddDbContext<AppDbContext>(options =>
    options.UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking));
// Then opt-in to tracking only when needed:
var order = await db.Orders.AsTracking().FirstAsync(o => o.Id == id);
```

**Impact:** 30-50% faster for read queries. Less memory pressure.

## Projections with Select (don't fetch entire entities)

```csharp
// BAD: Fetches all 30 columns of Order + all navigation properties
var orders = await db.Orders.Include(o => o.Customer).ToListAsync();

// GOOD: Only fetch what you need
var orders = await db.Orders
    .Select(o => new OrderListDto
    {
        Id = o.Id,
        Total = o.Total,
        Status = o.Status,
        CustomerName = o.Customer.Name, // Translated to JOIN, not lazy load
        ItemCount = o.Items.Count       // Translated to subquery
    })
    .ToListAsync();
```

**Impact:** Less data from DB, less memory, faster serialization. Often 2-5x improvement.

## Compiled queries (hot path optimization)

```csharp
// Define compiled query (parsed and cached at startup)
private static readonly Func<AppDbContext, int, Task<Order?>> GetOrderById =
    EF.CompileAsyncQuery((AppDbContext db, int id) =>
        db.Orders.AsNoTracking().FirstOrDefault(o => o.Id == id));

// Usage (no expression tree compilation overhead)
var order = await GetOrderById(db, orderId);
```

**When to use:** Hot-path queries called thousands of times per second. Saves ~0.5ms per call of expression compilation.

## Batch operations (EF Core 7+)

```csharp
// BAD: Loads all entities into memory, then saves one by one
var orders = await db.Orders.Where(o => o.Status == "expired").ToListAsync();
foreach (var order in orders)
{
    order.Status = "archived";
}
await db.SaveChangesAsync(); // Still generates individual UPDATE statements

// GOOD: ExecuteUpdate (single SQL statement, no entities loaded)
await db.Orders
    .Where(o => o.Status == "expired")
    .ExecuteUpdateAsync(s => s.SetProperty(o => o.Status, "archived"));

// GOOD: ExecuteDelete (single DELETE statement)
await db.Orders
    .Where(o => o.CreatedAt < cutoffDate && o.Status == "archived")
    .ExecuteDeleteAsync();
```

**Impact:** From loading 10,000 entities + 10,000 UPDATE statements → 1 SQL statement.

## Pagination with EF Core

```csharp
// BAD: OFFSET-based (slow at depth)
var page = await db.Orders
    .OrderByDescending(o => o.CreatedAt)
    .Skip((pageNumber - 1) * pageSize)
    .Take(pageSize)
    .ToListAsync();

// GOOD: Keyset pagination (constant time)
var page = await db.Orders
    .Where(o => o.CreatedAt < lastSeenDate 
        || (o.CreatedAt == lastSeenDate && o.Id < lastSeenId))
    .OrderByDescending(o => o.CreatedAt)
    .ThenByDescending(o => o.Id)
    .Take(pageSize)
    .ToListAsync();
```

## Split queries (avoiding cartesian explosion)

```csharp
// BAD: Include with multiple collections → cartesian product
var orders = await db.Orders
    .Include(o => o.Items)       // 10 items per order
    .Include(o => o.Payments)    // 3 payments per order
    .ToListAsync();
// Result: 10 × 3 = 30 rows per order in the result set!

// GOOD: Split into separate queries (one per Include)
var orders = await db.Orders
    .Include(o => o.Items)
    .Include(o => o.Payments)
    .AsSplitQuery()
    .ToListAsync();
// Result: 3 queries, no cartesian explosion
```

**When to use:** When including 2+ collection navigation properties.

## Raw SQL for complex queries

```csharp
// When EF generates inefficient SQL or you need window functions, CTEs, etc.
var topCustomers = await db.Database
    .SqlQuery<TopCustomerDto>($"""
        WITH OrderTotals AS (
            SELECT CustomerId, SUM(Total) as TotalSpent,
                   ROW_NUMBER() OVER (ORDER BY SUM(Total) DESC) as Rank
            FROM Orders
            WHERE CreatedAt >= {startDate}
            GROUP BY CustomerId
        )
        SELECT c.Id, c.Name, ot.TotalSpent, ot.Rank
        FROM OrderTotals ot
        JOIN Customers c ON c.Id = ot.CustomerId
        WHERE ot.Rank <= 10
    """)
    .ToListAsync();
```

## Monitoring EF Core queries

```csharp
// In development: log all queries
services.AddDbContext<AppDbContext>(options =>
    options
        .UseSqlServer(connectionString)
        .LogTo(Console.WriteLine, LogLevel.Information)
        .EnableSensitiveDataLogging()  // Shows parameter values
        .EnableDetailedErrors());

// In production: log slow queries only
services.AddDbContext<AppDbContext>(options =>
    options
        .UseSqlServer(connectionString)
        .LogTo(
            message => logger.LogWarning(message),
            new[] { DbLoggerCategory.Database.Command.Name },
            LogLevel.Warning,
            DbContextLoggerOptions.DefaultWithUtcTime));
```

## Common anti-patterns

| Pattern | Problem | Fix |
|---------|---------|-----|
| Lazy loading in loops | N+1 queries | Use Include or Select projection |
| Tracking on read queries | Unnecessary memory + CPU | AsNoTracking |
| Loading entities to update one field | Unnecessary round trip | ExecuteUpdateAsync |
| Include on collections without AsSplitQuery | Cartesian explosion | AsSplitQuery |
| ToList() before Where() | Loads entire table into memory | Always filter in DB |
| No index on frequently filtered columns | Table scans | Add index, check EF migrations |
| Calling SaveChanges in a loop | One round trip per save | Batch: call once at end |
| Using Contains with large lists | Generates huge IN clause | Use temp table or join |

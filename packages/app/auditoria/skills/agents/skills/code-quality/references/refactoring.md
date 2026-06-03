# Refactoring Patterns

Source: Martin Fowler — Refactoring (2nd edition).

Each pattern: what it fixes, the mechanics, and a before/after example.

## Extract Method

**When:** A code fragment can be grouped together and named. The method is too long. A comment explains what the next block does (the comment should be the method name).

```csharp
// BEFORE
public Invoice ProcessOrder(Order order)
{
    // Validate order
    if (order.Items.Count == 0) throw new InvalidOperationException("Empty order");
    if (order.Items.Any(i => i.Quantity <= 0)) throw new InvalidOperationException("Invalid quantity");

    // Calculate totals
    var subtotal = order.Items.Sum(i => i.Price * i.Quantity);
    var tax = subtotal * 0.21m;
    var total = subtotal + tax;

    // Create invoice
    var invoice = new Invoice(order.Id, subtotal, tax, total);
    _db.Invoices.Add(invoice);
    return invoice;
}

// AFTER
public Invoice ProcessOrder(Order order)
{
    ValidateOrder(order);
    var (subtotal, tax, total) = CalculateTotals(order);
    return CreateInvoice(order.Id, subtotal, tax, total);
}

private static void ValidateOrder(Order order) { ... }
private static (decimal subtotal, decimal tax, decimal total) CalculateTotals(Order order) { ... }
private Invoice CreateInvoice(int orderId, decimal subtotal, decimal tax, decimal total) { ... }
```

## Replace Conditional with Polymorphism

**When:** A switch/if-else chain selects behavior based on a type discriminator. Each branch does fundamentally different things.

```csharp
// BEFORE
public decimal CalculateShipping(Order order)
{
    return order.ShippingMethod switch
    {
        "standard" => order.Weight * 0.5m,
        "express" => order.Weight * 1.5m + 5.0m,
        "overnight" => order.Weight * 3.0m + 15.0m,
        _ => throw new ArgumentException($"Unknown shipping: {order.ShippingMethod}")
    };
}

// AFTER
public interface IShippingCalculator
{
    decimal Calculate(Order order);
}

public class StandardShipping : IShippingCalculator
{
    public decimal Calculate(Order order) => order.Weight * 0.5m;
}

public class ExpressShipping : IShippingCalculator
{
    public decimal Calculate(Order order) => order.Weight * 1.5m + 5.0m;
}

// Registration: Dictionary<string, IShippingCalculator> or DI
```

**Don't over-apply:** If the switch has 2-3 cases and is unlikely to grow, the switch is simpler. Polymorphism shines when there are 5+ cases or new cases are added frequently.

## Replace Temp with Query

**When:** A temporary variable holds a computation that could be a method call.

```csharp
// BEFORE
var basePrice = order.Quantity * order.ItemPrice;
if (basePrice > 1000)
    return basePrice * 0.95m;
return basePrice * 0.98m;

// AFTER
if (BasePrice(order) > 1000)
    return BasePrice(order) * 0.95m;
return BasePrice(order) * 0.98m;

private static decimal BasePrice(Order order) => order.Quantity * order.ItemPrice;
```

**Caveat:** If the computation is expensive, keep the temp (or use memoization). This refactoring is for cheap computations where the method call improves readability.

## Introduce Parameter Object

**When:** Multiple parameters always travel together.

```csharp
// BEFORE
public List<Order> SearchOrders(
    DateTime startDate, DateTime endDate,
    string? status, string? customerId,
    int page, int pageSize,
    string sortBy, string sortDirection)

// AFTER
public record OrderSearchCriteria(
    DateRange DateRange,
    string? Status = null,
    string? CustomerId = null,
    Pagination Pagination = default,
    SortSpec? Sort = null);

public List<Order> SearchOrders(OrderSearchCriteria criteria)
```

Benefits: named, self-documenting, extensible without breaking callers, can have validation in the constructor.

## Replace Magic Number with Symbolic Constant

```csharp
// BEFORE
if (retryCount > 3) ...
await Task.Delay(30000);
if (password.Length < 8) ...

// AFTER
private const int MaxRetries = 3;
private static readonly TimeSpan RetryDelay = TimeSpan.FromSeconds(30);
private const int MinPasswordLength = 8;
```

## Guard Clauses (Replace Nested Conditional with Guard)

```csharp
// BEFORE
public decimal CalculatePayment(Order order)
{
    decimal result;
    if (order != null)
    {
        if (order.IsPaid)
        {
            result = 0;
        }
        else
        {
            if (order.Total > 0)
            {
                result = order.Total * (1 - order.Discount);
            }
            else
            {
                result = 0;
            }
        }
    }
    else
    {
        throw new ArgumentNullException(nameof(order));
    }
    return result;
}

// AFTER
public decimal CalculatePayment(Order order)
{
    ArgumentNullException.ThrowIfNull(order);
    if (order.IsPaid) return 0;
    if (order.Total <= 0) return 0;
    return order.Total * (1 - order.Discount);
}
```

## Decompose Conditional

**When:** A complex conditional expression is hard to read.

```csharp
// BEFORE
if (date >= seasonStart && date <= seasonEnd && !holidays.Contains(date) && order.Total > minThreshold)
{
    // apply seasonal discount
}

// AFTER
if (IsInSeason(date) && IsBusinessDay(date) && MeetsMinimumThreshold(order))
{
    // apply seasonal discount
}
```

## When NOT to refactor

1. **Code that works and is never changed.** If nobody touches it, the risk of introducing bugs outweighs the readability benefit.
2. **During an incident.** Fix the bug, ship the hotfix, refactor later.
3. **Without tests.** Refactoring without tests is gambling. Add tests first, then refactor.
4. **Just before a release.** Refactoring introduces risk. Don't refactor in a release branch.
5. **As a separate "refactoring sprint."** Refactor continuously, alongside feature work. Big-bang refactoring projects never finish and create merge conflicts.

# Code Smells Catalog

Organized by category. Each smell includes: how to detect it, why it matters, and how to fix it.

## Naming smells

### Generic names

**Detect:** Variables named `data`, `result`, `temp`, `info`, `manager`, `handler`, `processor`, `helper`, `utils`.

**Why:** Tells you nothing about what the variable holds or what the class does. `data` could be anything. `UserService` vs `UserManager` vs `UserHandler` — what's the difference?

**Fix:** Name by what it IS, not what it DOES generically. `data` → `pendingOrders`. `result` → `validationErrors`. `Utils` → split into specific classes (`DateFormatter`, `CurrencyConverter`).

### Boolean naming

**Detect:** `flag`, `status`, `check`, `process` as boolean names.

**Fix:** Use `is`, `has`, `can`, `should` prefixes. `flag` → `isActive`. `status` → `isCompleted`. The name should read as a question.

### Inconsistent naming

**Detect:** Same concept with different names across the codebase: `user`/`customer`/`account`/`client` for the same entity. `get`/`fetch`/`retrieve`/`load` for the same operation.

**Fix:** Establish a ubiquitous language (DDD term). Pick one word per concept and enforce it. Document in a glossary.

## Structural smells

### God class / God function

**Detect:** Class >500 lines or function >50 lines. Multiple unrelated responsibilities. Injecting >5 dependencies.

**Why:** Hard to test, hard to understand, hard to change without side effects. Changes for different reasons (violates Single Responsibility).

**Fix:** Extract classes by responsibility. Extract functions by logical step. Each class/function should have one reason to change.

### Feature envy

**Detect:** A method that uses more data from another class than from its own.

```csharp
// Feature envy — this method belongs in Order, not in Printer
public string FormatOrderSummary(Order order)
{
    return $"{order.Id}: {order.Items.Count} items, " +
           $"total {order.Currency}{order.Items.Sum(i => i.Price * i.Quantity)}, " +
           $"status: {order.Status}";
}
```

**Fix:** Move the method to the class whose data it uses. `order.FormatSummary()` or `order.GetSummary()`.

### Primitive obsession

**Detect:** Strings used for emails, money, phone numbers, dates. `decimal amount` + `string currency` passed separately instead of `Money`.

**Why:** No validation at the type level. You can pass any string where an email is expected. Currency can be misspelled.

**Fix:** Value objects. `Email`, `Money`, `PhoneNumber`, `DateRange`. Validate in the constructor, impossible to create invalid instances.

### Shotgun surgery

**Detect:** A single change requires modifying 5+ files across unrelated parts of the codebase.

**Why:** High coupling. Changes are expensive and error-prone — miss one file and you have a bug.

**Fix:** Co-locate related code. If adding a new order status requires changes in the domain, API, database, mapper, and validator — consider if these can be restructured so the change is localized.

### Dead code

**Detect:** Unused methods, unreachable branches, commented-out code, unused imports, unused variables.

**Why:** Noise. Makes the codebase harder to navigate. Developers are afraid to delete it because "someone might need it."

**Fix:** Delete it. Version control has the history. If you need it back, git has it. Commented-out code is never "temporary."

## Logic smells

### Deeply nested conditionals

**Detect:** 3+ levels of if/else nesting.

```csharp
// BAD
if (order != null)
{
    if (order.Status == "active")
    {
        if (order.Items.Any())
        {
            if (order.Customer != null)
            {
                // actual logic here, 4 levels deep
            }
        }
    }
}
```

**Fix:** Guard clauses (early returns), extract conditions into named methods.

```csharp
// GOOD
if (order is null) return;
if (order.Status != "active") return;
if (!order.Items.Any()) return;
if (order.Customer is null) return;

// actual logic here, 0 levels deep
```

### Magic numbers/strings

**Detect:** Literal values in conditions: `if (status == 3)`, `if (role == "admin")`, `timeout: 30000`.

**Fix:** Named constants or enums. `OrderStatus.Active`, `Role.Admin`, `TimeoutMs.Default`. The name explains the intent.

### Copy-paste code (duplicated logic)

**Detect:** Same logic in 2+ places with minor variations.

**Why:** Bug fix in one place is missed in the other. Knowledge is scattered.

**Fix:** Extract shared logic into a method, hook, function, or base class. DRY applies to knowledge, not just characters.

### Catch-all exception handling

**Detect:** `catch (Exception)` or `catch (Exception ex) { /* log and continue */ }`.

**Why:** Swallows unexpected errors. Hides bugs. The system appears to work but produces wrong results silently.

**Fix:** Catch specific exceptions. Let unexpected ones propagate to the global handler. Log with the exception object, not just the message.

## Dependency smells

### Circular dependencies

**Detect:** Module A depends on Module B which depends on Module A. Often manifested as `using` imports that form cycles.

**Fix:** Extract the shared concept into a third module that both depend on. Or invert the dependency using interfaces/events.

### Hidden dependencies

**Detect:** A class uses `DateTime.Now`, `HttpContext.Current`, static methods, or service locator internally instead of receiving dependencies through its constructor.

**Why:** Impossible to test with different dates/contexts. Dependencies aren't visible in the API.

**Fix:** Inject dependencies. `TimeProvider` (or `IClock`) instead of `DateTime.Now`. Constructor injection instead of service locator.

## Test smells

### Testing implementation, not behavior

**Detect:** Tests that assert on internal state, mock every dependency, verify method call counts.

**Fix:** Test the observable behavior — given an input, what output or side effect does the system produce?

### No assertions

**Detect:** Test that calls a method but never asserts anything. "It didn't throw, so it works."

**Fix:** Assert on the expected outcome. If the test is for "doesn't throw," make that explicit: `Assert.DoesNotThrow(...)`.

### Test names that don't describe behavior

**Detect:** `Test1`, `TestCreateOrder`, `OrderServiceTests`.

**Fix:** Name describes the scenario: `CreateOrder_WithInvalidCustomer_ReturnsValidationError`.

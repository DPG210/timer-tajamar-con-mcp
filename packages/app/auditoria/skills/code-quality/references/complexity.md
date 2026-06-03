# Complexity Metrics

## Cyclomatic complexity

Counts the number of independent paths through a function. Each decision point (if, else, case, &&, ||, catch, ternary) adds 1.

| Score | Risk | Action |
|---|---|---|
| 1-5 | Low | Simple, easy to test |
| 6-10 | Moderate | Consider simplifying |
| 11-20 | High | Must refactor — too many paths to test reliably |
| 21+ | Critical | Untestable. Split immediately. |

### Example

```csharp
public decimal CalculateDiscount(Order order) // CC = 1 (entry)
{
    if (order.Total > 1000)                    // +1 = 2
    {
        if (order.Customer.IsVip)              // +1 = 3
            return 0.20m;
        else if (order.Customer.LoyaltyYears > 5) // +1 = 4
            return 0.15m;
        else
            return 0.10m;
    }
    else if (order.Total > 500)                // +1 = 5
    {
        return order.Customer.IsVip ? 0.10m : 0.05m; // +1 = 6
    }
    return 0m;
}
// Cyclomatic complexity: 6
```

### How to reduce

1. **Replace conditional with polymorphism** — discount strategies instead of if/else chains.
2. **Extract guard clauses** — early returns for edge cases.
3. **Replace switch with dictionary/map** — `discountRules[customerType](order)`.
4. **Decompose into smaller functions** — each handles one decision.

## Cognitive complexity (SonarQube)

Measures how hard code is to **understand** (not just how many paths exist). Differs from cyclomatic complexity:

- Nesting increases the penalty (nested if inside a loop costs more than a flat if).
- `else if` is free (it's a continuation, not a new decision).
- Recursion adds a penalty (hard to trace mentally).
- Short-circuit operators (`&&`, `||`) in conditions are free (single mental unit).

| Score | Assessment |
|---|---|
| 0-5 | Clear and readable |
| 6-15 | Acceptable but watch it |
| 16-25 | Difficult to understand — refactor |
| 25+ | Incomprehensible — must split |

### Why cognitive > cyclomatic for reviews

```csharp
// Cyclomatic: 4 (same as a flat if-else chain)
// Cognitive: 10+ (nesting makes it much harder to follow)
for (var i = 0; i < orders.Count; i++)          // +1
{
    if (orders[i].Status == "active")             // +2 (nesting=1)
    {
        for (var j = 0; j < orders[i].Items.Count; j++)  // +3 (nesting=2)
        {
            if (orders[i].Items[j].Price > 100)   // +4 (nesting=3)
            {
                // logic
            }
        }
    }
}
```

Cyclomatic says "4 paths, moderate." Cognitive says "deeply nested, hard to follow." Cognitive is closer to what a reviewer feels.

## Coupling metrics

### Afferent coupling (Ca) — incoming

Number of types outside the module that depend on types inside the module.

High Ca = many dependents = changes are risky (high blast radius). This is your **stable core** — change carefully.

### Efferent coupling (Ce) — outgoing

Number of types inside the module that depend on types outside the module.

High Ce = many dependencies = the module is fragile (breaks when others change). Consider dependency inversion.

### Instability (I)

`I = Ce / (Ca + Ce)` — ranges from 0 (maximally stable) to 1 (maximally unstable).

- **I = 0:** Many dependents, no dependencies. Hard to change without breaking things. (Domain model, shared contracts.)
- **I = 1:** No dependents, many dependencies. Easy to change. (UI, infrastructure, adapters.)

The Stable Dependencies Principle: depend in the direction of stability (unstable → stable).

## Method-level metrics to check in reviews

| Metric | Threshold | Tool |
|---|---|---|
| Lines per method | <30 (aim for <15) | Any linter |
| Parameters per method | <4 (use object for more) | StyleCop, ESLint |
| Cyclomatic complexity | <10 | SonarQube, NDepend, ESLint |
| Cognitive complexity | <15 | SonarQube |
| Nesting depth | <3 levels | SonarQube, custom rules |
| Return statements | <5 (guard clauses are fine) | Manual review |

## Class-level metrics

| Metric | Threshold | Indicator |
|---|---|---|
| Lines per class | <300 | >500 = god class |
| Methods per class | <15 | >20 = too many responsibilities |
| Constructor parameters | <5 | >7 = too many dependencies |
| Fields per class | <10 | >15 = data clump or god class |
| Inheritance depth | <3 | >4 = fragile base class problem |

## Tooling

| Language | Tool | What it measures |
|---|---|---|
| C# / .NET | NDepend, SonarQube, Roslyn analyzers | All metrics + dependency graphs |
| TypeScript/JS | ESLint (complexity rule), SonarQube | Cyclomatic, cognitive, duplications |
| Python | radon, SonarQube | Cyclomatic, maintainability index |
| Multi-language | SonarQube / SonarCloud | All metrics, dashboard, quality gates |

### SonarQube quality gate example

```
- No new bugs
- No new vulnerabilities
- Code coverage on new code >= 80%
- Duplicated lines on new code < 3%
- Cognitive complexity per method < 15
```

Quality gates enforce standards automatically — PR can't merge if gate fails.

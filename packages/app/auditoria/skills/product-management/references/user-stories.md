# User Stories and Acceptance Criteria

Source: Mike Cohn (User Stories Applied), BDD (Dan North), INVEST criteria, Cucumber/Gherkin syntax.

## User story format

```
As a [role/persona],
I want [capability/action],
so that [benefit/outcome].
```

Every part earns its place:

- **Role**: not "user" — a specific persona or role with a name. "Warehouse manager", "first-time buyer", "billing admin." If the story applies equally to every user, say "any authenticated user" and question whether the story is specific enough.
- **Capability**: what the person wants to DO, described in their language, not implementation language. "See which orders are late" not "GET /api/orders?status=late."
- **Benefit**: why they care. This is the part that gets cut most often — and it's the most important part because it's how you judge whether the implementation actually solves the problem.

## INVEST criteria

Every user story should be:

| Letter | Criterion | What it means | Red flag |
|---|---|---|---|
| **I** | Independent | Can be built and delivered without depending on another story completing first | "This story only works after story #47 is done" |
| **N** | Negotiable | The implementation is open; the story describes the outcome, not the solution | "Use a modal dialog with a DataGrid component" |
| **V** | Valuable | Delivers value to the user or the business — not a technical task | "Refactor the authentication module" |
| **E** | Estimable | The team can estimate effort — the story is understood well enough | "Integrate with the partner system" (which partner? what data?) |
| **S** | Small | Can be completed in one sprint (ideally 1-3 days of work) | Epic-sized stories disguised as stories |
| **T** | Testable | You can write acceptance criteria that verify it's done | "The system should be user-friendly" |

## Acceptance criteria — BDD format (Given/When/Then)

```gherkin
Scenario: <descriptive name of the scenario>
  Given <initial context / precondition>
    And <additional context if needed>
  When <action the user takes>
    And <additional action if needed>
  Then <expected observable outcome>
    And <additional outcome if needed>
```

### Rules for good acceptance criteria

1. **Each criterion tests ONE behavior.** If a criterion has 5 "And" clauses in the "Then" block, it's testing too many things. Split it.
2. **Use concrete values, not placeholders.** "Given an order with 3 items totaling €150" not "Given an order with items." Concrete values expose edge cases.
3. **Cover the happy path AND the sad paths.** The happy path is obvious. The interesting criteria are: what happens when input is invalid? When the user has no permission? When the external service is down? When the list is empty?
4. **No implementation details.** "Then the system returns a 200 OK with JSON body" is a technical specification, not an acceptance criterion. "Then the order summary shows the updated total" is a behavior.
5. **Testable by QA without reading code.** If a QA engineer can't verify the criterion by interacting with the product, it's not a good criterion.

### Example: complete story with criteria

```markdown
### Story: View late orders

As a **warehouse manager**,
I want to **see which orders are overdue for shipment**,
so that **I can prioritize them and avoid SLA breaches**.

**Acceptance criteria:**

Scenario: Orders overdue by more than 24 hours appear in the late list
  Given there are 10 orders, 3 of which have a shipment deadline older than 24 hours
  When I open the order dashboard
  Then I see a "Late Orders" section showing exactly those 3 orders
    And each order shows the order ID, customer name, and hours overdue

Scenario: No late orders shows an empty state
  Given all orders have been shipped on time
  When I open the order dashboard
  Then the "Late Orders" section shows "All orders are on track" with a checkmark icon

Scenario: Clicking a late order navigates to its detail
  Given there are late orders visible
  When I click on a late order row
  Then I navigate to the order detail page for that order

Scenario: Late orders update in near real-time
  Given I am viewing the order dashboard
  When an order crosses the 24-hour overdue threshold
  Then it appears in the "Late Orders" section within 60 seconds
    And I receive a visual notification (badge or toast)
```

## Story mapping

For larger features, organize stories in a story map (Jeff Patton):

```
User Activity (horizontal axis — the narrative flow)
─────────────────────────────────────────────────────
  Step 1          Step 2          Step 3          Step 4
  ──────          ──────          ──────          ──────
  Story A (MVP)   Story D (MVP)   Story G (MVP)   Story J (MVP)
  Story B (v1.1)  Story E (v1.1)  Story H (v1.1)
  Story C (v2)    Story F (v2)                    Story K (v2)
```

The top row is the "walking skeleton" — the thinnest end-to-end flow that delivers value. Each row below adds depth. This is how you define MVP scope: draw a horizontal line across the map.

## Epics vs. stories vs. tasks

| Level | What it describes | Example | Who writes it |
|---|---|---|---|
| **Epic** | A user-facing capability area | "Order tracking for warehouse managers" | PM |
| **Story** | A specific user behavior within the epic | "View late orders" | PM |
| **Task** | A technical work item to implement the story | "Add `overdue` filter to orders query" | Engineering |

PMs write epics and stories. Engineers decompose stories into tasks. The PM should not write tasks — that's micromanaging implementation. The engineer should not write stories — that's deciding scope.

## Splitting stories that are too large

Techniques (ordered by preference):

1. **By workflow step.** "Manage orders" → "View orders", "Filter orders", "Export orders."
2. **By business rule.** "Calculate shipping cost" → "Flat rate shipping", "Weight-based shipping", "Free shipping threshold."
3. **By data variation.** "Import customer data" → "Import from CSV", "Import from Excel", "Import from API."
4. **By user role.** "Manage users" → "Admin manages users", "Manager views team."
5. **By happy path / edge case.** "Process payment" → "Successful payment", "Payment declined", "Payment timeout."
6. **By performance.** "Search products" → "Search with results <100ms" (MVP), "Search with autocomplete" (next), "Search with facets" (later).

## Anti-patterns in user stories

- **Technical stories disguised as user stories.** "As a developer, I want to refactor the auth module." This is a task, not a story. It delivers no user value. If refactoring is needed, attach it as a task to a story that DOES deliver user value.
- **Solution-first stories.** "As a user, I want a dropdown to select my country." Why a dropdown? What's the problem? Maybe a type-ahead is better. The story should say "I want to specify my country during checkout."
- **Stories without acceptance criteria.** If you can't write the criteria, the story isn't understood well enough to build.
- **Enormous stories.** If a story takes more than a sprint, it's an epic pretending to be a story. Split it.
- **Stories that only make sense together.** If Story B is meaningless without Story A, consider merging them or making the dependency explicit.
- **"As a system" stories.** The system is not a user. If you need to describe system behavior (batch jobs, integrations), use a different format — but don't force it into user story syntax.

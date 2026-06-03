# Review Comment Format and Severity Levels

## Severity prefixes

Every review comment starts with a severity prefix. This eliminates ambiguity — the author knows what must be fixed vs what's optional.

| Prefix | Meaning | Author action | Example |
|---|---|---|---|
| `blocking:` | Must fix before merge. Correctness, security, or design issue. | Fix or justify why not | `blocking: This SQL query is vulnerable to injection — use parameterized queries.` |
| `suggestion:` | Would improve the code but not required. | Fix or acknowledge | `suggestion: Extract this logic into a custom hook — it's reused in 3 components.` |
| `question:` | Need clarification to continue review. | Answer | `question: Is this intentionally ignoring the cancellation token? The caller passes one.` |
| `nit:` | Minor style preference. Take it or leave it. | Optional | `nit: I'd name this `ordersByCustomer` instead of `data` for clarity.` |
| `praise:` | Something done well. | None | `praise: Good use of the Result pattern here — clean error propagation.` |

## Comment structure

### Bad comment (what to avoid)

```
This is wrong.
```

No context, no explanation, no alternative. The author doesn't know what to fix or why.

### Good comment (what to write)

```
blocking: This catches Exception broadly and swallows the error by returning null.
If SaveChangesAsync fails due to a concurrency conflict, the caller gets null and
assumes the entity doesn't exist — it will silently create a duplicate.

Consider: catch DbUpdateConcurrencyException specifically and either retry or
throw. Let unexpected exceptions propagate to the global handler.

```csharp
catch (DbUpdateConcurrencyException)
{
    // Retry or return a conflict result
    return Result<Order>.Conflict("Order was modified by another user");
}
```
```

Structure: **What** (the issue) → **Why** (the impact) → **How** (the fix, with code).

## Tone guidelines

### Phrases to use

- "Consider..." — suggests without demanding.
- "I'd suggest..." — personal recommendation, not an order.
- "This could cause X because Y" — explains impact.
- "Have you considered...?" — opens a dialogue.
- "Nice approach here" — acknowledge good work.

### Phrases to avoid

- "Obviously..." — if it were obvious, they wouldn't have written it this way.
- "Just do X" — dismissive of complexity.
- "Why didn't you...?" — accusatory tone.
- "This is wrong" — without explanation is useless.
- "I would never..." — not constructive.

### Framing feedback

```
// BAD
"This function is too long and hard to read."

// GOOD
"suggestion: This function handles validation, transformation, and persistence —
three responsibilities. Extracting the validation into a separate method would
make each part independently testable and easier to follow."
```

The good version: names the specific concern, explains why it matters, and suggests a concrete action.

## Batch vs inline comments

| Type | When |
|---|---|
| **Inline comment** | Specific to a line or block of code |
| **File-level comment** | Applies to the file's structure, naming, or organization |
| **PR-level summary** | Overall assessment, cross-cutting concerns, approval status |

### PR-level summary template

```
## Summary

This PR adds order cancellation with refund processing. The core logic
is solid and well-tested.

### Must fix (blocking)
1. Missing authorization check — any user can cancel any order (#L45)
2. Race condition in concurrent cancellations (#L78)

### Suggestions
1. Extract refund calculation into a domain method (#L92)
2. Add integration test for the Stripe refund flow

### Positive
- Good use of domain events for the notification side effect
- Comprehensive unit tests for edge cases (partial refund, expired order)

**Verdict: Request changes** (2 blocking issues)
```

## Review etiquette

1. **Review the code, not the person.** "This code has a bug" not "You made a bug."
2. **Assume good intent.** The author chose their approach for a reason — ask before assuming it's wrong.
3. **One round of feedback.** Don't add new nitpicks on the second round of review after the author fixed your blocking issues. If it wasn't important enough to mention the first time, it's not important enough for a second round.
4. **Respond to all comments.** Authors should acknowledge or address every comment, even nits (a thumbs-up reaction is enough).
5. **Don't block on style.** If the code works correctly and is readable, style preferences shouldn't block a merge. File a ticket to update the style guide instead.

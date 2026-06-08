# Writing Style Guide

## Clarity rules

### Use active voice

```
❌ "The order is created by the service when a request is received."
✅ "The service creates an order when it receives a request."
```

Active voice: subject acts. Passive voice: subject is acted upon. Active is shorter, clearer, and easier to follow. Use passive only when the actor is unknown or irrelevant.

### Use present tense

```
❌ "The API will return a 201 status code."
❌ "The API returned a 201 status code."
✅ "The API returns a 201 status code."
```

Documentation describes how the system works NOW. Present tense.

### Use second person ("you")

```
❌ "The developer should configure the connection string."
❌ "One must configure the connection string."
✅ "Configure the connection string in appsettings.json."
✅ "You can configure the connection string in appsettings.json."
```

Directly address the reader. Imperative mood for instructions.

### One idea per sentence

```
❌ "The service validates the input and if the input is valid it creates the order 
    and publishes an event and if the input is invalid it returns a 400 error."

✅ "The service validates the input. If valid, it creates the order and publishes 
    an event. If invalid, it returns a 400 error."
```

Short sentences. One concept each. If a sentence has "and" three times, split it.

### Avoid jargon without context

```
❌ "The service uses CQRS with ES and publishes to the DLQ."

✅ "The service separates reads from writes (CQRS) and stores events as the 
    source of truth (event sourcing). Failed messages go to a dead letter queue 
    for retry."
```

Define acronyms on first use. Assume the reader is smart but unfamiliar with YOUR specific stack.

## Formatting

### Headers create scannable structure

```markdown
## Create an order                    ← Task-oriented (good)
## Order Creation Endpoint            ← Also acceptable
## Section 3.2.1: Order Subsystem     ← Academic paper (bad)
```

Use task-oriented or descriptive headers. Don't number sections (numbering breaks when you reorganize).

### Code blocks need language tags

````markdown
```csharp
var order = new Order { CustomerId = "C-1" };
```
````

Always specify the language for syntax highlighting. For shell commands, use `bash` or `shell`.

### Tables for structured comparisons

```markdown
| Option | Pros | Cons | Best for |
|---|---|---|---|
| PostgreSQL | ACID, relational | Scaling limits | Transactional data |
| MongoDB | Flexible schema | Weaker consistency | Document-heavy data |
```

Use tables when comparing 3+ options across 2+ dimensions. Don't use tables for single items (use a description list instead).

### Admonitions for callouts

```markdown
> **Note:** This requires .NET 8 or later.

> **Warning:** This operation is irreversible. Back up your data first.

> **Tip:** Use `--dry-run` to preview changes without applying them.
```

Use sparingly. If everything is a warning, nothing is. Reserve warnings for data loss, security implications, and breaking changes.

## Code examples

### Make examples copy-pasteable

```bash
# BAD — placeholders that aren't obvious
curl -X POST https://api.example.com/orders -H "Authorization: Bearer <token>"

# GOOD — clear placeholders with explanation
# Replace YOUR_TOKEN with your API key from Settings > API Keys
curl -X POST https://api.example.com/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"customerId": "C-1", "items": [{"productId": "P-1", "quantity": 2}]}'
```

### Show input AND output

```bash
$ curl https://api.example.com/orders/ORD-1

{
  "id": "ORD-1",
  "status": "active",
  "total": 99.99,
  "items": [
    { "productId": "P-1", "name": "Widget", "quantity": 2, "price": 49.995 }
  ]
}
```

The reader needs to know what to expect. Show the response.

### Annotate non-obvious parts

```csharp
var options = new DbContextOptionsBuilder<AppDbContext>()
    .UseNpgsql(connectionString)
    .EnableSensitiveDataLogging()    // ⚠️ Development only — logs SQL parameters
    .Options;
```

Inline comments on the line that needs explanation, not a paragraph before the code block.

## Writing process

1. **Outline first.** List the questions the reader will have. Each question becomes a section.
2. **Write the examples.** Code examples first, prose second. The examples ARE the documentation — the text explains the examples.
3. **Cut ruthlessly.** Remove every sentence that doesn't help the reader accomplish their goal. If you're explaining WHY in a how-to guide, move the explanation to a separate document and link to it.
4. **Test the examples.** Run every code example. If it doesn't work when you paste it, it won't work when the reader pastes it.
5. **Get a review.** Someone unfamiliar with the system should be able to follow the document. If they can't, the document needs work, not the reader.

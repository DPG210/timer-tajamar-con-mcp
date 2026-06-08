# Architecture Decision Records (ADRs)

Source: Michael Nygard (original ADR proposal), Joel Parker Henderson (ADR collection), ThoughtWorks Technology Radar.

## Purpose

An ADR captures a single architecture decision: what was decided, why, what alternatives were considered, and what consequences follow. Without ADRs, architecture decisions become tribal knowledge — and tribal knowledge dies when people leave.

## ADR template

```markdown
# ADR-NNN: <Title — short, imperative phrase>

**Date:** YYYY-MM-DD
**Status:** Proposed | Accepted | Deprecated | Superseded by ADR-XXX
**Deciders:** <who made or approved this decision>
**Technical area:** <system/subsystem/component affected>

## Context

<What is the situation that requires a decision? What forces are at play
(business requirements, technical constraints, team capabilities, time pressure)?
This section is pure FACTS — no opinion yet.>

## Decision

<The decision, stated as a single clear sentence.
"We will use PostgreSQL as the primary datastore for the Orders service."
Not: "We decided to maybe consider PostgreSQL.">

## Alternatives Considered

### Alternative 1: <name>
- **Description:** <what this option entails>
- **Pros:** <advantages>
- **Cons:** <disadvantages>
- **Why rejected:** <specific reason this wasn't chosen>

### Alternative 2: <name>
- **Description:** ...
- **Pros:** ...
- **Cons:** ...
- **Why rejected:** ...

### Alternative 3: <name> (if applicable)
...

## Consequences

### Positive
- <benefit 1>
- <benefit 2>

### Negative
- <accepted trade-off 1>
- <accepted trade-off 2>

### Risks
- <risk 1> — mitigation: <how we'll handle it>
- <risk 2> — mitigation: <how we'll handle it>

## Evolution triggers

<Under what conditions should this decision be revisited?>
- "If write throughput exceeds 10K TPS, evaluate sharding or a different datastore."
- "If the team adopts event sourcing, revisit the storage model."
- "Revisit in 12 months regardless."

## References

- <link to relevant design doc, RFC, benchmark, blog post>
- <link to related ADR if applicable>
```

## ADR lifecycle

```
Proposed → Accepted → [Active] → Deprecated / Superseded
```

- **Proposed:** Under discussion. Not yet binding.
- **Accepted:** Decision is made. Team commits to it.
- **Deprecated:** Decision is no longer relevant (system decommissioned, technology sunset).
- **Superseded:** A new ADR replaces this one. The old ADR links to the new one.

Never delete ADRs. They're a historical record. Even bad decisions have value as lessons.

## Numbering and organization

```
docs/
└── adrs/
    ├── ADR-001-use-postgresql-for-orders.md
    ├── ADR-002-adopt-modular-monolith.md
    ├── ADR-003-async-messaging-with-rabbitmq.md
    ├── ADR-004-supersedes-003-migrate-to-kafka.md
    └── INDEX.md  ← table with number, title, status, date
```

## What deserves an ADR

Not every decision needs an ADR. Use this filter:

| Deserves ADR | Does NOT deserve ADR |
|---|---|
| Database selection | Library version bump |
| Architecture style (monolith vs. microservices) | CSS framework choice |
| Communication protocol (REST vs. gRPC) | Naming convention for variables |
| Authentication strategy | Lint rule configuration |
| Caching strategy | IDE settings |
| Consistency model (strong vs. eventual) | Test file naming pattern |
| Build vs. Buy decision | Which mock library to use |
| Migration strategy (strangler fig vs. big bang) | Sprint planning process |

Rule of thumb: if the decision is hard to reverse and affects multiple teams or components, write an ADR.

## Common ADR mistakes

- **Missing "Alternatives Considered."** If there's only one option listed, you didn't do architecture — you did dictation. At least 2 alternatives.
- **Missing "Why rejected."** Listing alternatives without explaining why they lost is useless. Future readers need the reasoning, not just the list.
- **Vague consequences.** "Better performance" is not a consequence. "Reduced P99 latency from 800ms to 200ms for order queries based on benchmark X" is.
- **No evolution triggers.** Every decision has a shelf life. State when to revisit.
- **ADR written after the fact.** ADRs should be written BEFORE or DURING the decision, not months later when nobody remembers the context.
- **ADR by committee.** The architect PROPOSES, stakeholders REVIEW, one person DECIDES. If 10 people co-author an ADR, nobody owns it.

## Lightweight ADRs (for smaller decisions)

When the decision is important enough to document but not large enough for the full template:

```markdown
# ADR-NNN: <Title>

**Date:** YYYY-MM-DD | **Status:** Accepted

**Context:** <2-3 sentences>

**Decision:** <1 sentence>

**Consequences:** <2-3 bullet points>

**Revisit when:** <1 condition>
```

Use the full template for strategic decisions (database, architecture style, build vs. buy). Use the lightweight template for tactical decisions (caching strategy for a specific service, queue configuration).

# Prioritization Frameworks

Source: Sean Ellis (RICE), Intercom (prioritization), Noriaki Kano (Kano model), MoSCoW (DSDM).

## When to use which framework

| Framework | Best for | Not for |
|---|---|---|
| **RICE** | Comparing 5-20 features on a backlog | Strategic bets, platform decisions |
| **ICE** | Quick-and-dirty prioritization in a brainstorm | Anything needing rigor |
| **Kano** | Understanding user expectations vs. delight | Comparing effort |
| **MoSCoW** | Scope negotiation with stakeholders | Ranking within a priority tier |
| **Weighted scoring** | Complex multi-criteria decisions with stakeholders | Simple backlogs |
| **Cost of Delay** | Deciding sequencing when timing matters | Feature comparison in a vacuum |

## RICE

```
RICE Score = (Reach × Impact × Confidence) / Effort
```

| Factor | Definition | Scale |
|---|---|---|
| **Reach** | How many users/accounts will this affect in a quarter? | Absolute number (e.g., 5,000 users/quarter) |
| **Impact** | How much will this move the target metric per user? | 3 = massive, 2 = high, 1 = medium, 0.5 = low, 0.25 = minimal |
| **Confidence** | How sure are we about Reach and Impact estimates? | 100% = high (data), 80% = medium (intuition + some data), 50% = low (gut) |
| **Effort** | How many person-months will this take? | Person-months (e.g., 2) |

### RICE worked example

| Feature | Reach | Impact | Confidence | Effort | Score |
|---|---|---|---|---|---|
| Bulk order import | 2,000 | 2 | 80% | 3 | (2000 × 2 × 0.8) / 3 = **1,067** |
| Email notifications | 10,000 | 0.5 | 100% | 1 | (10000 × 0.5 × 1.0) / 1 = **5,000** |
| Advanced filtering | 500 | 3 | 50% | 4 | (500 × 3 × 0.5) / 4 = **188** |

### RICE pitfalls

- **Gaming Confidence.** If everything is 100% confidence, the factor is useless. Be honest — most things are 50-80%.
- **Ignoring Effort variance.** A feature estimated at 2 person-months could be 1 or 4. Factor estimation uncertainty into Confidence.
- **Comparing across teams.** RICE scores are relative within a team/backlog, not absolute across the company.
- **Over-reliance on the number.** RICE is a conversation starter, not a decision maker. If the #1 RICE item feels wrong, explore why — maybe Reach is overestimated or Impact is misjudged.

## ICE

```
ICE Score = Impact × Confidence × Ease
```

Simpler than RICE — no Reach factor, Ease instead of Effort (inverted). Useful for rapid prioritization in a workshop. Each factor scored 1-10.

Use ICE when you have 15 minutes and 30 ideas on a whiteboard. Use RICE when you're making a quarterly plan.

## Kano Model

Classifies features by how they affect user satisfaction:

| Category | If present | If absent | Example |
|---|---|---|---|
| **Must-be (basic)** | No increase in satisfaction | Strong dissatisfaction | Login works, data is saved |
| **One-dimensional (performance)** | Satisfaction increases proportionally | Dissatisfaction increases proportionally | Page load speed, search relevance |
| **Attractive (delight)** | Disproportionate satisfaction | No dissatisfaction | Smart autocomplete, proactive suggestions |
| **Indifferent** | No effect | No effect | Internal refactoring, framework upgrade |
| **Reverse** | Dissatisfaction | Satisfaction (!) | Unnecessary notifications, feature bloat |

### Using Kano for prioritization

1. **Must-be features are table stakes.** Don't celebrate them, just deliver them. Missing them is catastrophic.
2. **One-dimensional features are the bulk of the roadmap.** They're the competitive dimension — better search, faster performance, richer reports.
3. **Attractive features differentiate.** They're the "wow" factor — but they decay into one-dimensional over time (every competitor copies them).
4. **Indifferent features are waste.** If users don't care, why are we building it?
5. **Reverse features are traps.** More is not always better. Sometimes removing features increases satisfaction.

### Kano survey technique

Ask two questions per feature:

- Functional: "How would you feel if the product had [feature]?"
- Dysfunctional: "How would you feel if the product did NOT have [feature]?"

Answers: Like it / Expect it / Neutral / Can live with it / Dislike it.

Cross-reference the answers to classify the feature. This is the only evidence-based way to use Kano — don't classify by gut.

## MoSCoW

| Priority | Meaning | Rule |
|---|---|---|
| **Must have** | Non-negotiable for this release. Without it, the release is a failure. | Max 60% of effort budget |
| **Should have** | Important but not critical. The release works without it, but less well. | ~20% of effort budget |
| **Could have** | Nice-to-have. Include if there's time. | ~20% of effort budget |
| **Won't have (this time)** | Explicitly deferred. Documented for future reference. | No effort budget |

### When MoSCoW works well

- **Scope negotiation with non-technical stakeholders.** "Must" and "Won't" are intuitive.
- **Fixed-deadline projects.** When the date can't move, MoSCoW forces honest scope conversations.
- **Contract work.** Clear language for what's promised vs. what's aspirational.

### When MoSCoW fails

- **Everything is "Must have."** If 90% of items are Must, the framework isn't being used — it's being gamed. Apply the 60% rule.
- **"Won't have" becomes "next sprint."** Won't means "not this release." It doesn't promise it'll happen later. Stakeholders conflate the two.

## Weighted Scoring

For complex decisions with multiple stakeholders and criteria:

1. Define criteria (user value, revenue impact, strategic alignment, effort, risk).
2. Assign weights to criteria (must sum to 100%).
3. Score each option on each criterion (1-5 scale).
4. Calculate weighted total.

```
| Feature | User Value (30%) | Revenue (25%) | Strategy (20%) | Effort (15%) | Risk (10%) | Total |
|---|---|---|---|---|---|---|
| Feature A | 4 (1.2) | 3 (0.75) | 5 (1.0) | 2 (0.3) | 3 (0.3) | 3.55 |
| Feature B | 5 (1.5) | 2 (0.5) | 3 (0.6) | 4 (0.6) | 4 (0.4) | 3.60 |
```

Best for: quarterly planning with leadership, build-vs-buy decisions, platform investment decisions.

## Cost of Delay

When timing matters more than absolute value:

```
Cost of Delay = value lost per unit of time by NOT shipping this
CD3 = Cost of Delay / Duration
```

Use when: a regulatory deadline is approaching, a competitor just launched, a seasonal event is coming (Black Friday), a contract renewal depends on a feature.

Features with high cost of delay and short duration should jump the queue regardless of RICE score.

## Decision log

Every prioritization decision should be logged:

```markdown
**Decision:** Prioritize [X] over [Y]
**Framework used:** RICE / Kano / MoSCoW / Cost of Delay
**Key inputs:** <the data that drove the decision>
**Dissenting view:** <if someone disagreed, what was their argument>
**Revisit trigger:** <what would make us reconsider — new data, deadline change, competitor move>
```

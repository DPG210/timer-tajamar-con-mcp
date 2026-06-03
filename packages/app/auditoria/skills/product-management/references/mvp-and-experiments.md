# MVP Definition and Experiment Design

Source: Eric Ries (The Lean Startup), Marty Cagan (SVPG), Ash Maurya (Running Lean).

## What MVP actually means

MVP = **Minimum Viable Product**. The smallest thing that delivers value to a real user AND lets you learn whether your hypothesis is true.

MVP does NOT mean:
- A bad version of the full product.
- The first release with all features at 50% quality.
- A prototype (prototypes test usability; MVPs test value).
- Something you're embarrassed by (if it doesn't deliver value, it's not viable).

MVP DOES mean:
- The smallest scope that lets a real user accomplish a real goal.
- Something that produces measurable data about your hypothesis.
- Something you can build in weeks, not months.

## MVP types

| Type | What it is | When to use | What it tests |
|---|---|---|---|
| **Concierge MVP** | Deliver the value manually, person-to-person | You're unsure if the VALUE exists | Value risk |
| **Wizard of Oz MVP** | User thinks it's automated, you do it manually | You've validated value, unsure if automation works | Value + Usability |
| **Single-feature MVP** | One feature, no frills, end-to-end | Value is validated, you need to test feasibility at scale | Feasibility + Usability |
| **Piecemeal MVP** | Stitch together existing tools (Zapier, Google Forms, Airtable) | You want to test a workflow without building | Value + Usability |
| **Fake door MVP** | A button/link that doesn't work yet, measures clicks | You need quantitative signal on demand | Value (demand) |
| **Landing page MVP** | A page explaining the product, measures sign-ups | You need to test positioning and demand | Value + Business viability |

## Scoping the MVP

### Step 1: Write the hypothesis

```
We believe that [user segment]
will [desired behavior]
if we provide [proposed solution]
because [evidence or reasoning].

We'll know this is true when [measurable signal] reaches [target]
within [timeframe].
```

### Step 2: Identify the riskiest assumption

What's the ONE assumption that, if wrong, kills the entire initiative? Test that first. Common riskiest assumptions:

- Users actually have this problem (they might have found a workaround).
- Users are willing to change their behavior (switching costs are real).
- We can deliver the value at acceptable quality (technical feasibility).
- Users will pay for this (willingness to pay ≠ willingness to use).

### Step 3: Draw the "walking skeleton"

The thinnest possible end-to-end flow. One path. One user type. One scenario. No edge cases. No admin panel. No settings page. No import/export. Just: user does the thing → gets the value.

Example for an order tracking tool:
```
Walking skeleton:
1. User logs in (email + password, no SSO, no social login)
2. User sees list of today's orders (no filtering, no search, no pagination)
3. Late orders are highlighted in red (simple rule: >24h since placed, not shipped)
4. User clicks an order to see detail (read-only, no actions)
```

That's it. Everything else is Phase 2+.

### Step 4: Apply the "cut test"

For each item in scope, ask: "If we remove this, does the MVP still test the hypothesis?"

- If yes → remove it. It's not minimum.
- If no → keep it. It's necessary for the test.

### Step 5: Define kill criteria

Before building, agree on what would make you STOP:

```
Kill criteria:
- If fewer than 10% of target users engage with the feature within 2 weeks → kill or pivot.
- If the primary metric does not move by at least 5% within 30 days → investigate root cause.
- If user feedback is consistently "I already do this with [existing tool]" → pivot the approach.
```

## Experiment design template

```markdown
# Experiment: <name>

## Hypothesis
We believe [action] will [outcome] because [reasoning].

## Riskiest assumption
<The ONE assumption we're testing>

## Experiment type
<Fake door / Prototype test / A/B test / Concierge / etc.>

## Audience
- **Who:** <user segment>
- **How many:** <sample size needed for statistical significance, or "N/A for qualitative">
- **How selected:** <random sample / opt-in / targeted>

## Setup
<What we need to build/configure — keep it minimal>

## Measurement
- **Primary signal:** <what we're measuring>
- **Target:** <what success looks like>
- **Guardrails:** <what must NOT get worse>
- **Duration:** <how long we'll run it>

## Decision criteria
- **If signal ≥ target:** Proceed to [next step].
- **If signal < target but > [threshold]:** Investigate and iterate.
- **If signal < [threshold]:** Kill or pivot.

## Timeline
- Build: <dates>
- Run: <dates>
- Evaluate: <date>
- Decision: <date>
```

## A/B testing essentials

### Statistical significance

- **Sample size matters.** Use a sample size calculator before launching. For a 5% baseline conversion with a 20% relative MDE (minimum detectable effect), you need ~25,000 visitors per variant.
- **Don't peek.** Checking results daily and stopping when you see a "winner" inflates false positive rates. Set the duration upfront, wait, then evaluate.
- **One change per test.** If you change the button text, the color, and the layout, you don't know what worked.

### Common A/B test mistakes

- **Running too short.** One day is not enough. You need to capture a full weekly cycle at minimum (weekday/weekend behavior differs).
- **Not accounting for novelty effect.** A new feature looks great in week 1 because it's novel. Measure again in week 3-4.
- **Testing the wrong metric.** "Click-through rate on the new button" is a proxy. Does it actually move the downstream metric (conversion, retention)?
- **No guardrail metrics.** The new checkout flow increases conversion but doubles support tickets. Net negative.

## Post-MVP decision framework

After the MVP, you have data. Use it:

| Signal | Action |
|---|---|
| Strong positive (metric exceeded target) | Scale: invest in quality, edge cases, polish |
| Weak positive (metric moved but below target) | Iterate: identify friction, run targeted experiments |
| Neutral (no measurable change) | Pivot: the solution doesn't address the opportunity, try another approach |
| Negative (metric got worse) | Kill: either the problem isn't what we thought or the solution made it worse |

Never "just keep going" without evaluating. The MVP's job was to produce a decision. Make it.

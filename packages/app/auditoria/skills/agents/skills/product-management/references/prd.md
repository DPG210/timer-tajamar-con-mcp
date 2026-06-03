# PRD — Product Requirements Document

Source: SVPG (Marty Cagan), Lenny Rachitsky's PRD template, Reforge Product Strategy.

## Purpose

A PRD is a **decision document**, not a specification document. It captures: what problem we're solving, for whom, why now, how we'll know it worked, and what we're explicitly NOT doing. The engineering spec (API contracts, data model, architecture) lives elsewhere — the PRD feeds it.

## One-pager format (recommended default)

Use the one-pager for most initiatives. Expand only when complexity demands it.

```markdown
# PRD: <Initiative Name>

**Author:** <name>
**Date:** <date>
**Status:** Draft | In Review | Approved | Archived
**Stakeholders:** <list>

## 1. Problem Statement
<2-3 sentences. Who has this problem? What is the pain? What evidence do we have?>

## 2. Hypothesis
We believe that [action/solution] will result in [measurable outcome]
because [evidence or reasoning].

## 3. Success Metric
- **Primary metric:** <metric name> — target: <value> — evaluate after: <timeframe>
- **Guardrail metrics:** <metrics that must NOT degrade>
- **Input metrics (leading indicators):** <metrics we expect to move first>

## 4. User Segment
- **Primary:** <segment description, size estimate>
- **Secondary:** <if applicable>
- **Explicitly excluded:** <segments we are NOT targeting>

## 5. Scope

### In scope (MVP)
- <capability 1 — one sentence>
- <capability 2>
- <capability 3>

### Out of scope (not now)
- <thing we're deliberately NOT building, and why>
- <thing deferred to phase 2, and the trigger for reconsidering>

### Open questions
- <unresolved decision that blocks detailed design>

## 6. User Stories
<See references/user-stories.md for format>

### Story 1: <title>
As a [role], I want [capability] so that [benefit].

**Acceptance criteria:**
- Given [context], When [action], Then [outcome]
- Given [context], When [action], Then [outcome]

### Story 2: <title>
...

## 7. Risks and Mitigations
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| <risk> | High/Med/Low | High/Med/Low | <what we'll do> |

## 8. Dependencies
- <Team/system X needs to provide Y by Z>
- <Third-party service needs contract signed>

## 9. GTM Considerations
- <Rollout strategy: % rollout, feature flag, beta, GA>
- <Communication: changelog, email, in-app>
- <Support: docs, training, runbook>

## 10. Timeline
- **Discovery:** <dates>
- **Design:** <dates>
- **Build:** <dates>
- **Test/QA:** <dates>
- **Rollout:** <dates>
- **Evaluation:** <date when we measure the primary metric>
```

## Full PRD format (for complex or cross-team initiatives)

Extends the one-pager with:

- **Competitive context**: what alternatives the user has today (including doing nothing).
- **Technical constraints summary**: handed off from a spike or architecture review.
- **Data requirements**: what data the initiative produces/consumes, analytics instrumentation plan.
- **Accessibility requirements**: WCAG level, assistive technology considerations.
- **Internationalization requirements**: languages, locales, RTL support.
- **Legal/compliance**: GDPR consent flows, data residency, audit trail.
- **Rollback plan**: what happens if the metric doesn't move or moves negatively.
- **Post-launch plan**: who monitors, when we evaluate, what triggers iteration vs. sunset.

## Common PRD mistakes

- **No problem statement.** The PRD starts with the solution. Fix: write the problem first, then check if the solution actually addresses it.
- **Vanity metrics.** "Increase page views" is not a success metric — it doesn't map to user value. Fix: tie to an outcome the user cares about.
- **Everything is in scope.** If nothing is out of scope, scope isn't managed. Fix: force at least 3 items into "out of scope" and justify each.
- **Acceptance criteria you can't test.** "The system should be fast" is not testable. Fix: Given/When/Then with concrete values.
- **Missing "why now."** Why is this more important than the 47 other things we could build? Fix: link to business objective, metric pressure, or competitive urgency.
- **No rollback plan.** What happens if we ship and the metric goes the wrong way? Fix: define the kill criteria and rollback procedure.
- **PRD as contract.** The PRD is a living document. It changes as we learn. Versioning and a changelog are essential. Fix: add a changelog section at the bottom.

## PRD review checklist

Before sign-off, verify:

- [ ] Problem statement names the user and the pain, with evidence.
- [ ] Hypothesis is falsifiable — you can imagine a world where it's wrong.
- [ ] Primary metric has a numeric target and evaluation timeline.
- [ ] Guardrail metrics are defined (things that must not degrade).
- [ ] Scope has explicit "out of scope" items with rationale.
- [ ] User stories are behavior-focused, not implementation-focused.
- [ ] Acceptance criteria are testable (Given/When/Then).
- [ ] Risks are named with likelihood, impact, and mitigation.
- [ ] Dependencies are listed with owners and dates.
- [ ] GTM approach is defined (even if minimal).
- [ ] Timeline includes evaluation date, not just ship date.
- [ ] "Why now" is answered — why this over everything else.

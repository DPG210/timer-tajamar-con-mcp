# Metrics — North Star, OKRs, AARRR, Input/Output

Source: Amplitude (North Star Framework), John Doerr (Measure What Matters), Dave McClure (AARRR), Reforge (metrics hierarchy).

## Metrics hierarchy

Every product initiative connects to metrics at multiple levels. Understanding the hierarchy prevents two mistakes: measuring the wrong thing (too high-level to act on) and optimizing the wrong thing (too low-level to matter).

```
Business Metric (revenue, margin, market share)
    ↑ lags
North Star Metric (value delivered to users at scale)
    ↑ lags
Product Metrics (AARRR: acquisition, activation, retention, revenue, referral)
    ↑ lags
Feature Metrics (specific to this initiative)
    ↑ leads
Input Metrics (actions the team can directly influence)
```

## North Star Metric

The single metric that best captures the core value the product delivers to customers. Not revenue (that's a business metric). Not DAU (that measures visits, not value).

### Characteristics of a good North Star

- **Measures value delivery.** "Messages sent" for a messaging app. "Successful bookings" for a travel platform. "Queries answered" for a search engine.
- **Leading indicator of revenue.** If the North Star grows, revenue follows (with a lag). If revenue grows but the North Star doesn't, something is wrong (price increases, forced usage).
- **Actionable by the product team.** The team can run experiments that move it.
- **Not gameable without delivering value.** "Page views" is gameable (add more clicks). "Tasks completed" is harder to game.

### North Star Metric examples by product type

| Product type | North Star candidate | Why |
|---|---|---|
| Marketplace | Successful transactions / week | Both sides got value |
| SaaS B2B | Weekly active teams using core feature | Adoption of the value prop |
| E-commerce | Purchases per buyer / month | Repeat value delivered |
| Content platform | Content consumed to completion / week | Users found what they came for |
| Productivity tool | Tasks completed / active user / week | Tool is delivering on its promise |

### Input metrics for the North Star

The North Star is a lagging indicator — it moves after users experience value. To influence it, identify the **input metrics** (leading indicators) that the team can directly affect:

```
North Star: Successful bookings / week
  ├── Input: Search-to-result conversion rate (can we show relevant results?)
  ├── Input: Result-to-detail-view rate (are results compelling?)
  ├── Input: Detail-to-booking rate (is pricing/availability right?)
  └── Input: Booking completion rate (is checkout frictionless?)
```

Each input metric can be moved by a specific initiative. This is how you connect feature work to the North Star.

## OKRs — Objectives and Key Results

### Structure

```
Objective: <qualitative, inspirational, time-bound>
  KR1: <quantitative, measurable outcome> — baseline: X, target: Y
  KR2: <quantitative, measurable outcome> — baseline: X, target: Y
  KR3: <quantitative, measurable outcome> — baseline: X, target: Y
```

### Rules

- **Objectives are qualitative.** "Make the checkout experience effortless." Not "Increase checkout conversion by 15%." That's a Key Result.
- **Key Results are outcomes, not outputs.** "Reduce checkout abandonment from 68% to 55%" is a KR. "Ship redesigned checkout page" is NOT — it's a task. You can ship the page and abandonment stays at 68%.
- **3-5 KRs per Objective.** Fewer is better. More than 5 means the objective is too broad.
- **70% achievement is success.** If you hit 100% on every KR, your targets were too easy. OKRs should be ambitious (stretch goals), not commitments.
- **Baseline required.** You cannot set a target without knowing the current value. "Increase NPS" is meaningless without "from 32 to 45."
- **Cadence: quarterly.** Annual OKRs are too slow to learn. Weekly is too noisy. Quarterly balances ambition with feedback.

### OKR anti-patterns

| Anti-pattern | Example | Fix |
|---|---|---|
| Task list disguised as KRs | "KR: Launch new onboarding flow" | "KR: Increase 7-day activation rate from 34% to 50%" |
| Binary KRs | "KR: Implement SSO" | "KR: 60% of enterprise accounts use SSO within 90 days" |
| Vanity metric KRs | "KR: 1M page views" | "KR: 15% of visitors complete core action" |
| Too many OKRs | 5 objectives × 5 KRs = 25 things | Max 3 objectives × 3 KRs = 9 things |
| No baseline | "KR: Improve retention" | "KR: Increase 30-day retention from 22% to 35%" |
| 100% achievable | All KRs are within easy reach | Set targets that require real effort — 70% is success |

## AARRR — Pirate Metrics

Dave McClure's framework for understanding the user lifecycle:

| Stage | Question | Example metrics |
|---|---|---|
| **Acquisition** | How do users find us? | Visitors, sign-ups by channel, CAC |
| **Activation** | Do they have a good first experience? | Completed onboarding, reached "aha moment", time-to-value |
| **Retention** | Do they come back? | D1/D7/D30 retention, weekly active rate, churn rate |
| **Revenue** | Do they pay? | Conversion to paid, ARPU, LTV, expansion revenue |
| **Referral** | Do they tell others? | NPS, referral invites sent, viral coefficient |

### When to use AARRR

- **Diagnosing where the funnel leaks.** If acquisition is high but activation is low, the problem isn't marketing — it's the first-time experience.
- **Prioritizing initiatives.** Fixing retention before pouring money into acquisition is almost always higher ROI.
- **Balancing the portfolio.** If every initiative targets acquisition and none targets retention, the product is a leaky bucket.

### AARRR ≠ linear

Users don't move through AARRR stages once. They loop: retained users refer, referrals acquire, acquired users activate (or don't). The framework is a lens, not a funnel.

## Guardrail metrics

Metrics that must NOT degrade when you optimize your primary metric:

- **If you optimize activation**: guardrail retention (are activated users sticking around, or are you lowering the bar?).
- **If you optimize conversion to paid**: guardrail NPS/satisfaction (are you pressuring users into paying, or delivering enough value?).
- **If you optimize engagement**: guardrail support ticket volume (are you creating engagement or confusion?).

Every initiative declares its guardrails in the PRD.

## Instrumentation checklist

Before shipping, verify:

- [ ] Primary metric is instrumented and dashboarded.
- [ ] Baseline value is recorded BEFORE launch.
- [ ] Guardrail metrics are instrumented.
- [ ] Events fire on the correct user actions (not page loads).
- [ ] Metric definitions are documented (what counts, what doesn't, how edge cases are handled).
- [ ] A/B test framework is configured (if running an experiment).
- [ ] Evaluation date is calendared — someone will actually look at the data.

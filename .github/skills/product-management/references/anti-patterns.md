# Anti-patterns in Product Management

Patterns to flag during product review. Each entry has the symptom, why it's a problem, and the fix.

## Discovery anti-patterns

### Skipping discovery entirely

**Symptom:** The team goes from idea to building without validating the problem, the user need, or the solution approach.

**Why:** You build the wrong thing. The most expensive bugs are features nobody wants.

**Fix:** Minimum viable discovery: 5 user interviews + analytics review before committing to a build. Even a 1-week discovery sprint is better than none.

### Stakeholder wish list as discovery

**Symptom:** "Discovery" consists of collecting feature requests from sales, CS, and executives, then prioritizing the list.

**Why:** Stakeholders report symptoms and propose solutions. They rarely diagnose the root cause. "Customers want a dashboard" might mean "customers can't tell when something needs attention."

**Fix:** Use stakeholder input as signal, not specification. For every request, ask: "What problem does this solve for the user?" Then validate with actual users.

### Validating solutions before problems

**Symptom:** "We showed users a prototype and they liked it!"

**Why:** Users say yes to prototypes because they're polite, because it's new, or because you asked a leading question. Liking a prototype doesn't prove the problem is real.

**Fix:** Validate the problem first (interviews about current behavior, analytics showing the pain), then test solutions.

## PRD and planning anti-patterns

### Feature factory

**Symptom:** The roadmap is a list of features with dates. Success is measured by "did we ship it on time?" not "did the metric move?"

**Why:** Shipping features without measuring outcomes is manufacturing, not product development. You can ship 50 features and move zero metrics.

**Fix:** Every feature has a hypothesis and a success metric. Shipping is not done — measuring is done.

### Solution-first PRD

**Symptom:** The PRD starts with "We will build a [widget/API/dashboard]" without explaining what problem it solves.

**Why:** You might build the right solution to the wrong problem, or the wrong solution to the right problem.

**Fix:** PRD starts with Problem Statement, then Hypothesis, then Solution. Solution comes last because it's the most flexible part.

### Everything is P0

**Symptom:** Every item in the backlog is "critical" or "P0." Nothing is deprioritized.

**Why:** If everything is critical, nothing is. The team can't focus. They context-switch constantly. Quality degrades across the board.

**Fix:** Force-rank. Only 1-2 items can be P0 at any time. Use RICE or another framework to make the ranking explicit and defensible.

### No "out of scope" section

**Symptom:** The PRD lists what's in scope but never what's out of scope.

**Why:** Without explicit exclusions, scope creep is invisible. Every stakeholder assumes their thing is included.

**Fix:** At least 3 items in "out of scope" with rationale. "We considered X but chose not to include it because Y."

## Metrics anti-patterns

### Vanity metrics

**Symptom:** Success measured by page views, total sign-ups, or social media followers.

**Why:** These metrics go up and to the right even if the product is failing. They measure activity, not value.

**Fix:** Measure outcomes: activation rate, retention, revenue per user, NPS. Metrics that can go down are more honest than metrics that only go up.

### OKRs as task lists

**Symptom:** "KR: Launch redesigned checkout page."

**Why:** This is an output, not an outcome. You can launch the page and conversion gets worse. The KR should measure the outcome the page was supposed to produce.

**Fix:** "KR: Increase checkout conversion from 2.1% to 3.5%."

### No baseline

**Symptom:** "Improve retention" without knowing current retention.

**Why:** Without a baseline, you can't set a target. Without a target, you can't evaluate success. Without evaluation, you can't learn.

**Fix:** Measure the baseline before you start. If you can't measure it, that's the first thing to fix.

### Measuring the wrong thing

**Symptom:** Optimizing email open rates when the goal is conversion. Optimizing signup flow when the bottleneck is activation.

**Why:** Local optimization of the wrong metric wastes effort and can actively harm the global metric.

**Fix:** Map the full funnel. Find the bottleneck. Optimize the bottleneck.

## Prioritization anti-patterns

### HiPPO (Highest Paid Person's Opinion)

**Symptom:** Priorities are set by the most senior person in the room, not by evidence.

**Why:** Senior people have broader context but less user contact. Their intuition is useful input, not a substitute for data.

**Fix:** Use a prioritization framework (RICE, Kano) that makes criteria explicit. The HiPPO's input informs the scores; it doesn't override them.

### Recency bias

**Symptom:** The last customer complaint or sales request jumps to the top of the backlog.

**Why:** Individual incidents are anecdotes, not trends. One angry customer ≠ a systematic problem.

**Fix:** Track requests over time. If 3+ users report the same pain, it's a pattern. One user reporting it once is an anecdote.

### Sunk cost fallacy

**Symptom:** "We've already invested 3 months in this, we can't stop now."

**Why:** Past investment is irrelevant to future decisions. If the hypothesis is wrong, more investment doesn't make it right.

**Fix:** Evaluate kill criteria regularly. If the experiment data says stop, stop. The 3 months are spent either way.

## Communication anti-patterns

### Roadmap as contract

**Symptom:** Stakeholders treat the roadmap as a binding commitment. "You said Feature X would ship in Q2."

**Why:** Roadmaps are plans, not contracts. They change as you learn. If they don't change, you're not learning.

**Fix:** Communicate roadmaps as bets, not commitments. "We plan to address [outcome] in Q2. The specific solution may change as we learn."

### Surprise launches

**Symptom:** Support, sales, and marketing learn about a feature when it ships (or from a customer).

**Why:** Misalignment. Support can't answer questions. Sales can't position it. Marketing can't amplify it.

**Fix:** Communication plan with progressive disclosure: beta users first, internal teams second, public third. No surprises.

### Saying yes to everything

**Symptom:** PM never pushes back on requests. The backlog grows indefinitely. Nothing gets done well.

**Why:** Fear of conflict, desire to please, lack of prioritization framework.

**Fix:** Saying no is a PM's core job. Use the "understand the need, not the solution" template. Acknowledge the pain, explain the prioritization, offer a timeline for reconsideration.

## Execution anti-patterns

### MVP = half-baked V1

**Symptom:** "MVP" is used to justify shipping something that doesn't deliver value. "It's an MVP, we'll fix it later."

**Why:** An MVP that doesn't deliver value doesn't test the hypothesis. You learn nothing. Users are frustrated. You've wasted time.

**Fix:** MVP = minimum VIABLE product. If it doesn't deliver value to at least one user, it's not viable. Cut scope, don't cut quality.

### Ship and forget

**Symptom:** Feature ships. Team moves to next feature. Nobody checks if the metric moved.

**Why:** Without evaluation, you can't learn. You might be shipping features that don't work, and you'd never know.

**Fix:** Calendar the evaluation date in the PRD. Assign someone to review the metrics. Make it a team ritual.

### Perfectionism

**Symptom:** Feature is polished to perfection before anyone uses it. Edge cases are handled before the happy path is validated.

**Why:** Perfectionism is procrastination in disguise. You're avoiding the risk of being wrong by never putting it in front of users.

**Fix:** Ship the walking skeleton first. Polish is earned by validating value.

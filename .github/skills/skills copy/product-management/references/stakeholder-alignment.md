# Stakeholder Communication and Alignment

Source: Marty Cagan (SVPG — Empowered), Julie Zhuo (The Making of a Manager), RACI framework.

## Why alignment matters

Misaligned stakeholders produce: scope creep after build starts, conflicting priorities discovered at launch, "I didn't know about this" moments that block releases, and political friction that kills good products.

Alignment is not consensus. Consensus means everyone agrees. Alignment means everyone understands the decision, the reasoning, and their role — even if they disagree.

## Stakeholder mapping

### Power/Interest grid

```
              High Interest
                  ↑
   ┌──────────────┼──────────────┐
   │              │              │
   │   KEEP       │   MANAGE     │
   │   INFORMED   │   CLOSELY    │
   │              │              │
   ├──────────────┼──────────────┤
   │              │              │
   │   MONITOR    │   KEEP       │
   │              │   SATISFIED  │
   │              │              │
   └──────────────┼──────────────┘
                  ↑
              High Power
```

- **Manage Closely (high power, high interest):** Direct involvement in decisions. These are your sponsors and key decision-makers. Regular 1:1 updates.
- **Keep Satisfied (high power, low interest):** Don't surprise them. Periodic summary updates. Escalate only when needed.
- **Keep Informed (low power, high interest):** They care deeply but can't block you. Regular comms, invite input.
- **Monitor (low power, low interest):** Minimal communication. Include in broadcasts.

### Identifying stakeholders

For any product initiative, the typical stakeholder set:

| Stakeholder | Interest | Typical concern |
|---|---|---|
| Executive sponsor | Strategic alignment, ROI | "Does this move the needle?" |
| Engineering lead | Feasibility, team capacity | "Can we build this with what we have?" |
| Design lead | User experience, consistency | "Does this fit the design system?" |
| Sales/CS | Customer impact, positioning | "Can I sell this? Will it reduce churn?" |
| Marketing | Messaging, launch timing | "How do I position this?" |
| Legal/Compliance | Regulatory risk | "Does this comply with X?" |
| Finance | Budget, revenue impact | "What's the ROI? What's the cost?" |
| Support | Operational impact | "Will this increase ticket volume?" |
| Data/Analytics | Measurement, instrumentation | "Can we measure success?" |

## Communication cadence

| Frequency | Audience | Format | Content |
|---|---|---|---|
| **Weekly** | Core team (eng, design, PM) | Standup / async update | What shipped, what's blocked, decisions needed |
| **Biweekly** | Manage Closely stakeholders | 15-min sync or Loom video | Progress vs. plan, risks, decisions made |
| **Monthly** | Keep Informed + Keep Satisfied | Written update (email/doc) | Summary of progress, upcoming milestones, metric trends |
| **Quarterly** | All stakeholders | Review meeting or deck | Outcomes vs. OKRs, learnings, next quarter plan |
| **Ad hoc** | Anyone affected | Slack/email | Decisions that affect them, changes in scope/timeline |

## Decision communication template

When you make or communicate a product decision:

```markdown
## Decision: <what was decided>

**Context:** <1-2 sentences on why this decision was needed>

**Options considered:**
1. <Option A> — <pros / cons summary>
2. <Option B> — <pros / cons summary>
3. <Option C> — <pros / cons summary>

**Decision:** <which option, and why>

**What this means for you:**
- Engineering: <impact>
- Design: <impact>
- Sales: <impact>
- Support: <impact>

**What we're NOT doing (and why):**
- <deferred option and reasoning>

**Open items:**
- <anything still unresolved>

**Feedback window:** <date by which to raise concerns>
```

## Handling disagreement

### DACI framework

| Role | Who | Responsibility |
|---|---|---|
| **D** — Driver | PM (usually) | Drives the process, gathers input, ensures a decision is made |
| **A** — Approver | One person (sponsor, VP) | Makes the final call. ONE person. |
| **C** — Contributors | SMEs, stakeholders | Provide input, analysis, recommendations |
| **I** — Informed | Broader team | Notified after the decision is made |

Rules:
- There is exactly ONE Approver per decision.
- Contributors have voice but not vote.
- Informed people don't get to reopen the decision.
- The Driver ensures the decision happens on time.

### Disagree and commit

When a stakeholder disagrees:

1. **Acknowledge the disagreement explicitly.** "I hear that you think we should prioritize X over Y."
2. **Explain the reasoning.** Not "because I said so" — the evidence, the trade-offs, the criteria.
3. **Document the dissent.** In the decision log: "Sales preferred Option B because of contract renewal timing. We chose Option A because it addresses 3x more users. Sales committed to supporting Option A launch."
4. **Ask for commitment.** "Can you support this decision even though you'd have chosen differently?"
5. **Set a revisit trigger.** "We'll revisit this in 30 days if [condition]." This gives the dissenter an explicit path back.

## Roadmap communication

### Format: Now / Next / Later

| Now (this quarter) | Next (next quarter) | Later (future) |
|---|---|---|
| Specific initiatives with defined scope | Outcome-level commitments with flexible scope | Strategic themes, no scope commitment |
| "We're building X to move metric Y" | "We plan to address problem Z" | "We're exploring area W" |
| High confidence | Medium confidence | Low confidence |

### Roadmap anti-patterns

- **Feature list with dates.** This is a project plan, not a roadmap. It communicates certainty that doesn't exist and invites "but you promised X by March."
- **Roadmap as contract.** A roadmap is a plan, not a commitment. It changes as you learn. Communicate this explicitly.
- **No outcomes, only outputs.** "Launch checkout redesign" is an output. "Increase checkout conversion from 2.1% to 3.5%" is an outcome. Roadmaps should communicate outcomes.
- **No "won't do" section.** If stakeholders don't know what's excluded, they'll assume everything is coming.

## Saying no to stakeholders

Stakeholders will request features. Most requests come from a real need — but the proposed solution is usually wrong. The PM's job is to understand the NEED, not to accept the SOLUTION.

Template for saying no:

```
"I understand you're seeing [problem/need]. That's consistent with what we're hearing
from [other source]. Right now, we're prioritizing [current initiative] because
[reasoning]. I've added [their need] to the opportunity space — it'll be evaluated
in [next planning cycle] against other opportunities using [criteria].
If the urgency changes, let me know and we'll reassess."
```

What NOT to say:
- "We'll add it to the backlog." (The backlog is where ideas go to die.)
- "Great idea, we'll do it next quarter." (Don't promise if you haven't prioritized.)
- "That's not our problem." (It may not be your SOLUTION, but the problem is real.)

# Discovery and Opportunity Solution Trees

Source: Teresa Torres (Continuous Discovery Habits), Marty Cagan (SVPG — Inspired, Empowered), Strategyzer (Value Proposition Canvas).

## What is discovery

Discovery answers: **Should we build this?** Delivery answers: **Can we build this?** Discovery is not a phase — it's a continuous practice that runs alongside delivery, every week.

Discovery has four questions:

1. **Is this problem real?** (Value risk) — Do users actually have this pain?
2. **Can users figure it out?** (Usability risk) — Will they understand the solution?
3. **Can we build it?** (Feasibility risk) — Do we have the tech, skills, and time?
4. **Does the business want this?** (Business viability risk) — Does it align with strategy, revenue model, compliance?

Strong teams test all four risks before building at scale.

## Opportunity Solution Tree (OST)

Teresa Torres' framework for connecting outcomes to experiments:

```
Desired Outcome (the metric you're trying to move)
├── Opportunity 1 (a user need, pain point, or desire discovered through research)
│   ├── Solution A
│   │   ├── Experiment A1 (how we test if Solution A works)
│   │   └── Experiment A2
│   └── Solution B
│       └── Experiment B1
├── Opportunity 2
│   ├── Solution C
│   │   └── Experiment C1
│   └── Solution D
│       └── Experiment D1
└── Opportunity 3
    └── Solution E
        └── Experiment E1
```

### Building the OST

**Step 1: Start with the outcome.**
Not a feature. Not an initiative. An outcome — a metric you're trying to move. "Increase 7-day activation rate from 34% to 50%."

**Step 2: Map the opportunity space.**
Through user research (interviews, observations, data analysis), identify the user needs, pain points, and desires that, if addressed, would move the outcome. These are the opportunities.

Rules for opportunities:
- They describe the **user's** world, not the product's features.
- They come from **evidence** (research), not brainstorming.
- They're framed as needs: "Warehouse managers need to know which orders are at risk of missing SLA before it's too late."
- They're **mutually exclusive** where possible — overlapping opportunities create confusion.

**Step 3: Generate solutions per opportunity.**
For each opportunity, brainstorm multiple solutions. The key word is **multiple** — if there's only one solution, you haven't explored enough. At least 3 per opportunity.

**Step 4: Design experiments per solution.**
For each solution, design the cheapest experiment that reduces the biggest risk. Not "build and see" — the smallest thing that teaches you whether the solution would work.

### Keeping the OST alive

The OST is not a one-time artifact. It evolves weekly:
- New opportunities emerge from ongoing research.
- Experiments produce results that validate or kill solutions.
- Dead branches get pruned.
- New solutions emerge for validated opportunities.

## Types of assumptions to test

| Risk | Assumption type | Example | Test method |
|---|---|---|---|
| **Value** | Users have this problem | "Warehouse managers manually track late orders" | User interviews, analytics |
| **Value** | Users want this solution | "They would use an automated alert" | Prototype test, fake-door test |
| **Usability** | Users can use it | "They can find and understand the late orders view" | Usability test with prototype |
| **Feasibility** | We can build it | "We can detect late orders in <5 seconds with current infra" | Technical spike |
| **Feasibility** | We can build it in time | "This fits in one sprint" | Estimation + historical velocity |
| **Business** | It's legal/compliant | "Sending automated alerts complies with GDPR" | Legal review |
| **Business** | It makes financial sense | "The feature reduces churn enough to justify 2 sprints of work" | Unit economics model |

## Assumption mapping

Plot assumptions on a 2×2 matrix:

```
                High importance (if wrong, the idea fails)
                        ↑
    ┌───────────────────┼───────────────────┐
    │                   │                   │
    │   Test LATER      │   Test FIRST      │
    │  (important but   │  (important and   │
    │   we know a lot)  │   we know little) │
    │                   │                   │
    ├───────────────────┼───────────────────┤
    │                   │                   │
    │   Skip            │   Test IF time    │
    │  (unimportant,    │  (unimportant,    │
    │   known)          │   unknown)        │
    │                   │                   │
    └───────────────────┼───────────────────┘
                        ↑
                Low knowledge (we don't know if it's true)
```

Test the top-right quadrant first: high importance, low knowledge. These are the "leap of faith" assumptions.

## Experiment types (ordered by cost and fidelity)

| Experiment | Cost | Fidelity | When to use |
|---|---|---|---|
| **Desk research** | Minutes | Low | Market exists? Competitors? Benchmarks? |
| **User interviews** | Hours | Medium | Understanding the problem space |
| **Survey** | Days | Medium-Low | Quantifying how many people have the problem |
| **Fake door / painted door** | Days | Medium | Does anyone want this? (click-through rate) |
| **Concierge** | Days-weeks | High | Can manual delivery of the value validate demand? |
| **Wizard of Oz** | Weeks | High | User thinks it's automated, you do it manually behind the scenes |
| **Prototype test** | Days | Medium-High | Can users figure out the UI? |
| **A/B test (feature flag)** | Weeks | High | Does the feature move the metric? |
| **Beta / limited release** | Weeks | High | Does it work at small scale before wide release? |

Rule: always pick the **cheapest** experiment that reduces the **biggest** risk.

## Weekly discovery cadence (Teresa Torres)

| Day | Activity |
|---|---|
| **Monday** | Review OST — what did we learn last week? Update branches. |
| **Tuesday** | User interview (1 per week minimum) |
| **Wednesday** | Synthesize — update opportunities based on what we heard |
| **Thursday** | Design experiments for top solutions |
| **Friday** | Ship experiments (prototype, fake door, or feature flag) |

This cadence assumes a team doing both discovery and delivery. The PM and designer drive discovery; the whole team is aware of findings.

## Continuous interviewing

### Rules for user interviews in discovery

1. **Interview weekly.** Not quarterly. Not "when we have a project." Weekly, as a habit.
2. **Talk to actual users.** Not internal stakeholders. Not your manager. Users who experience the problem.
3. **Ask about past behavior, not future intent.** "Tell me about the last time you had to track a late order" not "Would you use a feature that...?"
4. **Don't pitch solutions.** If you describe your solution and ask "would you use this?", the answer is always yes. Show a prototype and watch them use it instead.
5. **Capture opportunities, not feature requests.** Users say "I need a button to export." The opportunity is: "I need to share order data with my logistics partner." The button is one of many possible solutions.

### Interview question framework

```
Opening: "Tell me about how you [relevant activity] today."
Timeline: "Walk me through the last time you did that."
Pain points: "What's the hardest part of that?"
Current solutions: "How do you handle that today?"
Impact: "What happens when it goes wrong?"
Closing: "Is there anything else about [topic] that I should know?"
```

Never ask: "Would you pay for X?", "Do you like this idea?", "How much would you pay?"

## Anti-patterns in discovery

- **Discovery as a phase.** "We'll do 2 weeks of discovery, then build." Discovery is continuous. If you stop learning when you start building, you're flying blind.
- **Stakeholder wish lists as discovery.** Collecting feature requests from stakeholders is input gathering, not discovery. It answers "what do stakeholders want?" not "what do users need?"
- **Building experiments that are actually MVPs.** An experiment tests an assumption. An MVP delivers value. If your "experiment" takes 3 sprints to build, it's not an experiment — it's a product bet.
- **Validating solutions before validating problems.** "Users want a dashboard" — do they? Or do they want to know if something needs their attention? Test the problem first.
- **Confirmation bias.** Designing interviews to confirm what you already believe. Cure: have someone else review your interview script.

---
name: product-management
description: Professional product management knowledge for senior PM work. Use this skill whenever the user asks for help defining a product problem, writing a PRD, creating user stories, prioritizing a backlog, designing experiments, defining metrics (North Star, OKR, AARRR), running discovery, mapping opportunities, evaluating build vs. buy, planning GTM, or making scope/priority/trade-off decisions. Trigger on any mention of PRD, product requirements, user stories, acceptance criteria, BDD, backlog, roadmap, OKR, North Star metric, RICE, Kano, opportunity solution tree, discovery, MVP, product-market fit, Go-To-Market, feature prioritization, or stakeholder alignment. Use this even when the user doesn't explicitly say "product management" — apply it whenever the task is about deciding WHAT to build, for WHOM, WHY, and HOW to measure success.
---

# Product Management

A reference skill for doing professional product management work that follows the frameworks and practices established by Marty Cagan (SVPG), Teresa Torres, the Reforge curriculum, and the broader outcome-driven product community.

This skill exists to keep two failure modes out of the output:

1. **Feature factory thinking** — jumping to solutions without validating the problem, shipping features without success metrics, writing requirements that describe implementation instead of outcomes, building roadmaps that are lists of features with dates instead of bets on problems worth solving.
2. **Framework theater** — applying RICE to three items when the real question is "should we do this at all?", writing OKRs that are disguised task lists, building Opportunity Solution Trees that are just feature lists in a tree shape, running "discovery" that's really just stakeholder opinion collection.

The goal is to do product work the way strong product teams do it: start with a real problem backed by evidence, define what success looks like before building, make scope decisions based on impact and risk, and ship learning before shipping features.

## When to consult this skill

Pull this skill in for any of:

- Defining or refining a product problem statement.
- Writing a PRD (Product Requirements Document) — one-pager or full.
- Creating user stories with acceptance criteria (BDD format).
- Prioritization decisions (RICE, ICE, Kano, MoSCoW, weighted scoring).
- Defining metrics: North Star, OKRs, AARRR pirate metrics, input/output metrics.
- Discovery work: opportunity mapping, assumption testing, experiment design.
- Opportunity Solution Trees (Teresa Torres).
- MVP definition — what's in, what's out, and why.
- Build vs. Buy evaluation.
- Go-To-Market planning.
- Stakeholder alignment and communication.
- Roadmap creation (now/next/later, outcome-based).
- Competitive analysis and positioning.
- User segmentation and persona definition.

## Core principles — apply in order

1. **Problem before solution.** Every piece of product work starts with a problem statement that names the user, the pain, the context, and the evidence. "We need a dashboard" is not a problem — it's a solution. "Operations managers spend 3 hours/day manually reconciling orders across two systems" is a problem.

2. **Outcomes over outputs.** The measure of success is never "we shipped the feature." It's "the metric moved." If you can't name the metric, you can't evaluate the feature. Every PRD declares its success metric before the first wireframe.

3. **Evidence over opinion.** User research, analytics, support tickets, sales calls, churn interviews — these are evidence. "The CEO thinks we need X" is a stakeholder input, not evidence. Both matter; they're not the same thing. Label them correctly.

4. **Smallest thing that tests the hypothesis.** MVP doesn't mean "bad version of the full product." It means "smallest thing that lets us learn whether our hypothesis is true." Sometimes that's a landing page. Sometimes that's a concierge service. Sometimes that's a feature flag on 5% of traffic. Size it to the risk.

5. **Scope is the variable.** The iron triangle has three sides: scope, time, resources. Strong teams fix time and resources, flex scope. A PRD that promises fixed scope in fixed time with fixed team is a fiction. Call it out.

6. **One metric per initiative.** An initiative can have guardrail metrics (things that must not get worse) and input metrics (leading indicators), but it has ONE primary success metric. If it has three equally weighted metrics, it has zero — because every trade-off decision becomes a debate.

7. **User stories describe behavior, not implementation.** "As a user, I want a REST API endpoint" is not a user story. "As a warehouse manager, I want to see which orders are late so I can prioritize them" is. Stories describe the who, the what, and the why — never the how.

8. **Acceptance criteria are testable.** Every criterion can be verified with a concrete scenario: Given [context], When [action], Then [outcome]. If you can't write the scenario, the criterion is vague.

9. **Prioritization is about saying no.** The value of RICE/ICE/Kano is not the score — it's the conversation. The frameworks force you to estimate reach, impact, confidence, and effort explicitly, which makes disagreements visible and resolvable. Don't game the scores; use them to surface assumptions.

10. **Discovery is continuous, not a phase.** You don't "finish discovery" and "start delivery." You're always discovering — every sprint, every user conversation, every metric review. The ratio shifts (more discovery early, more delivery later), but it never goes to zero.

11. **Communicate decisions, not just conclusions.** Stakeholders need to know what was decided, what was considered and rejected, and why. A PRD without a "What we're NOT doing" section is incomplete.

## Workflow — for any non-trivial product task

1. **Establish the business context.** What business objective does this serve? What user segment? What stage is the product in (pre-PMF, growth, maturity)? What constraints exist (time, budget, compliance, team)?

2. **Define the problem with evidence.** User research quotes, analytics data, support ticket volume, churn reasons, competitive pressure — what evidence says this problem is worth solving? If there's no evidence, the first task is to get some.

3. **Map the opportunity space.** What outcomes are we trying to drive? What opportunities exist within those outcomes? What solutions could address those opportunities? (This is the Opportunity Solution Tree structure.)

4. **Evaluate and prioritize.** Use the right framework for the decision at hand. RICE for comparing features. Kano for understanding user expectations. MoSCoW for scope negotiation. Weighted scoring for complex multi-criteria decisions.

5. **Define the MVP and success criteria.** What's the smallest scope that tests the core hypothesis? What metric will we measure? What's the target? What's the timeline for evaluation?

6. **Write the PRD.** One-pager format: problem, hypothesis, success metric, scope (in/out), user stories with acceptance criteria, risks, dependencies, GTM considerations.

7. **Align stakeholders.** Share the PRD, get feedback, resolve disagreements, document decisions. The PRD is a living document until sign-off.

8. **Hand off to execution with context.** The Architect needs the constraints, the SLA expectations, the scale assumptions. The UX needs the user segments, the jobs-to-be-done, the success criteria. Don't throw a PRD over the wall — transfer context.

## Reference index — load on demand

| Topic | File | When to read |
|---|---|---|
| PRD structure and writing guide | `references/prd.md` | Writing or reviewing a PRD |
| User stories and acceptance criteria (BDD) | `references/user-stories.md` | Writing stories, defining acceptance criteria |
| Metrics: North Star, OKRs, AARRR, input/output | `references/metrics.md` | Defining success metrics, OKRs, KPIs |
| Prioritization frameworks (RICE, ICE, Kano, MoSCoW) | `references/prioritization.md` | Making priority decisions, backlog grooming |
| Discovery and Opportunity Solution Trees | `references/discovery.md` | Running discovery, mapping opportunities |
| MVP definition and experiment design | `references/mvp-and-experiments.md` | Scoping MVP, designing experiments |
| Go-To-Market planning | `references/go-to-market.md` | Planning launch, rollout strategy |
| Stakeholder communication and alignment | `references/stakeholder-alignment.md` | Communicating decisions, managing expectations |
| Competitive analysis and positioning | `references/competitive-analysis.md` | Analyzing competition, positioning product |
| User segmentation and personas | `references/segmentation.md` | Defining user segments, building personas |
| Anti-patterns in product management | `references/anti-patterns.md` | Reviewing product decisions, spotting red flags |

## Output expectations

When the agent produces product artifacts from this skill, they should:

- Start with a problem statement backed by evidence (or explicit assumptions if evidence is unavailable).
- Include a clear success metric with a target and evaluation timeline.
- Scope decisions are explicit — what's IN and what's OUT, with rationale.
- User stories follow "As a [role], I want [capability] so that [benefit]" and have BDD acceptance criteria.
- Prioritization uses a named framework with visible inputs (not just a final score).
- Risks are named with likelihood and impact, not hidden in footnotes.
- Dependencies on other teams/systems are called out explicitly.
- "Not doing" section exists in every PRD.
- No feature is proposed without a hypothesis: "We believe [action] will result in [outcome] because [evidence/reasoning]."

When the agent reviews existing product work, it should call out:

- Missing problem statement or solution-first thinking.
- Features without success metrics.
- User stories that describe implementation ("API endpoint") instead of behavior.
- Acceptance criteria that aren't testable (can't write a Given/When/Then).
- Scope presented as fixed alongside fixed timeline and fixed team.
- Prioritization without explicit criteria.
- Missing "what we're NOT doing" section.
- OKRs that are disguised task lists (Key Results are outputs, not outcomes).
- Discovery skipped or conflated with stakeholder wish-list collection.
- MVPs that are actually V1 of the full product.

## Closing each response

After delivering product work, finish with:

1. **What assumptions were made** about the business context, user segment, or constraints. If the user's reality differs, the deliverable needs adjustment.
2. **What was deliberately not included** (competitive analysis, GTM, detailed user research) and why.
3. **One follow-up question** offering to go deeper on the most relevant adjacent topic (metrics definition, experiment design, stakeholder communication, user research plan).

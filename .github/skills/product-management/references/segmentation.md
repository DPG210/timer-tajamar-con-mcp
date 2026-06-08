# User Segmentation and Personas

Source: Alan Cooper (About Face), JTBD (Clayton Christensen, Bob Moesta), Intercom (Jobs-to-be-Done framework).

## Purpose

Segmentation answers: "Who are our users, and how do they differ in ways that matter for product decisions?" Not all users are the same. A feature that delights power users can overwhelm new users. A pricing tier that works for SMB fails for enterprise. Segmentation makes these differences visible and actionable.

## Segmentation approaches

### Behavioral segmentation (recommended default)

Segment by what users DO, not who they ARE:

| Segment | Based on | Example |
|---|---|---|
| **Usage frequency** | How often they use the product | Daily active, weekly active, monthly active |
| **Feature adoption** | Which features they use | Core-only users, power users, API users |
| **Workflow pattern** | How they accomplish their goals | Self-serve, collaborative, admin-heavy |
| **Lifecycle stage** | Where they are in the journey | New (< 7 days), Activated, Retained, At-risk, Churned |
| **Value received** | How much value they extract | High (achieved outcome), Low (struggling) |

Behavioral segmentation is actionable because you can observe it in analytics and design for it.

### Demographic segmentation

Segment by who users ARE:

| Dimension | Examples |
|---|---|
| Company size | Solo, SMB (1-50), Mid-market (50-500), Enterprise (500+) |
| Industry | Healthcare, Finance, Retail, Tech, Education |
| Role | IC, Manager, Executive, Admin |
| Geography | Region, country, urban/rural |
| Technical sophistication | Non-technical, semi-technical, developer |

Demographic segmentation is useful for GTM and pricing decisions, less useful for feature design (because two CTOs in the same company size can have wildly different needs).

### Jobs-to-be-Done segmentation

Segment by the JOB users are trying to accomplish:

```
When [situation],
I want to [motivation],
so I can [expected outcome].
```

Example jobs for a project management tool:
- "When I start my workday, I want to see what needs my attention, so I can prioritize my time."
- "When a deadline is at risk, I want to know before it's missed, so I can reallocate resources."
- "When the quarter ends, I want to report on delivery outcomes, so I can justify my team's budget."

Same product, three different jobs, three different feature priorities.

## Persona creation

### What makes a good persona

A persona is a fictional but realistic representation of a user segment. It's a decision-making tool, not a marketing poster.

Good personas:
- Are based on research (interviews, data), not imagination.
- Focus on behaviors, goals, and pain points — not demographics.
- Are specific enough to make design trade-offs ("Maria wouldn't use this" vs. "users wouldn't use this").
- Have a name and are referred to by name in discussions.
- Are few (3-5 max). More than 5 means you haven't prioritized.

Bad personas:
- Are made up in a workshop without talking to users.
- Have irrelevant details ("likes hiking on weekends").
- Are too generic ("Sarah is a busy professional who values efficiency").
- Have no prioritization — all personas are equally important.

### Persona template

```markdown
# Persona: <Name>

## Summary
<1-2 sentences: who they are, what they do, what drives them>

## Demographics (context, not the point)
- **Role:** <job title>
- **Company:** <type and size>
- **Reports to:** <who>
- **Team size:** <how many people they manage or work with>
- **Technical skill:** <non-technical / semi-technical / technical>

## Goals
1. <Primary goal — what success looks like for them>
2. <Secondary goal>
3. <Tertiary goal>

## Pain points
1. <Biggest frustration — in their words>
2. <Second frustration>
3. <Third frustration>

## Current behavior
- **How they do the job today:** <tools, processes, workarounds>
- **What triggers them to seek a solution:** <breaking point, event>
- **Decision criteria:** <what they evaluate when choosing a tool>

## Jobs to be done
- When <situation>, I want to <motivation>, so I can <outcome>.
- When <situation>, I want to <motivation>, so I can <outcome>.

## Quotes (from real interviews)
- "<verbatim quote that captures their mindset>"
- "<verbatim quote about a pain point>"

## Key insight
<The ONE thing that, if you remember nothing else about this persona, you should remember>
```

### Persona prioritization

Not all personas are equal. Use this matrix:

| | High value to business | Low value to business |
|---|---|---|
| **Underserved (big gap)** | **Primary persona** — build for them first | **Opportunistic** — serve if cheap |
| **Well-served (small gap)** | **Maintain** — don't break their experience | **Deprioritize** — don't invest |

You should have ONE primary persona. All design trade-offs default to their needs. If a feature helps Persona B but hurts Persona A (primary), don't build it.

## Segmentation anti-patterns

- **Everyone is a persona.** "Our user is anyone who manages projects." That's a market, not a segment. Segment further.
- **Personas without research.** If the persona wasn't informed by at least 5 user interviews, it's fiction. Label it as a hypothesis and plan the research.
- **Demographic-first segmentation for product decisions.** "SMBs want simplicity, Enterprise wants complexity" is a stereotype. Some SMBs have complex workflows. Segment by behavior.
- **Too many personas.** If you have 8 personas, you can't design for all of them. Prioritize to 3-5.
- **Personas that never change.** Users evolve. Products evolve. Markets evolve. Revisit personas at least annually.
- **Persona without "current behavior."** If you don't know how they solve the problem today, you don't understand the competitive landscape for this persona.
- **Jobs statements that are really features.** "I want to filter by date" is a feature request. "I want to find orders from last week so I can reconcile with my supplier" is a job.

## Using segmentation in product decisions

### Feature prioritization
"Does this feature serve our primary persona? If not, is there a strong business case for serving the secondary persona with this feature?"

### Design trade-offs
"If these two needs conflict, whose need wins?" (The primary persona's, unless there's a compelling business reason.)

### Pricing and packaging
"Which features does each segment value most? Can we package by segment value?"

### Communication
"How does each segment describe their problem? Use their language, not ours."

### Success metrics
"What does success look like for each segment? A power user metric is different from a new user metric."

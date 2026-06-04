# Competitive Analysis and Positioning

Source: April Dunford (Obviously Awesome), Michael Porter (Competitive Strategy), Strategyzer (Value Proposition Canvas).

## Purpose

Competitive analysis answers: What alternatives does the user have today (including doing nothing)? Where do we win? Where do we lose? What's our defensible position?

It's NOT a feature comparison spreadsheet. It's an understanding of the competitive landscape that informs product decisions.

## Competitive landscape mapping

### Types of competition

| Type | Definition | Example (for a project management tool) |
|---|---|---|
| **Direct** | Same product category, same user | Asana, Monday.com, Linear |
| **Indirect** | Different category, same job-to-be-done | Spreadsheets, email threads, sticky notes |
| **Potential** | Could enter your space | Large platform adding PM features (Notion, Slack) |
| **Substitute** | User does nothing / does it manually | Manual tracking, tribal knowledge |

Most teams only look at direct competitors. The biggest threat is often indirect competitors and substitutes — because that's what users are ACTUALLY doing today.

### Competitive analysis template

```markdown
# Competitor: <name>

## Overview
- **Category:** Direct / Indirect / Potential
- **Target segment:** <who they serve>
- **Positioning:** <how they describe themselves — their own words>
- **Pricing:** <model and range>
- **Estimated size:** <users, revenue, team size if known>

## Strengths
- <strength 1 — specific, evidence-based>
- <strength 2>
- <strength 3>

## Weaknesses
- <weakness 1 — specific, evidence-based>
- <weakness 2>
- <weakness 3>

## What users say
- <verbatim quotes from reviews, forums, interviews>
- <common complaints>
- <common praise>

## How they win deals (against us)
- <specific scenarios where they're chosen over us>

## How we win deals (against them)
- <specific scenarios where we're chosen over them>

## Strategic moves to watch
- <recent product launches, pricing changes, acquisitions>
```

## Positioning

### April Dunford's positioning framework

Positioning defines how your product fits in the market. It has 5 components:

1. **Competitive alternatives.** What would the user do if your product didn't exist? (Not just other software — includes manual processes, doing nothing.)
2. **Unique attributes.** What can you do that the alternatives cannot? (Features, capabilities, integrations, data.)
3. **Value.** What benefit do those unique attributes deliver? (Not "we have feature X" but "you save 3 hours/week because of X.")
4. **Target segment.** Who cares most about that value? (Not "everyone" — the specific segment that values your unique attributes.)
5. **Market category.** What market do you position in? (This sets buyer expectations for features, pricing, competitors.)

### Positioning statement template

```
For [target segment]
who [have this need/problem],
[product name] is a [market category]
that [key value proposition].
Unlike [competitive alternative],
we [unique differentiator].
```

### Positioning pitfalls

- **"We're better at everything."** Nobody is. If you can't name what you're worse at, you don't understand the landscape.
- **Feature-first positioning.** "We have 47 integrations." Nobody cares about the number. They care about whether YOU integrate with THEIR tools.
- **Copying the leader's positioning.** If Salesforce says "CRM," you don't win by also saying "CRM better." You win by defining a different category or a different value.
- **Positioning for investors instead of users.** "AI-powered enterprise-grade solution" means nothing to a warehouse manager who needs to track late orders.

## Value Proposition Canvas (Strategyzer)

Two sides: Customer Profile and Value Map.

### Customer Profile

| Element | What it captures | How to fill it |
|---|---|---|
| **Jobs** | What the user is trying to accomplish (functional, social, emotional) | User interviews, observation |
| **Pains** | What frustrates them, what risks they face, what barriers exist | User interviews, support tickets |
| **Gains** | What outcomes they desire, what would delight them | User interviews, competitive reviews |

### Value Map

| Element | What it captures |
|---|---|
| **Products & Services** | What you offer (features, services) |
| **Pain Relievers** | How your product addresses specific pains |
| **Gain Creators** | How your product delivers specific gains |

### Fit

You have fit when:
- Every significant pain has a pain reliever.
- The most important gains have gain creators.
- No pain reliever addresses a pain that doesn't exist.
- No gain creator delivers a gain nobody wants.

## Competitive intelligence gathering

### Ethical sources

- Public product pages, pricing pages, changelogs.
- G2, Capterra, TrustRadius reviews (users compare for you).
- Job postings (reveal tech stack, priorities, team growth areas).
- Blog posts, conference talks, podcasts.
- SEC filings (for public companies — revenue, strategy, risks).
- User interviews ("what else did you evaluate?").
- Win/loss analysis from sales team.
- Open source repos (for developer tools).

### What to track ongoing

| Signal | Frequency | Source |
|---|---|---|
| New feature launches | Weekly | Product pages, changelogs, tech blogs |
| Pricing changes | Monthly | Pricing pages, G2 reviews |
| Strategic moves (acquisitions, partnerships) | As they happen | News, press releases |
| User sentiment shifts | Quarterly | Review sites, social media, forums |
| Team growth / hiring patterns | Quarterly | LinkedIn, job boards |

## Win/loss analysis

After every significant deal (won or lost), capture:

```markdown
## Win/Loss: <company name>

**Outcome:** Won / Lost
**Competitor(s) evaluated:** <names>
**Decision maker role:** <title>
**Deal size:** <ACV>
**Sales cycle length:** <days>

**Why they chose us (if won):**
- <reason 1 — in their words>
- <reason 2>

**Why they chose competitor (if lost):**
- <reason 1 — in their words>
- <reason 2>

**What almost killed the deal:**
- <objection or concern>

**Lessons for product:**
- <what this tells us about our strengths/weaknesses>
```

Do this systematically (not just for big losses) and patterns emerge that inform the roadmap.

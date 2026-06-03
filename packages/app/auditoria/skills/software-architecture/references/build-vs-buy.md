# Build vs. Buy Evaluation

Source: Thoughtworks Technology Radar, pragmatic engineering decision-making frameworks.

## When the question arises

Build vs. Buy surfaces whenever the team considers: authentication (build custom vs. Auth0/Okta), search (build on DB vs. Elasticsearch/Algolia), payments (build integration vs. Stripe), CMS (custom vs. headless CMS), monitoring (custom dashboards vs. Datadog), email delivery (custom SMTP vs. SendGrid), feature flags (custom vs. LaunchDarkly).

## Evaluation framework

### Step 1: Define the requirement precisely

Before comparing options, write down exactly what you need — not what the vendor offers. Most build-vs-buy mistakes happen because the team evaluates the vendor's full feature set instead of their actual requirements.

```markdown
## Requirement definition
- **Core need (must-have):** <what the system MUST do, in 2-3 sentences>
- **Nice-to-have:** <what would be great but isn't blocking>
- **Scale:** <users, transactions, data volume>
- **Compliance:** <regulatory requirements that affect the decision>
- **Integration:** <what systems this needs to connect to>
- **Timeline:** <when this must be operational>
```

### Step 2: Evaluate with the matrix

| Criterion | Weight | Build | Buy | Score Build | Score Buy |
|---|---|---|---|---|---|
| **Fit to requirement** | 25% | <1-5> | <1-5> | | |
| **Time to production** | 20% | <1-5> | <1-5> | | |
| **Total cost (3-year)** | 20% | <1-5> | <1-5> | | |
| **Maintenance burden** | 15% | <1-5> | <1-5> | | |
| **Customizability** | 10% | <1-5> | <1-5> | | |
| **Vendor risk** | 10% | <1-5> | <1-5> | | |

Adjust weights based on what matters most for your context.

### Step 3: Calculate 3-year TCO

**Build TCO:**
```
Development cost    = Engineers × months × fully loaded cost/month
Ongoing maintenance = Engineers × % time × 36 months × cost/month
Infrastructure      = Monthly infra cost × 36
Bug fixes           = Estimated hours/month × cost/hour × 36
Opportunity cost    = What those engineers could have built instead (hardest to quantify)
```

**Buy TCO:**
```
License/subscription = Monthly/annual fee × 36 months
Integration cost     = Engineers × weeks × cost/week (one-time)
Ongoing config       = Hours/month × cost/hour × 36
Overage fees         = Per-unit cost × projected usage × 36
Migration cost       = If switching later, what does it cost?
```

### Step 4: Risk assessment

| Risk | Build | Buy |
|---|---|---|
| **Delivery risk** | Can we build it on time? Do we have the expertise? | Vendor delivers what they promise? |
| **Maintenance risk** | Who maintains it when the builder leaves? | Vendor raises prices, changes API, gets acquired? |
| **Lock-in risk** | Lock-in to internal architecture (manageable) | Lock-in to vendor API, data format, ecosystem |
| **Security risk** | We own the attack surface | Vendor's security posture, data handling |
| **Scalability risk** | We design for our scale | Vendor may throttle or charge per unit |
| **Compliance risk** | We control data residency, retention | Vendor's compliance certifications match ours? |

## Decision heuristics

### Build when:

- The capability IS your core product differentiator.
- No vendor fits >80% of your requirements without heavy customization.
- Compliance/security requirements make vendor evaluation more expensive than building.
- The team has deep expertise in the domain AND capacity to maintain it long-term.
- The build is small enough that maintenance cost is negligible (<2 weeks to build, <2 hours/month to maintain).

### Buy when:

- The capability is commoditized (auth, email, payments, monitoring).
- Time to market is critical and the vendor gets you there 3-10× faster.
- Maintaining the capability is not a good use of your engineering team's time.
- The vendor's R&D investment far exceeds what you could build (search, AI/ML, CDN).
- The 3-year TCO of buying is lower than building (including opportunity cost).

### Extend (open source) when:

- A well-maintained open source project covers 70-90% of the requirement.
- You need customization that a SaaS vendor doesn't allow.
- You want to avoid vendor lock-in but don't want to build from scratch.
- The team can contribute back and benefits from community maintenance.

## Common mistakes

- **Underestimating maintenance cost of "build."** The initial build is 20% of the lifetime cost. The other 80% is bugs, security patches, scaling, feature requests, and onboarding new engineers.
- **Ignoring opportunity cost.** 3 engineers spending 6 months building an auth system is 3 engineers NOT building product features.
- **Overweighting vendor lock-in fear.** Lock-in is real, but mitigatable (abstraction layers, contracts, data portability). Building everything to avoid lock-in is its own prison.
- **Comparing build cost to vendor sticker price.** The vendor's price includes R&D, security, scaling, maintenance, support. Your build cost should include all of these too.
- **"We'll build a simple version."** Simple versions become complex versions. If you're building "just a simple X," you'll be maintaining a not-so-simple X in 18 months.
- **Not defining exit criteria.** For buy decisions: what happens if the vendor doubles the price, gets acquired, or shuts down? For build decisions: what happens if maintenance cost exceeds the vendor alternative?

## ADR template for build-vs-buy

```markdown
# ADR-NNN: Build vs. Buy for <capability>

**Date:** YYYY-MM-DD
**Status:** Accepted

## Context
<Why we need this capability, what requirements it must meet>

## Options evaluated

### Option A: Build custom
- **Fit:** <% of requirements met>
- **Estimated build time:** <weeks/months>
- **3-year TCO:** <$>
- **Risks:** <delivery, maintenance, expertise>

### Option B: Buy <vendor name>
- **Fit:** <% of requirements met>
- **Integration time:** <weeks>
- **3-year TCO:** <$>
- **Risks:** <lock-in, pricing, compliance>

### Option C: Open source <project name>
- **Fit:** <% of requirements met>
- **Customization time:** <weeks>
- **3-year TCO:** <$>
- **Risks:** <maintenance, community health>

## Decision
<Which option and why>

## Exit criteria
<Under what conditions we would switch to a different option>
```

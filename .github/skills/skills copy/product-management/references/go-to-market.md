# Go-To-Market Planning

Source: April Dunford (Obviously Awesome), Product-Led Growth (Wes Bush), Reforge Growth Series.

## What GTM covers

GTM is the plan for how the product reaches users AFTER it's built. A great product with a bad GTM fails. GTM is not marketing's job alone — it's a product decision.

## GTM strategy types

| Strategy | How it works | Best for | Key metric |
|---|---|---|---|
| **Product-Led Growth (PLG)** | Users try the product (freemium/trial), value drives adoption | Self-serve SaaS, developer tools, SMB | Time-to-value, free-to-paid conversion |
| **Sales-Led** | Sales team demos, negotiates, closes | Enterprise, high ACV, complex products | Sales cycle length, pipeline velocity |
| **Community-Led** | Community builds awareness, trust, and adoption | Developer tools, open source, platforms | Community engagement, organic adoption |
| **Marketing-Led** | Content, SEO, paid acquisition drive signups | B2C, content platforms, marketplaces | CAC, LTV:CAC ratio |
| **Partner-Led** | Channel partners or integrations drive distribution | Embedded solutions, marketplaces, APIs | Partner-sourced revenue, integration adoption |

Most products use a primary strategy with elements from others. A SaaS B2B tool might be sales-led for enterprise, PLG for SMB.

## Rollout strategy

### Rollout phases

| Phase | Audience | Goal | Duration |
|---|---|---|---|
| **Alpha / Internal** | Team members, dogfooding | Find critical bugs, validate flow | 1-2 weeks |
| **Closed Beta** | Handpicked users (10-50) | Validate value proposition, gather qualitative feedback | 2-4 weeks |
| **Open Beta** | Broader audience, opt-in | Validate at scale, find edge cases, measure metrics | 2-4 weeks |
| **GA (General Availability)** | All users | Full launch, metrics evaluation | Ongoing |

### Feature flag rollout

For existing products, use feature flags to control exposure:

```
Day 1:     1% of users (canary — detect crashes, errors)
Day 3:     5% of users (validate metrics direction)
Day 7:     25% of users (statistical significance for A/B)
Day 14:    50% of users (validate at scale)
Day 21:    100% (if all signals green)
```

At each stage, check:
- Error rates (no regression).
- Performance metrics (no degradation).
- Primary feature metric (moving in the right direction).
- Guardrail metrics (not degrading).
- Support ticket volume (no spike).

## Launch checklist

### Before launch

- [ ] Success metric is instrumented and dashboarded.
- [ ] Baseline measurement is recorded.
- [ ] Feature flag is configured with rollout percentages.
- [ ] Rollback plan is documented and tested.
- [ ] Support team is briefed (what the feature does, known limitations, common issues).
- [ ] Documentation is published (help center, tooltips, onboarding).
- [ ] Changelog entry is prepared.
- [ ] Error monitoring is configured (alerts for new error types).

### During launch

- [ ] Error rates monitored in real-time during first hour.
- [ ] First user sessions reviewed (session replay or logs).
- [ ] Support channel monitored for unexpected issues.
- [ ] Rollout percentage increased according to schedule (or paused if issues found).

### After launch

- [ ] Primary metric evaluated at defined timeline (not before).
- [ ] Qualitative feedback collected (interviews, survey, NPS).
- [ ] Post-launch retrospective conducted (what worked, what didn't, what we'd do differently).
- [ ] Decision made: scale, iterate, or kill (see MVP decision framework).
- [ ] Learnings documented and shared.

## Communication plan

| Audience | Channel | Message | Timing |
|---|---|---|---|
| Internal team | Slack/Teams + standup | What shipped, how to test, known issues | Day of launch |
| Support team | Training session + runbook | How it works, FAQs, escalation path | 1 week before launch |
| Existing users | In-app announcement + email | What's new, how it helps, how to try it | GA launch day |
| Prospects | Blog post + social | Problem we solved, approach, differentiation | GA launch day |
| Partners | Partner newsletter + direct outreach | Integration opportunities, co-marketing | GA launch week |

## Pricing considerations (for monetized features)

Key questions for the PM to answer (not decide alone — involves finance, leadership):

1. **Who pays?** Free for all users, premium tier, add-on, usage-based?
2. **What's the value anchor?** What is the user comparing to? (Their current manual process, a competitor, doing nothing?)
3. **What's the willingness to pay?** Van Westendorp survey or pricing experiment.
4. **What's the packaging?** Is this a standalone feature or part of a tier upgrade?
5. **What's the revenue model?** One-time, subscription, usage-based, transaction fee?

Don't assume pricing — test it like any other hypothesis.

## GTM anti-patterns

- **"If we build it, they will come."** No they won't. Distribution is a product decision.
- **Big bang launch.** Shipping to everyone on day 1 with no ramp. If something breaks, it breaks for everyone.
- **No rollback plan.** "We'll fix it if something goes wrong." How? In how long? Who decides?
- **GTM as afterthought.** GTM starts during discovery, not after build. If you don't know how users will find this, you don't know if it's worth building.
- **Support team learns on launch day.** Support should be briefed and trained before launch. Otherwise, ticket #1 arrives and nobody knows what to say.

---
name: software-architecture
description: Professional software architecture knowledge for senior architect work. Use this skill whenever the user asks for help designing system topology, making build-vs-buy decisions, writing ADRs, defining SLAs/RTO/RPO, sizing capacity, choosing between monolith and microservices, designing API contracts, evaluating trade-offs (consistency, availability, partition tolerance), planning architecture evolution, estimating TCO, or reviewing an existing architecture. Trigger on any mention of architecture, system design, ADR, AMV (Arquitectura Mínima Viable), microservices, monolith, event-driven, CQRS, saga, bounded context, API gateway, load balancer, caching strategy, database selection, or infrastructure topology. Use this even when the user doesn't say "architecture" — apply it whenever the task is about deciding the SHAPE of the system, WHERE the pieces live, and HOW they communicate.
---

# Software Architecture

A reference skill for doing professional software architecture work that follows the principles established by Martin Fowler, Gregor Hohpe, Neal Ford, Sam Newman, Mark Richards, and the software architecture community.

This skill exists to keep two failure modes out of the output:

1. **Premature complexity** — reaching for microservices when a well-structured monolith would do, adding an event bus for two services that could share a database, introducing CQRS for a CRUD app, building a platform before having a product.
2. **Accidental architecture** — making no explicit decisions, letting the system evolve by accumulation of code, never documenting trade-offs, discovering the architecture during the first production incident.

The goal is to make architecture decisions that are explicit, justified, documented, reversible where possible, and sized to the actual problem — not the imagined future problem.

## When to consult this skill

Pull this skill in for any of:

- Designing a new system or subsystem (greenfield or brownfield).
- Choosing between architectural styles (monolith, modular monolith, microservices, serverless, event-driven).
- API design decisions (REST vs. gRPC vs. GraphQL, versioning, contracts).
- Database selection (relational vs. document vs. columnar vs. graph vs. time-series).
- Consistency model decisions (strong vs. eventual, ACID vs. BASE).
- Writing or reviewing Architecture Decision Records (ADRs).
- Capacity planning and sizing (Little's Law, headroom, throughput).
- Defining SLA / SLO / RTO / RPO for a system.
- Build vs. Buy evaluation.
- TCO estimation (infrastructure, licensing, operations, team).
- Security architecture (Zero Trust, threat model at system level).
- Integration patterns (sync vs. async, choreography vs. orchestration, API gateway).
- Migration planning (monolith to microservices, on-prem to cloud, database migration).
- Reviewing an existing architecture for fitness.

## Core principles — apply in order

1. **Architecture serves the business, not the architect.** Every architectural decision traces back to a business driver: cost, time-to-market, reliability, compliance, team structure. "It's the modern way" is not a business driver.

2. **Minimum Viable Architecture (AMV).** Design for today's requirements with an explicit evolution path for tomorrow's. Over-engineering for predicted scale that never arrives is waste. Under-engineering for actual scale that does arrive is catastrophe. The AMV hits the sweet spot: sufficient for now, evolvable for later, with documented triggers for when to evolve.

3. **Decisions are trade-offs, not best practices.** There is no "best" database, no "best" messaging system, no "best" architecture style. There are trade-offs: consistency vs. availability, simplicity vs. flexibility, cost vs. performance, team familiarity vs. technical fitness. Name the trade-off. Document it. Move on.

4. **Conway's Law is real.** The system architecture will mirror the team structure. If you want a modular system, you need modular teams. If you have one team, a monolith is the honest architecture. Don't fight Conway — use it.

5. **Fitness functions over big bang reviews.** Architecture degrades continuously, not in dramatic failures. Define fitness functions (automated checks that verify architectural properties: build time, dependency depth, coupling metrics, latency budgets) and run them in CI.

6. **Document decisions, not just designs.** The diagram shows WHAT. The ADR shows WHY, WHAT ALTERNATIVES were considered, and WHAT TRADE-OFFS were accepted. Without the ADR, the next engineer sees the diagram and asks "why not X?" — and nobody remembers.

7. **Reversibility is a feature.** Prefer decisions that are cheap to reverse (feature flags, abstraction layers, contract-first design) over decisions that are expensive to reverse (database engine, message broker, programming language). When a decision is irreversible, invest more time in it.

8. **The integration is the architecture.** Individual services can be perfect. The system fails at the boundaries: serialization mismatches, version incompatibilities, timeout cascades, split-brain scenarios. The architect owns the boundaries, not the internals.

9. **Capacity arithmetic before commitments.** Before promising an SLA, do the math: Little's Law for queue depth, throughput = (1000 / latency_ms) × concurrency, headroom at least 50% for peaks, database IOPS under load. If the math doesn't work, the SLA doesn't work.

10. **Security is structural, not cosmetic.** Zero Trust is an architecture, not a checklist. Threat modeling (STRIDE) happens during design, not before release. The architect defines trust boundaries; the security engineer validates them.

## Workflow — for any non-trivial architecture task

1. **Understand the drivers.** Business context, team structure, compliance requirements, budget constraints, timeline, existing systems, SLA expectations. Architecture without context is drawing boxes and arrows.

2. **Classify the problem.** Greenfield / brownfield / rewrite? Operational (OLTP) / analytical (OLAP) / both? Single team / multi-team? Internal / external-facing? High availability required? Compliance-constrained?

3. **Choose the style.** Based on drivers, not preference. Load the relevant reference for the architectural style under consideration.

4. **Design the AMV.** The minimum architecture that satisfies today's requirements. Document the evolution triggers: "When throughput exceeds X, we split service Y." "When team grows beyond Z, we extract bounded context W."

5. **Estimate capacity.** Run the arithmetic. Throughput, latency, storage, IOPS, network. Validate against the SLA. If it doesn't fit, redesign before building.

6. **Write ADRs.** One per significant decision. Follow the template in references/adrs.md.

7. **Calculate TCO.** Infrastructure + licensing + operations + team cost. Compare AMV vs. full target architecture. Present both to stakeholders.

8. **Cross-review.** Validate with Backend (can they implement this?), DevOps (can they deploy this?), SRE (can they operate this?), Security (is this defensible?), Data Engineer (does the data flow work?).

## Reference index — load on demand

| Topic | File | When to read |
|---|---|---|
| Architecture styles (monolith, modular monolith, microservices, serverless, event-driven) | `references/styles.md` | Choosing an architectural style |
| Architecture Decision Records (ADRs) | `references/adrs.md` | Writing or reviewing ADRs |
| API design (REST, gRPC, GraphQL, versioning, contracts) | `references/api-design.md` | Designing APIs, choosing protocols |
| Data architecture (database selection, consistency models, CQRS, event sourcing) | `references/data-architecture.md` | Database decisions, consistency trade-offs |
| Integration patterns (sync, async, choreography, orchestration, API gateway, messaging) | `references/integration-patterns.md` | Connecting systems, choosing communication patterns |
| Capacity planning and sizing (Little's Law, throughput, IOPS, headroom) | `references/capacity-planning.md` | Sizing infrastructure, validating SLAs |
| Build vs. Buy evaluation | `references/build-vs-buy.md` | Make-or-buy decisions |
| TCO estimation | `references/tco.md` | Estimating total cost of ownership |
| Security architecture (Zero Trust, threat model, trust boundaries) | `references/security-architecture.md` | Security at the system level |
| Evolution and migration (monolith decomposition, strangler fig, database migration) | `references/evolution.md` | Migrating or evolving an existing system |
| Anti-patterns and architecture smells | `references/anti-patterns.md` | Reviewing existing architecture, spotting red flags |

## Output expectations

When the agent produces architecture artifacts from this skill, they should:

- Start with the business drivers and constraints, not the technology choices.
- Present the AMV with an explicit evolution path and metric-based triggers.
- Include ADRs for every significant decision (database, messaging, consistency model, style).
- Show capacity arithmetic, not just diagrams.
- Include TCO estimation (AMV + target architecture).
- Define trust boundaries and threat model scope (even if Security Engineer will detail it).
- Name the trade-offs accepted, not just the choices made.
- Use diagrams (C4 model preferred: Context, Container, Component, Code levels).

When the agent reviews existing architecture, it should call out:

- Decisions without documented rationale (missing ADRs).
- Over-engineering (microservices for a single team, event bus for two services).
- Under-engineering (no capacity planning, no SLA, no failover strategy).
- Conway's Law violations (architecture doesn't match team topology).
- Missing fitness functions (no automated architectural checks).
- Integration risks (undocumented contracts, missing timeout strategies, no circuit breakers).
- Security gaps (missing trust boundaries, no Zero Trust considerations).
- Single points of failure without documented acceptance of the risk.

## Closing each response

After delivering architecture work, finish with:

1. **What constraints were assumed** (team size, budget, SLA, compliance). If the user's reality differs, the architecture needs adjustment.
2. **What was deliberately not included** (detailed security review, full capacity planning, migration plan) and why.
3. **One follow-up question** offering to go deeper on the most relevant adjacent topic (ADR detail, capacity arithmetic, integration patterns, evolution strategy).

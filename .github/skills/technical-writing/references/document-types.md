# Document Types and Templates

## The four types of documentation (Divio/Diataxis)

| Type | Purpose | Form | Analogy |
|---|---|---|---|
| **Tutorial** | Learning by doing | Lesson — guided steps to complete a task | Teaching a child to cook |
| **How-to guide** | Accomplishing a specific goal | Recipe — steps to solve a problem | Recipe in a cookbook |
| **Reference** | Information lookup | Encyclopedia — dry, accurate, complete | Dictionary entry |
| **Explanation** | Understanding context | Discussion — why things work the way they do | Magazine article |

Don't mix types. A tutorial that also tries to explain architecture and serve as a reference will fail at all three.

## README

The first thing anyone sees. Must answer: what is this, why should I care, how do I get started.

```markdown
# Order API

REST API for managing customer orders. Handles order creation, payment processing,
fulfillment tracking, and cancellation.

## Quick start

```bash
# Prerequisites: .NET 8 SDK, Docker

# Start dependencies
docker compose up -d

# Run the API
dotnet run --project src/OrderApi

# Verify
curl http://localhost:5000/health
```

## API overview

| Endpoint | Method | Description |
|---|---|---|
| `/api/orders` | GET | List orders (paginated) |
| `/api/orders` | POST | Create a new order |
| `/api/orders/{id}` | GET | Get order by ID |
| `/api/orders/{id}/cancel` | POST | Cancel an order |

Full API docs: [OpenAPI spec](./docs/openapi.yaml) | [Swagger UI](http://localhost:5000/swagger)

## Architecture

This service is part of the e-commerce platform. See [Architecture overview](./docs/architecture.md)
for how it fits into the broader system.

## Development

```bash
# Run tests
dotnet test

# Run with hot reload
dotnet watch --project src/OrderApi

# Lint
dotnet format --verify-no-changes
```

## Configuration

| Variable | Description | Default |
|---|---|---|
| `ConnectionStrings__Default` | PostgreSQL connection string | (required) |
| `Stripe__ApiKey` | Stripe API key | (required) |
| `Cors__AllowedOrigins` | Comma-separated allowed origins | `http://localhost:3000` |

## Deployment

Deployed via GitHub Actions to Kubernetes. See [Deployment guide](./docs/deployment.md).
```

### README rules

1. **Lead with what it does** — one sentence.
2. **Quick start in 3 steps** — clone, run, verify. If it takes more than 5 minutes, the setup is too complex.
3. **Table of endpoints/features** — scannable overview.
4. **Link to deeper docs** — don't put everything in the README.
5. **No badges wall** — 1-3 meaningful badges (build status, coverage). Not 15.

## ADR (Architecture Decision Record)

```markdown
# ADR-007: Use PostgreSQL for order storage

## Status
Accepted (2025-03-15)

## Context
The order service needs a persistent data store. We considered:
- PostgreSQL (relational, ACID, mature)
- MongoDB (document store, flexible schema)
- DynamoDB (managed, serverless)

The order domain has well-defined relationships (orders → items → products → customers)
and requires transactional consistency (payment + order creation must be atomic).

## Decision
Use PostgreSQL via EF Core.

## Consequences
**Positive:**
- Strong ACID guarantees for order transactions
- Relational model fits the domain naturally
- Team has PostgreSQL experience
- EF Core provides migrations and type safety

**Negative:**
- Must manage connection pooling
- Schema migrations require coordination with deployments
- Horizontal scaling requires read replicas or sharding (not needed now)

## Alternatives rejected
- **MongoDB:** Flexible schema not needed; transactional consistency across
  collections (orders + payments) is awkward.
- **DynamoDB:** Single-table design adds complexity for a relational domain;
  team lacks NoSQL modeling experience.
```

### When to write an ADR

- Choosing a database, framework, library, or service.
- Deciding between architectural patterns (monolith vs microservices).
- Making a trade-off that future developers will question.
- Changing an existing architectural decision.

### When NOT to write an ADR

- Choosing between two equivalent libraries (just pick one).
- Implementation details that don't affect architecture.
- Decisions that are easily reversible.

## Runbook

See SRE skill → `references/alerting.md` for the full runbook template. Key elements:

1. **Alert name and meaning** — what triggered this runbook.
2. **Impact** — what users are experiencing.
3. **Immediate actions** — numbered steps, copy-pasteable commands.
4. **Common causes table** — symptom → evidence → fix.
5. **Escalation** — who to contact if steps don't resolve.

## Changelog

```markdown
# Changelog

All notable changes to this project will be documented in this file.
Format based on [Keep a Changelog](https://keepachangelog.com/).

## [2.3.0] - 2025-05-20

### Added
- Order search endpoint with full-text search support
- Webhook notifications for order status changes

### Changed
- Payment processing now retries failed charges up to 3 times
- Improved error messages for invalid order items

### Fixed
- Race condition in concurrent order cancellation (#234)
- Incorrect tax calculation for multi-currency orders (#241)

### Security
- Updated Stripe SDK to v45.0.0 (CVE-2025-1234)
```

Categories: Added, Changed, Deprecated, Removed, Fixed, Security. This is the Keep a Changelog standard — don't invent your own format.

## Onboarding guide

```markdown
# Developer Onboarding — Order Service

## Day 1: Environment setup
1. [ ] Clone the repo and run the quick start (README)
2. [ ] Get access to: GitHub org, staging environment, Slack channels (#order-team, #incidents)
3. [ ] Read: Architecture overview (./docs/architecture.md)

## Day 2-3: Understand the domain
4. [ ] Read: ADRs (./docs/adrs/) — understand past decisions
5. [ ] Walk through a request: trace an order creation from API to database
6. [ ] Pair with a team member on a small PR

## Week 2: First contribution
7. [ ] Pick a "good first issue" and implement it
8. [ ] Shadow an on-call shift (observe, don't respond)
9. [ ] Read: Runbooks (./docs/runbooks/) — understand operational concerns

## Resources
- Domain glossary: [./docs/glossary.md](./docs/glossary.md)
- Team rituals: standup (daily 10am), retro (bi-weekly Friday)
- Questions: #order-team Slack channel
```

# Documentation Anti-patterns

## Content anti-patterns

### The wall of text

**Symptom:** A 2000-word explanation with no code examples, no headers, no tables. Readers scroll past it.

```markdown
❌
The authentication system uses OAuth 2.0 with the authorization code flow and PKCE
extension for public clients. When a user initiates login, the client generates a
code verifier and code challenge, then redirects to the authorization server with
the code challenge. The authorization server authenticates the user and returns an
authorization code to the redirect URI. The client then exchanges the authorization
code along with the code verifier for an access token. The access token is a JWT
that contains claims about the user including their roles and permissions...
(continues for 1500 more words)

✅
## Authentication flow

The API uses OAuth 2.0 Authorization Code + PKCE.

​```
Client                    Auth Server                API
  |── GET /authorize ──────>|                          |
  |   + code_challenge      |                          |
  |<── authorization_code ──|                          |
  |── POST /token ─────────>|                          |
  |   + code_verifier       |                          |
  |<── access_token (JWT) ──|                          |
  |── GET /api/orders ─────────────────────────────────>|
  |   Authorization: Bearer {token}                     |
​```

See [Authentication guide](./authentication.md) for setup instructions.
```

**Why it fails:** Developers scan, they don't read. A wall of text with no visual anchors (headers, code, diagrams) gets skipped entirely.

**Fix:** Lead with a diagram or code example. Use prose to explain what the example shows, not to replace it.

### No code examples

**Symptom:** Documentation describes what the API does in paragraphs but never shows a request or response.

```markdown
❌
The create order endpoint accepts a JSON body with the customer ID, currency,
and an array of items. Each item requires a product ID and quantity. The endpoint
returns the created order with its ID and status.

✅
​```bash
curl -X POST https://api.example.com/api/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "C-123",
    "currency": "EUR",
    "items": [{"productId": "P-456", "quantity": 2}]
  }'
​```

Response (201 Created):
​```json
{
  "id": "ORD-789",
  "status": "pending",
  "total": 59.98
}
​```
```

**Why it fails:** Descriptions require the reader to mentally translate prose into code. Code examples can be copied, pasted, and run. The example IS the documentation — the prose explains the example.

**Fix:** Write the code example first, then write only enough prose to explain what's not obvious from the code itself.

### Happy path only

**Symptom:** Documentation shows how to create an order successfully but doesn't show what happens when validation fails, the token expires, or the customer doesn't exist.

```markdown
❌
## Create order
POST /api/orders → 201 Created
(only success response shown)

✅
## Create order

### Success
POST /api/orders → 201 Created

### Errors

| Status | Cause | Response body |
|---|---|---|
| 400 | Validation failed | `{"errors": {"items": ["At least one item required"]}}` |
| 401 | Token expired or missing | `{"title": "Unauthorized"}` |
| 404 | Customer not found | `{"title": "Not found", "detail": "Customer C-999 not found"}` |
| 409 | Duplicate idempotency key | `{"title": "Conflict"}` |
| 429 | Rate limited | `Retry-After: 30` header |
```

**Why it fails:** Developers spend more time debugging errors than writing happy path code. If they can't find what a 422 response means, they'll read your source code — or file a support ticket.

**Fix:** Document every error status code an endpoint can return. Include the response body. Developers need to know what they'll see in their logs.

### Outdated documentation

**Symptom:** The README says "run `npm start`" but the project migrated to `pnpm` six months ago. The architecture diagram shows Service A talking to Service B, but Service B was decommissioned.

```markdown
❌
## Setup
npm install          ← project uses pnpm, this fails
npm run dev          ← script was renamed to 'start'

❌
## Architecture
┌─────────┐    ┌─────────┐
│ Order API│───>│ Legacy  │    ← Legacy was decommissioned in Q1
└─────────┘    │ Gateway │
               └─────────┘
```

**Why it fails:** Outdated docs are worse than no docs. No docs means the reader asks someone. Outdated docs means the reader follows wrong instructions, wastes time, loses trust in ALL your documentation, and THEN asks someone.

**Fix:** Three approaches, in order of preference:

| Approach | How | When |
|---|---|---|
| Automate verification | CI job runs code examples, checks links | Setup instructions, API examples |
| Review with code changes | PR template includes "did you update docs?" | Architecture changes, config changes |
| Add "verified on" dates | `> Last verified: 2025-05-20 against v2.3.0` | Tutorials, guides that can't be auto-tested |

### Jargon without context

**Symptom:** Documentation assumes the reader knows every acronym and internal term.

```markdown
❌
"The OMS publishes domain events to the ESB, which the WMS consumes
via the DLQ retry pattern after CQRS projection."

✅
"The Order Management Service (OMS) publishes domain events to the
message broker. The Warehouse Management Service (WMS) consumes these
events. Failed messages are sent to a dead letter queue (DLQ) for
automatic retry."
```

**Why it fails:** The reader might be a new hire, a contractor, a developer from another team, or your future self in 6 months. Unexplained acronyms create a wall that only insiders can pass.

**Fix:** Define every acronym on first use. If you have more than 10 domain-specific terms, create a glossary and link to it.

## Structure anti-patterns

### The monolith README

**Symptom:** A single README.md that's 800+ lines. Setup, architecture, API reference, deployment, troubleshooting, contributing guide — all in one file.

```
❌
README.md (847 lines)
  - Project overview
  - Architecture
  - Setup (local, Docker, Kubernetes)
  - API reference (12 endpoints)
  - Database schema
  - Deployment guide
  - Monitoring
  - Troubleshooting FAQ
  - Contributing guide

✅
README.md (80 lines — overview + quickstart + links)
docs/
  architecture.md
  api-reference.md
  setup/
    local.md
    docker.md
    kubernetes.md
  deployment.md
  monitoring.md
  troubleshooting.md
  contributing.md
```

**Why it fails:** Long documents don't get maintained. The person updating the API reference doesn't review the deployment section in the same file. Merge conflicts increase. Readers can't find what they need.

**Fix:** The README is an entry point — what this is, how to start, and links to everything else. Each focused document has one owner and one purpose.

### Mixing document types

**Symptom:** A tutorial that also tries to explain architecture decisions and serve as an API reference.

```markdown
❌
## Getting Started Tutorial

Step 1: Install the SDK.

The SDK uses a microservices architecture based on the CQRS pattern,
which separates read and write models for better scalability. The decision
to use CQRS was made in ADR-012 after evaluating event sourcing and
traditional CRUD approaches...

(Reader wanted to install the SDK, not read an architecture essay)

✅
## Getting Started

Step 1: Install the SDK.
Step 2: Configure authentication.
Step 3: Make your first API call.

> **Want to understand how the SDK works internally?**
> See [Architecture overview](./architecture.md).
```

**Why it fails:** Each document type (tutorial, how-to, reference, explanation) serves a different reader with a different goal. Mixing them means no reader gets what they need efficiently.

**Fix:** One document, one type. Link between types. A tutorial links to the reference. The reference links to the explanation. The explanation links back to the how-to guide.

### No information hierarchy

**Symptom:** The most important information (how to authenticate) is buried on page 3. The first page explains the project's history and design philosophy.

```markdown
❌
## Our Philosophy
We believe in developer-first design...
## History
Founded in 2019, our API started as...
## Team
Meet the API team...
## Authentication    ← page 3, finally something useful

✅
## Quick Start
1. Get an API key: Settings → API Keys → Create
2. Make your first call:
   curl -H "Authorization: Bearer YOUR_KEY" https://api.example.com/health
3. Explore endpoints: /docs/api-reference

## Authentication       ← second section
## Core Concepts        ← third section
## About This Project   ← last, for those who care
```

**Why it fails:** Readers arrive with a task. The faster they accomplish it, the better the documentation. Front-loading background information delays the reader from reaching actionable content.

**Fix:** Most important = most common task = first section. Progressive disclosure: quickstart → core usage → advanced topics → background.

## Process anti-patterns

### Write once, never update

**Symptom:** Documentation was written during the initial build. The system has changed significantly. Nobody updates the docs because "that's not my job."

**Why it fails:** Documentation drifts from reality at the speed of deployment. After 3 months of weekly deploys without doc updates, the documentation is fiction.

**Fix:**

| Practice | Implementation |
|---|---|
| Docs live with code | Same repo, same PR, same review |
| PR template check | `- [ ] Documentation updated (if applicable)` |
| Doc ownership | Each document has an owner in CODEOWNERS |
| Quarterly review | Calendar event: review each doc, archive or update |
| CI validation | Link checker, code example compilation, freshness alerts |

### Documentation by committee

**Symptom:** Nobody wants to make decisions about structure, so every team writes docs differently. Some use Confluence, some use Notion, some use README files, some use Google Docs.

**Why it fails:** When documentation is scattered across platforms, developers can't find it. When formats vary, quality drops because there's no standard to hold to.

**Fix:** Pick one system and enforce it:

```
Decision: Documentation lives in the code repository.
- API docs: OpenAPI spec + handwritten guides in docs/
- Architecture: ADRs in docs/adrs/
- Operations: Runbooks in docs/runbooks/
- Everything else: docs/ folder with consistent structure

Exceptions: Non-technical stakeholder docs (e.g., product specs) may live
in Notion/Confluence with links from the repo.
```

### No review process

**Symptom:** Someone writes documentation, merges it, and nobody reads it until a new hire tries to follow it 4 months later.

**Why it fails:** Documentation that hasn't been tested by a reader is unreliable. Steps get skipped, prerequisites get assumed, examples don't work.

**Fix:** Every documentation PR needs a reviewer who is NOT the author AND is unfamiliar enough with the system to catch assumptions. The review checklist:

```markdown
- [ ] Can I follow the steps without asking the author for help?
- [ ] Do the code examples run without modification (except placeholders)?
- [ ] Are prerequisites listed before the steps that need them?
- [ ] Does the document answer ONE question or accomplish ONE task clearly?
- [ ] Is there any content I had to re-read to understand?
```

### Auto-generated docs as the only docs

**Symptom:** Swagger/OpenAPI spec is auto-generated from code annotations. That's the entire documentation. No guides, no tutorials, no error handling explanation, no authentication walkthrough.

```
❌
docs/
  swagger.json    ← auto-generated, shows schemas and endpoints
  (nothing else)

✅
docs/
  openapi.yaml           ← auto-generated reference
  getting-started.md     ← handwritten tutorial
  authentication.md      ← handwritten guide
  error-handling.md      ← handwritten guide
  pagination.md          ← handwritten guide
  webhooks.md            ← handwritten guide
  changelog.md           ← maintained manually
```

**Why it fails:** Auto-generated docs answer "what endpoints exist?" but not "how do I accomplish X?" or "what happens when Y goes wrong?" Reference documentation without tutorials and guides is a dictionary without a textbook.

**Fix:** Auto-generated specs provide the reference. Handwritten docs provide the learning path. Both are needed. The ratio should be roughly 40% auto-generated reference, 60% handwritten guides and tutorials.

## Style anti-patterns

### Passive voice everywhere

**Symptom:** Every sentence uses passive voice, making instructions unclear about who does what.

```markdown
❌
"The configuration file should be updated and the service
should be restarted after changes have been made."

✅
"Update the configuration file and restart the service."
```

**Why it fails:** Passive voice hides the actor. In documentation, the reader needs to know: who does this? Is it them? A script? The system? Passive voice creates ambiguity.

### Future tense for current behavior

**Symptom:** "The API will return a 201 status code." Will it? When? Tomorrow?

```markdown
❌ "The endpoint will validate the request body."
❌ "The system will send an email notification."
✅ "The endpoint validates the request body."
✅ "The system sends an email notification."
```

**Why it fails:** Documentation describes how the system works now. Future tense implies it doesn't work yet, or that the behavior is conditional.

### Warning fatigue

**Symptom:** Every other paragraph has a warning, note, or caution callout.

```markdown
❌
> **Warning:** Use a strong password.

> **Note:** The API uses JSON.

> **Caution:** Read the docs before using.

> **Important:** This endpoint requires authentication.

(When everything is important, nothing is important)

✅
> **Warning:** This operation permanently deletes all customer data
> and cannot be undone. Back up your database first.

(Reserve warnings for data loss, security implications, and breaking changes)
```

**Fix:** Maximum 1–2 callouts per page. Reserve them for genuine risks: data loss, security vulnerabilities, breaking changes, and irreversible operations.

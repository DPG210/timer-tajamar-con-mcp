# Architecture Anti-patterns and Smells

Patterns to flag during architecture review. Each entry has the symptom, why it's a problem, and the fix.

## Structural anti-patterns

### Big Ball of Mud

**Symptom:** No discernible module boundaries. Any code can call any other code. Circular dependencies everywhere. New features require changes in 10+ files across unrelated areas.

**Why:** Without explicit boundaries, code grows organically into a tangled web. Change impact is unpredictable. Testing is impossible without the full system.

**Fix:** Identify bounded contexts. Enforce module boundaries (package-level access control, architectural fitness functions). Consider modular monolith as the target.

### Distributed Monolith

**Symptom:** Multiple services that must be deployed together, share a database, or can't function independently. You have the operational complexity of microservices with none of the benefits.

**Why:** Services were split by technical layer (API service, business logic service, data access service) instead of by domain. Or services share state through a common database.

**Fix:** Reorganize around domain boundaries. Each service owns its data. If two services must always deploy together, merge them.

### Golden Hammer

**Symptom:** Every problem is solved with the same technology. "We use Kafka for everything." "Everything is a microservice." "All data goes in MongoDB."

**Why:** Familiarity bias. The team knows one tool well and applies it regardless of fit.

**Fix:** Match the technology to the problem. Use the decision frameworks in this skill (database selection, messaging selection, architecture style selection). Accept that polyglot is healthy.

### Resume-Driven Architecture

**Symptom:** Technology choices that serve the architect's career more than the project. Kubernetes for a 5-person team. Event sourcing for a CRUD app. Microservices for a prototype.

**Why:** Excitement about new technology, conference talks, or career advancement overrides pragmatic decision-making.

**Fix:** Every technology choice must trace to a business or technical driver. "It's the modern approach" is not a driver. Run the build-vs-buy framework.

## Decision anti-patterns

### Architecture by Assumption

**Symptom:** No ADRs. Nobody can explain WHY the architecture is the way it is. New team members have to reverse-engineer decisions from code.

**Why:** Decisions were made verbally, in Slack, or not at all (they emerged from code).

**Fix:** Write ADRs. Even retroactive ADRs for existing decisions are better than nothing.

### Premature Optimization

**Symptom:** Caching layers before measuring latency. Sharding before a single database is at capacity. Event sourcing before needing audit trails.

**Why:** Anticipating problems that don't exist yet. Or solving problems at 10× current scale when you're not sure you'll reach 2×.

**Fix:** AMV: build for today, document evolution triggers for tomorrow. Optimize based on measurements, not predictions.

### Analysis Paralysis

**Symptom:** Weeks of evaluation for a decision that's easily reversible. Four-page comparison documents for choosing between two logging libraries.

**Why:** Fear of making the wrong choice. Perfectionism. No framework for distinguishing reversible from irreversible decisions.

**Fix:** Classify decisions by reversibility. Reversible decisions (library choice, caching strategy) → decide in days. Irreversible decisions (database engine, architecture style) → invest weeks.

### Accidental Complexity

**Symptom:** The architecture is more complex than the problem requires. There are more moving parts than necessary. The deployment diagram looks like a subway map for a 3-developer team.

**Why:** Each individual decision seemed reasonable, but the cumulative complexity was never assessed. Or: the architecture was designed for a problem that grew more complex than the actual business problem.

**Fix:** Regularly ask: "If we were building this from scratch today with what we know now, would we choose this architecture?" If no, plan an evolution.

## Integration anti-patterns

### Chatty Services

**Symptom:** Service A calls Service B 50 times to render a single page. Network latency dominates response time. N+1 query patterns, but over the network instead of a database.

**Why:** Services were split too granularly. Or: the API was designed for CRUD operations instead of use-case-driven operations.

**Fix:** Design APIs around use cases, not entities. Use batch endpoints. Consider a BFF (Backend for Frontend) to aggregate calls. If services are always called together, consider merging them.

### Shared Database

**Symptom:** Multiple services read and write to the same database tables. Schema changes in one service break others. No clear data ownership.

**Why:** It's the path of least resistance when splitting a monolith. "We'll fix data ownership later." (Later never comes.)

**Fix:** Each service owns its data. Other services access it through the owning service's API. Migration path: duplicate the data, sync during transition, cut over.

### Synchronous Chain

**Symptom:** Request from user → Service A → Service B → Service C → Service D. If D is slow, everyone is slow. If D is down, everyone is down.

**Why:** Each service was designed independently without considering the full call chain.

**Fix:** Break the chain. Use async messaging for non-critical steps. Cache intermediate results. Apply circuit breakers. Consider saga pattern for multi-step processes.

### Missing Idempotency

**Symptom:** Retrying a failed request creates duplicate orders, charges the user twice, sends the email again.

**Why:** APIs were designed for the happy path. Retries weren't considered during design.

**Fix:** Idempotency keys on all mutations. Design every write operation so that executing it twice produces the same result as executing it once.

## Operational anti-patterns

### No SLO

**Symptom:** Nobody knows what "acceptable performance" means. Alerts fire on arbitrary thresholds. Every latency spike triggers a fire drill.

**Why:** SLOs were never defined. "The system should be fast" was considered sufficient.

**Fix:** Define SLOs based on user experience: "99.9% of order submissions complete within 2 seconds." Derive alerts from SLO error budget.

### Single Point of Failure (undisclosed)

**Symptom:** One component failure takes down the entire system. Nobody knew it was a SPOF because it wasn't documented.

**Why:** Every system has SPOFs — the question is whether they're known and accepted. Undocumented SPOFs are architectural time bombs.

**Fix:** Identify all SPOFs. For each: document it, calculate the blast radius, either eliminate it (redundancy) or accept it (with documented risk and mitigation plan).

### Infrastructure as Afterthought

**Symptom:** Architecture diagrams show services and databases but not how they're deployed, monitored, or recovered. The DevOps team discovers the architecture when they try to deploy it.

**Why:** Architecture was done in isolation from operations. "DevOps will figure it out."

**Fix:** Include deployment topology, monitoring strategy, and recovery plan in the architecture design. DevOps and SRE are reviewers of the architecture, not recipients.

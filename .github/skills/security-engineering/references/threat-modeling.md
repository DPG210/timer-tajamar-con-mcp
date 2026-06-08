# Threat Modeling

## STRIDE

Each letter represents a threat category. Apply per component in your architecture.

| Threat | Violates | Question | Example |
|---|---|---|---|
| **S**poofing | Authentication | Can someone pretend to be another user/service? | Stolen JWT, forged API key, session fixation |
| **T**ampering | Integrity | Can someone modify data they shouldn't? | SQL injection, MITM, unsigned config files |
| **R**epudiation | Non-repudiation | Can someone deny performing an action? | Missing audit logs, unsigned transactions |
| **I**nformation Disclosure | Confidentiality | Can someone read data they shouldn't? | Verbose errors exposing stack traces, insecure direct object references |
| **D**enial of Service | Availability | Can someone make the system unavailable? | Resource exhaustion, regex DoS, unbounded queries |
| **E**levation of Privilege | Authorization | Can someone gain higher access than intended? | Missing authorization checks, IDOR, JWT claim manipulation |

## Threat modeling process

### Step 1: Draw the data flow diagram

```
[Browser] --HTTPS--> [API Gateway] --HTTP--> [Order Service] --TCP--> [Database]
                          |                        |
                     [Auth Service]           [Payment Gateway]
                                                (external)
```

### Step 2: Identify trust boundaries

A trust boundary exists wherever the trust level changes:

```
┌─────────────────────────────────────┐
│ Internet (untrusted)                │
│   [Browser]                         │
│         │                           │
├─────────┼───────────────────────────┤  ← Trust boundary 1 (network edge)
│ DMZ     │                           │
│   [API Gateway / WAF]               │
│         │                           │
├─────────┼───────────────────────────┤  ← Trust boundary 2 (internal network)
│ Internal│                           │
│   [Order Service]──[Payment GW]     │  ← Trust boundary 3 (external service)
│         │                           │
│   [Database]                        │  ← Trust boundary 4 (data store)
└─────────────────────────────────────┘
```

Every trust boundary crossing needs validation and authentication.

### Step 3: Apply STRIDE per component

| Component | S | T | R | I | D | E |
|---|---|---|---|---|---|---|
| **API Gateway** | JWT validation | TLS termination | Access logs | Rate limiting errors | Rate limiting | Claim validation |
| **Order Service** | Service-to-service auth | Input validation | Audit trail | Error sanitization | Query limits | Authorization checks |
| **Database** | Connection auth | Parameterized queries | Query logs | Column-level encryption | Connection limits | Least privilege roles |
| **Payment GW** | mTLS/API key | HMAC signatures | Transaction logs | PCI scope isolation | Timeout + circuit breaker | Scoped API key |

### Step 4: Prioritize with DREAD (risk rating)

| Factor | Description | 1 (low) | 5 (medium) | 10 (high) |
|---|---|---|---|---|
| **D**amage | What's the impact? | Minor data leak | Significant data loss | Full system compromise |
| **R**eproducibility | How easy to reproduce? | Requires specific conditions | Reproducible with effort | Trivially reproducible |
| **E**xploitability | How easy to exploit? | Requires advanced skills | Requires some knowledge | Automated tools exist |
| **A**ffected users | How many users impacted? | Single user | Some users | All users |
| **D**iscoverability | How easy to find? | Requires insider knowledge | Findable with effort | Publicly visible |

Risk score = average of all factors. Prioritize by score: >7 = fix immediately, 4-7 = fix in current sprint, <4 = track and schedule.

## Attack trees

For complex threats, decompose into sub-goals:

```
Goal: Steal customer data
├── Exploit SQL injection
│   ├── Find injection point (search, filters, API params)
│   └── Extract data via UNION-based or blind injection
├── Compromise admin account
│   ├── Credential stuffing (reused passwords)
│   ├── Phishing admin user
│   └── Exploit password reset flow
├── Exploit IDOR
│   ├── Enumerate order IDs (/api/orders/1, /api/orders/2, ...)
│   └── Access other users' data via predictable IDs
└── Intercept data in transit
    ├── MITM on HTTP (if not enforcing HTTPS)
    └── Compromise TLS (weak ciphers, expired cert)
```

Each leaf node is a specific, testable attack vector. Work from the leaves — if you block all leaves, the goal is unreachable.

## When to threat model

| Trigger | Depth |
|---|---|
| New system/service | Full STRIDE per component, document in ADR |
| New feature touching auth/data | STRIDE on affected components |
| Third-party integration | Trust boundary analysis + STRIDE |
| Security incident | Root cause → update threat model → add missing controls |
| Annually | Review existing model for new threats |

## Lightweight threat model template

```markdown
## Threat Model: [Feature/System]

### Assets
- What are we protecting? (customer PII, payment data, admin access)

### Trust Boundaries
- Where does trust level change? (browser→API, service→service, service→external)

### Threats (STRIDE)
| # | Category | Threat | Likelihood | Impact | Risk | Mitigation |
|---|---|---|---|---|---|---|
| 1 | Spoofing | Attacker forges JWT | Medium | High | High | Validate signature, issuer, audience, expiry |
| 2 | Tampering | SQL injection in search | High | Critical | Critical | Parameterized queries (EF Core) |
| ... |

### Residual Risk
- What risks remain after mitigations? Are they acceptable?

### Review Date
- Next review: [date or trigger]
```

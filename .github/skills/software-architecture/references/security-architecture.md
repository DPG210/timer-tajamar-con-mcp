# Security Architecture

Source: NIST Zero Trust Architecture (SP 800-207), STRIDE (Microsoft), OWASP.

## Zero Trust architecture

### Core principle

"Never trust, always verify." No network location, no previous authentication, no internal status grants implicit trust. Every request is authenticated and authorized as if it came from the open internet.

### Zero Trust pillars

| Pillar | What it means | Implementation |
|---|---|---|
| **Identity** | Every actor has a verified identity | OAuth 2.0 / OIDC, service-to-service mTLS, API keys with scopes |
| **Device** | Device health is assessed | Device certificates, MDM compliance checks |
| **Network** | Network is untrusted, even internal | mTLS everywhere, service mesh, micro-segmentation |
| **Application** | Applications authenticate to each other | Service identities, workload identity federation |
| **Data** | Data is classified and access-controlled | Encryption at rest and in transit, field-level encryption, RBAC/ABAC |
| **Observability** | All access is logged and monitored | Audit logs, anomaly detection, SIEM integration |

### Trust boundaries

The architect defines trust boundaries — the lines across which different trust levels apply:

```
┌─────────────────────────────────────────────────┐
│ Public Internet (untrusted)                      │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │ Edge / DMZ                                  │ │
│  │  WAF, DDoS protection, rate limiting        │ │
│  │  API Gateway (AuthN, AuthZ at the edge)     │ │
│  │                                              │ │
│  │  ┌──────────────────────────────────────┐   │ │
│  │  │ Application tier (service mesh)       │   │ │
│  │  │  mTLS between services               │   │ │
│  │  │  Service identity verification        │   │ │
│  │  │                                        │   │ │
│  │  │  ┌────────────────────────────────┐   │   │ │
│  │  │  │ Data tier                       │   │   │ │
│  │  │  │  Encryption at rest             │   │   │ │
│  │  │  │  Connection authentication      │   │   │ │
│  │  │  │  Row-level security (if needed) │   │   │ │
│  │  │  └────────────────────────────────┘   │   │ │
│  │  └──────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

Every arrow crossing a boundary must answer: who is calling, are they authenticated, are they authorized, is the channel encrypted, is the action logged?

## STRIDE threat model (architect level)

The architect runs a high-level STRIDE analysis during design. The Security Engineer details it during the quality phase.

| Threat | Question | Architectural mitigation |
|---|---|---|
| **Spoofing** | Can someone pretend to be another user/service? | Strong authentication (OAuth 2.0, mTLS, signed tokens) |
| **Tampering** | Can data be modified in transit or at rest? | TLS in transit, encryption at rest, integrity checks (HMAC, signatures) |
| **Repudiation** | Can someone deny they performed an action? | Audit logging, non-repudiation (signed events, timestamps) |
| **Information Disclosure** | Can sensitive data leak? | Encryption, access controls, data classification, PII handling |
| **Denial of Service** | Can the system be overwhelmed? | Rate limiting, auto-scaling, circuit breakers, CDN |
| **Elevation of Privilege** | Can a user gain unauthorized access? | Least privilege, RBAC/ABAC, input validation, defense in depth |

### STRIDE at the architecture level

For each component in the architecture diagram:
1. Draw the data flow diagram (DFD).
2. Identify trust boundaries.
3. For each data flow crossing a trust boundary, apply STRIDE.
4. Document the threat and the mitigation.
5. Assign threats to the Security Engineer for detailed review.

## Authentication architecture

| Pattern | When to use | Implementation |
|---|---|---|
| **OAuth 2.0 + OIDC** | User-facing apps, SSO | Authorization code flow + PKCE for SPAs, client credentials for service-to-service |
| **API keys** | Simple service integrations, third-party API access | Scoped keys, rotated regularly, stored in secrets manager |
| **mTLS** | Service-to-service in Zero Trust | Certificates managed by service mesh (Istio, Linkerd) or PKI |
| **JWT** | Stateless token-based auth | Short-lived access tokens (15 min), refresh tokens (24h), token introspection for revocation |

### Token architecture

```
Client → Authorization Server (login) → Access Token (short-lived) + Refresh Token (long-lived)
Client → API Gateway (access token in Authorization header)
API Gateway → validates token (signature, expiry, audience, scope)
API Gateway → forwards to service with validated claims
Service → uses claims for authorization (RBAC/ABAC)
```

## Authorization models

| Model | How it works | Best for |
|---|---|---|
| **RBAC** (Role-Based) | Users have roles, roles have permissions | Simple permission models, small number of roles |
| **ABAC** (Attribute-Based) | Policies evaluate attributes (user, resource, context) | Complex rules, multi-tenant, context-dependent access |
| **ReBAC** (Relationship-Based) | Access based on relationships between entities | Document sharing (Google Docs model), social graphs |

### Authorization decision points

- **API Gateway:** Coarse-grained (is this user authenticated? do they have the right scope?).
- **Service layer:** Fine-grained (does this user have permission to access THIS resource?).
- **Database:** Row-level security (user only sees their own data).

## Secrets management

| What | Where | NOT here |
|---|---|---|
| API keys, tokens, certificates | Secrets manager (Vault, AWS Secrets Manager, Azure Key Vault) | Source code, environment variables in plain text, config files |
| Database credentials | Secrets manager with rotation | Connection strings in appsettings.json |
| Encryption keys | KMS (cloud-managed or HSM) | Application code |
| Service identity | Workload identity (cloud IAM, SPIFFE) | Static credentials |

### Secrets rotation

- Automate rotation. Manual rotation = rotation that doesn't happen.
- Rotation period: 90 days for long-lived secrets, shorter for high-risk.
- Zero-downtime rotation: new secret valid before old one expires.

## Data classification (architect establishes, security enforces)

| Level | Examples | Handling |
|---|---|---|
| **Public** | Marketing content, public API docs | No restrictions |
| **Internal** | Internal wikis, team communications | Authentication required |
| **Confidential** | Customer data, business metrics | Encryption at rest + in transit, access logging |
| **Restricted** | PII, PHI, payment data, credentials | All of above + field-level encryption, data masking, audit trail, compliance controls |

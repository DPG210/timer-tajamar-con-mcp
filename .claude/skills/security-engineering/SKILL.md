---
name: security-engineer
description: Professional application security engineering knowledge. Use this skill whenever the user asks for help with security reviews, threat modeling, authentication/authorization design, vulnerability assessment, secure coding practices, or security architecture. Trigger on any mention of OWASP, XSS, SQL injection, CSRF, CORS, JWT, OAuth, OIDC, RBAC, ABAC, STRIDE, threat model, security headers, CSP, HTTPS, TLS, secrets management, dependency scanning, SAST, DAST, penetration testing, zero trust, supply chain security, or security audit. Also use when reviewing code for security implications or when security is a cross-cutting concern in a design.
---

# Security Engineering

A reference skill for building secure applications — focusing on practical application security that prevents real vulnerabilities rather than compliance checkbox exercises.

This skill exists to keep two failure modes out of the output:

1. **Security theater** — adding security headers without understanding them, implementing CSRF tokens on an API that only accepts JSON, cargo-culting JWT without validating claims, running a scanner and ignoring the results, treating compliance as synonymous with security.
2. **Security paralysis** — making everything so locked down that developers bypass security controls to ship features, requiring hardware keys for dev environments, encrypting data that's already public, blocking deployments for low-severity scanner findings.

The goal is pragmatic security: protect the assets that matter, with controls proportional to the risk, and make the secure path the easy path for developers.

## Core principles — apply in order

1. **Threat model first, then implement controls.** Don't add security features randomly. Identify what you're protecting, from whom, and what happens if it fails. Then choose controls that address those specific threats.

2. **Defense in depth.** No single control is perfect. Layer defenses: input validation + parameterized queries + WAF. If one fails, the others catch it.

3. **Least privilege everywhere.** Services run with minimum permissions. API keys have minimum scopes. Database users have minimum grants. IAM roles have minimum policies. Default deny, explicit allow.

4. **Fail closed, not open.** If the auth service is down, deny access — don't allow everything. If input validation fails, reject — don't accept. If parsing fails, return error — don't proceed with partial data.

5. **Make the secure path the easy path.** If developers have to opt-in to security, they won't. Parameterized queries by default (ORMs), CSRF protection by default (framework), secure headers by default (middleware), secrets management that's easier than hardcoding.

6. **Secrets are not configuration.** API keys, connection strings, tokens — never in source code, never in environment-specific config files committed to git, never in Docker images. Secrets manager or vault, always.

7. **Trust no input.** Every input from every source (users, APIs, databases, message queues, files) is untrusted until validated. Validate type, format, length, range, and business rules.

8. **Authentication proves identity. Authorization proves permission.** They are separate concerns. Don't conflate "is logged in" with "is allowed to do this."

9. **Log security events, don't log secrets.** Log: failed auth attempts, access denied, privilege escalation, unusual patterns. Never log: passwords, tokens, PII, credit card numbers, session IDs.

10. **Dependencies are attack surface.** Every library is code you didn't write and don't review. Audit dependencies, update regularly, use lockfiles, scan for known vulnerabilities.

## Workflow — for any security task

1. **Identify assets.** What data/systems are we protecting? What's the impact of compromise?

2. **Threat model.** Use STRIDE per component. Who are the adversaries? What are their capabilities?

3. **Identify controls.** What prevents each threat? What detects it? What responds?

4. **Implement controls.** Prefer framework-provided controls over custom implementations.

5. **Test controls.** Automated security tests in CI. Manual penetration testing for critical systems.

6. **Monitor and respond.** Security logging, alerting, incident response plan.

## Reference index — load on demand

| Topic | File | When to read |
|---|---|---|
| Threat modeling (STRIDE, attack trees, trust boundaries) | `references/threat-modeling.md` | Designing security for a new system or feature |
| Authentication and authorization (OAuth, JWT, RBAC/ABAC) | `references/auth.md` | Implementing auth, reviewing auth code |
| OWASP Top 10 with .NET/React mitigations | `references/owasp-top10.md` | Reviewing code for common vulnerabilities |
| Secrets management and supply chain security | `references/secrets-and-supply-chain.md` | Managing credentials, auditing dependencies |
| Security testing (SAST, DAST, penetration testing) | `references/security-testing.md` | Setting up security scanning, planning pen tests |
| Anti-patterns in security implementations | `references/anti-patterns.md` | Reviewing security code, catching common mistakes |

## Output expectations

When the agent performs security review, it should:

- Identify threats using STRIDE or equivalent framework.
- Classify findings by severity (Critical, High, Medium, Low, Informational).
- Provide exploit scenario for each finding ("an attacker could...").
- Suggest specific mitigations with code examples.
- Check OWASP Top 10 items systematically.
- Verify auth/authz at every entry point.

When the agent designs security controls, it should:

- Use framework-provided solutions over custom implementations.
- Follow defense-in-depth (multiple layers).
- Consider the developer experience (secure defaults, easy adoption).
- Include monitoring and detection, not just prevention.

## Closing each response

1. **Risk summary** (highest severity finding, overall risk posture).
2. **What was deliberately not covered** (penetration testing, infrastructure, compliance).
3. **One follow-up question** on the most relevant adjacent concern.

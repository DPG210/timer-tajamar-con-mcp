# OWASP Top 10 — Practical Mitigations

For each vulnerability: what it is, how it manifests in .NET/React, and the specific mitigation.

## A01: Broken Access Control

**What:** Users acting outside their intended permissions — accessing other users' data, escalating roles, bypassing checks.

**Common manifestation:** IDOR (Insecure Direct Object Reference).

```csharp
// VULNERABLE: any authenticated user can access any order
app.MapGet("/api/orders/{id}", async (int id, AppDbContext db) =>
{
    var order = await db.Orders.FindAsync(id);
    return order is not null ? Results.Ok(order) : Results.NotFound();
});

// FIXED: verify ownership
app.MapGet("/api/orders/{id}", async (int id, AppDbContext db, ClaimsPrincipal user) =>
{
    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
    var order = await db.Orders
        .FirstOrDefaultAsync(o => o.Id == id && o.CustomerId == userId);
    return order is not null ? Results.Ok(order) : Results.NotFound();
});
```

**Mitigations:** Resource-level authorization (not just role checks), deny by default, EF Core global query filters for multi-tenancy, automated tests that verify cross-user access is blocked.

## A02: Cryptographic Failures

**What:** Missing encryption, weak algorithms, exposed secrets.

**Mitigations for .NET:**
- Use Data Protection API for encrypting data at rest.
- HTTPS everywhere — `app.UseHttpsRedirection()` + HSTS.
- bcrypt or Argon2 for passwords (never SHA256/MD5).
- AES-256-GCM for symmetric encryption.
- RS256 (asymmetric) for JWT signatures.

## A03: Injection

**What:** Untrusted data sent to an interpreter (SQL, LDAP, OS command, NoSQL).

```csharp
// VULNERABLE: string concatenation in SQL
var sql = $"SELECT * FROM Orders WHERE CustomerId = '{customerId}'";
var orders = await db.Orders.FromSqlRaw(sql).ToListAsync();
// Input: ' OR 1=1 --  → returns ALL orders

// FIXED: parameterized query (EF Core does this by default)
var orders = await db.Orders
    .Where(o => o.CustomerId == customerId)
    .ToListAsync();

// If raw SQL is needed:
var orders = await db.Orders
    .FromSqlInterpolated($"SELECT * FROM Orders WHERE CustomerId = {customerId}")
    .ToListAsync();
```

**React XSS:**
```tsx
// VULNERABLE: dangerouslySetInnerHTML with user input
<div dangerouslySetInnerHTML={{ __html: userComment }} />

// SAFE: React auto-escapes JSX expressions
<div>{userComment}</div>

// If HTML rendering is needed: use DOMPurify
import DOMPurify from "dompurify";
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userComment) }} />
```

## A04: Insecure Design

**What:** Design-level flaws that can't be fixed by a correct implementation — missing threat model, no rate limiting on auth, no abuse case analysis.

**Mitigations:** Threat modeling before implementation, abuse cases in user stories ("as an attacker, I try to..."), rate limiting on sensitive endpoints, business logic limits (max order value, max failed logins).

## A05: Security Misconfiguration

**What:** Default credentials, verbose errors in production, unnecessary features enabled, permissive CORS.

```csharp
// DANGEROUS: allow any origin
builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader()));

// CORRECT: explicit origins
builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.WithOrigins("https://app.example.com")
     .WithMethods("GET", "POST", "PUT", "DELETE")
     .WithHeaders("Authorization", "Content-Type")));
```

**Security headers:**
```csharp
app.Use(async (context, next) =>
{
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["X-Frame-Options"] = "DENY";
    context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    context.Response.Headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";
    context.Response.Headers["Content-Security-Policy"] =
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'";
    await next();
});
```

## A07: Identification and Authentication Failures

**What:** Weak passwords accepted, credential stuffing unmitigated, session fixation, missing MFA on sensitive operations.

**Mitigations:**
- Rate limiting on `/login` (5 attempts per minute per IP+username).
- Account lockout after 10 failed attempts (with unlock after 30 minutes).
- MFA for admin accounts and sensitive operations.
- Secure session management (regenerate session ID after login).
- Password requirements: minimum 8 characters, check against breached password databases (Have I Been Pwned API).

## A08: Software and Data Integrity Failures

**What:** Using untrusted dependencies, unsigned updates, deserialization of untrusted data.

**Mitigations:**
- Lock file (`package-lock.json`, `packages.lock.json`) committed and verified in CI.
- Dependency scanning (Dependabot, Snyk, `dotnet list package --vulnerable`).
- Never deserialize untrusted data with `BinaryFormatter` (removed in .NET 9).
- Subresource Integrity (SRI) for CDN scripts.

## A09: Security Logging and Monitoring Failures

**What:** Security events not logged, logs not monitored, no alerting.

**What to log:**
| Event | Log level | Alert? |
|---|---|---|
| Successful login | Information | No |
| Failed login | Warning | After 5 in 1 minute |
| Authorization denied | Warning | Pattern-based |
| Admin action | Information | Yes (audit trail) |
| Input validation failure | Warning | Volume-based |
| Unhandled exception | Error | Yes |

**What NEVER to log:** Passwords, tokens, credit card numbers, PII beyond user ID.

## A10: Server-Side Request Forgery (SSRF)

**What:** Attacker tricks the server into making requests to internal resources.

```csharp
// VULNERABLE: user-provided URL fetched by server
app.MapGet("/proxy", async (string url) =>
{
    var response = await httpClient.GetAsync(url);
    // Attacker sends: url=http://169.254.169.254/latest/meta-data/iam/security-credentials/
    // → server fetches AWS metadata endpoint → credentials leaked
});

// MITIGATIONS:
// 1. Allowlist of permitted domains
// 2. Block private IP ranges (10.x, 172.16-31.x, 192.168.x, 169.254.x)
// 3. Don't allow user-provided URLs if possible
```

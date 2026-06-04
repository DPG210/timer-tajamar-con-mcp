# Authentication and Authorization

## Authentication vs Authorization

| Concern | Question | Mechanism |
|---|---|---|
| **Authentication (AuthN)** | Who are you? | OAuth 2.0 + OIDC, JWT, API keys, mTLS |
| **Authorization (AuthZ)** | What can you do? | RBAC, ABAC, ReBAC, policy engines |

They are separate systems. Never conflate "is authenticated" with "is authorized."

## OAuth 2.0 + OpenID Connect

### Flows — when to use which

| Flow | Client type | When |
|---|---|---|
| **Authorization Code + PKCE** | SPA, mobile, any public client | Standard for all browser-based apps. PKCE is mandatory. |
| **Client Credentials** | Service-to-service (no user) | Backend services calling each other. The client IS the resource owner. |
| **Device Code** | CLI, TV, IoT | No browser available on the device |

**Deprecated flows (never use):**
- Implicit: tokens in URL fragment — leaks via history, referrer.
- Resource Owner Password: client handles credentials directly — anti-pattern.

### Authorization Code + PKCE (SPA)

```
1. Browser → Auth Server: /authorize?response_type=code&client_id=X&code_challenge=Y&redirect_uri=Z
2. User logs in on Auth Server
3. Auth Server → Browser: redirect to Z with ?code=ABC
4. Browser → Auth Server: /token with code=ABC + code_verifier
5. Auth Server → Browser: { access_token, id_token, refresh_token }
```

PKCE (Proof Key for Code Exchange) prevents authorization code interception — the code is useless without the code_verifier that only the legitimate client has.

### Token storage in SPAs

| Storage | Risk | Recommendation |
|---|---|---|
| **localStorage** | XSS reads it | Never for access tokens |
| **sessionStorage** | XSS reads it | Never for access tokens |
| **Memory (variable)** | Lost on refresh | Acceptable with silent refresh |
| **HttpOnly cookie** | CSRF (mitigated with SameSite) | Best option — set by BFF or auth server |

**Recommended pattern:** Backend-for-Frontend (BFF). The SPA calls a same-origin backend that handles tokens in HttpOnly cookies. The browser never sees the tokens.

## JWT structure and validation

```
Header.Payload.Signature

Header:  { "alg": "RS256", "typ": "JWT", "kid": "key-1" }
Payload: { "sub": "user-123", "iss": "https://auth.example.com", "aud": "order-api",
           "exp": 1700000000, "iat": 1699996400, "roles": ["customer"], "tenant_id": "t-1" }
Signature: RS256(base64(header) + "." + base64(payload), private_key)
```

### Validation checklist (every JWT, every time)

| Check | What | Why |
|---|---|---|
| **Signature** | Verify with public key (RS256) or shared secret (HS256) | Prevents token forgery |
| **`exp`** | Token not expired | Prevents replay of old tokens |
| **`iss`** | Issuer matches your auth server | Prevents tokens from untrusted issuers |
| **`aud`** | Audience includes this API | Prevents tokens meant for other services |
| **`nbf`** | Not before time (if present) | Prevents use before intended time |
| **Algorithm** | Matches expected (RS256, not "none") | Prevents algorithm confusion attack |

### JWT anti-patterns

- **`alg: "none"`** — never accept unsigned tokens. Validate that the algorithm is in your allow-list.
- **Storing sensitive data in JWT payload** — JWTs are base64-encoded, not encrypted. Anyone can read the payload.
- **Long-lived access tokens** — access tokens should live 5-15 minutes. Use refresh tokens (stored server-side) for session continuity.
- **No token revocation strategy** — JWTs can't be revoked. Use short expiry + token denylist for emergency revocation.

## Authorization models

### RBAC (Role-Based Access Control)

```csharp
// Simple — works for most apps
[Authorize(Roles = "Admin,Manager")]
public async Task<IActionResult> DeleteOrder(int id) { ... }
```

Roles: `Admin`, `Manager`, `Customer`. Each role has a set of permissions. User has one or more roles.

**Limitation:** Can't express "users can only delete THEIR orders." RBAC says "this user has the delete permission" but not "on which resources."

### ABAC (Attribute-Based Access Control)

Policies based on attributes of the user, resource, action, and environment.

```csharp
// Policy: user can cancel orders they own, that are not shipped
public class OrderCancellationHandler : AuthorizationHandler<CancelOrderRequirement, Order>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        CancelOrderRequirement requirement,
        Order order)
    {
        var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (order.CustomerId == userId && order.Status != OrderStatus.Shipped)
        {
            context.Succeed(requirement);
        }

        return Task.CompletedTask;
    }
}
```

Use when: permissions depend on the relationship between the user and the resource (ownership, team membership, tenant).

### ReBAC (Relationship-Based Access Control)

Models authorization as a graph of relationships: "user:alice is owner of document:123", "team:engineering is member of org:acme".

```
user:alice → owner → document:123
user:bob → viewer → document:123
team:eng → member → org:acme
user:alice → member → team:eng
```

Query: "Can alice edit document:123?" → Traverse: alice→owner→document:123 → yes (owners can edit).

Tools: OpenFGA (open source), Zanzibar (Google), SpiceDB.

Use when: complex hierarchical permissions (Google Docs-style sharing, multi-tenant with team hierarchies).

## Multi-tenancy authorization

```csharp
// Middleware: extract tenant from JWT and enforce isolation
public class TenantMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context)
    {
        var tenantId = context.User.FindFirstValue("tenant_id");
        if (tenantId is null)
        {
            context.Response.StatusCode = 403;
            return;
        }

        // Set tenant context for the entire request
        context.Items["TenantId"] = tenantId;
        await next(context);
    }
}

// EF Core global query filter: automatic tenant isolation
modelBuilder.Entity<Order>().HasQueryFilter(o => o.TenantId == _currentTenant.Id);
```

Every query automatically filtered by tenant. A bug in one endpoint can't leak data across tenants.

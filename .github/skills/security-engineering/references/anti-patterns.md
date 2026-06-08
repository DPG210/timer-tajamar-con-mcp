# Anti-patterns in Security Implementations

## Authentication anti-patterns

### Rolling your own auth

**Symptom:** Custom login system with hand-written password hashing, session management, token generation.

**Why:** Auth is the hardest thing to get right. One mistake (timing attack on comparison, weak random for token generation, missing rate limiting) and the entire system is compromised.

**Fix:** Use a proven identity provider: Auth0, Entra ID, Keycloak, Firebase Auth. If you must build it, use ASP.NET Identity (which handles hashing, lockout, token generation).

### Password stored as MD5/SHA256

**Symptom:** `var hash = SHA256.HashData(Encoding.UTF8.GetBytes(password));`

**Why:** SHA256 is fast — an attacker can try billions of hashes per second with a GPU. It's not designed for passwords.

**Fix:** bcrypt, Argon2id, or PBKDF2 with high iteration count. These are deliberately slow (100ms+ per hash).

### JWT as session (long-lived, no revocation)

**Symptom:** JWT access token with 24-hour or 7-day expiry. No refresh token. No revocation mechanism.

**Why:** If the token is compromised, the attacker has access for the full lifetime. JWTs can't be revoked — they're self-contained.

**Fix:** Short-lived access tokens (5-15 min) + refresh tokens (stored server-side, revocable). Token denylist in Redis for emergency revocation.

### Comparing secrets with `==`

**Symptom:** `if (providedToken == storedToken)` for API key or token validation.

**Why:** String comparison short-circuits — it returns false as soon as it finds a mismatched character. An attacker can measure response time to determine how many characters are correct (timing attack).

**Fix:** `CryptographicOperations.FixedTimeEquals()` in .NET, `crypto.timingSafeEqual()` in Node.js.

## Authorization anti-patterns

### Authorization in the frontend only

**Symptom:** UI hides the "Delete" button for non-admins, but the API endpoint `/api/orders/{id}` has no authorization check.

**Why:** The frontend is client-side — the user controls it. Hiding a button doesn't prevent a curl request.

**Fix:** Authorization is ALWAYS enforced on the server. The frontend hides UI elements as a UX convenience, not as a security control.

### Role check without resource check

**Symptom:** `[Authorize(Roles = "Customer")]` on an endpoint that returns any customer's data. Being a customer is enough to see all customers' orders.

**Fix:** Check both role AND resource ownership: `if (order.CustomerId != currentUserId) return NotFound();`

### Insecure Direct Object Reference (IDOR)

**Symptom:** Sequential, predictable IDs in URLs: `/api/invoices/1001`, `/api/invoices/1002`. Any authenticated user can iterate.

**Fix:** 
1. Always check ownership/permission before returning data.
2. Use UUIDs instead of sequential IDs (doesn't fix IDOR but reduces discoverability).
3. Global query filter on tenant/user: `HasQueryFilter(o => o.UserId == currentUserId)`.

## Data exposure anti-patterns

### Verbose error messages in production

**Symptom:** Stack traces, SQL queries, file paths in API error responses.

```json
{
  "error": "SqlException: Invalid column name 'Pasword' at line 42 of OrderService.cs",
  "stackTrace": "at Microsoft.Data.SqlClient..."
}
```

**Why:** Reveals internal structure (table names, column names, file paths, library versions) to attackers.

**Fix:** Generic error in production, detailed in development only.

```csharp
if (!env.IsDevelopment())
{
    problemDetails.Detail = null; // Strip internal details
}
```

### Logging sensitive data

**Symptom:** `logger.LogInformation("User login: {Email}, password: {Password}", email, password);`

**Fix:** Never log passwords, tokens, API keys, credit card numbers, SSNs. Log user IDs and event types: `logger.LogInformation("Login attempt for user {UserId}", userId);`

### Returning full entity instead of DTO

**Symptom:** API returns the entire database entity, including `PasswordHash`, `InternalNotes`, `CreatedBy`, `TenantId`.

**Fix:** Map to a response DTO that includes only the fields the consumer needs. Never serialize entities directly.

## Configuration anti-patterns

### CORS `AllowAnyOrigin()` with credentials

**Symptom:** `builder.Services.AddCors(o => o.AddDefaultPolicy(p => p.AllowAnyOrigin().AllowCredentials()));`

**Why:** Any website can make authenticated requests to your API. This is the same as having no CORS policy.

**Fix:** Explicit origin list. If you need multiple origins, use a whitelist.

### Default credentials in production

**Symptom:** admin/admin, sa/password, root/(empty) on production services.

**Fix:** Unique, strong credentials per environment. Secrets manager. Validate no defaults at deployment time.

### Security headers missing

**Symptom:** No `Content-Security-Policy`, no `X-Frame-Options`, no `X-Content-Type-Options`.

**Why:** Without CSP, XSS is easier to exploit. Without X-Frame-Options, clickjacking is possible. Without X-Content-Type-Options, MIME sniffing can lead to script execution.

**Fix:** Add all security headers via middleware. Test with securityheaders.com.

## Crypto anti-patterns

### Home-grown encryption

**Symptom:** Custom XOR-based "encryption", custom hash functions, custom token generation with `Random`.

**Fix:** Use standard algorithms from standard libraries. AES-256-GCM for encryption. RSA/ECDSA for signatures. `RandomNumberGenerator` (not `Random`) for security tokens.

### Encryption without authentication (AES-CBC without HMAC)

**Symptom:** Using AES in CBC mode without a MAC to verify integrity.

**Why:** An attacker can modify the ciphertext and produce valid-looking (but corrupted) plaintext. This enables padding oracle attacks.

**Fix:** Use AES-GCM (authenticated encryption) or AES-CBC + HMAC-SHA256 (encrypt-then-MAC).

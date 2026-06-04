# Review Checklists by Change Type

Specialized checklists for the types of changes that most commonly introduce bugs. Use the relevant checklist alongside the general review.

## API endpoint changes

- [ ] HTTP method matches the operation (GET for read, POST for create, PUT/PATCH for update, DELETE for delete)
- [ ] Route follows naming conventions (plural nouns, no verbs in path)
- [ ] Request validation runs before any business logic
- [ ] Authorization check is present (not just authentication)
- [ ] Error responses use ProblemDetails / consistent error format
- [ ] Success response uses correct HTTP status (201 for creation, 204 for no content)
- [ ] Pagination is implemented for list endpoints
- [ ] CancellationToken is accepted and propagated
- [ ] API versioning is considered if this is a breaking change
- [ ] Response does not expose internal IDs or sensitive fields unnecessarily
- [ ] Rate limiting is applied for public-facing endpoints

## Database migration changes

- [ ] Migration is reversible (has a Down/rollback script)
- [ ] Column additions use nullable or have a default (avoid NOT NULL without default on existing table)
- [ ] No data loss — columns being removed have been verified as unused
- [ ] Index additions won't lock the table for too long (CONCURRENTLY for PostgreSQL)
- [ ] Foreign key constraints have appropriate ON DELETE behavior
- [ ] Migration runs within acceptable time for production data volume
- [ ] Expand-contract pattern used for breaking schema changes
- [ ] Migration tested against a production-like dataset (not just empty tables)
- [ ] No raw data manipulation in migration (seed data belongs elsewhere)

## Authentication / authorization changes

- [ ] No credentials or tokens hardcoded
- [ ] Token validation checks expiration, issuer, audience
- [ ] Authorization is resource-level, not just role-level (user can only access THEIR orders)
- [ ] Failed auth returns 401 (unauthenticated) or 403 (unauthorized), not 404
- [ ] Admin endpoints have explicit authorization, not just "is authenticated"
- [ ] Password handling uses proper hashing (bcrypt, Argon2) — not SHA256/MD5
- [ ] Session/token invalidation on logout and password change
- [ ] CORS policy doesn't use wildcard (*) for authenticated endpoints

## Third-party integration changes

- [ ] API keys and secrets use configuration/secrets manager (not committed)
- [ ] HTTP client uses IHttpClientFactory (not `new HttpClient()`)
- [ ] Retry policy with exponential backoff and jitter
- [ ] Circuit breaker for cascading failure protection
- [ ] Timeout configured (not using default infinite timeout)
- [ ] Response error handling covers all known error codes
- [ ] Fallback behavior defined for when the service is unavailable
- [ ] Idempotency keys for mutating operations (to handle retries safely)
- [ ] Rate limit handling (429 status code → back off)

## Frontend component changes

- [ ] Component has loading, error, and empty states
- [ ] Interactive elements are keyboard-accessible
- [ ] Semantic HTML used (`<button>`, `<a>`, `<nav>`, not `<div onClick>`)
- [ ] ARIA attributes present where semantic HTML is insufficient
- [ ] No `useEffect` for derived state (compute during render)
- [ ] Data fetching uses TanStack Query/SWR (not raw useEffect+fetch)
- [ ] Form validation provides clear, specific error messages
- [ ] No `any` types in TypeScript
- [ ] Lists use stable unique keys (not array index)
- [ ] Large lists use virtualization if >500 items
- [ ] URL state used for filters/pagination/tabs (not React state)

## Performance-sensitive changes

- [ ] Database queries have appropriate indexes for the WHERE/JOIN clauses
- [ ] N+1 query pattern is absent (use Include/Join, not lazy loading in loops)
- [ ] Pagination is used for unbounded data (no "load all 100K records")
- [ ] Caching has TTL and invalidation strategy
- [ ] Response sizes are reasonable (no returning entire entity graph)
- [ ] Background processing used for operations >1 second
- [ ] Connection pools are used (database, HTTP)
- [ ] Async/await used throughout the call chain (no sync-over-async)

## Configuration changes

- [ ] No secrets committed (API keys, connection strings, passwords)
- [ ] Configuration uses strongly-typed options (not raw string access)
- [ ] Environment-specific values use environment variables (not if/else on env name)
- [ ] Default values are safe (fail closed, not fail open)
- [ ] Configuration validation runs at startup (not at first use)
- [ ] Feature flags have an expiry or cleanup plan

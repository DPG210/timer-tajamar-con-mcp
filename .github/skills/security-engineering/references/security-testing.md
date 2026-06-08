# Security Testing

## Testing types

| Type | What | When | Tool |
|---|---|---|---|
| **SAST** (Static Application Security Testing) | Analyzes source code for vulnerabilities | Every PR in CI | SonarQube, Semgrep, Roslyn Security analyzers |
| **DAST** (Dynamic Application Security Testing) | Tests running application for vulnerabilities | Staging, pre-release | OWASP ZAP, Burp Suite |
| **SCA** (Software Composition Analysis) | Scans dependencies for known CVEs | Every PR + weekly | Dependabot, Snyk, npm audit |
| **Secret scanning** | Detects committed secrets | Pre-commit + CI | Gitleaks, GitHub Secret Scanning |
| **Penetration testing** | Manual expert-driven attack simulation | Annually, before major launches | External security firm |

## SAST in CI

### Semgrep (multi-language, custom rules)

```yaml
# .github/workflows/security.yml
- name: Semgrep
  uses: returntocorp/semgrep-action@v1
  with:
    config: >-
      p/owasp-top-ten
      p/csharp
      p/typescript
```

Custom rule example — detect raw SQL:

```yaml
# .semgrep/no-raw-sql.yml
rules:
  - id: no-raw-sql-string-concat
    patterns:
      - pattern: |
          $DB.FromSqlRaw($"...");
    message: Use FromSqlInterpolated or parameterized queries to prevent SQL injection
    severity: ERROR
    languages: [csharp]
```

### Roslyn Security Analyzers (.NET)

```xml
<!-- In .csproj -->
<PackageReference Include="Microsoft.CodeAnalysis.NetAnalyzers" Version="8.0.0">
  <PrivateAssets>all</PrivateAssets>
</PackageReference>
```

Catches: SQL injection, XSS, insecure deserialization, hardcoded credentials, weak crypto. Runs at compile time — zero CI cost.

## DAST with OWASP ZAP

```yaml
# CI integration — baseline scan against staging
- name: ZAP Baseline Scan
  uses: zaproxy/action-baseline@v0.9.0
  with:
    target: "https://staging.example.com"
    rules_file_name: ".zap/rules.tsv"
    fail_action: true  # Fail CI on high-severity findings
```

### ZAP scan types

| Scan | Duration | Coverage | When |
|---|---|---|---|
| **Baseline** | 1-5 min | Passive scan (headers, cookies, common issues) | Every merge to main |
| **Full scan** | 30-60 min | Active crawl + attack (injection, XSS, auth bypass) | Weekly, pre-release |
| **API scan** | 10-20 min | Tests against OpenAPI spec | When API changes |

## Security unit tests

Write tests for security-critical behavior:

```csharp
// Test: unauthenticated request is rejected
[Fact]
public async Task GetOrders_WithoutToken_Returns401()
{
    var response = await _client.GetAsync("/api/orders");
    Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
}

// Test: user can't access another user's orders (IDOR)
[Fact]
public async Task GetOrder_OtherUsersOrder_Returns404()
{
    var client = CreateAuthenticatedClient(userId: "user-1");
    var response = await client.GetAsync("/api/orders/order-owned-by-user-2");
    Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
}

// Test: admin endpoint requires admin role
[Fact]
public async Task DeleteUser_AsCustomer_Returns403()
{
    var client = CreateAuthenticatedClient(role: "customer");
    var response = await client.DeleteAsync("/api/admin/users/123");
    Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
}

// Test: input validation rejects malicious input
[Theory]
[InlineData("'; DROP TABLE Orders; --")]
[InlineData("<script>alert('xss')</script>")]
[InlineData("../../../etc/passwd")]
public async Task CreateOrder_MaliciousInput_Returns400(string maliciousInput)
{
    var request = new { CustomerName = maliciousInput, Items = new[] { new { ProductId = "P-1", Quantity = 1 } } };
    var response = await _client.PostAsJsonAsync("/api/orders", request);
    Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
}
```

## Penetration testing

### Scope definition

```markdown
## Pen Test Scope

### In scope
- Web application: https://app.example.com
- API: https://api.example.com
- Authentication flows (login, registration, password reset, MFA)
- Authorization (IDOR, privilege escalation, tenant isolation)
- Data exposure (API responses, error messages, logs)

### Out of scope
- Infrastructure (AWS account, network layer)
- Social engineering
- Physical access
- DDoS testing (separate engagement)

### Rules of engagement
- Testing window: Mon-Fri, 9am-6pm UTC
- No destructive tests on production data
- Report critical findings immediately (don't wait for final report)
- Use test accounts (credentials provided)
```

### Findings remediation priority

| Severity | SLA | Example |
|---|---|---|
| **Critical** | Fix within 24 hours | SQL injection, RCE, auth bypass |
| **High** | Fix within 1 week | IDOR, stored XSS, privilege escalation |
| **Medium** | Fix within 1 month | CSRF, reflected XSS, information disclosure |
| **Low** | Fix in next sprint | Missing headers, verbose errors, weak password policy |
| **Informational** | Track | Best practice recommendations |

## CI security pipeline

```yaml
# Recommended order in CI
1. Secret scanning (gitleaks)          # <1 min, blocks commit
2. SAST (Semgrep + Roslyn)            # 2-5 min, blocks PR
3. SCA (dependency scanning)          # 1-2 min, blocks PR
4. Security unit tests                # Part of test suite
5. DAST baseline scan                 # 5 min, on merge to main
6. DAST full scan                     # 30 min, weekly/pre-release
```

Every security tool must have clear ownership: who triages findings, who fixes them, what's the SLA.

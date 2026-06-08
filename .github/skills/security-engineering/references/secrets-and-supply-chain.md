# Secrets Management and Supply Chain Security

## Secrets management

### Where secrets should live

| Environment | Tool | How |
|---|---|---|
| **Local dev** | User Secrets (.NET), `.env` (gitignored) | `dotnet user-secrets set "Stripe:ApiKey" "sk_test_..."` |
| **CI/CD** | Pipeline secrets (GitHub Actions, Azure DevOps) | Environment variables injected at build/deploy |
| **Production** | Secrets manager (Azure Key Vault, AWS Secrets Manager, HashiCorp Vault) | Fetched at runtime, auto-rotated |

### Where secrets must NEVER live

- `appsettings.json` committed to git
- `docker-compose.yml` with hardcoded credentials
- Environment variables baked into Docker images
- Shared `.env` files in team drives
- Comments in code: `// API key: sk_live_abc123`
- Git history (once committed, it's there forever — even after "fixing" the file)

### Secret rotation

```csharp
// Azure Key Vault with auto-reload
builder.Configuration.AddAzureKeyVault(
    new Uri("https://myapp-vault.vault.azure.net/"),
    new DefaultAzureCredential(),
    new AzureKeyVaultConfigurationOptions
    {
        ReloadInterval = TimeSpan.FromMinutes(5) // Auto-refresh every 5 min
    });
```

Rotation strategy:
1. New secret is created alongside the old one.
2. Application starts using new secret (configuration reload).
3. Old secret is deactivated after all instances have rotated.
4. Old secret is deleted after the deactivation grace period.

### What to do when a secret leaks

1. **Revoke immediately.** Rotate the key/token/password. Don't wait.
2. **Audit usage.** Check logs for unauthorized access using the leaked credential.
3. **Find the source.** How did it leak? Git commit, log file, error message, chat message?
4. **Prevent recurrence.** Add pre-commit hooks, secret scanning, rotate policy.

### Pre-commit secret detection

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.18.0
    hooks:
      - id: gitleaks
```

Also enable GitHub's built-in secret scanning (free for public repos, available for private repos on Enterprise).

## Supply chain security

### The threat

Every dependency is code you didn't write. Compromised dependencies can: steal environment variables (secrets), exfiltrate data, install backdoors, run crypto miners.

Real incidents: event-stream (2018), ua-parser-js (2021), colors.js (2022), xz-utils (2024).

### Dependency hygiene

| Practice | Tool | When |
|---|---|---|
| **Lock files** | `package-lock.json`, `packages.lock.json` | Always commit. CI installs from lock file only. |
| **Vulnerability scanning** | Dependabot, Snyk, `npm audit`, `dotnet list package --vulnerable` | Every PR + weekly automated scan |
| **License compliance** | FOSSA, license-checker | Before adding new dependency |
| **Dependency review** | GitHub Dependency Review Action | On every PR that changes dependencies |
| **Pin versions** | Exact versions in lock files | Always (don't use `^` or `~` without lock files) |

### Evaluating a new dependency

Before adding a dependency, check:

| Factor | Green flag | Red flag |
|---|---|---|
| Maintainers | Multiple active maintainers, org-backed | Single maintainer, inactive |
| Downloads | >100K weekly | <1K weekly |
| Last commit | Within 6 months | >2 years ago |
| Open issues | Responsive maintainers | 500+ ignored issues |
| Dependencies | Few, well-known | Deep dependency tree with unknowns |
| License | MIT, Apache 2.0, BSD | No license, GPL (if commercial product) |
| Size | Minimal for its purpose | 50MB for a date formatting library |

### Do you need this dependency?

Before adding a library, ask:
1. Can this be done in <50 lines of code? → Write it yourself.
2. Does the standard library have this? → Use the standard library.
3. Is this a critical, complex problem? (crypto, auth, parsing) → Use the library, don't roll your own.

### SBOM (Software Bill of Materials)

Generate an SBOM for every release — a complete list of all dependencies and their versions:

```bash
# .NET
dotnet CycloneDX myapp.csproj -o sbom.json

# Node.js
npx @cyclonedx/cyclonedx-npm --output-file sbom.json
```

Use for: vulnerability tracking, license compliance, incident response ("are we affected by CVE-X?").

### Subresource Integrity (SRI) for CDN scripts

```html
<!-- Without SRI: CDN compromise → your users run malicious code -->
<script src="https://cdn.example.com/library.js"></script>

<!-- With SRI: browser verifies hash before executing -->
<script src="https://cdn.example.com/library.js"
        integrity="sha384-abc123..."
        crossorigin="anonymous"></script>
```

If the CDN serves a different file (compromised or swapped), the browser refuses to execute it.

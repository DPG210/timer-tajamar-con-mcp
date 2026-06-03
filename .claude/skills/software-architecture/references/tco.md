# TCO Estimation

Source: FinOps Foundation, cloud provider pricing models, pragmatic engineering economics.

## What TCO includes

Total Cost of Ownership is not just "how much does the server cost." It's everything:

```
TCO = Infrastructure + Licensing + People + Opportunity Cost + Risk Cost
```

### Infrastructure costs

| Category | Components |
|---|---|
| **Compute** | VMs, containers, serverless invocations, Kubernetes nodes |
| **Database** | Managed DB instances, storage, IOPS, read replicas, backups |
| **Storage** | Object storage, block storage, archive storage |
| **Network** | Data transfer (egress), load balancers, CDN, VPN, private links |
| **Cache** | Redis/Memcached instances |
| **Messaging** | Queue/topic throughput, message retention |
| **Observability** | Logs ingestion, metrics storage, traces, alerting |
| **Security** | WAF, DDoS protection, key management, certificate management |
| **CI/CD** | Build minutes, artifact storage, deployment pipelines |

### Licensing costs

- SaaS subscriptions (monitoring, APM, error tracking, feature flags, auth).
- Database licenses (SQL Server, Oracle — if not using open source).
- IDE/tooling licenses per developer.
- Support contracts (cloud provider support plans).

### People costs

| Role | Activity | Estimation |
|---|---|---|
| **Engineering** | Build time (one-time) | Engineer-months × fully loaded cost |
| **Engineering** | Maintenance (ongoing) | % of engineer time × months × cost |
| **DevOps/SRE** | Operations (ongoing) | % of time × months × cost |
| **On-call** | Incident response | On-call rotation cost × months |

### Opportunity cost

What could the team build instead? This is the hardest to quantify but often the largest cost. 3 engineers × 6 months building custom auth = 18 engineer-months NOT spent on product features.

## TCO comparison template

```markdown
# TCO Comparison — <Initiative>

## Scenario A: <name> (e.g., AMV)
| Category | Monthly | Annual | 3-Year |
|---|---|---|---|
| Compute | $ | $ | $ |
| Database | $ | $ | $ |
| Cache | $ | $ | $ |
| Messaging | $ | $ | $ |
| Storage | $ | $ | $ |
| Network | $ | $ | $ |
| Observability | $ | $ | $ |
| Licensing | $ | $ | $ |
| Engineering (build) | — | — | $ (one-time) |
| Engineering (maintain) | $ | $ | $ |
| Operations (SRE/DevOps) | $ | $ | $ |
| **Total** | **$** | **$** | **$** |

## Scenario B: <name> (e.g., Target Architecture)
| Category | Monthly | Annual | 3-Year |
|---|---|---|---|
| ... | | | |

## Comparison
| Metric | Scenario A | Scenario B | Delta |
|---|---|---|---|
| 3-Year TCO | $ | $ | $ |
| Monthly run rate (steady state) | $ | $ | $ |
| Cost per user / month | $ | $ | $ |
| Cost per transaction | $ | $ | $ |
| Break-even point | — | — | Month X |

## Assumptions
- <Traffic growth: X% per quarter>
- <Pricing tier: pay-as-you-go / reserved / committed use>
- <Team size: X engineers at $Y/month fully loaded>
- <Exchange rate: if multi-currency>

## Risks to the estimate
- <Cloud provider price increases>
- <Traffic exceeds projections>
- <Hidden costs (egress, cross-AZ, premium support)>
```

## Cloud pricing traps

| Trap | What happens | Mitigation |
|---|---|---|
| **Egress fees** | Data leaving the cloud is expensive ($0.01-0.09/GB) | Minimize cross-region traffic, use CDN |
| **Cross-AZ traffic** | Traffic between availability zones incurs charges | Keep service-to-service calls within AZ where possible |
| **Logging volume** | Observability costs scale with log volume, not with traffic | Structured logging, sampling, log levels |
| **IOPS charges** | Database IOPS beyond baseline are billed separately | Right-size provisioned IOPS, use read replicas |
| **Idle resources** | Dev/staging environments running 24/7 | Auto-shutdown schedules for non-prod |
| **Over-provisioning** | Reserved instances for peak that only lasts 2 hours/day | Auto-scaling + smaller reserved baseline |
| **Support plans** | Enterprise support is 3-10% of total spend | Budget it explicitly |
| **Data retention** | Logs, backups, snapshots accumulate indefinitely | Define retention policies, lifecycle rules |

## FinOps practices

| Practice | What it does |
|---|---|
| **Tagging** | Tag every resource with team, service, environment, cost center |
| **Budget alerts** | Set alerts at 50%, 80%, 100% of monthly budget |
| **Right-sizing** | Review instance utilization monthly; downsize underused resources |
| **Reserved instances** | Commit to 1-year or 3-year for stable workloads (30-60% savings) |
| **Spot/preemptible** | Use for stateless, fault-tolerant workloads (60-90% savings) |
| **Auto-scaling** | Scale to demand, not to peak |
| **Storage tiering** | Move old data to cheaper storage classes (S3 Glacier, Archive) |
| **Showback/chargeback** | Attribute costs to teams to create accountability |

## When to present TCO

- **Architecture review.** AMV vs. target architecture — what's the cost delta?
- **Build vs. Buy.** 3-year TCO comparison is mandatory.
- **Scaling decision.** Before committing to horizontal vs. vertical scaling.
- **Migration decision.** On-prem to cloud, monolith to microservices — what's the cost impact?
- **Budget planning.** Quarterly/annual infrastructure budget with growth projections.

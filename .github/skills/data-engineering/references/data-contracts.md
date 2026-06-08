# Data Contracts and Governance

## What is a data contract

A data contract is a formal agreement between a data producer (team that generates the data) and a data consumer (team that uses it). It defines: what the data looks like (schema), how fresh it is (SLAs), who owns it, and what changes are allowed.

Without contracts, schema changes in a source system silently break downstream pipelines, dashboards, and ML models.

## Contract structure

```yaml
# contracts/orders/contract.yml
apiVersion: v1
kind: DataContract
metadata:
  name: orders
  version: 2.1.0
  owner: order-service-team
  contact: orders-team@company.com
  domain: commerce

schema:
  type: object
  properties:
    order_id:
      type: string
      format: uuid
      description: Unique order identifier
      pii: false
    customer_id:
      type: string
      format: uuid
      pii: true
      classification: confidential
    status:
      type: string
      enum: [pending, confirmed, shipped, delivered, cancelled]
    total_amount:
      type: number
      minimum: 0
      description: Order total in the order's currency
    currency:
      type: string
      pattern: "^[A-Z]{3}$"
    created_at:
      type: string
      format: date-time
  required: [order_id, customer_id, status, total_amount, currency, created_at]

sla:
  freshness: 1 hour
  availability: 99.9%
  latency_p99: 500ms

quality:
  completeness: 99.5%
  uniqueness:
    - order_id
  validity:
    - field: total_amount
      rule: ">= 0"
    - field: status
      rule: "in enum"

semantics:
  grain: one row per order
  update_frequency: real-time (CDC)
  retention: 7 years

breaking_changes:
  notification: 30 days advance notice
  process: ADR + consumer sign-off
```

## Schema evolution rules

| Change type | Breaking? | Process |
|---|---|---|
| Add optional column | No | Notify consumers, update docs |
| Add required column | Yes | 30-day notice, consumer migration |
| Remove column | Yes | Deprecate → remove after migration |
| Rename column | Yes | Add new column → migrate consumers → remove old |
| Change type (widen: int→bigint) | No* | Usually safe, test downstream |
| Change type (narrow: string→int) | Yes | Full migration required |
| Change enum values (add) | No | Consumers should handle unknown values |
| Change enum values (remove) | Yes | Verify no downstream dependency |

### Expand-contract pattern for breaking changes

1. **Expand:** Add the new column alongside the old one. Both populated.
2. **Migrate:** Consumers switch to the new column.
3. **Contract:** Remove the old column after all consumers have migrated.

Timeline: 2-4 weeks between steps, with monitoring for any consumer still reading the old column.

## Data classification

| Level | Examples | Rules |
|---|---|---|
| **Public** | Product names, categories | No restrictions |
| **Internal** | Order counts, revenue aggregates | Employees only, no external sharing |
| **Confidential** | Customer emails, addresses | Encrypted at rest, column-level access control |
| **Restricted** | SSN, payment details, health data | Tokenized/masked, audit trail, minimal access |

### Column-level masking

```sql
-- BigQuery column-level security
CREATE OR REPLACE FUNCTION mask_email(email STRING)
RETURNS STRING
AS (
  CONCAT(LEFT(email, 2), '***@', SPLIT(email, '@')[SAFE_OFFSET(1)])
);

-- Snowflake masking policy
CREATE MASKING POLICY email_mask AS (val STRING)
RETURNS STRING ->
    CASE
        WHEN CURRENT_ROLE() IN ('ANALYTICS_ADMIN') THEN val
        ELSE CONCAT(LEFT(val, 2), '***@***')
    END;
```

## Data lineage

Track where data comes from, how it's transformed, and where it goes.

### dbt lineage (built-in)

```bash
dbt docs generate  # generates lineage graph
dbt docs serve     # visual DAG in browser
```

dbt tracks lineage through `{{ ref() }}` and `{{ source() }}` — every dependency is explicit.

### Cross-system lineage

For lineage beyond dbt (APIs → warehouse → BI tools):

| Tool | Scope | How |
|---|---|---|
| dbt | SQL transformations | Automatic via ref/source |
| OpenLineage | Cross-system (Airflow, Spark, dbt) | Standardized metadata events |
| DataHub | Full catalog + lineage | Ingests from multiple sources |
| Atlan | Business-friendly catalog | Automated + manual lineage |

### Why lineage matters

1. **Impact analysis:** Before changing a column, see which dashboards, models, and pipelines use it.
2. **Root cause analysis:** When a dashboard shows wrong numbers, trace upstream to find where the error was introduced.
3. **Compliance:** GDPR/CCPA requires knowing where PII flows and being able to delete it everywhere.

## Ownership model

| Role | Responsibility |
|---|---|
| **Data Producer** | Schema stability, SLA compliance, contract maintenance, notification of changes |
| **Data Consumer** | Handling schema evolution gracefully, reporting quality issues, respecting access policies |
| **Data Platform** | Infrastructure, tooling, catalog, lineage, access control |
| **Data Steward** | Classification, quality standards, cross-domain consistency |

Every table has exactly ONE owner team. If nobody owns it, nobody maintains it.

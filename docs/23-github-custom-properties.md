---
render_with_liquid: false
---

# GitHub Custom Properties for Governance and Compliance

**Level:** L400 (Expert)
**Objective:** Master GitHub custom properties as the metadata backbone for repository governance, policy targeting, and compliance reporting at enterprise scale

> **Document status**
>
> - **Last reviewed:** 2026-06-30
> - **Authorship:** Drafted with AI assistance (GitHub Copilot, multi-model review) and reviewed by a human maintainer before publication.
> - **Sources:** Based on public documentation — primarily [docs.github.com](https://docs.github.com), [learn.microsoft.com](https://learn.microsoft.com), and official vendor blogs cited inline.
> - **Verify before acting:** GitHub and Microsoft update product documentation continuously. Re-confirm against the live source pages before relying on this content for production decisions.

## Table of Contents

- [Overview](#overview)
- [Why Custom Properties Matter for Governance](#why-custom-properties-matter-for-governance)
- [Core Concepts](#core-concepts)
- [Definition Scope: Enterprise vs Organization](#definition-scope-enterprise-vs-organization)
- [Property Value Types](#property-value-types)
- [Schema Design Principles](#schema-design-principles)
- [Recommended Governance Taxonomy](#recommended-governance-taxonomy)
- [Setting and Editing Property Values](#setting-and-editing-property-values)
- [Required Properties, Defaults, and Explicit Values](#required-properties-defaults-and-explicit-values)
- [Promoting Organization Properties to the Enterprise](#promoting-organization-properties-to-the-enterprise)
- [Targeting Rulesets with Custom Properties](#targeting-rulesets-with-custom-properties)
- [Searching and Filtering by Custom Properties](#searching-and-filtering-by-custom-properties)
- [Automation and Infrastructure as Code](#automation-and-infrastructure-as-code)
- [Operating Model and Change Control](#operating-model-and-change-control)
- [Auditing, Reporting, and Drift Detection](#auditing-reporting-and-drift-detection)
- [Compliance Framework Mapping](#compliance-framework-mapping)
- [Permissions Reference](#permissions-reference)
- [Limits Reference](#limits-reference)
- [Best Practices Summary](#best-practices-summary)
- [Anti-Patterns to Avoid](#anti-patterns-to-avoid)
- [Implementation Roadmap](#implementation-roadmap)
- [References](#references)

## Overview

Custom properties are structured metadata fields you attach to repositories to enable consistent organization, governance, and automation across GitHub Enterprise Cloud. A custom property is a typed key-value pair — for example `data-classification = confidential` or `compliance-framework = pci-dss` — defined centrally at the enterprise or organization level and then applied to individual repositories.

Unlike repository topics (which are free-form, user-created tags) or naming conventions (which are fragile and unenforceable), custom properties provide a governed vocabulary: administrators control which properties exist, what values are allowed, and which repositories must carry them. This makes custom properties the connective tissue between your repository inventory and your policy engine.

The strategic value comes from a single capability: **repository rulesets can target repositories by custom property value**. This turns metadata into enforcement. Instead of manually maintaining lists of repositories that need branch protection, signed commits, or required status checks, you classify repositories once and let policy follow the classification automatically — including for repositories created in the future. (GitHub's newer enterprise repository-policy features also build on the same property model; confirm current capabilities against the live documentation.)

> **Note:** The visibility of a custom property value matches the visibility of the repository. Values on public repositories are visible to anyone; values on internal or private repositories are visible only to accounts with `read` access to the repository. Do not store secrets or sensitive data in property values.

## Why Custom Properties Matter for Governance

Governance at scale fails when it depends on humans remembering to apply controls to the right repositories. Custom properties replace that manual discipline with declarative, attribute-based governance.

| Governance challenge | Without custom properties | With custom properties |
|----------------------|---------------------------|------------------------|
| Apply branch protection to production repos | Manually configure each repository or maintain ruleset target lists by name | Target a ruleset at `service-tier = tier-1`; new tier-1 repos inherit protection automatically |
| Prove which repositories are in PCI scope | Spreadsheet maintained by hand, quickly stale | Filter the org repository list by `compliance-framework = pci-dss` on demand |
| Identify ownerless repositories | Tribal knowledge, CODEOWNERS spelunking | Make `owning-team` a required property; query repositories missing a value |
| Enforce stricter controls on confidential code | Inconsistent, reviewer-dependent | Rulesets keyed to `data-classification = confidential` require signed commits and reviews |
| Cost allocation and chargeback | Manual mapping of repos to cost centers | Tag `cost-center` once; export values via API for finance |
| Lifecycle hygiene (archive candidates) | Ad hoc audits | Query `lifecycle-stage = deprecated` and act in bulk |

In short, custom properties give you **attribute-based access and policy control (ABAC)** for repositories: define the attributes once, attach policy to the attributes, and let classification drive enforcement consistently across thousands of repositories.

## Core Concepts

- **Property definition (schema):** The named, typed field created by an enterprise or organization owner — for example a `single_select` named `environment` with allowed values `production`, `staging`, `development`.
- **Property value:** The specific value assigned to a property on a given repository — for example `environment = production` on `octo-payments`.
- **Source type:** Whether the definition originates at the `enterprise` or `organization` level. Enterprise-defined properties are available to every organization in the enterprise.
- **Required property:** A property that all in-scope repositories must have. Repositories without an explicit value inherit a configured default.
- **Editable-by setting:** Controls who can set values — organization actors only, or organization and repository actors.

### Allowed characters

GitHub constrains the characters allowed in property names and values:

- **Names:** `a-z`, `A-Z`, `0-9`, `_`, `-`, `$`, `#`. No spaces. Maximum 75 characters.
- **Values:** All printable ASCII characters except the double-quote (`"`). Maximum 75 characters per value.

> **Convention:** Use lowercase, hyphen-separated names (`data-classification`, `owning-team`, `cost-center`). This reads cleanly in rulesets, repository search filters, and API payloads, and avoids case-sensitivity confusion.

## Definition Scope: Enterprise vs Organization

Custom properties can be defined at two levels. Choosing the right level is the first governance decision.

### Enterprise-level definitions

Enterprise owners define properties under **Enterprise → Policies → Custom properties**. These definitions become available across **all** organizations in the enterprise, creating a consistent vocabulary and consistent allowed values everywhere.

- An enterprise-defined (or promoted) property name must be unique across all organizations in the enterprise; promotion is blocked if the name collides with an existing organization-managed property.
- Enterprise owners can mark properties required and set default values that apply enterprise-wide.
- Ideal for governance-critical classifications that must mean the same thing in every organization (data classification, compliance scope, environment).

### Organization-level definitions

Organization owners define properties under **Organization → Settings → Repository → Custom properties**. These apply only within that organization.

- Ideal for organization-specific context (a team taxonomy, a product line, an internal service catalog ID) that does not need to exist enterprise-wide.
- Organization properties can later be **promoted** to the enterprise if they prove broadly useful (see [Promoting Organization Properties to the Enterprise](#promoting-organization-properties-to-the-enterprise)).

### Decision guidance

| Define at... | When the property... |
|--------------|----------------------|
| **Enterprise** | Drives cross-org compliance, must have identical meaning and values everywhere, or feeds enterprise-wide reporting (data classification, compliance framework, environment, criticality) |
| **Organization** | Reflects local structure, varies by org, or is still being piloted before broader rollout (team names, product codes, local service catalog IDs) |

> **Recommendation:** Establish a small set of mandatory, enterprise-defined governance properties as your "golden schema," then let organizations extend with local properties. This balances consistency with autonomy.

## Property Value Types

GitHub supports five value types. Choose the most constrained type that fits the data — constrained types prevent typos, keep reporting clean, and make rulesets reliable.

| Type | Description | Best for | Example |
|------|-------------|----------|---------|
| `single_select` | One value chosen from a predefined list (up to 200 allowed values) | Governed taxonomies where exactly one value applies | `data-classification`: `public`, `internal`, `confidential`, `restricted` |
| `multi_select` | One or more values from a predefined list | Attributes where multiple labels can apply | `compliance-framework`: `soc2`, `iso-27001`, `pci-dss` |
| `true_false` | Boolean | Yes/no flags | `customer-facing`: `true` / `false` |
| `string` | Free-text (printable ASCII, max 75 chars) | Identifiers that cannot be enumerated in advance | `cost-center`: `CC-48213` |
| `url` | A URL value | Links to external systems of record | `runbook-url`: `https://...` |

> **Prefer `single_select` and `multi_select` over `string` for anything used in governance.** Free-text strings drift (`prod`, `Production`, `PROD`), break ruleset targeting, and pollute reports. Reserve `string` for genuinely open identifiers such as cost-center codes or ticket numbers.

## Schema Design Principles

A well-designed schema is small, opinionated, and stable. Treat it like a database schema, not a tag cloud.

1. **Start minimal.** Ship 5–8 high-value properties. You can always add more; removing widely-used properties is disruptive.
2. **One concept per property.** Avoid overloading a property (`type = prod-pci-customerfacing`). Split into orthogonal properties so each can be queried and targeted independently.
3. **Constrain values.** Default to `single_select`/`multi_select` with an explicit allowed-values list. Document the meaning of each value.
4. **Name for the consumer.** Names appear in rulesets, search (`props.<name>:<value>`), and API payloads. Use clear, lowercase, hyphenated nouns.
5. **Make governance-critical properties required.** If a property must exist for policy to work (classification, owner), require it and set a sensible default.
6. **Pick a sensible default carefully.** A required default of `confidential` fails safe (over-protect); a default of `public` fails open. Default toward the more restrictive posture for security properties.
7. **Version your taxonomy in code.** Keep the canonical schema in a repository as IaC (Terraform/REST scripts) so changes are reviewed, audited, and reproducible.
8. **Document the data dictionary.** Maintain a single source of truth describing every property, its type, allowed values, owner, and intended policy use.

## Recommended Governance Taxonomy

The following is a battle-tested starter taxonomy. Adapt names and values to your environment, but keep the structure: a few required governance anchors plus optional context.

| Property | Type | Required | Suggested allowed values | Governance / compliance purpose |
|----------|------|----------|--------------------------|----------------------------------|
| `data-classification` | `single_select` | Yes | `public`, `internal`, `confidential`, `restricted` | Drives encryption, review, and access policy; core to ISO 27001 / SOC 2 data handling |
| `compliance-framework` | `multi_select` | No | `soc2`, `iso-27001`, `pci-dss`, `hipaa`, `gdpr`, `fedramp` | Identifies in-scope repositories for audits and evidence collection |
| `service-tier` | `single_select` | Yes | `tier-0`, `tier-1`, `tier-2`, `tier-3` | Criticality; targets stricter rulesets at higher tiers |
| `environment` | `single_select` | No | `production`, `staging`, `development`, `sandbox` | Separates production controls from experimentation |
| `lifecycle-stage` | `single_select` | Yes | `incubating`, `active`, `maintenance`, `deprecated`, `archived` | Drives lifecycle hygiene and archival workflows |
| `owning-team` | `string` or `single_select` | Yes | Team slugs (or a curated select list) | Accountability; resolves ownerless-repo risk |
| `business-unit` | `single_select` | No | Your BU list | Portfolio reporting and org alignment |
| `cost-center` | `string` | No | `CC-#####` | Chargeback and financial allocation |
| `customer-facing` | `true_false` | No | `true`, `false` | Flags external exposure for risk and incident triage |
| `contains-pii` | `true_false` | No | `true`, `false` | Privacy obligations (GDPR/CCPA); triggers stricter handling |
| `runbook-url` | `url` | No | URL | Operational readiness; links to incident runbook |

> **Minimum viable governance set:** `data-classification`, `service-tier`, `lifecycle-stage`, and `owning-team` as required enterprise properties give you classification, criticality, lifecycle, and accountability — the four anchors most policies and audits depend on.

## Setting and Editing Property Values

Defining a property creates the schema; you still need to populate values on repositories. There are three complementary paths.

### Organization-wide bulk assignment (recommended for rollout)

Organization owners set values from **Organization → Settings → Repository → Custom properties → Set values**:

1. Open the **Set values** tab.
2. Select one or more repositories from the list.
3. Click **Edit properties**.
4. Choose values for each property in the dialog.
5. Click **Save changes**.

This is the fastest way to classify an existing estate. Combine with search/filter to apply values to logical groups (for example, select all repositories matching a naming pattern and set `business-unit`).

### Repository-level assignment (delegated)

If a property definition enables **Allow repository actors to set this property**, users (or apps) with the repository-level `custom properties` fine-grained permission can set the value from **Repository → Settings → Custom properties**. Use this to delegate context that repository teams know best (for example `runbook-url`) while keeping governance anchors centrally controlled.

### Set-on-creation

When a property allows repository actors to set it, anyone creating a repository can set the value at creation time. Pair this with required properties and `require_explicit_values` to force classification decisions up front rather than retrofitting them later.

### Viewing values

Anyone with `read` access to a repository can view its property values under **Repository → Settings → Custom properties** but cannot edit them unless granted the appropriate permission.

## Required Properties, Defaults, and Explicit Values

Three settings on a property definition determine how strictly it is enforced:

- **Require this property for all repositories:** Every in-scope repository must have a value. Repositories without an explicit value inherit the configured **default value**. This guarantees universal coverage — useful for `data-classification` and `owning-team`.
- **Default value:** The fallback applied to required properties when no explicit value is set. Choose a fail-safe default for security-sensitive properties (e.g., default `data-classification` to `confidential`, not `public`).
- **Require explicit user-specified values:** When enabled, users and apps **must** provide an explicit value when setting properties, creating repositories, or transferring repositories. Repositories that do not yet have an explicit value still inherit the default, but new/transferred repositories cannot be created without a deliberate choice. This eliminates "default by accident" and forces conscious classification.

> **Pattern for high-assurance governance:** Mark `data-classification` required, default it to `restricted`/`confidential`, and enable **Require explicit user-specified values**. New repositories then cannot dodge classification, and anything unclassified is treated as sensitive until proven otherwise.

## Promoting Organization Properties to the Enterprise

A property that proves valuable in one organization can be promoted so its name and values are consistent across the whole enterprise.

1. Navigate to your enterprise (for example, from the **Enterprises** page on GitHub.com).
2. In the left sidebar, under **Policies**, click **Custom properties**.
3. Filter to organization-managed properties using **Managed by → organization** (or the filter `managed-by:organization`). Optionally narrow to one org with `org:<ORGANIZATION-NAME>`.
4. Select the property name to open its details page.
5. Click **Promote to enterprise**, then confirm with **Promote**.

The property name must be unique across all organizations in the enterprise; otherwise promotion is blocked. Use promotion to graduate a piloted, well-understood property into the enterprise golden schema once its taxonomy has stabilized.

## Targeting Rulesets with Custom Properties

This is the highest-leverage use of custom properties: **repository rulesets and repository policies can target repositories by property value**, turning classification into automatic enforcement.

### How it works

When you create an organization ruleset, the target selection lets you include or exclude repositories **by custom property** in addition to by name. Because targeting is evaluated dynamically, a repository that later receives the matching property value immediately falls under the ruleset — no manual re-targeting required.

### Example governance patterns

| Classification | Ruleset enforcement |
|----------------|---------------------|
| `service-tier = tier-0` or `tier-1` | Require pull requests, 2 or more approvals, required status checks, linear history, block force pushes |
| `data-classification = confidential` / `restricted` | Require signed commits, required reviewers via CODEOWNERS, restrict who can push |
| `compliance-framework` contains `pci-dss` | Require status checks for security scans, require deployments to pass, restrict deletions |
| `environment = production` | Protect default branch, require successful CI, disallow direct pushes |
| `lifecycle-stage = archived` | Restrict updates; pair with archival policy |

### Why this beats name-based targeting

- **Future-proof:** New repositories inherit policy the moment they are classified, including auto-created repositories.
- **Self-documenting:** The ruleset states the governance intent ("all confidential repos require signing") rather than an opaque list of names.
- **Resistant to drift:** Renames and reorganizations do not break targeting, because policy follows the attribute, not the name.

> **Sequence rollout to avoid surprises:** Define the property → classify repositories → create the ruleset in **Evaluate** (dry-run) mode → review the insights → switch to **Active**. Validate that the target set matches expectations before enforcing.

See also [Repository Governance](07-repository-governance.md) for the full ruleset deep dive and [Policy Inheritance](06-policy-inheritance.md) for enterprise → org → repo enforcement layering.

## Searching and Filtering by Custom Properties

Custom properties make your repository estate queryable, which is essential for audits and operational hygiene.

### In the GitHub UI

From **Organization → Repositories**, type `prop` in the search bar to list available custom properties, then select one to filter. You can combine property filters with other repository search qualifiers. GitHub also exposes a property search qualifier (commonly of the form `props.<property-name>:<value>`); confirm the exact qualifier syntax against the live GitHub search documentation, as it has evolved over time.

### Common audit queries

| Goal | Approach |
|------|----------|
| List all confidential repositories | Filter by `data-classification` = `confidential` |
| Find PCI-scope repositories for an audit | Filter by `compliance-framework` = `pci-dss` |
| Find ownerless repositories | List repositories missing a value for required `owning-team` (via API export) |
| Identify archive candidates | Filter by `lifecycle-stage` = `deprecated` |
| Scope an incident blast radius | Filter by `customer-facing` = `true` combined with `service-tier` = `tier-0` |

## Automation and Infrastructure as Code

Treat your property schema and value assignments as code so changes are reviewed, versioned, and reproducible.

> **Scope note:** The REST endpoints below operate at the **organization** level (`/orgs/{org}/properties`). They are ideal for defining and populating properties within an organization and for scripted, multi-org rollouts (loop over each org). Enterprise-level property definitions and promotion are managed by enterprise owners in the enterprise **Policies → Custom properties** UI; do not assume the org endpoints define enterprise-scoped schema.

### REST API endpoints

Custom properties are managed through the REST API under `/orgs/{org}/properties`:

| Operation | Method & endpoint |
|-----------|-------------------|
| Get all property definitions | `GET /orgs/{org}/properties/schema` |
| Create/update definitions (batch) | `PATCH /orgs/{org}/properties/schema` |
| Get one property definition | `GET /orgs/{org}/properties/schema/{name}` |
| Create/update one definition | `PUT /orgs/{org}/properties/schema/{name}` |
| Remove a definition | `DELETE /orgs/{org}/properties/schema/{name}` |
| List values across repositories | `GET /orgs/{org}/properties/values` |
| Set values (batch, up to 30 repos) | `PATCH /orgs/{org}/properties/values` |

#### Define properties (batch)

```bash
curl -L -X PATCH \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer <YOUR-TOKEN>" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  https://api.github.com/orgs/ORG/properties/schema \
  -d '{
    "properties": [
      {
        "property_name": "data-classification",
        "value_type": "single_select",
        "required": true,
        "default_value": "confidential",
        "description": "Sensitivity of the data handled by this repository",
        "allowed_values": ["public", "internal", "confidential", "restricted"],
        "values_editable_by": "org_actors",
        "require_explicit_values": true
      },
      {
        "property_name": "service-tier",
        "value_type": "single_select",
        "required": true,
        "default_value": "tier-3",
        "allowed_values": ["tier-0", "tier-1", "tier-2", "tier-3"]
      }
    ]
  }'
```

#### Assign values to repositories (batch)

```bash
curl -L -X PATCH \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer <YOUR-TOKEN>" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  https://api.github.com/orgs/ORG/properties/values \
  -d '{
    "repository_names": ["payments-api", "payments-web"],
    "properties": [
      { "property_name": "data-classification", "value": "restricted" },
      { "property_name": "service-tier", "value": "tier-1" },
      { "property_name": "compliance-framework", "value": ["pci-dss", "soc2"] }
    ]
  }'
```

> Setting a property value to `null` removes (unsets) it from the repository. A single value-assignment request can update a maximum of 30 repositories.

### GitHub CLI

Use `gh api` to script the same endpoints, which is convenient for one-off audits and pipelines:

```bash
# Export all property values across the org to a file
gh api --paginate /orgs/ORG/properties/values > property-values.json

# Read the schema
gh api /orgs/ORG/properties/schema
```

### Terraform

If you manage GitHub with Terraform, you can keep the property schema (and optionally per-repository assignments) under version control with plan/apply review. The exact resource and argument names in the `integrations/github` provider change between versions, so **verify against the provider documentation for the version you pin** before adopting a concrete resource block.

As a provider-agnostic alternative that is stable across versions, drive the verified REST endpoints from Terraform with a `terraform_data`/`null_resource` and `gh api`, or generate the schema from a checked-in JSON file and apply it with the `PATCH /orgs/{org}/properties/schema` call shown above. This keeps the canonical schema in source control without depending on a specific provider resource name.

> Reminder: for `single_select`, the default value is a single string (for example `"confidential"`); only `multi_select` defaults are expressed as a list. Match this in whichever tool you use.

## Operating Model and Change Control

A schema is only as trustworthy as the process that governs it. For an L400 compliance audience, define an explicit operating model alongside the technical configuration.

### Ownership and accountability

- **Schema owner (RACI):** Name an accountable owner (typically platform engineering or the GitHub admin team) for the enterprise golden schema. Document who is Responsible, Accountable, Consulted, and Informed for property changes.
- **Value stewardship:** Decide per property who owns the *values* — centrally set governance anchors (`data-classification`, `service-tier`) versus team-delegated context (`runbook-url`, `owning-team`).

### Change control for the schema

- **Propose via pull request:** Keep the canonical schema (JSON or IaC) in a controlled repository; all additions, renames, or allowed-value changes go through review.
- **Assess blast radius:** Adding an allowed value is low risk; **renaming or removing** a property or value can break ruleset targeting and reporting. Treat these as breaking changes with a migration plan.
- **Deprecation strategy:** Renames are effectively delete-plus-recreate. Migrate values and re-point rulesets before retiring an old property. Stage changes in Evaluate mode first.

### Exceptions and approvals

- **Exception register:** Record any repository granted an exception from a required classification or a property-targeted ruleset, with owner, justification, and expiry.
- **Sensitive-value approval:** Require a second approver to change high-impact values (for example downgrading `data-classification` from `restricted`), and capture the change in the audit log.
- **Break-glass:** Define how an emergency classification change is made and retroactively reviewed.

### Attestation and data quality

- **Periodic attestation:** On a fixed cadence (commonly quarterly), owning teams confirm their repositories' classifications. Track attestation completion as a compliance KPI.
- **Data-quality SLA:** Set targets such as "100% of repositories have a `data-classification` value" and "0 required properties left on default after 30 days" and report against them.

## Auditing, Reporting, and Drift Detection

Custom properties only deliver governance value if values stay accurate. Build a lightweight assurance loop:

- **Coverage report:** Periodically pull `GET /orgs/{org}/properties/values` and flag repositories missing required properties or still on default values. Track coverage percentage as a governance KPI.
- **Drift detection:** Compare live property values against the intended state declared in your IaC. Alert on unexpected changes, especially to `data-classification` and `service-tier`.
- **Audit-log monitoring:** Custom property definition and value changes are captured in the organization/enterprise audit log. Review these events for unauthorized schema or classification changes.
- **Reclassification reviews:** Schedule recurring reviews (quarterly is common) where owning teams confirm or update classifications. Tie this to access and lifecycle reviews already in your governance cadence.
- **Evidence packs:** For audits, export the filtered repository list (e.g., all `compliance-framework:pci-dss` repos with their ruleset coverage) as point-in-time evidence.

## Compliance Framework Mapping

Custom properties provide the classification layer that many control frameworks expect. The table below is an **illustrative example mapping** of common requirements to a property-driven implementation — not a statement of GitHub-native compliance certification. Validate control applicability with your own compliance owner or auditor before relying on it for evidence.

| Framework / control area | Requirement | Custom-property implementation |
|--------------------------|-------------|--------------------------------|
| **ISO 27001 (A.8 Asset management)** | Inventory and classify information assets | `data-classification` (required) + `owning-team` provide the asset register and ownership |
| **SOC 2 (CC6 / CC7)** | Logical access and change controls scaled to risk | `service-tier` + `data-classification` target rulesets enforcing reviews, signing, and status checks |
| **PCI DSS (Req. 6)** | Secure SDLC for in-scope systems | `compliance-framework:pci-dss` targets a ruleset requiring security checks and restricted changes |
| **GDPR / CCPA** | Identify and protect personal data | `contains-pii = true` flags repositories for stricter handling and data-protection reviews |
| **NIST CSF (Identify)** | Asset and criticality identification | `service-tier` + `business-unit` establish criticality and portfolio context |
| **FedRAMP / regulated workloads** | Boundary and scope definition | `compliance-framework:fedramp` plus `environment` delineate authorization boundaries |

> Custom properties are an enabling control, not a complete compliance solution. They make scope, classification, and policy targeting auditable and consistent; you still need the underlying rulesets, scanning, and process controls described in [Security and Compliance](08-security-compliance.md) and [Security-by-Default Policies](11-security-by-default-policies.md).

## Permissions Reference

| Action | Who can perform it |
|--------|--------------------|
| Define/edit enterprise properties | Enterprise owners |
| Define/edit organization properties | Organization owners, or holders of the `custom_properties_org_definitions_manager` fine-grained permission |
| Set values across the organization | Organization owners, or holders of `custom_properties_org_values_editor` |
| Set values on a single repository | Repository actors with the repository-level `custom properties` permission (only if the definition allows repository actors to set it) |
| View property values | Anyone with `read` access to the repository |
| Promote org property to enterprise | Enterprise owners |

API tokens require the **Custom properties** organization permission at the appropriate level: `read` to list, `write` to set values, and `admin` to manage definitions.

## Limits Reference

| Limit | Value |
|-------|-------|
| Property definitions per enterprise | 100 |
| Allowed values per `single_select` / `multi_select` list | 200 |
| Property name length | 75 characters |
| Property value length | 75 characters |
| Repositories updated per value-assignment API request | 30 |
| Name allowed characters | `a-z`, `A-Z`, `0-9`, `_`, `-`, `$`, `#` (no spaces) |
| Value allowed characters | All printable ASCII except `"` |

> Limits change over time. Re-confirm against the live GitHub documentation before designing against a specific ceiling.

## Best Practices Summary

1. **Define a small, mandatory golden schema at the enterprise level** (`data-classification`, `service-tier`, `lifecycle-stage`, `owning-team`) and let organizations extend locally.
2. **Prefer `single_select`/`multi_select`** with explicit allowed values for anything used in governance; reserve `string` for open identifiers.
3. **Make governance anchors required**, set fail-safe defaults, and enable **Require explicit user-specified values** for sensitive classifications.
4. **Drive policy from properties:** target rulesets and repository policies at property values so enforcement follows classification automatically.
5. **Roll out rulesets in Evaluate mode first** to validate the target set before enforcing.
6. **Manage the schema as code** (Terraform or REST scripts) under pull-request review; keep a documented data dictionary.
7. **Classify on creation,** not as an afterthought — use set-on-creation plus required explicit values.
8. **Measure coverage and detect drift** with periodic API exports and audit-log review.
9. **Tie reclassification to existing governance reviews** (access, lifecycle, security) so it does not become orphaned work.
10. **Never store secrets or sensitive data in values** — value visibility follows repository visibility.

## Anti-Patterns to Avoid

- **Free-text everywhere:** Using `string` for `environment` or `team` invites `prod`/`Production`/`PROD` drift that breaks ruleset targeting and reporting.
- **Overloaded properties:** Cramming multiple concepts into one value (`prod-pci-tier1`) makes filtering and targeting impossible. Keep properties orthogonal.
- **Schema sprawl:** Launching 30 properties on day one. Start with the minimum viable set and grow deliberately.
- **Optional governance anchors:** Leaving `data-classification` optional yields blind spots. Required + explicit values prevents gaps.
- **Fail-open defaults:** Defaulting security-sensitive properties to the least restrictive value (`public`) silently under-protects new repositories.
- **Manual-only assignment:** Classifying by hand without API/IaC backing makes the estate impossible to audit or reproduce.
- **Enforcing before validating:** Activating a ruleset keyed to a property before checking the target set, causing unexpected friction for teams.

## Implementation Roadmap

A pragmatic phased rollout:

1. **Design (week 1):** Workshop the taxonomy with security, compliance, and platform teams. Document the data dictionary and choose enterprise vs org scope for each property.
2. **Define (week 1–2):** Create the golden schema via REST/Terraform at the enterprise level. Start required properties with safe defaults but keep enforcement light.
3. **Classify (week 2–4):** Bulk-assign values to the existing estate using the **Set values** UI for obvious groups and the API for scripted classification. Track coverage toward 100% of required properties.
4. **Enforce in dry-run (week 4–5):** Create rulesets targeting key property values in **Evaluate** mode. Review insights and reconcile mis-classifications.
5. **Activate (week 5–6):** Switch validated rulesets to **Active**. Enable **Require explicit user-specified values** so new repositories must classify on creation.
6. **Operate (ongoing):** Run coverage and drift reports, monitor the audit log, and fold reclassification into quarterly governance reviews. Promote proven org properties to the enterprise as the taxonomy matures.

## References

- [Managing custom properties for repositories in your organization](https://docs.github.com/en/organizations/managing-organization-settings/managing-custom-properties-for-repositories-in-your-organization)
- [Managing custom properties for repositories in your enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-accounts-and-repositories/managing-repositories-in-your-enterprise/managing-custom-properties-for-repositories-in-your-enterprise)
- [REST API endpoints for organization custom properties](https://docs.github.com/en/rest/orgs/custom-properties)
- [About rulesets](https://docs.github.com/en/enterprise-cloud@latest/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)
- [Creating rulesets for repositories in your organization](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-organization-settings/creating-rulesets-for-repositories-in-your-organization)
- [Managing custom organization roles](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-peoples-access-to-your-organization-with-roles/about-custom-organization-roles)
- [GitHub Well-Architected — Governance](https://wellarchitected.github.com/library/governance/)
- Related workshop docs: [Policy Inheritance](06-policy-inheritance.md) · [Repository Governance](07-repository-governance.md) · [Security and Compliance](08-security-compliance.md) · [Security-by-Default Policies](11-security-by-default-policies.md)

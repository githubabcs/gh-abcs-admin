---
title: GHAS Reusable Workflows and Tools - Evaluated Resource Catalog
description: Selected advanced-security repositories, concrete workflow and configuration links, source-level caveats, and recommended adoption for enterprise GHAS.
ms.date: 2026-09-08
ms.topic: reference
render_with_liquid: false
---

## Recommended Use

Use the [advanced-security organization](https://github.com/advanced-security)
as a source of reusable components and implementation examples, not as a
blanket list of GitHub-supported products. Its organization README explicitly
describes much of the software as best-effort open source developed outside
core responsibilities. A verified organization badge does not change that
support contract.

Keep native security configurations, CodeQL default setup where appropriate,
rulesets, and official CodeQL/dependency-review actions as the foundation in the
[GHAS implementation guide](25-ghas-implementation-guide.md). Add a component
only when it closes a measured gap. Pin and review the entire execution chain,
assign an internal maintainer, test on representative repositories, and promote
through controlled cohorts.

### Research Scope

On 2026-09-08, the public repositories API returned 102 repositories. The
assessment inventoried repository metadata, read the organization profile and
the three curated resource lists, read selected relevant READMEs, and inspected
the workflow/configuration/source files called out below. It did not execute
the tools or audit every source file in all 102 repositories.

The reusable-workflow findings are anchored to commit
`5238986b05a2643a03910233f881a1b677b5bcfe`; onboarding-helper findings are anchored
to `5742e73e06b8bf6c9bbd0d079653b0b12ac26cd9`. These are reviewed snapshots,
**not production-approved revisions**. Recheck newer releases before adoption.
Recent pushes can be dependency automation, not proof of a tested integration.

## Adoption Order

1. Implement the [existing-workflow onboarding procedure](25-ghas-implementation-guide.md#reuse-an-existing-codeql-workflow).
   Avoid the GUI generator when a canonical workflow already exists. Keep its
   filename and analysis identity unless there is a deliberate migration.
2. Establish an organization-owned security-workflow repository. Adapt the
   relevant workflows below; do not mass-adopt untested upstream wrappers.
3. Add dependency submission only where the graph is incomplete. Prefer a
   build-aware resolver or an existing release SBOM over redundant scans.
4. Establish a versioned custom-pattern repository with offline/synthetic tests
   and GitHub dry-run review before enabling patterns organization-wide.
5. Add read-only audit/export tools and optional KEV/EPSS prioritization.
   Reconcile scan freshness separately for advanced and release-branch analysis.
6. Evaluate monorepo optimization, policy aggregation, and automated secret
   remediation only after the baseline and operational ownership are reliable.

## Reusable Workflow Library

Start with the [reusable-workflows README](https://github.com/advanced-security/reusable-workflows)
and [workflow directory](https://github.com/advanced-security/reusable-workflows/tree/main/.github/workflows).
The README describes an organization-internal reusable library; the actual
workflow files are necessary to understand its contracts and defaults.

| Reusable source | What can be reused | Recommendation and boundary |
| --- | --- | --- |
| [CodeQL dynamic workflow](https://github.com/advanced-security/reusable-workflows/blob/5238986b05a2643a03910233f881a1b677b5bcfe/.github/workflows/codeql-dynamic.yml) | Language discovery followed by a CodeQL matrix; `workflow_call` and `workflow_dispatch` entry points | Adapt for supported build profiles and runners. It uses Ubuntu for all analysis and autobuild, has no fleet scheduler, and exposes no general custom-build input contract |
| [Dependency review workflow](https://github.com/advanced-security/reusable-workflows/blob/5238986b05a2643a03910233f881a1b677b5bcfe/.github/workflows/dependency-review.yml) | PR review with central/local configuration selection and snapshot retries | Repair the configuration handoff described below or use the official dependency-review action directly in your wrapper |
| [Dependency review configuration](https://github.com/advanced-security/reusable-workflows/blob/5238986b05a2643a03910233f881a1b677b5bcfe/.github/dependency-review.yml) | An example policy file | Do not adopt unchanged: correct the license key, obtain legal approval, and choose severity/scopes deliberately |
| [Dependency submission workflow](https://github.com/advanced-security/reusable-workflows/blob/5238986b05a2643a03910233f881a1b677b5bcfe/.github/workflows/dependency-submission.yml) | Submission of Actions dependencies, including additional composite-action paths and fork handling | Useful candidate for workflow repositories. Despite its generic name, it currently implements Actions dependency submission, not universal application dependency resolution; requires `contents: write` |
| [Policy-as-code workflow](https://github.com/advanced-security/reusable-workflows/blob/5238986b05a2643a03910233f881a1b677b5bcfe/.github/workflows/policy-as-code.yml) | Aggregate policy checks against an external YAML policy | Adapt authentication and policy ownership. It calls the action and policy at mutable `main` refs and does not supply the extra App/PAT permissions needed for secret/Dependabot alerts |
| [Default aggregate policy](https://github.com/advanced-security/reusable-workflows/blob/5238986b05a2643a03910233f881a1b677b5bcfe/security/default.yml) | Example CodeQL, dependency, license, and secret thresholds | An input to that tool, not a native GitHub security configuration or ruleset |
| [CodeQL pack publisher](https://github.com/advanced-security/reusable-workflows/blob/5238986b05a2643a03910233f881a1b677b5bcfe/.github/workflows/codeql-packs.yml) | General shape of a central query-pack build/publish pipeline | Reference only until its job/output wiring is corrected and tested; run publication only from protected trusted code |
| [Container security workflow](https://github.com/advanced-security/reusable-workflows/blob/5238986b05a2643a03910233f881a1b677b5bcfe/.github/workflows/container-security.yml) | Build an image, run Grype, upload SARIF | Complementary container scanning, not CodeQL. `scanning-block` defaults to `false`; `only-fixed: true` excludes vulnerabilities without fixes. Change these if policy requires complete reporting/blocking |
| [IaC workflow](https://github.com/advanced-security/reusable-workflows/blob/5238986b05a2643a03910233f881a1b677b5bcfe/.github/workflows/codeql-iac.yml) | Custom IaC extractor and SARIF integration pattern | Experimental extension to evaluate, not proof of native supported CodeQL coverage for all IaC; pins the extractor to mutable `main` |
| [Opengrep workflow](https://github.com/advanced-security/reusable-workflows/blob/5238986b05a2643a03910233f881a1b677b5bcfe/.github/workflows/sec-opengrep.yml) | Third-party SAST and SARIF integration | Specify approved rules and version. It downloads the latest binary at runtime and checks its release digest; integrity checking does not make the version reproducible |

### Source-Level Caveats Before Reuse

The following are static source observations at the reviewed revision, not
results of executing upstream workflows:

* The dependency-review wrapper writes its selected configuration to
  `GITHUB_STATE`, then consumes `steps.config.outputs.config`. That does not
  define the expected step output. Use `GITHUB_OUTPUT` for an ordinary step
  output, or pass a fixed reviewed configuration path directly. Test that a
  deliberately disallowed dependency/license actually fails.
* The central dependency-review policy uses `allow_licenses`; the official
  action's documented key is `allow-licenses`. Do not assume its intended
  license restriction is enforced. The policy also selects runtime scope only.
* The pack publisher declares a job output named `matrix` from
  `steps.set-matrix.outputs.packs`, although the script returns its value through
  the normal `result` output. The build job refers to
  `needs.create-matrix.outputs.packs` and lacks `needs: create-matrix`. Correct
  the dependency and output names before using it to publish organization packs.
* Pinning a reusable workflow to a SHA does not pin its nested `uses: ...@main`,
  major-version tags, or runtime downloads. Audit nested actions, scripts, query
  packs, and packages, and verify compatibility with the enterprise action
  allowlist and SHA-pinning policy.
* Do not copy [language-detection-and-assignment](https://github.com/advanced-security/reusable-workflows/blob/5238986b05a2643a03910233f881a1b677b5bcfe/.github/workflows/language-detection-and-assignment.yml)
  as a generic CodeQL helper: it assigns PR reviewers using hardcoded upstream
  usernames. The CodeQL matrix helper below serves a different purpose.

These findings favor a small, reviewed internal wrapper around
[github/codeql-action](https://github.com/github/codeql-action) and
[actions/dependency-review-action](https://github.com/actions/dependency-review-action),
borrowing useful upstream patterns while retaining explicit ownership.

### Keep the Existing Caller File

The target repository can retain `.github/workflows/code-ql.yml` and replace
its duplicated implementation with one job-level reusable-workflow call.
The following is an illustrative caller contract, **not a runnable reference
to a repository supplied with this guide**. Replace the owner, repository,
workflow path, and SHA with your tested internal implementation. The central
workflow must declare `workflow_call` and the required `language` input.

```yaml
name: CodeQL
on:
  push:
    branches: [main, master, release, 'release/**']
  pull_request:
    branches: [main, master, release, 'release/**']
  workflow_dispatch:
  schedule:
    - cron: '17 2 * * 2'
permissions:
  contents: read
jobs:
  codeql:
    permissions:
      contents: read
      actions: read
      security-events: write
    uses: example-org/security-workflows/.github/workflows/codeql.yml@APPROVED_FULL_COMMIT_SHA
    with:
      language: javascript-typescript
```

The caller is still a repository-local workflow. Its schedule invokes the
workflow for the default branch only; the push branch filters do not turn cron
into multi-branch scanning. Use the guide's
[weekly ref enumeration and attribution](25-ghas-implementation-guide.md#weekly-scanning-of-maintained-branches)
for maintained release coverage. Add the actual default branch if named
differently, validate `merge_group` when a merge queue is used, and pass only
required secrets rather than `secrets: inherit` by default.

The upstream dynamic workflow can illustrate reuse, but it does not declare
the `language` input shown in this internal contract. Do not substitute its
path into this example and expect identical behavior.

## CodeQL Onboarding and Analysis Helpers

| Repository or configuration | Useful addition | Adoption constraint |
| --- | --- | --- |
| [gh-add-files](https://github.com/advanced-security/gh-add-files) | Opens workflow-creation/update PRs from a file/template for an organization or explicit repository list | Not safe as a generic existing-file adopter: reviewed code hardcodes `codeql.yml`, discussed below |
| [set-codeql-language-matrix](https://github.com/advanced-security/set-codeql-language-matrix) | Keeps an advanced workflow's language matrix aligned with the languages API | Evaluate version `v1.6.0` or a reviewed newer revision; use the `matrix` output for language/build-mode data. Keep approved manual builds and macOS handling for Swift |
| [monorepo-code-scanning-action](https://github.com/advanced-security/monorepo-code-scanning-action) | Project partitioning, changed-project PR scans, whole-repository scheduled scans | Pilot only where boundaries are valid; component splitting can lose cross-component source/sink dataflow |
| [Monorepo PR workflow sample](https://github.com/advanced-security/monorepo-code-scanning-action/blob/main/samples/sample-codeql-monorepo-pr-workflow.yml) | Concrete changed-project workflow | It can republish prior SARIF for unchanged projects; do not count that as a new analysis |
| [Monorepo whole-repository workflow sample](https://github.com/advanced-security/monorepo-code-scanning-action/blob/main/samples/sample-codeql-monorepo-whole-repo-workflow.yml) | Parallel full-project scanning for periodic freshness | Fresh scans still need correct branch scheduling, complete project inventory, and capacity below matrix limits |
| [sample-codeql-pipeline-config](https://github.com/advanced-security/sample-codeql-pipeline-config) | CodeQL CLI examples for Jenkins, Azure Pipelines, and other CI systems | Adapt the relevant sample into the managed scanner; replace old PAT/build/version assumptions and preserve isolated publisher credentials |
| [gh-codeql-scan](https://github.com/advanced-security/gh-codeql-scan) | Local/CI convenience wrapper for database creation, analysis, and upload | Useful for a pilot or developer troubleshooting, not an organization scheduler. Audit token handling, target attribution, and download versions |
| [CodeQL Community Packs](https://github.com/GitHubSecurityLab/CodeQL-Community-Packs) and [provided configs](https://github.com/GitHubSecurityLab/CodeQL-Community-Packs/tree/main/configs) | Successor to archived field-team queries; reusable queries, models, and suite examples | Add selected compatible packs to the approved central configuration; pilot precision/runtime. Package names use their own language aliases, not every combined CodeQL language label |
| [advanced-security-material](https://github.com/advanced-security/advanced-security-material) | Build/SARIF troubleshooting and older workflow examples | Useful reference, not the authority for current behavior; verify old snippets against live docs and current actions |

The language helper supports `standard-language-names: 'true'` for combined
names such as `javascript-typescript`. Use consistent names/categories for new
workflows; changing existing names can create different analysis identities.
Its language API discovery also needs special treatment for Actions YAML; the
README describes Linguist configuration. Native default setup already performs
language discovery, so this helper is mainly for advanced workflows.

### Why gh-add-files Does Not Directly Solve Existing Filename Reuse

In the [reviewed common implementation](https://github.com/advanced-security/gh-add-files/blob/5742e73e06b8bf6c9bbd0d079653b0b12ac26cd9/cmd/common.go),
both workflow-existence detection and file creation target
`.github/workflows/codeql.yml`. Your existing `code-ql.yml` can therefore be
missed, resulting in a second workflow. The source also uses a fixed automation
branch, so repeated invocations need lifecycle handling.

The [force-mode control flow](https://github.com/advanced-security/gh-add-files/blob/5742e73e06b8bf6c9bbd0d079653b0b12ac26cd9/cmd/codescanning.go)
can disable default setup **before** opening/merging the replacement PR, and
can delete/recreate an existing automation branch. Do not run an organization-
wide `--force` operation as the recommended onboarding path.

Use the guide's filename-specific enable/dispatch procedure when the workflow
already exists. For new file rollout, use a reviewed adaptation that discovers
the canonical workflow, preserves its path, respects pending PRs, reconciles
security configuration enforcement, and verifies the new scan before declaring
the repository protected. Recheck the helper's language mapping and API error
handling against your fleet before approving it.

## Dependency and SBOM Components

| Repository | Useful addition | Boundary and recommendation |
| --- | --- | --- |
| [maven-dependency-submission-action](https://github.com/advanced-security/maven-dependency-submission-action) | Resolves a Maven graph including transitive and multi-module dependencies | Prefer when actual Maven resolution is needed; supply settings/registry access and unique correlators for matrix slices; workflow submission needs `contents: write` |
| [component-detection-dependency-submission-action](https://github.com/advanced-security/component-detection-dependency-submission-action) | Broader manifest/lockfile detection and submission | Validate enabled detectors and compare the result with a resolved build; experimental/default-off detectors are not automatically complete coverage |
| [spdx-dependency-submission-action](https://github.com/advanced-security/spdx-dependency-submission-action) | Ingest an existing SPDX 2.2 SBOM into the dependency graph | Strong candidate when release CI already produces SBOMs. Cross-repository inputs include owner/repo/ref/SHA; use the trusted target identity rather than controller defaults |
| [github-sbom-toolkit](https://github.com/advanced-security/github-sbom-toolkit) | Enterprise/organization SBOM collection, caching, PURL search, malware-advisory matching | Useful for incident inventory. Not full SCA: it syncs malware advisories, warns about ecosystem version matching, and has no continuous daemon mode |
| [dependabot-kev-action](https://github.com/advanced-security/dependabot-kev-action) | Matches open Dependabot CVEs against CISA's Known Exploited Vulnerabilities catalog | Optional high-priority signal; reads existing alerts rather than scanning every release dependency graph |
| [dependabot-epss-action](https://github.com/advanced-security/dependabot-epss-action) | Matches open alerts against an EPSS threshold | Risk-ranking supplement, not a vulnerability waiver. README default threshold is `0.6`; approve a suitable threshold rather than copying it |
| [dependabot-version-updates](https://github.com/advanced-security/dependabot-version-updates) | Sample repository using cooldown and dependency groups | Example only, not a central Dependabot service or inheritance mechanism. API metadata identifies GPL-3.0; review licensing before copying project content |

The SBOM toolkit's optional branch mode uses dependency-review diffs and may
submit missing snapshots. It defaults to a branch limit of ten, records errors
without stopping collection for every other repository, and still notes that
the native graph SBOM is default-branch based. Treat branch mode as an
investigation aid until you prove completeness for the explicit maintained-ref
inventory. Do not equate a successful process exit with complete release SCA.
Snapshot submission and SARIF upload are mutations requiring separate approval
from read-only inventory collection.

Do not enable every dependency submitter on every repository. Assign one
authoritative producer per intended build/component snapshot, use stable
detector/job identifiers, and avoid conflicting duplicate snapshots. These
tools enrich the graph; they do not eliminate per-repository Dependabot
version-update configuration.

## Secret Protection Components

| Repository/configuration | Useful addition | Boundary and recommendation |
| --- | --- | --- |
| [secret-scanning-custom-patterns](https://github.com/advanced-security/secret-scanning-custom-patterns) | Pattern examples grouped into database, configuration, generic, vendor, and other categories | Start with missing organization-specific formats; avoid importing all patterns or duplicating native provider coverage |
| [Generic pattern YAML](https://github.com/advanced-security/secret-scanning-custom-patterns/blob/main/generic/patterns.yml) | Concrete versionable pattern-definition format | This is tooling input, not a magic repository file that configures GitHub by its presence |
| [secret-scanning-tools](https://github.com/advanced-security/secret-scanning-tools) and [example configuration](https://github.com/advanced-security/secret-scanning-tools/blob/main/examples/config/patterns.yml) | Offline pattern tests, online snapshots, and validation | Use synthetic fixtures and dry-run validation. Its documented Hyperscan offline tests need Intel-compatible hardware; do not assume native Windows ARM support |
| [secret-protection-custom-pattern-automation](https://github.com/advanced-security/secret-protection-custom-pattern-automation) | Import/export, tests, dry runs, and deployment of pattern YAML at repo/org/enterprise scope | Browser automation using persisted authenticated `.state`, not a supported declarative REST control plane; keep human approval, protect session files, and avoid force-submission/deletion flags |
| [secret-scanning-review-action](https://github.com/advanced-security/secret-scanning-review-action) | Optional PR annotations/checks for already-detected secret alerts, including push-protection bypass cases | Requires dedicated alert-read credentials; ordinary `GITHUB_TOKEN` is insufficient. Default `fail-on-alert` is false; test detection timing, visibility, and closed-alert behavior |
| [Teams notifier](https://github.com/advanced-security/teams-secret-scanning-notifier-azure-function) and [event filter example](https://github.com/advanced-security/teams-secret-scanning-notifier-azure-function/blob/main/filter.yml.example) | GitHub App webhook-to-notification architecture | Adapt to the tenant's currently supported Teams endpoint, validate webhook signatures, restrict recipients, and redact secret values; treat as an unofficial sample |
| [GSSAR](https://github.com/advanced-security/GSSAR) | Provider-specific automatic revocation via App/webhook and cloud workers | High-impact extension, not an automatic fleet baseline. Start with one approved provider/remediator, scoped revocation permissions, incident drills, retries, and a kill switch |

The custom-pattern repository also includes PII and broad generic patterns.
They are not automatically appropriate secret-blocking rules. Review privacy,
false positives, provider overlap, and developer impact. Tests passing offline
do not replace GitHub's own dry run.

The PR review action reads asynchronous secret-scanning results; it is not a
synchronous replacement for push protection or an independent scanner. Plan
reconciliation for delayed alerts and protect its credential from untrusted PR
code. A workflow permission declaration does not grant additional permissions
to a custom App token.

The browser pattern tool can print match data and capture debug screenshots.
Keep logs, browser sessions, and exports in restricted storage, never normal
repository artifacts. For automatic revocation, deleting a finding or closing
an alert must not be treated as evidence that a credential was revoked.

## Reporting and Policy Components

| Repository | Useful addition | Boundary and recommendation |
| --- | --- | --- |
| [gh-ghas-audit](https://github.com/advanced-security/gh-ghas-audit) | Default-setup language/configuration audits, CSV output, security-configuration filter | Suitable for native cohorts; intentionally advanced repositories can appear unconfigured. Join with actual analyses and expected setup mode |
| [ghas-to-csv](https://github.com/advanced-security/ghas-to-csv) | Code scanning, secret, and Dependabot alert exports for external reporting | Validate pagination/fields and redact sensitive data. Keep exports restricted; old README licensing/platform assumptions are not current product authority |
| [policy-as-code](https://github.com/advanced-security/policy-as-code) and [example policies](https://github.com/advanced-security/policy-as-code/tree/main/examples/policies) | Configurable cross-feature thresholds and remediation-age policies | Optional extra release gate where native rules are insufficient, not a substitute for security configurations. Treat `total_errors`, missing checks, and null fallback results as incomplete evaluation, not zero risk |
| [ghas-license-utilization](https://github.com/advanced-security/ghas-license-utilization) | Planning based on overlapping active committers | Useful analytical model, but validate separate Code Security/Secret Protection billing and current APIs; business criticality takes precedence over maximizing repository count |
| [security-report-action](https://github.com/advanced-security/security-report-action) | Formatted report/template ideas | Do not make it a production dependency yet: its README explicitly says early access and not ready for production |

Preserve the distinction between a report of existing alerts and evidence that
all required branches were scanned recently. An export tool cannot report
findings from an analysis that never ran. Similarly, policy aggregation cannot
invent missing secret or dependency permissions.

## Resources Not to Adopt as the New Baseline

* [codeql-queries](https://github.com/advanced-security/codeql-queries) is archived
  and its README directs users to CodeQL Community Packs. Do not distribute its
  old central configuration as a new enterprise default.
* The repository inventory marks `custom-codeql-bundle`, `probot-security-alerts`,
  `ghas-mttr`, `sbom-generator-action`, and `tag-sarif` as archived. Assess supported
  native capabilities or actively maintained alternatives before any reuse.
* [filter-sarif](https://github.com/advanced-security/filter-sarif) deliberately
  removes findings before upload. Do not use it to hide lower-severity findings
  merely because only high/critical issues block merges; use merge thresholds
  while retaining the detection inventory. Any suppression needs approval and
  retained original evidence.
* Old pipeline samples may use mutable tags, deprecated actions, broad PATs,
  or old product assumptions. A recent README or dependency update does not
  validate those choices for your enterprise.

For ongoing discovery, use [awesome-codeql](https://github.com/advanced-security/awesome-codeql),
[awesome-dependabot](https://github.com/advanced-security/awesome-dependabot), and
[awesome-secret-scanning](https://github.com/advanced-security/awesome-secret-scanning).
They link to third-party projects as well as GitHub organizations; inclusion
is not a support or security endorsement.

## Adoption Acceptance Checks

Before approving a component for thousands of repositories:

* Record upstream revision, license, maintainer/support channel, nested
  dependencies, required permissions, and internal owner.
* Confirm the declared workflow/action inputs and outputs against the exact
  revision being called, including boolean values and matrix shapes.
* Prove that configured policy is actually consumed with positive and negative
  fixtures, not just a green workflow that silently fell back to defaults.
* Test private registry access, fork PRs, language/build modes, nested release
  refs, supported runner platforms, and no-language cases.
* Verify target repository/ref/SHA attribution, stable categories/correlators,
  scan freshness, and missing-data behavior.
* Exercise rate limiting, pagination, partial failures, restarts, and rollback
  before a broad cohort rollout.
* Restrict token, alert, snapshot, browser-session, and report access. Do not
  install an administrative token in untrusted scan/build jobs.
* Retest when upstream changes. Open-source reuse reduces implementation work;
  it does not transfer the organization's operational accountability.

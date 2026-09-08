---
title: GitHub Advanced Security - Organization-Wide Implementation Guide
description: Enterprise-scale GHAS architecture, weekly multi-branch CodeQL scans without repository workflows, centralized governance, Dependabot defaults, and repository security profiles.
ms.date: 2026-09-08
ms.topic: how-to
render_with_liquid: false
---

## Recommended Architecture

Use native enterprise and organization security configurations to establish the
baseline. Centralize CodeQL analysis settings, secret protection, dependency
security, merge rules, and alert operations. Select the CodeQL execution mode
per repository instead of requiring every team to maintain its own scanner.

For the strict requirement of weekly scans of `main`, `master`, and maintained
release branches with **no workflow file in the target repositories**, operate
a central scan service using the CodeQL CLI and target-repository SARIF uploads.
Use default setup for repositories where GitHub-managed scheduling is sufficient.
Do not enable both default setup and external CodeQL uploads on the same
repository. Default setup blocks those uploads. [S01], [S02], [S03]

| Question | Recommended answer |
| --- | --- |
| What is the best default for thousands of repositories? | Enforced security configurations, native secret protection and Dependabot, CodeQL default setup where eligible, central query configuration, and ruleset-based merge controls |
| Can CodeQL run without a repository workflow? | Yes. Default setup has no committed workflow, but still uses Actions. External CodeQL analysis also needs no target-repository workflow |
| Can default setup guarantee weekly scans of all release branches? | No documented configurable weekly branch-selection mechanism provides that guarantee; protected-branch push coverage is not a periodic all-branch contract |
| Can one central Actions workflow scan all repositories weekly? | Yes, as a custom orchestrator with explicit repository access, branch enumeration, isolated workers, and target-attributed uploads. It is not workflow inheritance |
| Can reusable workflows eliminate every caller? | No. Reuse centralizes implementation; ordinary event-driven use still requires a caller |
| Can ruleset workflows remove local PR-check files? | Yes, for supported PR and merge-queue events. They do not supply scheduled scans |
| Can Dependabot be enabled everywhere centrally? | Alerts and security updates: yes. Version-update schedules and ecosystem paths still require repository configuration |
| Can Dependabot credentials be centralized? | Yes. Organization private registries and organization Dependabot secrets are supported, with scoped repository access |
| What remains local? | Build knowledge, manifest locations, maintained release branches, code ownership, remediation, and approved exceptions |

### Scope and Confidence

The target is GitHub Enterprise Cloud, including private and internal
repositories. Public repositories have different free-feature entitlements.
GitHub Enterprise Server, data-residency variants, and preview availability
must be checked against the actual deployment and contract.

Product behavior was checked against official documentation on 2026-09-08.
Design recommendations, service-level objectives, and example profiles below
are proposed organizational policy, not GitHub defaults. Examples describe
an implementation to pilot; no enterprise settings were changed and no live
scan fleet was deployed as part of writing this guide.

The strict zero-local-workflow design has a tradeoff: current AI-powered
security detections require default setup. Moving a repository to external
CodeQL analysis loses that default-setup-only capability. It also transfers
scheduling, build support, PR integration, and reliability to the platform
team. No single mode satisfies every feature and every customization constraint.

## Navigation

* [Existing documentation](#existing-documentation)
* [Feature and licensing map](#feature-and-licensing-map)
* [Enterprise and organization governance](#enterprise-and-organization-governance)
* [Deploy security configurations](#deploy-security-configurations)
* [Reuse an existing CodeQL workflow](#reuse-an-existing-codeql-workflow)
* [Centralize CodeQL without local workflows](#centralize-codeql-without-local-workflows)
* [Weekly scanning of maintained branches](#weekly-scanning-of-maintained-branches)
* [Central PR checks and merge protection](#central-pr-checks-and-merge-protection)
* [Dependabot across all repositories](#dependabot-across-all-repositories)
* [Secret Protection implementation](#secret-protection-implementation)
* [Recommended repository profiles](#recommended-repository-profiles)
* [Repository responsibilities](#repository-responsibilities)
* [Evaluated reusable resources](#evaluated-reusable-resources)
* [Fleet rollout and operations](#fleet-rollout-and-operations)
* [Acceptance tests](#acceptance-tests)
* [Sources](#sources)

## Existing Documentation

Use the existing material for the broader administration model. Use the
procedures here for GHAS scheduling, centralization, and defaults.

| Existing document | Reuse and connection |
| --- | --- |
| [Security and compliance](08-security-compliance.md) | Feature concepts, vulnerability handling, audit and SIEM context |
| [Security-by-default policies](11-security-by-default-policies.md) | Identity, Actions, repository, and enterprise policy checklist; distinguish recommendations there from actual feature enablement |
| [Policy inheritance](06-policy-inheritance.md) | Governance boundaries; do not infer inheritance of arbitrary workflow or Dependabot YAML |
| [Repository governance](07-repository-governance.md) | Rulesets, protected branches, ownership, and templates |
| [Custom properties](23-github-custom-properties.md) | Classify repositories and target controls using risk, lifecycle, and ownership |
| [Onboarding implementation plan](13-github-onboarding-implementation-plan.md) and [enterprise adoption plan](21-github-enterprise-adoption-plan.md) | Add the rollout gates below to their security phases |
| [Multi-repository checkout](17-github-actions-repos-checkout-strategy.md) | Repository-scoped tokens, GitHub App access, and private source dependencies |
| [Actions injection prevention](17-github-actions-security-echo-command-injection.md) | Treat branch names, PR data, and build scripts as untrusted inputs |
| [Chargeback design](22-github-chargeback-system-design.md) | Attribute security licenses and scanner compute separately |

Research decisions, review outcomes, and validation evidence are maintained in
[the research and implementation plan](25-ghas-research-and-plan.md).

## Feature and Licensing Map

GHAS is an umbrella term. Budget GitHub Code Security and GitHub Secret
Protection separately, or use the existing bundled agreement where applicable.
Do not count repositories as license seats: active-committer billing is based
on unique qualifying committers over the documented 90-day activity window,
with product-specific deduplication and contract rules. Scanner compute,
Actions storage, and any AI-credit consumption are separate considerations.
Verify current billing rather than using an old per-seat price. [S01], [S04]

GitHub App bots are excluded from committer counts; machine-user accounts are
not automatically equivalent. With metered billing, hard SKU budgets prevent
new enablement rather than shutting down already-enabled repositories. New
active committers in enabled repositories can still increase spend. Monitor
both onboarding failures and usage instead of treating a budget as a total
spend cap. [S04]

| Capability | Role and implementation | Entitlement consideration |
| --- | --- | --- |
| Dependency graph | Inventory supported manifests, lockfiles, and submitted dependencies | Core feature; not inherently a paid GHAS feature |
| Dependency submission and SBOM export | Fill resolved-dependency gaps and export software bills of materials | Core supply-chain capabilities; verify ecosystem and submission support |
| Dependabot alerts | Match known vulnerable dependencies against the graph | Core feature available without buying Code Security |
| Dependabot security updates | Alert-driven remediation PRs where a supported fix can be generated | Core feature; not the same as scheduled version updates |
| Dependabot version updates | Keep dependencies and Actions references current | Core feature requiring repository configuration |
| Dependabot malware alerts | Identify known malicious dependencies where supported | Check current ecosystem and product eligibility; do not equate advisory matching with malware analysis of arbitrary packages |
| Code scanning and CodeQL CLI | Static application security testing and SARIF ingestion | Code Security for private/internal repositories; public code scanning has free availability |
| Dependency review | Inspect dependency changes and enforce a PR policy using the action | Available for public repositories on GitHub.com; budget Code Security for private/internal repositories |
| Copilot Autofix | Suggested fixes for supported code scanning alerts | Code Security capability; a separate Copilot subscription is not required for ordinary CodeQL Autofix |
| AI-powered security detections | Additional PR-only findings for coverage gaps | Public preview; current docs require GHAS and Copilot licenses, consume AI credits, and require default setup |
| Custom Dependabot auto-triage | Centrally dismiss, snooze, or trigger remediation according to policy | Premium Code Security capability; distinguish from GitHub preset rules |
| Secret scanning | Detect supported secrets in history and repository collaboration surfaces | Secret Protection for private/internal repositories; public secret scanning has free availability |
| Push protection | Block supported secrets before accepting a push | Secret Protection for governed private/internal repository coverage |
| Generic and AI-detected secrets | Extend detection beyond provider-issued tokens | Check pattern-specific support; AI detection is not equivalent to push protection |
| Validity and extended metadata checks | Help prioritize supported provider secrets | Pattern/provider dependent; approve external validation and data handling |
| Custom secret patterns | Detect organization-specific credential formats | Secret Protection capability |
| Public monitoring | Attribute secrets leaked in public repositories outside enterprise ownership | Enterprise Secret Protection/GHAS capability, currently public preview |
| Delegated bypass and alert dismissal | Require review of sensitive security exceptions | Product- and alert-type-specific controls; configure the eligible reviewers |
| Security overview and campaigns | Measure coverage and coordinate remediation across repositories | Product-specific paid capabilities; public visibility alone does not unlock every premium feature |
| Security advisories and private reporting | Receive coordinated disclosures and publish fixes | Adjacent repository security features; enable private reporting for eligible public projects |
| Rulesets and required workflows | Enforce merge policy and central checks | Repository plan and rule eligibility apply; they are not scanners |

Use the live [product comparison][S01], [billing documentation][S04], and
individual feature documentation to confirm entitlements. In particular,
do not assume that because public CodeQL scanning is free, campaigns, custom
auto-triage, or every advanced secret-governance feature are also free.

GHAS does not replace dynamic application testing, penetration testing,
runtime detection, container-image vulnerability scanning, infrastructure
configuration assessment, or business-logic review. Use complementary tools
and ingest compatible findings into code scanning where appropriate.

## Enterprise and Organization Governance

### Four Different Types of Control

1. Enterprise policies constrain who can enable features and how the platform
   may be used. An availability policy is not evidence that scanning ran.
2. Security configurations set and can enforce supported enablement settings
   on attached repositories. They exist at enterprise and organization scope.
3. Organization global settings, private registries, repository properties,
   and rulesets configure analysis, access, and merge behavior. Their override
   semantics differ; not every global setting is an immutable mandate.
4. Platform automation reconciles repository-specific files, branch inventory,
   execution, exceptions, and evidence where native configuration stops.

Repositories have an associated security configuration, not a stack of
arbitrarily merged configuration documents. Reattaching a repository replaces
its association. Enterprise defaults apply to organizations that do not already
have their own default configuration. Audit the effective assignment and
settings instead of assuming that enterprise always overrides organization.
[S05], [S06], [S07]

### Governance Matrix

| Control | Enterprise governance | Organization governance | Repository or automation boundary |
| --- | --- | --- | --- |
| Product access and billing | Budget, licensing, availability policies | Authorized enablement and cost ownership | Private/internal repositories need the relevant entitlement |
| Security configurations | Create and apply enterprise configurations | Create/apply configurations; default for new repositories | Verify association, enforcement, and actual enabled state |
| Dependency graph, alerts, security updates | Set through configurations | Set through configurations and monitor | Supported manifests and functioning resolution required |
| Automatic dependency submission | Enable through configurations | Choose supported submission strategy | Build-specific dependencies may require explicit submission |
| CodeQL default setup | Set through configurations | Bulk enable, runner settings | Build and language failures remain possible |
| Shared CodeQL queries/configuration | Define policy and approved content | Default values of supported repository properties | Explicit overrides and advanced workflow inputs need auditing |
| Weekly scan of arbitrary refs | Define coverage obligation | Own central scheduler or reusable implementation | No generic enterprise cron inheritance |
| Secret scanning and push protection | Set through configurations | Enforce baseline and monitor bypasses | Rotate exposed credentials and repair code |
| Validity, metadata, generic/AI secrets | Configure supported flags and AI policy | Pilot, enable, triage | Not all secret types support all checks |
| Custom patterns | Define enterprise patterns | Define and test organization patterns | Project-specific patterns need ownership and noise review |
| Public monitoring | Enable eligible enterprise preview and review attribution/privacy | Route relevant incidents to organization owners | Outside-owned public repositories are a distinct monitoring surface |
| Pattern-level push protection | Enterprise setting, currently preview | Organization override is supported | Not an immutable enterprise floor; track differences |
| Delegated bypass and dismissal | Standardize supported configuration flags | Maintain reviewers, teams, and response coverage | Reviewers approve justified exceptions; avoid blanket exemptions |
| Dependabot grouped security updates | Set organizational standard | Native global toggle | Repository security grouping rules can customize behavior |
| Dependabot custom auto-triage | Define policy, distribute where needed | Native organization rules | Do not confuse alert suppression with remediation |
| Dependabot version updates | Standard templates and reconciliation policy | Bot-managed configuration PRs | Ecosystems, directories, schedules, and target branches remain in each repository |
| Private registries and secrets | Approve identity and network patterns | Native private registries and scoped Dependabot secrets | Advanced CodeQL/external workers require their own access setup |
| Copilot Autofix | Enterprise policy | Organization setting | Human review and tests before merge |
| AI-powered detections | Explicitly allow AI Findings | Opt in; repositories can opt out | Default setup only, PR-only, advisory, not a merge-blocking ruleset source |
| Merge requirements | Enterprise rules where available | Property-targeted rulesets and required workflows | Tool coverage, PR results, and supported events must exist |
| Actions trust and runners | Allowed actions, token policy, runner governance | Approved runner groups, restricted workflow access | Isolate untrusted code; pin dependencies and workflow implementations |
| Security overview and campaigns | Enterprise reporting and accountability | Organization triage and remediation campaigns | Teams own fixes and justified dismissals |
| Audit and reporting | Central retention, SIEM, compliance evidence | Alert webhooks and reporting integrations | Exclude raw secret values from downstream systems |
| Disclosure policy | Organization-wide standard | Default community health security policy | Supported versions, contacts, and advisories are project-specific |

Sources: [security configurations][S05], [API semantics][S07],
[global settings][S08], [CodeQL properties][S09],
[private registries][S10], and [AI detections][S11].

### What Enforcement Does Not Guarantee

An enforced configuration prevents repository owners from changing specified
enabled/disabled feature states. `not_set` does not enforce that feature.
Enforcement does not prove that required Actions are allowed, runner capacity
exists, compilation works, dependencies resolve, or a recent analysis succeeded.

GitHub documents cases where enforcement breaks, including disabling Actions
or changing analyzed-language definitions. It also documents that a REST call
to change an enforced setting can appear successful while leaving the state
unchanged. Always read back actual state. [S12]

Enterprise policies that govern repository administrators are not universally
restrictions on organization owners/security managers. Conversely, do not
assume those roles bypass every enterprise control or an enterprise-wide
product disablement. Apply the semantics of the specific policy. [S01], [S13]

## Deploy Security Configurations

### Establish a Small Set of Profiles

Use complete profiles with a shared baseline, not dozens of nearly identical
configurations. `security_tier`, `codeql_mode`, and `lifecycle` below are
organization-defined metadata, not built-in GitHub settings.

| Profile | Intended repositories | CodeQL setup decision |
| --- | --- | --- |
| Standard native | Most active application repositories | Default setup with centrally managed queries |
| Managed advanced | Custom weekly branches, custom builds, or external CI | Code Security enabled; default setup disabled; approved scanner required |
| Non-CodeQL | Unsupported-language, infrastructure, or content repositories | Secret/dependency baseline; suitable alternative tools; never label unsupported code as successfully scanned |
| Public project | Public collaboration and external contributions | Explicit fork-PR strategy, disclosure channel, eligible premium governance |

Add lifecycle handling for archives and criticality-specific merge rules to
these profiles. An archive can retain useful secret scanning coverage; do not
unarchive or disable security merely to make a fleet report look uniform.

### Native Enablement Procedure

1. Inventory existing security configurations, enabled products, default setup,
   advanced workflows, external uploads, and language/build failures. Estimate
   incremental active committers and compute before applying paid features.
2. Assign organization security managers and repository owners. Prepare a staffed
   bypass/dismissal review process and incident channel.
3. In enterprise or organization **Settings > Advanced Security**, create the
   approved custom configurations. UI labels vary with the license model.
4. Enable dependency graph, Dependabot alerts/security updates, Secret Protection,
   push protection, and approved validity/generic-pattern controls. Enable Code
   Security and the correct CodeQL mode. Configure delegated review controls.
5. For mixed existing fleets, evaluate **Enabled with advanced setup allowed**:
   it enables default setup only where CodeQL is not actively running. For
   deliberately externally scanned repositories, prefer a dedicated profile
   with default setup disabled, avoiding accidental mode changes. [S05]
6. Attach to an explicit pilot cohort first. Check attachment statuses and
   effective settings. Bulk application is asynchronous; `202 Accepted` is not
   proof of complete coverage. Insufficient licenses can leave only free
   features enabled. [S07]
7. Enable enforcement after the pilot works. Set the appropriate default for
   newly created repositories by visibility, then explicitly attach existing
   repositories. Reconcile transfers/imports separately: transferred
   repositories do not automatically get the organization's default. [S05]
8. Configure global settings, private registries, query properties, and rulesets
   separately. Default setup enablement alone does not configure all of them.

### API-Based Reconciliation

Use the [security configurations REST API][S07] for inventory and controlled
changes. Use an administrative identity for configuration management, separate
from scan-worker credentials. Check endpoint-specific authentication support:
do not assume a repository-scoped App installation token works for every
enterprise administration endpoint.

The following is a starting request body for creating an organization pilot
configuration, not a complete production profile. It enables paid products;
obtain budget approval before applying it. Add reviewers and the remaining
approved controls before enforcing production coverage.

```json
{
  "name": "standard-native-pilot",
  "description": "Native baseline with existing advanced CodeQL preserved",
  "code_security": "enabled",
  "secret_protection": "enabled",
  "dependency_graph": "enabled",
  "dependabot_alerts": "enabled",
  "dependabot_security_updates": "enabled",
  "code_scanning_default_setup": "enabled",
  "code_scanning_options": { "allow_advanced": true },
  "secret_scanning": "enabled",
  "secret_scanning_push_protection": "enabled",
  "secret_scanning_validity_checks": "enabled",
  "enforcement": "unenforced"
}
```

| Operation | API route |
| --- | --- |
| List configurations | `GET /orgs/{org}/code-security/configurations` |
| Create a configuration | `POST /orgs/{org}/code-security/configurations` |
| Attach approved repository IDs | `POST /orgs/{org}/code-security/configurations/{configuration_id}/attach` with `scope: selected` and `selected_repository_ids` |
| Set future-repository default | `PUT /orgs/{org}/code-security/configurations/{configuration_id}/defaults` |
| Read effective association | `GET /repos/{owner}/{repo}/code-security-configuration` |
| Monitor attachment status | `GET /orgs/{org}/code-security/configurations/{configuration_id}/repositories` |
| Read CodeQL default setup | `GET /repos/{owner}/{repo}/code-scanning/default-setup` |
| Read actual analyses | `GET /repos/{owner}/{repo}/code-scanning/analyses` |

Enterprise configurations have corresponding `/enterprises/{enterprise}/...`
routes. The enterprise attach endpoint supports `all` and
`all_without_configurations`, not the organization's selected-ID contract.
Do not turn an organization pilot request into an enterprise-wide change by
substituting the URL. Enterprise defaults also do not replace existing
organization defaults. [S07]

Export the current settings before changes. Set every policy-critical field
explicitly. The create API has defaults such as dependency graph enabled,
Dependabot alerts/security updates disabled, default setup disabled, and
enforcement enforced. These are **request-field defaults**, not evidence of
the existing state of repositories or the GitHub-recommended configuration.

## Reuse an Existing CodeQL Workflow

### Recommended Setup Without the GUI Generator

If a repository already contains a valid workflow such as
`.github/workflows/code-ql.yml`, keep and run that file. You do **not** need to
click **Set up > Advanced** to register it. That UI scaffolds a new workflow;
it is not a picker that binds CodeQL to an existing filename. Advanced setup
is the workflow-driven analysis that runs and uploads results. The filename
does not need to be `codeql.yml` or match GitHub's generated filename.

There is no `state: advanced` setting in the default-setup API. Its states are
`configured` and `not-configured`. Disabling default setup removes the managed
CodeQL configuration; it does not by itself create, enable, or successfully
run an advanced workflow. Conversely, having a YAML file in the repository is
not proof that CodeQL is operational. [S21], [S38]

| Layer | Required state for a repository-owned CodeQL workflow |
| --- | --- |
| License/feature | Code Security enabled for a private/internal repository |
| Security configuration | Managed-advanced profile, with default setup disabled rather than forcibly enabled |
| Default-setup API | `state: not-configured` |
| Workflow | Existing valid YAML under `.github/workflows`, active and allowed by Actions policy |
| Trigger | An applicable push, PR, dispatch, or schedule actually starts the workflow |
| Result | Successful CodeQL analysis uploaded against the expected repository/ref/SHA |

### Automate New Repository Onboarding

1. Prepare a managed-advanced security configuration that retains the full
   secret/dependency baseline, enables Code Security, and sets
   `code_scanning_default_setup: disabled`. Use the provisioning service's
   administrative identity to attach it, not the scanner's runtime token.
2. Create the repository from an approved template, or provision it and add the
   workflow through a reviewed commit/PR. Templates copy files; they do not
   transfer the template repository's security settings, secrets, or successful
   scan history. Apply the configuration to the new repository explicitly.
3. Wait for attachment and read back the effective settings. If the organization
   automatically enabled default setup when the repository was created, resolve
   that association and disable default setup before running the copied workflow.
4. Check the existing workflow for supported language/build settings, approved
   action revisions, allowed runners, and appropriate token permissions. A
   reusable caller is valid if its referenced workflow is accessible and its
   input/permission contract is satisfied.
5. Ensure the workflow is present on the default branch and has
   `workflow_dispatch` for controlled onboarding. Preserve useful `push` and
   `pull_request` triggers. Do not depend on an earlier creation push: it may
   have happened before Code Security or runner access was ready.
6. Run that exact workflow by filename or workflow ID after setup is ready.
   If it was disabled by a previous switch to default setup, explicitly
   re-enable it. Inspect its state rather than assuming the YAML is enough.
7. Confirm the completed run and processed code scanning analysis for the
   expected SHA and every required language/component. Only then mark onboarding
   complete and enable required merge checks for that cohort.

For organizations containing only managed-advanced repositories, the matching
configuration can be the new-repository default. In a mixed organization, use
the provisioning service to attach the correct profile immediately and gate
the first scan on reconciliation. Do not weaken secret protection while
changing the CodeQL execution mode.

**Enabled with advanced setup allowed** is useful for preserving repositories
where CodeQL is already actively running. It is not a promise that GitHub will
recognize every newly copied, never-run workflow before default setup starts.
Use the explicit managed-advanced profile for deterministic onboarding and
test this creation-time ordering in the pilot. [S05], [S07]

### Transition an Existing Repository Safely

Before changing modes, inspect the effective security configuration. If default
setup is enforced, an authorized organization/enterprise administrator must
change or replace the assignment first. A repository-level mutation can appear
successful without changing an enforced setting. Leave Code Security itself
enabled. [S12]

The following Bash/GitHub CLI commands are an operator example for **one
explicitly selected repository**, not a command to run indiscriminately across
the organization. They reuse existing authentication; do not put a token in the
command line. The identity needs endpoint-appropriate repository administration
for setup changes, Actions write for enable/dispatch, and code scanning read for
verification. Prefer separate provisioning/runtime identities.

Read the current setup and repository association first:

```bash
set -euo pipefail
TARGET_REPOSITORY='example-org/application'
gh api "repos/$TARGET_REPOSITORY/code-security-configuration"
gh api "repos/$TARGET_REPOSITORY/code-scanning/default-setup"
```

After the approved configuration assignment permits advanced setup, disable
default setup **only if it is currently configured**:

```bash
SETUP_STATE=$(gh api "repos/$TARGET_REPOSITORY/code-scanning/default-setup" --jq '.state')
if [[ "$SETUP_STATE" == 'configured' ]]; then
  gh api --method PATCH \
    "repos/$TARGET_REPOSITORY/code-scanning/default-setup" \
    -f state=not-configured
fi
```

Read back until the transition is confirmed before continuing; handle pending
configuration work, `409`/`422` responses, and policy conflicts explicitly in a
provisioning controller. The following assertion deliberately stops if the
repository is not ready. Do not hide a failed setup call with `|| true`.

```bash
SETUP_STATE=$(gh api "repos/$TARGET_REPOSITORY/code-scanning/default-setup" --jq '.state')
[[ "$SETUP_STATE" == 'not-configured' ]]
gh api "repos/$TARGET_REPOSITORY/actions/workflows/code-ql.yml" \
  --jq '{id, path, state}'
```

If that workflow is disabled, re-enable the existing file, then dispatch it
against the repository's actual default branch. The dispatch command requires
`workflow_dispatch` in the existing workflow; add that trigger through review
if it is missing.

```bash
gh workflow enable code-ql.yml --repo "$TARGET_REPOSITORY"
DEFAULT_BRANCH=$(gh api "repos/$TARGET_REPOSITORY" --jq '.default_branch')
gh workflow run code-ql.yml --repo "$TARGET_REPOSITORY" --ref "$DEFAULT_BRANCH"
gh run list --repo "$TARGET_REPOSITORY" --workflow code-ql.yml --limit 5
gh api --method GET "repos/$TARGET_REPOSITORY/code-scanning/analyses" \
  -f ref="refs/heads/$DEFAULT_BRANCH" -f tool_name=CodeQL \
  --jq '.[] | {commit_sha, analysis_key, category, error, created_at}'
```

Dispatch returns before analysis completes. Wait for the specific new run and
its processed results; an old entry returned by `analyses` does not validate
the transition. Check `analysis_key`, category, ref, and SHA to confirm that
the intended existing workflow produced the result. Preserve established
workflow paths/job IDs/categories where practical to avoid unnecessary analysis
identity changes. [S21], [S39]

Do not commit the extra file offered by the GUI when a suitable workflow
already exists. If an extra workflow was previously committed, identify the
canonical scanner, compare coverage, then remove or disable only the redundant
workflow through review. Do not delete historical analyses to make the UI look
cleaner. A weekly schedule in the retained workflow still needs the explicit
branch-handling design described in
[weekly scanning](#weekly-scanning-of-maintained-branches).

## Centralize CodeQL Without Local Workflows

### Native Default Setup and Shared Analysis Settings

Default setup detects supported languages and creates a managed analysis
configuration without committing YAML. Current documented triggers are:

* Pushes to the default branch or protected branches
* Creation or updates of PRs targeting the default or protected branches,
  excluding PRs from forks
* A weekly schedule

The managed weekly schedule is not a configurable cron or a guarantee of
weekly analysis of every protected/release ref. After 180 days without pushes
or PRs, weekly scans pause. The organization can instead retain scans every
30 days for inactive repositories; that interval is not configurable.
[S02], [S03], [S08]

If a repository has no supported languages, enabling default setup is not the
same as analyzing it. If all language analyses fail, default setup can remain
enabled without running scans. Inspect language coverage and tool status.
For compiled projects, compare buildless analysis with a representative
production build; generated code and dependency resolution can affect coverage.

### Share a CodeQL Configuration File

1. Put the reviewed CodeQL configuration in a central, protected repository.
2. Create the supported text repository property `github-codeql-config-file`
   in the organization. First set it only for test repositories.
3. Use the documented remote-file syntax, for example
   `remote=example-org/security-config@main:codeql.yml`.
4. After validation, set the property default for the organization. Restrict
   who can change property values and audit explicit repository overrides.
5. For a private/internal central configuration repository, configure a **Git
   Source** organization private registry pointing at that repository's full
   URL, with narrowly scoped read access.
6. Verify the next analyses use the intended configuration. Default setup
   merges the custom file with its generated configuration. Explicit property
   values retain precedence over the organization default. [S09], [S14]

Minimal central analysis configuration:

```yaml
name: Organization security queries
queries:
  - uses: security-extended
```

This is a CodeQL configuration, not an Actions workflow. Start with GitHub's
default query suite for broad rollout, then pilot `security-extended` and
promote it where findings remain actionable. Do not choose
`security-and-quality` as an indiscriminate security gate. Avoid blanket path
exclusions; language/build mode affects whether path filtering is applicable.

Protect the configuration branch and require review. Prefer an approved
immutable revision for controlled cohorts where supported by the documented
remote-file format; record the exact config revision used in scan evidence.
A shared mutable branch updates many repositories at once and needs canary
testing and rollback.

Additional current properties include `github-codeql-extra-queries`,
`github-codeql-disable-overlay`, and `github-codeql-file-coverage-on-prs`.
They depend on the CodeQL action version. Advanced setup's explicit
`config-file` input overrides the property; the organization default is not
unconditional enforcement. External CLI workers must explicitly consume the
approved settings, not assume GitHub will inject them. [S09]

Model packs can extend framework coverage organization-wide in default setup.
They must be published and accessible to consuming repositories; model packs
and the local-source threat-model options are currently preview capabilities.
Test their precision, access, and performance before broad enablement. [S14]

### Compare Centralization Options

| Mechanism | Local workflow in target repository | PR checks | Custom weekly maintained-branch scans | Operating responsibility |
| --- | --- | --- | --- | --- |
| Default setup plus organization properties | No | Native, subject to trigger limitations | No configurable all-ref guarantee | Mostly GitHub-managed |
| Reusable advanced workflow | Small caller normally required | Yes, if caller triggers correctly | Yes, with explicit ref discovery/dispatch | Platform implementation, repository caller lifecycle |
| Ruleset-required workflow from a central repository | No local copy of the required workflow | Supported PR/merge-group events | No cron/push scheduler | Platform owns required workflow and targeting |
| Central Actions controller plus CodeQL CLI workers | No | Requires separate PR event/result integration | Yes, custom service | Platform owns queue, credentials, analysis and evidence |
| Existing external CI plus CodeQL CLI | No Actions workflow needed | Requires CI PR integration | Yes, custom service | Existing CI/platform team |
| Workflow template in organization `.github` repository | Generates a copy | Only after installation | Only after installation | Template updates do not update existing copies |

Rulesets and reusable workflows solve different problems. Putting a workflow
in the organization's `.github` repository does not cause all repositories to
inherit its events. CodeQL variant analysis is useful for investigative queries
across databases; it is not a replacement for fresh branch-baseline scanning.
[S15], [S16]

## Weekly Scanning of Maintained Branches

### Define the Coverage Contract

For every in-scope repository, include the union of:

* Its actual default branch, even if it is not named `main` or `master`
* Existing branches named `main` and `master`
* Existing literal `release` and `release/**` branches that policy considers
  supported, including nested names such as `release/customer/2.x`
* Explicitly registered long-term support branches such as `support/1.x`

Deduplicate branches. Discover actual refs using paginated APIs rather than
assuming every repository has every branch. A `release` event is a release
publication event, not a schedule for branches whose names start with release.

Maintain support status, owner, and retirement date centrally. At onboarding,
treat matching release branches as in scope until an owner explicitly approves
retirement; do not silently omit unclassified branches. Stale supported
branches can still contain exploitable code.

Adopt a rolling coverage objective, for example a successful processed analysis
of every required `(repository, branch, language or component)` at least every
seven days. This is stronger than one attempted cron run each calendar week.
Start jobs before the deadline, provide retry capacity, and alert on overdue
results. Unchanged source still needs new analysis as queries evolve.

### Why a Cron Entry Alone Is Insufficient

GitHub Actions schedules run the workflow from the default branch. A workflow
with push filters for `main`, `master`, and `release/**` does not run its
scheduled event separately on those branches. [S17]

The following is a **trigger fragment for the central controller**, not a
complete scanner. `17 2 * * 2` requests a run each Tuesday at 02:17 UTC.

```yaml
on:
  schedule:
    - cron: '17 2 * * 2'
  workflow_dispatch:
```

The controller must enumerate repositories/refs and queue work. For a rolling
seven-day objective, run reconciliation more frequently than weekly and enqueue
jobs approaching their deadline. GitHub cron is best effort: runs can be
delayed or dropped, public schedules can disable after 60 days without
repository activity, and an inactive EMU schedule actor can stop execution.
Use a durable scheduler and an independent freshness monitor for compliance
obligations; a cron expression is not a service guarantee. [S17]

### Central Scan Service Procedure

1. Run an authenticated inventory controller in a protected platform repository
   or existing CI service. Enumerate the installation's authorized repositories,
   actual branches, support metadata, and security mode.
2. Resolve each selected branch to an immutable commit SHA and persist a work
   item containing repository ID/name, full ref, SHA, language/component,
   approved build profile, config/query revision, and due time.
3. Enqueue bounded jobs by trust zone and language. Do not place thousands of
   repository/branch/language combinations in a single Actions matrix. GitHub
   limits a matrix to 256 jobs; use batches and a durable queue. [S18]
4. Fetch the exact source revision in a trusted checkout stage with short-lived,
   target-scoped read access. Validate repository identity and that the SHA was
   resolved from the authorized ref. Do not accept arbitrary clone URLs.
5. Analyze in a fresh disposable worker. Build scripts and package installation
   can execute code, even on protected branches. The worker must not receive
   the App private key, organization-administration token, or fleet upload token.
6. Create a CodeQL database from that exact source and the approved language
   build strategy. Run the approved queries and preserve stable relative file
   paths and fingerprints in SARIF. Capture coverage and extraction failures.
7. Destroy the untrusted worker. A separate clean publisher verifies the work
   item and artifact metadata and uploads to the **target repository**, with
   its full ref and the **analyzed SHA**, never the controller's SHA.
8. Wait for processing and reconcile the resulting analysis. Only successful
   extraction, analysis, and server-side processing count as completed coverage.
   Store errors separately from a successful scan with zero findings.
9. Reconcile drift and overdue work, retry transient failures with backoff, and
   escalate persistent failures. A deleted branch becomes a reviewed retirement
   event; a moved branch does not change the SHA recorded for an existing job.

Separate the control process from untrusted execution with different machines
or isolated workloads and identities. Separate steps within one compromised
runner are not a security boundary: a background process could steal a token
introduced later. Registry access also needs per-job read-only scoping and
network restrictions. [S19], [S20]

Example work item shape, maintained by your platform service rather than a
GitHub-defined schema:

```json
{
  "repository": "example-org/payments",
  "ref": "refs/heads/release/2.x",
  "commit_sha": "RESOLVED_40_CHARACTER_COMMIT_SHA",
  "language": "javascript-typescript",
  "component": "application",
  "build_profile": "javascript-no-build",
  "analysis_category": "fleet/javascript-typescript/application",
  "configuration_revision": "APPROVED_CONFIGURATION_COMMIT_SHA",
  "due_at": "2026-09-15T02:17:00Z"
}
```

Do not put dates, run IDs, or commit SHAs in the analysis category. Use stable
categories per tool/language/component to avoid alert churn or overwriting
different analyses of the same commit. Branch and commit attribution belong
in their dedicated fields. [S21], [S22]

### CodeQL Worker and Publisher Examples

These Bash examples show the analysis/upload core, not a turnkey fleet service.
Prerequisites are a pinned CodeQL CLI bundle and query packs, an authorized
source snapshot at the resolved SHA, valid entitlement, and the isolated stages
described above. The JavaScript example intentionally does not run a repository
build. Other languages need validated extraction/build profiles.

In the disposable analysis worker, with no GitHub upload credential:

```bash
set -euo pipefail
: "${SOURCE_ROOT:?Set the exact source snapshot directory}"
: "${OUTPUT_ROOT:?Set a fresh per-job output directory}"
codeql database create "$OUTPUT_ROOT/codeql-db" \
  --language=javascript-typescript \
  --source-root="$SOURCE_ROOT"
codeql database analyze "$OUTPUT_ROOT/codeql-db" \
  codeql/javascript-queries:codeql-suites/javascript-security-extended.qls \
  --format=sarif-latest \
  --sarif-category=fleet/javascript-typescript/application \
  --output="$OUTPUT_ROOT/results.sarif"
```

Transfer the SARIF and controlled job metadata through the platform's artifact
channel. In a **separate clean publisher**, provide a fresh App installation
token scoped to the target repository. `TARGET_REPOSITORY`, `TARGET_REF`, and
`TARGET_SHA` must come from the trusted work item, not fields supplied by the
scanned code. The publisher must validate artifact size and format.

```bash
set -euo pipefail
: "${TARGET_REPOSITORY:?Set owner/repository from trusted job metadata}"
: "${TARGET_REF:?Set the full refs/heads/... ref}"
: "${TARGET_SHA:?Set the exact analyzed commit SHA}"
: "${SARIF_FILE:?Set the validated SARIF artifact path}"
: "${UPLOAD_TOKEN:?Inject a short-lived target-scoped token}"
printf '%s' "$UPLOAD_TOKEN" | codeql github upload-results \
  --github-auth-stdin \
  --github-url=https://github.com \
  --repository="$TARGET_REPOSITORY" \
  --ref="$TARGET_REF" \
  --commit="$TARGET_SHA" \
  --sarif="$SARIF_FILE" \
  --format=json
```

Never enable shell tracing around secrets. The CLI waits for processing by
default, with a documented default timeout of 120 seconds. A timeout requires
status reconciliation, not blind upload retry: the original upload may still
finish. The REST equivalent is
`POST /repos/{owner}/{repo}/code-scanning/sarifs`, supplying `commit_sha`, `ref`,
and gzip/base64 SARIF, followed by processing-status verification. [S21], [S23]

The example assumes SARIF paths are relative to the analyzed source root. If
the results contain absolute URIs, configure the corresponding source-root
mapping using CLI `--checkout-path` or REST `checkout_uri`. Validate that GitHub
links findings to the intended target files before enabling a fleet cohort.

### Permissions and Scale

| Identity | Minimum capability to design for | Must not be shared with |
| --- | --- | --- |
| Configuration administrator | Endpoint-specific organization/enterprise administration | Scan workers |
| Inventory and checkout App | Selected repository metadata/contents read; add only needed branch/PR reads | Unrelated repositories or external callers |
| SARIF publisher App | Repository **Code scanning alerts: write**; installation restricted to target repositories | Build and package-install stages |
| Optional PR-check publisher | Checks/status write for the specific integration | General-purpose build scripts |
| Registry identity | Read-only access to required packages for that job | Other trust zones or organization administration |

`security-events: write` is the Actions permission name; `security_events` is
the classic-token scope. GitHub App permissions have their own names. Do not
grant a classic `repo`-scoped PAT to every worker. The controller repository's
`GITHUB_TOKEN` does not grant access to arbitrary target repositories. [S19], [S21]

Size the fleet using branch-language workload, not repository count alone.
For example, 3,000 repositories with four maintained branches and two analyses
per branch produce 24,000 weekly analyses. At ten minutes each, that is
240,000 runner-minutes before retries, PR scans, or larger-runner multipliers.
This is illustrative sizing, not a GitHub price estimate.

The SARIF API documents a 1,000-upload-per-hour limit per user/App installation
and a 10 MB compressed-file limit. General primary/secondary rate limits and
SARIF result limits also apply. Read response headers, paginate inventories,
bound parallelism, and leave room for PR traffic. Do not create identities to
circumvent limits. Persist progress across controller restarts. [S21], [S22]

### Alternative When a Thin Caller Is Acceptable

A small per-repository caller plus a pinned reusable workflow is usually less
operationally expensive than a custom cross-repository scanner. This relaxes
the no-local-workflow requirement and should be an explicit choice.

The caller owns `push`, `pull_request`, `merge_group` where needed, and a
schedule or dispatch trigger. The shared implementation owns language/build
profiles, queries, runner selection, and reporting. For scheduled multi-branch
coverage it must still enumerate refs and use correct ref/SHA attribution, or
dispatch runs against the branches with the required workflow present.

Changing checkout `ref` alone does not change the workflow event's `GITHUB_REF`
or `GITHUB_SHA`. Do not copy a matrix checkout example without validating the
uploaded analysis metadata. Use the explicit CLI publisher contract above when
analyzing a different repository/ref from the workflow context.

## Central PR Checks and Merge Protection

Weekly scans find vulnerabilities in maintained code, including unchanged
branches. They do not replace scanning the proposed change before merging it.

Configure organization branch rulesets for the relevant repositories and
default/release branches. Start in evaluate mode where available, then enforce
after coverage is healthy. Require PR review, restrict bypass, and require
code scanning results for the selected tools and security severity threshold.
Begin with new high/critical findings; use remediation campaigns for backlog.

The code scanning rule can block when findings meet the threshold, analysis is
pending, or a required tool is not configured. Do not apply a CodeQL requirement
to repositories with unsupported languages and call the resulting blocked PRs
successful security adoption. Security severity and diagnostic level
(`error`, `warning`, `note`) are different dimensions. [S15]

### Centrally Required Workflows

Store the approved PR validation workflow in a protected central repository
and select it in an organization ruleset's **Require workflows to pass before
merging** rule. Configure repository access to the source workflow and runner
groups. This is the native way to require a central PR workflow without copying
it into every repository.

The source repository must have compatible visibility: a public source can
serve any target visibility, an internal source can serve internal/private
targets, and a private source can serve private targets. A mixed-visibility
fleet may need separate approved workflow sources. Do not publish confidential
policy merely to use one public source for all repositories. [S15]

Ruleset workflows support `pull_request`, `pull_request_target`, and
`merge_group`; event filters are ignored for these required workflows. Scope
repositories/branches in the ruleset and test event handling. Do not use
`pull_request_target` to build untrusted PR code with privileged credentials.
Use `merge_group` when a merge queue requires the check. [S15], [S20]

The **Require merge queue** rule itself is repository-level, not available in
organization-level rulesets. Configure each repository's queue and settings
separately, directly or through approved automation; a central workflow that
handles `merge_group` does not enable merge queue. [S15]

A centralized dependency-review job can run without building the PR's code.
For code scanning, validate all language, fork, and merge-queue paths before
enforcement. In the external mode, subscribe to PR updates and analyze the
correct PR head or merge ref with matching SHA and an appropriate base
analysis. A weekly `refs/heads/main` upload does not substitute for PR analysis.

### Dependency Review Gate

Enable the graph and the relevant Code Security entitlement, then require a
dependency-review check. The review UI being available does not itself block
merges. Set a severity threshold and, if required, an approved license policy.
Prefer `allow-licenses`: `deny-licenses` is deprecated for possible removal in
the next major action release. The two options are mutually exclusive. Use the
action's supported shared configuration option to centralize policy. [S24]

The action defaults to `fail-on-severity: low` and `fail-on-scopes: runtime`.
Set these explicitly: the example starts blocking at high severity and includes
development and unknown scopes because build dependencies can compromise CI.
Unknown licenses are reported but do not automatically fail this action;
add a separate approval/check process if unknown licenses must block release.

Example policy content for the dependency-review action:

```yaml
fail-on-severity: high
fail-on-scopes:
   - runtime
   - development
   - unknown
vulnerability-check: true
license-check: true
allow-licenses:
  - MIT
  - Apache-2.0
  - BSD-3-Clause
```

This allowlist is illustrative and must be approved by legal/open-source
governance. Use the action's required input format when passing policy directly
as workflow inputs instead of a YAML configuration file. Provide dependency
snapshots for base and head when manifests alone do not reveal resolved
dependencies. Treat missing graph data and submission failures as gaps, not a
clean bill of health. [S24], [S25]

### Dependency Submission and SBOM Operations

1. Enable the dependency graph and verify that it recognizes representative
   manifests and lockfiles. Compare its inventory with a real resolved build,
   including transitive dependencies and private packages.
2. Enable automatic dependency submission through security configurations for
   supported ecosystems after testing its build and registry access. This is
   not a universal resolver for every language or build system.
3. For remaining gaps, use a supported submission action in an existing build
   or the dependency submission API from external CI. Submit the actual resolved
   dependencies for the target repository and commit, with consistent detector
   and job identifiers. Authenticate narrowly and monitor submission failures.
4. For PR dependency review, ensure the required base/head dependency data is
   available before judging the change. Use supported retry-on-snapshot-warning
   settings when submission is asynchronous; do not return success merely
   because dependency data is missing.
5. Export an SBOM from the dependency graph through its UI or
   `GET /repos/{owner}/{repo}/dependency-graph/sbom`. Store the export with
   repository/release identification and retention metadata. [S25]

A repository graph export is not automatically a release-specific bill of
materials for every maintained branch or the final container image. For a
release contract, generate an artifact-specific SBOM from the exact release
build and correlate it with the scanned source. SBOM generation supplies an
inventory; it does not itself detect vulnerabilities or prove provenance.

## Dependabot Across All Repositories

### Keep the Three Capabilities Separate

| Capability | Trigger and coverage | Configuration |
| --- | --- | --- |
| Alerts | Graph changes and newly applicable reviewed advisories; default-branch dependency inventory | Security configuration, settings, or API; no version-update file required |
| Security updates | Alerts for which Dependabot can generate a supported fix; default branch | Enable centrally; optional file settings customize supported behaviors |
| Version updates | Scheduled search for newer releases in declared ecosystems/directories | Repository `.github/dependabot.yml` on its default branch |

Alerts are not a weekly batch scanner and do not require every vulnerability to
have a CVE identifier. A security update is not guaranteed: no patched version,
unsupported manifests, constraints, lockfile problems, or registry failures can
prevent a PR. Dependency graph availability also does not imply support for
all Dependabot update features in that ecosystem. [S26], [S27], [S28]

### Documented Defaults and Recommended Overrides

The following reflects the current options reference. Explicit policy is
preferable to relying on defaults that change over time. [S28]

| Setting | Documented behavior when not customized | Recommended organization policy |
| --- | --- | --- |
| Alerts/security-update enablement | Depends on repository history and applied settings; do not infer enabled from availability | Explicitly enable and read back through security configurations |
| Version-update configuration | No organization-wide inferred ecosystem/directory schedule | Generate an appropriate file for every applicable repository |
| `version` | Required schema value `2` | Set explicitly |
| Ecosystem and path | `package-ecosystem` and `directory` or `directories` are required | Inventory all supported manifests; avoid overlapping entries |
| `schedule.interval` | Required, no implicit interval | Weekly routine updates; more frequent checks for selected critical packages |
| Weekly day | Monday | Spread repository cohorts over the week |
| Time and zone | Randomly assigned time; explicitly specified times default to UTC | Keep randomized spreading or generate deterministic staggered times |
| `daily` | Weekdays, Monday through Friday | Use `cron` when a seven-day schedule is required |
| Version-update PR limit | Five open PRs; no more until some are merged or closed | Start at five per update configuration and monitor backlog |
| Security-update PR limit | No open-PR limit in the current reference; security PRs do not count toward the version limit | Control noise through grouping and rollout, not the version PR limit |
| Cooldown | Three days for version updates, even without `cooldown`; does not apply to security updates | Keep or deliberately customize for supported ecosystems |
| Grouping | Individual dependency PRs unless grouping is configured | Group compatible nonbreaking version updates; keep security updates separate |
| `groups.applies-to` | `version-updates` | Set explicitly for security groups |
| Target branch | Repository default branch | Explicit entries for maintained non-default version-update targets |
| Rebase strategy | Automatic rebasing on documented events | Keep enabled unless a measured operational problem justifies changing it |
| Labels | `dependencies`; ecosystem labels where applicable; existing SemVer labels may be added | Provision any custom labels before using them |
| Assignees and milestones | None | Route ownership through team review, CODEOWNERS, or automation |
| Registry access | Public registries unless private access is configured | Central scoped registry definitions or Dependabot secrets |
| External code execution with private registries | Disabled by default | Enable only for narrowly reviewed ecosystem requirements |
| Versioning strategy | Ecosystem-dependent; supported ecosystems can infer application vs library behavior | Preserve application/library compatibility intent |

The version-update schedule and cooldown do **not** delay security updates.
`open-pull-requests-limit: 0` disables version PR creation for that entry while
allowing supported security-update customization to remain. It does not
globally disable alerts or security updates.

### What Can Be Customized Centrally

Use organization **Advanced Security > Global settings** for grouped security
updates, auto-triage rules, Dependabot runner selection, and permitted private
repository access. Use security configurations for alert/security-update
enablement and delegated dismissal. Use organization private registries or
Dependabot secrets for credentials. [S05], [S08], [S10]

There is no general enterprise/organization `dependabot.yml` inheritance or
`extends` mechanism in the documented native configuration. A file in the
organization's `.github` repository configures that repository only; it does
not automatically apply update schedules to the fleet. [S29]

Implement centrally governed configuration as a reconciliation service:

1. Discover ecosystems, manifest directories, registry requirements, and
   maintained branches during onboarding and after relevant repository changes.
2. Render repository-specific YAML from versioned organization templates and
   approved overrides. Validate its schema and directory coverage.
3. Open an idempotent PR through an approved App. Respect protected branches
   and code owners; do not force-push over developer changes.
4. Store template revision and exception ownership centrally. Reconcile drift
   daily and whenever policy changes. Surface failed/stale PRs as coverage gaps.
5. Require approved changes to security configuration files via CODEOWNERS and
   rulesets. A template with no reconciliation is only a starting example.

The repository still contains the generated Dependabot file, but teams do not
need to hand-maintain standard boilerplate. If the requirement is **no local
configuration file of any kind**, native Dependabot version updates cannot
meet it. Keep native alerts/security updates and evaluate a separately governed
dependency-update service rather than inventing unsupported inheritance.

### Example Generated Dependabot Configuration

Example for a repository with npm dependencies at its root and GitHub Actions.
Only include ecosystems and directories that actually exist. Leave `time`
unset to retain distributed scheduling; a fleet generator can assign staggered
days and times if reproducibility is required.

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
      day: tuesday
    open-pull-requests-limit: 5
    cooldown:
      default-days: 3
    groups:
      compatible-version-updates:
        applies-to: version-updates
        patterns: ['*']
        update-types: [minor, patch]
      security-fixes:
        applies-to: security-updates
        patterns: ['*']
  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
      day: wednesday
    open-pull-requests-limit: 5
```

Major npm updates remain eligible as separate PRs; grouping minor/patch updates
does not suppress major security fixes. Do not globally ignore major updates
or all development dependencies: build/test dependencies can compromise CI.
Broad `ignore` rules can also suppress security remediation; alert triage and
update suppression are separate decisions. [S28]

Organization grouped security updates provide a useful starting point;
repository `groups` rules provide finer control and take precedence for the
configured scope. Security and version updates remain separate. Current
Dependabot also supports `multi-ecosystem-groups` for version updates and
`group-by: dependency-name` for supported cross-directory version grouping
within the same package ecosystem. Multi-ecosystem groups have their own
schedule and parameter-merging rules; follow the dedicated configuration guide
linked from the options reference. Use them for coordinated changes only after
testing, not as an assumption that all security updates across ecosystems form
one PR. [S28], [S30]

For specialized templates, `schedule.interval: cron` uses `schedule.cronjob`
for custom scheduling. `exclude-paths` can omit approved fixtures or vendored
paths from version-update discovery; review exclusions so they do not hide
maintained code. Consult the cooldown ecosystem support matrix before applying
SemVer-specific cooldown settings across different package managers. [S28]

### Release Branches Need a Separate Dependency Policy

Dependabot alerts and security-update PRs are based on the default branch.
Adding `target-branch` does not extend that alert/remediation model to release
branches. It redirects **version updates**, and options in that entry do not
customize default-branch security updates. [S28]

For a supported `release/2.x`, add a separate version-update entry with an
explicit target if regular maintenance is appropriate:

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    target-branch: release/2.x
    schedule:
      interval: weekly
      day: thursday
    open-pull-requests-limit: 3
```

This standalone example demonstrates the release entry; a real generated file
must also preserve its default-branch entries. `target-branch` is a specific
branch, not a `release/**` fan-out expression.

Maintain a backport process for security fixes, and scan release-specific
dependency inventories with an appropriate SCA tool if vulnerability coverage
on every supported release is required. CodeQL source scanning is not
dependency vulnerability scanning. Do not claim weekly CodeQL coverage closes
the Dependabot release-branch gap.

### Private Registries and Credentials

Prefer **Settings > Secrets and variables > Private registries** to define
organization-level registries and grant access to selected repositories.
Dependabot can use these definitions as well as repository file definitions.
Organization-level OIDC is supported for Dependabot with documented providers,
including Azure DevOps Artifacts, AWS CodeArtifact, Cloudsmith, Google Cloud
Artifact Registry, and JFrog Artifactory. Establish provider trust and restrict
claims and package permissions before enabling it. The organization UI calls
the Azure provider **Azure**; the provider-specific Dependabot guide describes
Azure DevOps Artifacts. [S10], [S31]

Organization Dependabot secrets are also supported. They are separate from
Actions secrets and can be limited to selected repositories. Where a file-based
registry definition is needed, reference these secrets rather than duplicating
credential values. For example, merge this registry into the same configuration
that declares the applicable npm update entry:

```yaml
version: 2
registries:
  internal-npm:
    type: npm-registry
    url: https://packages.example.com/npm/
    token: ${{ secrets.DEPENDABOT_NPM_READ_TOKEN }}
updates:
  - package-ecosystem: npm
    directory: /
    registries: [internal-npm]
    schedule:
      interval: weekly
```

Use the central native registry definition when it meets the need; do not
duplicate it in every file. Test authentication and routing where organization
and repository definitions overlap. Narrow npm scope/routing and registry
permissions to reduce dependency-confusion exposure.

The same organization registry UI serves multiple security features, but
capabilities differ. CodeQL default setup supports selected language/registry
combinations and Git Source configuration access; its organization-registry
OIDC authentication is **not supported**. Advanced CodeQL workflows and external
workers do not inherit these registry credentials. They need their own approved
package access. Initial default-setup registry adoption can require disabling
and re-enabling setup; coordinate it to avoid an unnoticed coverage gap. [S10]

For network-private registries, provide supported isolated runner connectivity,
DNS, TLS, and egress access. A secret is not a network route. Public-repository
Dependabot jobs use GitHub-hosted runners even when labeled runners are selected.
Granting Dependabot access to a private source repository can expose its contents
indirectly through updates to organization users; review that access carefully.
[S08], [S31]

### Alert Triage and Safe Remediation

Start by routing alerts to accountable teams and measuring response times.
GitHub preset auto-triage rules and premium custom rules are distinct. Review
the active presets in every visibility cohort; the documented low-impact
development-dependency preset is enabled by default on public repositories,
not private ones. Keep malware suppression off unless a narrow documented
false-positive case justifies it. [S32]

Do not broadly auto-dismiss based only on low severity or development scope.
Use exposure, exploit evidence, dependency usage, and compensating controls.
Preserve reasons and expiry for dismissals/snoozes. Delegated Dependabot alert
dismissal is distinct from rules that automatically triage alerts.

Auto-merge is an optional repository/PR capability, not the effect of enabling
Dependabot. Require tests, dependency review, branch rules, and a constrained
approval policy. A patch version is not proof of safety. Never give Dependabot
PRs privileged build credentials merely to make CI pass.

## Secret Protection Implementation

Enable repository secret scanning and push protection through enforced
configurations for all in-scope repositories, including non-CodeQL projects.
Secret scanning is service-driven and needs no scanner workflow or weekly
schedule. Scan history and new content; do not replace it with a cron regex job.

### Detection Coverage

| Detection/control | Recommended treatment |
| --- | --- |
| Provider patterns | Enable; prioritize supported validity signals without treating unknown validity as safe |
| Generic patterns | Enable after a noise/ownership pilot; include private keys and other supported generic credentials |
| AI-detected secrets | Pilot with a staffed review queue; current password detection has no push protection or validity checks |
| Validity checks | Enable when provider contact and data handling are approved; unavailable checks do not downgrade the incident |
| Extended metadata | Enable where useful and approved; requires validity checks and provider support |
| Custom patterns | Define enterprise/organization credential formats, dry-run, inspect false positives, then publish and enable eligible push protection |
| AI-generated custom regex | Optional authoring aid; independently test generated expressions and dry-run before publishing |
| Pattern-level push protection | Preview; audit enterprise and organization overrides rather than assuming all detections are blocked |
| Delegated bypass | Require approval by a small staffed reviewer group; minimize direct bypass and especially exemptions |
| Delegated alert dismissal | Prevent unreviewed closure where required; keep it distinct from permission to push a secret |

Push protection supports a subset of detections and has documented limits.
An accepted push is not proof that no secret exists. Repository secret scanning
and user-level public push protection are different controls. Organization
governance must configure repository protection rather than rely on contributors'
personal settings. [S33], [S34]

GitHub documents scanning Git history and repository issues, PRs, discussions,
and wikis. Do not generalize that into scanning every Actions log, artifact,
package, or deployment environment. Route those surfaces to appropriate secret
handling and detection controls. [S08], [S33]

### Enterprise Public Monitoring

Evaluate the public-monitoring preview to detect credentials leaked in public
GitHub.com repositories that the enterprise does not own. Current attribution
uses enterprise membership and verified email-domain matching; alerts appear
in enterprise security overview. GitHub Advanced Security or Secret Protection
must be enabled. Review privacy, attribution accuracy, verified domains, and
incident ownership before opting in. This supplements repository scanning; it
does not let your organization enforce push protection in someone else's
repository. See [Public monitoring](https://docs.github.com/en/code-security/concepts/secret-security/public-monitoring).

The optional AI regex generator can assist custom-pattern authoring, but it
does not automatically validate or deploy a suitable organization pattern.
Ordinary CodeQL Autofix and this regex generator do not require a separate
Copilot subscription, unlike the AI-powered code-detection preview described
earlier. GitHub Code Quality is a related capability, not a substitute for
security scanning; verify its separate availability and billing before adding
it to the rollout. See the
[security and quality AI application card](https://docs.github.com/en/code-security/responsible-use/security-and-quality-ai-features).

### Response and Exceptions

1. Restrict access to the alert. Do not copy raw secrets into tickets, logs,
   chat, or SIEM payloads. Send metadata and the restricted alert URL.
2. Revoke or rotate the credential at the provider immediately for a credible
   exposure; investigate usage and permissions. Deleting the string or rewriting
   history does not revoke it.
3. Remove the secret from active code and update applications to use managed
   identities, short-lived credentials, or an approved secrets manager.
4. Confirm revocation, investigate impact, and close with evidence. History
   cleanup is a separate coordinated operation when necessary.
5. Review bypass requests with a reason, owner, and expiry. A test value should
   be clearly synthetic, not an active credential labeled as a test.

Publish an organization help link in push-protection messages so developers
can reach the approved recovery process. Use campaigns for existing secret
debt and staff reviewers before enabling delegated bypass across thousands
of repositories. [S08], [S35]

## Recommended Repository Profiles

Best security is a complete supported control set with verified execution,
not the largest number of enabled switches. The following are recommended
targets after piloting, not product defaults.

| Repository class | Required baseline | Code and dependency strategy | Merge and operations |
| --- | --- | --- | --- |
| Standard application | Secret Protection, push protection, graph, Dependabot alerts/security updates, ownership | Native CodeQL plus shared configuration; generated version updates; resolved dependencies where needed | PR review, high/critical scanning gate, dependency review, weekly freshness monitoring |
| Internet-facing or regulated service | Standard baseline plus approved validity/metadata and delegated bypass/dismissal | Extended queries after validation; production-build coverage; explicit weekly maintained-release scanning; release-specific SCA | Tighter SLAs, restricted bypass, release evidence and threat modeling |
| Custom-build or multi-release application | Same protection baseline, no reduction for tooling complexity | Managed advanced/external CodeQL, exact ref/SHA evidence, generated dependency maintenance and backports | Tested PR/merge-queue integration; platform-owned failure escalation |
| Shared library or reusable workflow | Same baseline; protect release credentials and workflows | CodeQL including Actions where supported; test all supported version lines; update dependencies/actions | Consumer-impact review, immutable releases/provenance where appropriate |
| Unsupported language or infrastructure | Secret/dependency baseline | Appropriate third-party SAST/IaC/container tooling; optional advisory AI PR detections where eligible | Require the actual supported tool; no fictitious CodeQL success |
| Public project with fork contributions | Eligible free features plus purchased governance as needed | Validate fork PR scanning; default setup alone excludes fork PRs in current docs | Isolated untrusted execution, private reporting, coordinated advisories |
| Documentation or empty repository | Secret protection and ownership; dependencies/Actions scanned if present | Default setup may wait for supported code; record not applicable accurately | Protect publishing workflow and maintainer access |
| Archived repository | Retain applicable secret coverage and retained evidence | No routine build assumption; record lifecycle exception and monitor if still deployed | Unarchive triggers revalidation; archiving is not a vulnerability fix |

For a critical repository with a strict weekly multi-ref obligation, choose
the managed advanced profile even if default setup is technically available.
For an ordinary supported application, start native and avoid building a custom
scanner merely to share queries, since organization properties already do that.

## Repository Responsibilities

| Responsibility | What the repository team supplies | What the platform team supplies |
| --- | --- | --- |
| Ownership | Team, business criticality, contacts, supported releases | Required metadata schema and reconciliation |
| Build coverage | Reproducible build, toolchain requirements, generated-code knowledge | Approved runner images and tested CodeQL profiles |
| Dependency coverage | Correct manifests/lockfiles and private package requirements | Registry access, generated Dependabot config, submission patterns |
| Code review | Domain-aware reviews and tests for fixes | Central rulesets and security checks |
| Merge queue | Repository-level queue configuration and merge strategy | Tested central merge-group checks and approved configuration automation |
| Remediation | Fix, test, backport, rotate credentials, document risk | Campaigns, routing, SLAs, escalation |
| Exceptions | Evidence, business owner, compensating controls, expiry | Approval process and automated expiry monitoring |
| Security configuration changes | Explain legitimate project-specific needs | Protect shared content and audit overrides |

Files that may still be needed locally include the generated Dependabot
configuration, CODEOWNERS, manifests/lockfiles, tests, and project build
configuration. An organization default community health security policy can
provide a fallback disclosure policy where applicable; it does not provide
Dependabot or workflow inheritance. [S29], [S36]

A zero-local-workflow repository still needs a reproducible build and an owner.
Keep central build profiles structured and reviewed; do not accept arbitrary
shell commands from repository metadata into a privileged controller.

## Evaluated Reusable Resources

The [evaluated advanced-security resource catalog](26-ghas-reusable-resources.md)
links directly to reusable workflows, query/configuration examples, dependency
submitters, custom-pattern tools, and reporting components. The public
organization was inventoried and selected READMEs and implementation files
reviewed on 2026-09-08. Its projects are not all officially supported or ready
for unchanged production reuse.

The most useful additions to this architecture are:

* An internally maintained workflow library adapted from selected
   `advanced-security/reusable-workflows` patterns and official scanning actions
* Language-matrix and monorepo helpers for measured advanced-setup needs, while
   preserving full fresh analyses and valid cross-component dataflow coverage
* Build-aware Maven/component detection or SPDX submission to close actual
   dependency-graph gaps
* Versioned organization secret patterns with test and dry-run gates
* Read-only native-setup audit, restricted alert exports, and SBOM/PURL incident
   investigation tools

Do not use `gh-add-files` unchanged to adopt an existing `code-ql.yml`: the
reviewed implementation hardcodes `codeql.yml`, and force mode can turn off
default setup before the replacement workflow PR is merged. Use the
[existing-workflow procedure](#reuse-an-existing-codeql-workflow) instead.
The catalog also identifies concrete output/configuration wiring defects in
some upstream wrappers and explains how to evaluate them before adoption.

## Fleet Rollout and Operations

### Phased Implementation

| Phase | Work | Exit criteria |
| --- | --- | --- |
| Research and inventory | Repository/branch/language inventory, current modes, registry/network map, owner and license baseline | No unknown critical owners; scan-mode conflicts identified |
| Pilot | Representative native, external, compiled, monorepo, private-registry, public-fork, and archived cases | Acceptance scenarios below pass; costs and false positives measured |
| Baseline prevention | Enforce approved secret/dependency settings; configure new-repo defaults; test bypass staffing | Expected controls active and transfers caught by reconciliation |
| Code coverage | Roll out native default setup and central properties; deploy managed scanner cohorts | Correct languages/refs analyzed; reliable freshness evidence |
| Merge protection | Evaluate then enforce rulesets and dependency review; validate queues/forks | New high/critical findings blocked without unsupported-tool deadlocks |
| Remediation | Campaigns, safe update grouping, backports, Autofix with review | Assigned backlog and measurable response performance |
| Continuous governance | Drift reconciliation, failure alerts, policy canaries, exception expiry | Coverage and operational objectives sustained |

Roll out in increasing batches sized by runner and triage capacity, not all
repositories at once. Freeze expansion if extraction failure rate, queue age,
unexpected license use, or alert-routing failures exceed the agreed threshold.

### Evidence and Metrics

Maintain separate dashboards for enablement, successful scanning, findings,
and remediation. A repository with no findings may have no analyzed code.

Record at least repository ID, owning team, profile/configuration ID, expected
branches/languages, setup mode, analyzed SHA, analysis category, query/config
revision, last successful processing time, extraction errors, next due time,
and active exceptions. For release coverage, query analyses per ref rather than
relying on a default-branch dashboard alone.

Useful measures include:

* Percentage of eligible repositories with expected enforced configuration
* Percentage of required branch-language analyses within the freshness objective
* Unsupported, failed, and missing analyses shown separately from clean analyses
* Secret protection coverage and bypass/dismissal approval volume and latency
* Resolved-dependency coverage and private-registry failure rate
* Vulnerability age, overdue findings, reopen rate, and security-update PR age
* Expired exceptions, unowned repositories, and policy/configuration drift
* Cost per successful analysis and incremental active committers by product

Use security overview and campaigns for native risk operations. Ingest alert
webhooks for timely routing and periodically reconcile REST inventories for
missed events. Audit logs record administration and exception activity, not a
complete substitute for alert and scan-result evidence. Preserve restricted
evidence according to retention policy. [S37]

### Suggested Remediation Targets

These are example service-level targets to approve with security and product
owners. Prioritize actual exploitation and exposure above severity alone.

| Finding | Initial action | Remediation target |
| --- | --- | --- |
| Credible active secret exposure or malicious dependency | Immediate incident triage and containment | Rotate/revoke or remove exposure urgently; do not wait for the weekly cycle |
| Critical, exploitable vulnerability | Same-day assessment | Example: 72 hours or approved compensating control |
| High severity | Assign within one business day | Example: seven days |
| Medium severity | Assess exposure and ownership | Example: 30 days |
| Low severity | Queue with documented priority | Example: 90 days |

Use Copilot Autofix to accelerate proposed changes, not to approve them. Validate
functional behavior, rescan, and review the patch. AI-powered detections are a
separate preview: PR-only, advisory, no backlog security alerts, no full-repo
scans, and no ruleset enforcement. Do not include them in the weekly CodeQL
coverage metric. [S01], [S11]

### Rollback and Recovery

Version configurations, query content, templates, worker images, and rulesets.
Record previous associations/settings before changes. Roll back the affected
cohort rather than disabling security enterprise-wide.

Deleting or detaching a security configuration leaves current repository
settings in place; it is not a full rollback. Reapply the prior configuration
and verify effective state. Coordinate default/advanced mode changes because
default setup can disable workflows and block external CodeQL uploads. [S03], [S07]

Retain enough prior analysis evidence to investigate regressions. Do not send
fabricated empty SARIF to make failed scans appear healthy. Central query or
publisher compromise affects many repositories: protect those assets with
restricted administration, independent review, and auditable releases.

## Acceptance Tests

Run these against an explicitly authorized pilot before calling the rollout
production-ready. Documentation and syntax validation cannot prove live
enterprise permissions, feature availability, or branch attribution.

| Scenario | Required evidence |
| --- | --- |
| New private, internal, and public repositories | Correct visibility-specific configuration, entitlement, and actual feature state |
| Existing and transferred repositories | Explicit attachment and reconciliation; transfer does not silently bypass baseline |
| Enterprise vs organization defaults | Organization default precedence is understood and expected configuration is attached |
| Enforced-setting mutation | Actual state remains expected even if an API mutation reports success |
| Native repository with no workflow file | Successful managed CodeQL run with expected languages and shared configuration |
| Explicit property/workflow override | Override is detected and either approved or corrected |
| Weekly branch coverage | Default branch, existing main/master, literal release, nested release branch, and supported custom branch each have correct ref/SHA results |
| Unchanged supported branch | Reanalysis occurs before the seven-day freshness deadline |
| CodeQL mode conflict | External upload accepted only with the intended setup mode; no forced default-setup re-enablement |
| Slow processing and scheduler outage | Upload timeout reconciled; overdue work retried; independent freshness alert fires |
| Untrusted build | No fleet/admin credential or later publisher credential can be read from the build environment |
| Monorepo and compiled languages | Expected components, generated code, and dependency resolution validated |
| Missing or unsupported language | Reported as a gap/not applicable, never a successful zero-finding analysis |
| PR high-severity finding | Correct required tool blocks; clean reviewed change can merge |
| Fork PR and merge queue | Supported scans/checks run or a documented compensating policy blocks unsafe merging |
| Dependency update | Alerts/security PRs work independently of version schedule; registry credentials and network access verified |
| Release dependency change | Backport/SCA process detects release-only risk; target-branch version updates are not misreported as alerts |
| Secret prevention | Approved synthetic test pattern triggers expected block, bypass review, and audit without using a real secret |
| Secret response | Incident drill demonstrates rotation, restricted evidence, and owner routing |
| Scale and rollback | Queues survive restart, rate limits respected, exceptions visible, previous profile restored successfully |

## Sources

Official documentation was consulted during research. Re-check the live pages
before deployment, especially preview features, licensing, limits, and changed
Dependabot defaults.

* [S01: GHAS products and feature availability][S01]
* [S02: Code scanning setup types and triggers][S02]
* [S03: Configuring default setup and mode conflicts][S03]
* [S04: Advanced Security billing][S04]
* [S05: Organization security configurations][S05]
* [S06: Enterprise security configurations][S06]
* [S07: Security configurations REST API][S07]
* [S08: Organization global security settings][S08]
* [S09: CodeQL repository properties][S09]
* [S10: Organization private registries][S10]
* [S11: AI-powered security detections][S11]
* [S12: Security configuration enforcement][S12]
* [S13: Enterprise code-security policies][S13]
* [S14: Shared default-setup configuration and model packs][S14]
* [S15: Available rules, code scanning, and required workflows][S15]
* [S16: Reusable workflows][S16]
* [S17: Actions schedules and other events][S17]
* [S18: Actions limits][S18]
* [S19: Code scanning with existing CI][S19]
* [S20: Actions secure use][S20]
* [S21: Code scanning analyses and SARIF REST API][S21]
* [S22: SARIF support and analysis identity][S22]
* [S23: CodeQL upload command][S23]
* [S24: Dependency review action][S24]
* [S25: Dependency graph][S25]
* [S26: Dependabot alerts][S26]
* [S27: Dependabot security updates][S27]
* [S28: Dependabot options and current defaults][S28]
* [S29: Dependabot configuration-file model][S29]
* [S30: Grouped security updates][S30]
* [S31: Dependabot private registries, OIDC, and secrets][S31]
* [S32: Dependabot auto-triage][S32]
* [S33: Secret scanning][S33]
* [S34: Supported secret patterns][S34]
* [S35: Delegated bypass][S35]
* [S36: Default community health files][S36]
* [S37: Adopting GHAS at scale][S37]
* [S38: Configuring advanced setup][S38]
* [S39: GitHub CLI workflow commands][S39]

[S01]: https://docs.github.com/en/get-started/learning-about-github/about-github-advanced-security
[S02]: https://docs.github.com/en/code-security/concepts/code-scanning/setup-types
[S03]: https://docs.github.com/en/code-security/code-scanning/enabling-code-scanning/configuring-default-setup-for-code-scanning
[S04]: https://docs.github.com/en/billing/concepts/product-billing/github-advanced-security
[S05]: https://docs.github.com/en/code-security/how-tos/secure-at-scale/configure-organization-security/establish-complete-coverage/create-custom-configuration
[S06]: https://docs.github.com/en/enterprise-cloud@latest/code-security/how-tos/secure-at-scale/configure-enterprise-security/establish-complete-coverage/create-custom-configuration
[S07]: https://docs.github.com/en/rest/code-security/configurations
[S08]: https://docs.github.com/en/code-security/how-tos/secure-at-scale/configure-organization-security/establish-complete-coverage/configure-global-settings
[S09]: https://docs.github.com/en/code-security/concepts/code-scanning/repository-properties
[S10]: https://docs.github.com/en/code-security/how-tos/secure-at-scale/configure-organization-security/manage-usage-and-access/giving-org-access-private-registries
[S11]: https://docs.github.com/en/code-security/concepts/code-scanning/ai-powered-security-detections
[S12]: https://docs.github.com/en/code-security/reference/security-at-scale/configuration-enforcement
[S13]: https://docs.github.com/en/enterprise-cloud@latest/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-policies-for-code-security-and-analysis-for-your-enterprise
[S14]: https://docs.github.com/en/code-security/how-tos/find-and-fix-code-vulnerabilities/manage-your-configuration/edit-default-setup
[S15]: https://docs.github.com/en/enterprise-cloud@latest/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets
[S16]: https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows
[S17]: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows
[S18]: https://docs.github.com/en/actions/reference/limits
[S19]: https://docs.github.com/en/code-security/how-tos/find-and-fix-code-vulnerabilities/integrate-with-existing-tools/use-with-existing-ci-system
[S20]: https://docs.github.com/en/actions/reference/security/secure-use
[S21]: https://docs.github.com/en/rest/code-scanning/code-scanning
[S22]: https://docs.github.com/en/code-security/reference/code-scanning/sarif-files/sarif-support
[S23]: https://docs.github.com/en/code-security/codeql-cli/codeql-cli-manual/github-upload-results
[S24]: https://github.com/actions/dependency-review-action
[S25]: https://docs.github.com/en/code-security/concepts/supply-chain-security/dependency-graph
[S26]: https://docs.github.com/en/code-security/concepts/supply-chain-security/dependabot-alerts
[S27]: https://docs.github.com/en/code-security/concepts/supply-chain-security/dependabot-security-updates
[S28]: https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference
[S29]: https://docs.github.com/en/code-security/concepts/supply-chain-security/about-the-dependabot-yml-file
[S30]: https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/secure-your-dependencies/configure-security-updates
[S31]: https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/manage-your-dependency-security/configure-access-to-private-registries
[S32]: https://docs.github.com/en/code-security/concepts/supply-chain-security/dependabot-auto-triage-rules
[S33]: https://docs.github.com/en/code-security/concepts/secret-security/about-secret-scanning
[S34]: https://docs.github.com/en/code-security/reference/secret-security/supported-secret-scanning-patterns
[S35]: https://docs.github.com/en/code-security/concepts/secret-security/delegated-bypass
[S36]: https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/creating-a-default-community-health-file
[S37]: https://docs.github.com/en/code-security/tutorials/adopting-github-advanced-security-at-scale
[S38]: https://docs.github.com/en/code-security/how-tos/find-and-fix-code-vulnerabilities/configure-code-scanning/configuring-advanced-setup-for-code-scanning
[S39]: https://cli.github.com/manual/gh_workflow

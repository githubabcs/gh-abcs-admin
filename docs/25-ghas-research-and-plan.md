---
title: GHAS at Scale - Research and Implementation Plan
description: Evidence, design decisions, review outcomes, and validation criteria for the organization-wide GHAS implementation guide.
ms.date: 2026-09-08
ms.topic: reference
render_with_liquid: false
---

## Scope and Research Method

> [!NOTE]
> This is a supplementary authoring and review record. Share the
> [implementation guide](25-ghas-implementation-guide.md) and
> [resource catalog](26-ghas-reusable-resources.md) as the customer-facing
> guidance. Model-assisted review and syntax/link checks are not an independent
> security assessment, GitHub endorsement, or production deployment approval.

The implementation target is GitHub Enterprise Cloud with thousands of
repositories. The deliverable is an implementation guide, not a deployment into
an authenticated enterprise. GitHub Enterprise Server requires separate,
version-specific validation.

Research uses existing administration documentation as context and official
GitHub documentation as the authority for product behavior. Recommendations
must distinguish native capabilities, platform-team automation, and
repository-specific decisions.

Separate read-only model-assisted reviewers completed a pre-draft challenge and
post-draft technical/reader review using GPT-5.4 and Claude Sonnet 4.6 model
selections. Model selections describe tool requests, not independently
verified runtime identities. The resulting
[implementation guide](25-ghas-implementation-guide.md) incorporates the
verified findings; no human approval or live enterprise deployment is claimed.

## Existing Documentation and Gaps

| Existing source | Reusable information | Gap for this implementation |
| --- | --- | --- |
| [Security and compliance](08-security-compliance.md) | Security feature overview, alert handling, audit integration | Precise scheduling, current default setup behavior, centralized implementation |
| [Security-by-default policies](11-security-by-default-policies.md) | Enterprise, organization, and repository controls | Distinguish feature availability from enforcement and execution |
| [Policy inheritance](06-policy-inheritance.md) | Governance hierarchy | Security configurations are not arbitrary YAML inheritance |
| [Repository governance](07-repository-governance.md) | Rulesets and repository templates | Required PR workflows do not provide organization-wide cron |
| [Enterprise adoption plan](21-github-enterprise-adoption-plan.md) | Phased rollout and security ownership | Fleet reconciliation, maintained release branches, scan evidence |
| [Custom properties](23-github-custom-properties.md) | Classification and targeting | Apply classification to security profiles and exceptions |
| [Multi-repository checkout](17-github-actions-repos-checkout-strategy.md) | GitHub App access and token boundaries | Target-repository SARIF attribution and isolated scanning workers |

## Initial Findings

1. A scheduled Actions workflow is loaded from the default branch. Adding
   `main`, `master`, or `release/**` to a push trigger does not make cron scan
   those branches. A scheduler must explicitly enumerate and analyze refs.
2. CodeQL default setup does not require a committed workflow file, but it uses
   GitHub Actions. Default setup also blocks external CodeQL analysis uploads;
   repositories must have a deliberate choice of CodeQL execution mode.
3. Default setup's weekly schedule can stop after six months without pushes or
   pull requests. The current documentation offers an organization setting for
   monthly inactive-repository scans. That is not a weekly coverage guarantee.
4. Existing text claiming default setup downloads pre-built databases should
   not be used as an implementation assumption. Analysis must be verified
   against the actual repository, supported languages, and build mode.

Sources:

* [Configuring default setup](https://docs.github.com/en/code-security/code-scanning/enabling-code-scanning/configuring-default-setup-for-code-scanning)
* [Actions schedule event](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)

## Design Hypothesis and Discriminating Checks

Native security configurations and default setup provide the lowest-maintenance
baseline. A strict requirement for weekly analysis of every maintained branch,
without any repository-local workflow, requires a centrally operated scan
service unless a documented native capability explicitly supplies both branch
selection and scheduling.

Before accepting this recommendation, check the current CodeQL repository
properties and organization-wide setup documentation for configurable schedules
and branch selection. Reject any design that uploads results against the
controller repository's SHA instead of the scanned repository's ref and SHA.

Dependabot defaults must be checked against the current options reference,
not copied from older workshop examples. In particular, validate version-update
scheduling separately from alert-driven security updates.

## Implementation Plan

1. Verify scanning, security configurations, Dependabot, secret protection,
   licensing boundaries, and centralized configuration against official sources.
2. Resolve the two reviewers' challenges and select a reference architecture
   for the strict no-local-workflow requirement, with a simpler native option
   for repositories that do not need custom weekly branch coverage.
3. Write the guide with feature and ownership matrices, configuration examples,
   fleet operation procedures, defaults, exceptions, and source references.
4. Add navigation and narrowly correct misleading claims in the existing
   security overview. Preserve unrelated workshop material.
5. Review the completed guide with both model selections and validate Markdown,
   local links, and structured examples. Record limitations honestly.

## Acceptance Criteria

* Every question in the request maps to an explicit guide section.
* Weekly scans include existing `main`, `master`, literal `release`, maintained
  `release/**`, and any differently named default branch selected by policy.
* Native default setup, reusable workflows, ruleset workflows, and an external
  scan service are not presented as interchangeable mechanisms.
* Enterprise and organization enforcement is separated from repository files,
  build knowledge, ownership, and remediation.
* Dependabot defaults, overrides, registry access, and release-branch limits
  are sourced and distinguish alerts, security updates, and version updates.
* Strict weekly coverage measures successful processed analyses, not enablement
  or upload acceptance alone.
* Examples are labeled by execution context and do not expose broad credentials
  to repository build scripts.
* Review findings, checks performed, and untested deployment requirements are
  recorded before completion.

## Research Decisions and Review Outcomes

| Round | Requested model | Focus | Outcome |
| --- | --- | --- | --- |
| Pre-draft | GPT-5.4 | Weekly branch coverage, central workflow mechanisms, SARIF identity and mode conflicts | Supported native baseline plus externally orchestrated strict multi-ref scanning; identified newer shared CodeQL configuration support |
| Pre-draft | Claude Sonnet 4.6 | Enterprise/organization governance, Dependabot defaults, secret protection | Supplied current defaults and feature inventory; registry claims were corrected against direct source checks |
| Post-draft | GPT-5.4 | Architecture safety, required workflows, fork/queue behavior, API attribution | No blocking core-architecture defect; added source-repository visibility rules, repository-level merge queue setup, and SARIF path mapping |
| Post-draft | Claude Sonnet 4.6 | Dependency policy, licensing, registry access, examples, completeness | Added dependency-review option deprecation/defaults and grouping constraints; reconfirmed current Dependabot defaults and OIDC limitations |

The selected design preserves the following distinctions:

* Default setup centralizes configuration without local workflow files, but
   does not supply configurable weekly analysis of every maintained release ref.
* A central scan service satisfies strict branch scheduling without local
   workflows, but requires platform-owned PR integration, build isolation,
   credentials, a durable queue, and evidence reconciliation.
* Default setup blocks external CodeQL uploads. Its current AI-powered
   security-detection preview is unavailable when that repository switches to
   external CodeQL mode. This tradeoff is explicit in the guide.
* Enterprise/organization configurations are supported natively. Enterprise
   defaults do not replace existing organization defaults, and transfers need
   reconciliation. Configuration enablement is not evidence of a successful scan.
* Dependabot version-update YAML remains repository-local, but organization
   private registries and scoped organization Dependabot secrets are supported.
* Current documented version-update cooldown is three days, and security-update
   PRs have no open-PR limit. Security updates do not follow the version schedule.

Direct verification rejected the initial claim that Dependabot has no
organization credential store or organization private-registry support.
It also qualified the suggestion that grouping cannot cross ecosystems:
multi-ecosystem grouping exists for version updates, not as a universal
security-update grouping mechanism. The source guide documents these boundaries.

The post-draft Azure provider wording was clarified, not removed: the
organization registry UI uses "Azure", while the provider-specific Dependabot
documentation describes Azure DevOps Artifacts. Autofix's no-separate-Copilot
subscription requirement was verified independently against the current
security and quality AI application card.

## Requirements Traceability

| Requested outcome | Guide section |
| --- | --- |
| Complete GHAS feature coverage | [Feature and licensing map](25-ghas-implementation-guide.md#feature-and-licensing-map) |
| Weekly main/master/release scanning | [Weekly scanning of maintained branches](25-ghas-implementation-guide.md#weekly-scanning-of-maintained-branches) |
| Central workflows without local copies | [Centralize CodeQL](25-ghas-implementation-guide.md#centralize-codeql-without-local-workflows) and [central PR checks](25-ghas-implementation-guide.md#central-pr-checks-and-merge-protection) |
| Dependabot defaults and global customization | [Dependabot across all repositories](25-ghas-implementation-guide.md#dependabot-across-all-repositories) |
| Everything centrally governable | [Governance matrix](25-ghas-implementation-guide.md#governance-matrix) and [deploy configurations](25-ghas-implementation-guide.md#deploy-security-configurations) |
| What remains repository-specific | [Repository responsibilities](25-ghas-implementation-guide.md#repository-responsibilities) |
| Best security per repository | [Recommended repository profiles](25-ghas-implementation-guide.md#recommended-repository-profiles) |
| Implementation at thousands-repository scale | [Fleet rollout and operations](25-ghas-implementation-guide.md#fleet-rollout-and-operations) |
| Existing-doc cross-references | [Existing documentation](25-ghas-implementation-guide.md#existing-documentation), README navigation, and links in the security overview/policy checklist |
| RPI and two-model challenges before/after drafting | This research record and the review table above |

## Validation Evidence

The following checks were performed locally on 2026-09-08 against the initial
drafting revision. Counts describe that revision, not the current document set:

* Markdownlint passed for both new documents, with MD013 disabled to permit
   source URLs and wide reference tables. No repository lint configuration was
   added or changed.
* Real Markdown and YAML parsers validated five edited-document frontmatter
   blocks and all eight YAML/JSON examples in the implementation guide.
* Local file links and heading anchors, including new cross-references from
   the README and existing security documents, were validated.
* Rendered source-citation targets were checked. Adjacent shortcut references
   were separated to prevent Markdown from combining different source IDs.
* All 40 distinct external URLs in the guide and research note returned
   successful HTTP responses, following redirects. This was a reachability
   check, not proof that every claim was supported by each linked page.
* VS Code reported no errors in the new guide and research note at the checked
   revision. The final whitespace check uses `git diff --check`.

Parser dependencies and the validation harness were installed in a temporary
directory, not added to the repository's project dependencies. Initial helper
validation attempts returned stale filenames/wrapper failures; those results
were not treated as evidence. Successful direct local checks superseded them.

The examples were parsed and checked against documentation, not executed
against an authenticated enterprise. No CodeQL scan, secret-detection test,
Dependabot update job, fork PR check, merge queue, license enablement, or
cross-repository SARIF upload was run. The guide's acceptance tests are the
required pilot gates before production rollout. Existing documents received
targeted corrections and cross-references, not a complete re-audit of every
older example or citation.

## Follow-Up Research on Existing Workflows and Reusable Tools

The 2026-09-08 follow-up adds the
[existing-workflow onboarding procedure](25-ghas-implementation-guide.md#reuse-an-existing-codeql-workflow)
and [evaluated reusable-resource catalog](26-ghas-reusable-resources.md).
It answers how a copied workflow becomes the advanced CodeQL implementation
without accepting a second file from the GUI, and which public
`advanced-security` components merit reuse.

Research inventoried 102 public repositories in a 2026-09-08 API snapshot,
then read the organization
profile, curated CodeQL/Dependabot/secret-scanning lists, selected relevant
READMEs, and the concrete workflows/configurations listed in the catalog.
This was a selected-content assessment, not an audit of all code in the
organization. Immutable source revisions anchor the significant findings.

| Finding | Recommendation incorporated |
| --- | --- |
| The default-setup API has only `configured` and `not-configured`, not `advanced` | Keep Code Security enabled, disable default setup under the appropriate security configuration, then enable/dispatch the existing workflow and verify its analysis |
| `allow_advanced` refers to CodeQL already actively running | Use an explicit managed-advanced onboarding profile for copied, never-run workflows; validate creation-time ordering in a pilot |
| `gh-add-files` hardcodes `codeql.yml` and force mode changes setup before PR merge | Do not use it unchanged to adopt a differently named existing workflow or apply broad force operations |
| Some reusable wrappers have incorrect output/configuration wiring | Adapt reviewed components into an internally owned library and test actual policy enforcement |
| Monorepo PR optimization can republish prior SARIF | Track fresh analysis separately from uploads and retain full periodic scans |
| Audit/SBOM/reporting tools have scope and support limits | Separate default-setup audits, advanced scan freshness, dependency inventory, and release-specific coverage |
| Custom pattern deployment uses browser sessions; revocation has operational impact | Require restricted credentials/session storage, human-controlled promotion, and incident-tested remediators |

Two read-only model-assisted follow-up reviews used requested GPT-5.4 and Claude Sonnet 4.6
model selections. The first checked setup transitions, CLI behavior, enforced
configuration, and onboarding ordering. The second checked the resource
recommendations and source-specific defects. Neither reported additional
blocking issues in that revision; this was a scoped model-assisted assessment,
not an external sign-off or guarantee of correctness. No tools were installed
in a GitHub organization and no settings,
workflows, alerts, or credentials were changed remotely.

The validation harness was extended to include the new catalog, its YAML caller
example, navigation links, and cited upstream URLs. The Bash operator examples
are documentation only; a successful syntax check does not establish their
authorization or end-to-end behavior in the target enterprise.

## Customer Pre-Share Critic Review

The 2026-09-08 pre-share review covers the implementation guide, the reusable
resource catalog, and this authoring record. Related GHAS statements in the
older security overview and security-by-default checklist were checked for
contradictions, not re-audited as complete documents.

Three `ait-code-reviewer` invocations used requested GPT-5.4 and Claude Sonnet
4.6 model selections. Their initial findings were adjudicated against the
actual document wording and live source pages; model agreement or disagreement
was not treated as authoritative evidence. No reviewer approval constitutes a
human or independent external security sign-off.

| Review item | Disposition | Evidence or correction |
| --- | --- | --- |
| Grouping default table could be read as recommending version groups for security fixes | Clarified | Recommendation now explicitly says `applies-to: security-updates`; the existing example already used the correct value |
| Onboarding commands used one example filename while describing arbitrary retained workflows | Clarified | `WORKFLOW_FILE` is defined once and reused; examples explicitly run in the same Bash session |
| Older security overview described layered security-configuration inheritance | Corrected | It now distinguishes the associated configuration from policies/global settings and links to effective governance |
| Older policy checklist recommended default setup indiscriminately | Corrected | Organization/repository rows now select native or managed-advanced profiles; required workflows are identified as PR checks, not cron |
| Model-assisted reviews and historical counts could be mistaken for current external sign-off | Clarified | Authoring record labeled supplementary; prior counts are revision-scoped; URL reachability is distinguished from factual verification |
| Critic asserted there was no implicit three-day version-update cooldown | Rejected after live verification | [Options reference](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference) explicitly documents three days even without a configured cooldown |
| Critic asserted a ten-PR security-update cap | Rejected after live verification | The same current reference explicitly says there is no open-PR limit for security updates; the guide does not promise unlimited throughput |
| Critic questioned the 180-day managed scan pause and monthly continuation | Confirmed current wording | [Organization global settings](https://docs.github.com/en/code-security/how-tos/secure-at-scale/configure-organization-security/establish-complete-coverage/configure-global-settings) documents 180 days and 30-day continuation; 60-day public Actions inactivity is a different rule |
| Critic questioned repository-level merge-queue scope | Confirmed current wording | [Available rules](https://docs.github.com/en/enterprise-cloud@latest/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets) explicitly excludes the merge-queue rule from organization-level rulesets |
| Critic questioned preview licensing and dependency-review defaults | Reverified and made more explicit | [AI detections](https://docs.github.com/en/code-security/concepts/code-scanning/ai-powered-security-detections) documents both licenses; dependency-review v5 documents low severity/runtime scope defaults |
| Upstream wrapper defects, mutable nested references, incomplete policy evaluation | Already documented; reinforced | Catalog remains reference-only for broken wrappers; guide now also requires a negative policy test and full nested-reference review |
| Private-registry authentication and SHA-pinned Actions advisory gaps | Added explicit acceptance checks | Dependabot OIDC is not CodeQL default-setup OIDC; version-update support for SHA pins is not proof of native alert coverage |

The source-level catalog findings remain scoped to their cited upstream
commits. No upstream code was changed and no upstream tool was executed against
an organization. The review preserves GitHub-native recommendations and does
not introduce a competing dependency-update service.

For customer sharing, use the implementation guide and resource catalog with
their scope/preview/pilot caveats intact. This record can accompany them as
background if useful, but is not an implementation runbook. Deployment still
requires confirmation of tenant entitlements and the documented pilot tests.

### Final Review Outcome

The final T-004 (requested GPT-5.4) and T-005 (requested Claude Sonnet 4.6)
critic passes reported no blocking documentation findings. T-004 rechecked
example consistency, governance, repository profiles, and publication claims.
T-005 verified the added SHA-pinned Actions alert limitation and CodeQL
default-setup OIDC limitation against their live official sources. The parent
review separately reverified the disputed defaults, inactivity rules, preview
licensing, and ruleset scope against current documentation.

Validation on 2026-09-08 passed:

* Markdown lint on the three new GHAS documents, excluding line-length rule
   MD013 for tables and URLs.
* Parsing of six frontmatter blocks, nine YAML/JSON examples, and six Bash
   syntax examples across the scoped document set.
* Resolution of 72 local links/anchors and 104 source-reference citations.
* HTTP reachability for all 97 distinct external URLs, following redirects.
* Editor diagnostics on the five edited documents, with no errors reported.

These checks establish documentation consistency and source reachability, not
successful execution of examples. No authenticated tenant test, scanner run,
Dependabot generator deployment, or GitHub Pages/Jekyll rendering test was
performed. Customer-specific entitlements, live pilot acceptance, and human
approval remain required before production rollout.

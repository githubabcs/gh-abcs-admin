---
title: "Mastering GitHub Administration on EMU: A Comprehensive Guide (Workshop)"
description: 3-hour intermediate/advanced workshop on administering a GitHub Enterprise Cloud with Enterprise Managed Users (EMU), structured around the Enterprise Adoption Plan in this repository.
author: GitHub ABCs Admin
ms.date: 2026-05-19
ms.topic: tutorial
audience: Platform engineers, security SMEs, repository admins, enterprise owners
level: Intermediate / Advanced
duration: 3 hours (max)
format: Instructor-led overview, guided discussion, and decision moments
keywords:
  - github enterprise cloud
  - enterprise managed users
  - emu
  - github administration
  - github advanced security
  - github actions
  - copilot governance
  - ado to github migration
---

# Mastering GitHub Administration on EMU: A Comprehensive Guide

> **Document status**
>
> - **Last reviewed:** 2026-05-19
> - **Authorship:** Drafted with AI assistance (GitHub Copilot) and reviewed by a human maintainer before publication.
> - **Sources:** Reference documents in this repository, anchored to the [GitHub Enterprise Cloud Adoption Plan](./21-github-enterprise-adoption-plan.md). All links resolve relatively within `docs/`.
> - **Verify before acting:** GitHub updates product behavior continuously. Re-confirm against [docs.github.com](https://docs.github.com) before applying these recommendations to production.

> **Scope assumption — EMU.** This workshop assumes your enterprise is an **Enterprise Managed Users (EMU)** enterprise with SSO and SCIM already established (or being established now). EMU-specific rules, limits, and pitfalls are called out inline in every module.

---

## 1. Workshop Overview

**Title:** Mastering GitHub Administration on EMU: A Comprehensive Guide
**Duration:** 3 hours (with two short breaks)
**Audience:** Intermediate / advanced practitioners — platform engineers, security SMEs, repository admins, enterprise owners, migration leads
**Format:** Concept overview (≈60%) + guided discussion and decisions (≈30%) + pointers to deep-dive labs and reference guides (≈10%)
**Anchor document:** [GitHub Enterprise Cloud Adoption Plan](./21-github-enterprise-adoption-plan.md) — every module maps to one or more of its 11 phases (0–10).

### 1.1 Why this workshop exists

Most teams adopting GitHub Enterprise Cloud on EMU succeed or fail on the same axis: **governance before migration**. This workshop compresses the adoption plan into a single 3-hour session so your administrators can make clear, durable decisions on identity, organization shape, policy, security, automation, and migration *before* the first repository moves — with EMU constraints baked into every decision.

### 1.2 Learning outcomes

By the end of this workshop, you will be able to:

1. **Map** the GitHub Enterprise Cloud hierarchy (Enterprise → Organization → Repository → Team) to the governance levers available at each level, and identify what EMU adds or removes at each level.
2. **Select and justify** an organization model (for example, Green / Red / Sandbox / Archive) that works with EMU's no-public-repos and no-personal-repos constraints.
3. **Validate** EMU identity and access — SSO (Microsoft Entra ID OIDC or SAML, Okta SAML), SCIM provisioning, IdP group sync, IP allow lists, and break-glass via the setup user.
4. **Design** a teams + CODEOWNERS model that maps cleanly from Azure DevOps security groups and stays synchronized with your identity provider.
5. **Apply** security-by-default: enterprise policies, organization security configurations, rulesets, GitHub Secret Protection, and GitHub Code Security.
6. **Govern** GitHub Actions and GitHub Copilot at enterprise scale — including the EMU-specific runner and Copilot licensing rules.
7. **Sequence** an Azure DevOps → GitHub migration: inventory, orphaned identities (mannequins), Git Large File Storage (LFS), Azure Pipelines hybrid model, Go/No-Go, cutover, rollback.
8. **Identify** day-2 workstreams — audit log streaming, cost allocation (chargeback), governed AI in the SDLC, and exception handling — and know where to deep-dive after the session.

### 1.3 Prerequisites

- Working knowledge of Git, pull requests, and CI/CD concepts.
- Familiarity with at least one identity provider (Microsoft Entra ID or Okta).
- An EMU enterprise account where you hold **Enterprise Owner** or **Organization Owner** access if you plan to follow up with hands-on labs (not required during the session).
- Review these reference guides in advance:
  - [Enterprise Hierarchy](./01-enterprise-hierarchy.md)
  - [Enterprise Managed Users (EMU)](./04-enterprise-managed-users.md)
  - [Security-by-Default Policies](./11-security-by-default-policies.md)
  - [GitHub Enterprise Cloud Adoption Plan](./21-github-enterprise-adoption-plan.md) — Executive Summary and Phase 0

### 1.4 Agenda at a glance (3:00 total)

| # | Block                                                       | Duration | Adoption-plan phases        |
|---|-------------------------------------------------------------|---------:|-----------------------------|
| 0 | Welcome, goals, EMU framing                                 |    10 min | —                           |
| 1 | Enterprise hierarchy, organization design & EMU             |    20 min | Phase 0, Phase 2            |
| 2 | EMU identity, access & teams                                |    25 min | Phase 1, Phase 3            |
| — | ☕ Break                                                     |    10 min | —                           |
| 3 | Policies, inheritance & repository governance               |    25 min | Phase 2, Phase 5            |
| 4 | Security-by-default & GitHub Advanced Security              |    30 min | Phase 4, Phase 7            |
| — | ☕ Break                                                     |    10 min | —                           |
| 5 | GitHub Actions & GitHub Copilot governance (EMU specifics)  |    25 min | Phase 6                     |
| 6 | Migration readiness, cutover & pilot decisioning            |    20 min | Phase 8, 9, 10              |
| 7 | Wrap-up, common pitfalls & next steps                       |     5 min | —                           |

> 💡 **How to get the most out of the session:** each module ends with a **decision moment** — an explicit choice your team can make together. Use those moments to focus discussion on the trade-offs that matter for your environment.

### 1.5 Glossary

| Acronym | Full term |
|---|---|
| ADO | Azure DevOps |
| CODEOWNERS | GitHub file that defines reviewers per path |
| EMU | Enterprise Managed Users |
| GEI | GitHub Enterprise Importer |
| GHAS | GitHub Advanced Security (now sold as two SKUs: **GitHub Secret Protection** and **GitHub Code Security**) |
| GHEC | GitHub Enterprise Cloud |
| IdP | Identity provider (e.g., Microsoft Entra ID, Okta, PingFederate) |
| LFS | Git Large File Storage |
| OIDC | OpenID Connect |
| PAT | Personal access token |
| SAML | Security Assertion Markup Language |
| SCIM | System for Cross-domain Identity Management |
| SDLC | Software Development Lifecycle |
| SIEM | Security information and event management |
| SLA | Service Level Agreement |
| SSL | Secure Sockets Layer (used informally for TLS) |
| SSO | Single Sign-On (umbrella term; specific protocols here are SAML and OIDC) |
| MCP | Model Context Protocol (an extension surface for AI assistants) |
| TFVC | Team Foundation Version Control (legacy ADO version control — not Git) |

---

## 2. Module 0 — Welcome & EMU Framing (10 min)

### Learning objectives

- State the workshop scope and what is **out of scope** (Git fundamentals, IDE setup, application architecture).
- Adopt the **"governance before migration"** principle that drives the running order.
- Recognize the **three EMU realities** that shape every later decision.

### Key concepts

- This workshop is a **map**, not a manual. The [Adoption Plan](./21-github-enterprise-adoption-plan.md) and [Well-Architected Best Practices](./09-best-practices-waf.md) remain the source of truth.
- Three lenses every administrator must hold simultaneously: **identity**, **policy**, **auditability**.
- The order of modules is deliberate: identity before policy, policy before security automation, security before migration.

**The three EMU realities to set the tone:**

1. **The identity provider is the front door.** Every user is provisioned by SCIM; usernames are `{idp_username}_{enterprise_shortcode}`; an IdP outage blocks all GitHub access.
2. **Public and user-namespace repositories are off-limits.** EMU users cannot create public repositories, cannot fork into a user namespace, cannot use PATs unless explicitly allowed, cannot use GitHub Sponsors, cannot use GitHub-hosted runners for any user-namespace repository, and cannot subscribe to Copilot Pro or Free (only Copilot Business or Enterprise).
3. **Mannequin reclamation is one-way and SCIM-only.** Any ADO committer who is not SCIM-provisioned at migration time becomes a mannequin whose contribution history cannot be reattributed afterwards — that attribution is permanently lost.

### Reference reading

- [GitHub Enterprise Cloud Adoption Plan](./21-github-enterprise-adoption-plan.md) — Executive Summary, Team Allocation Model
- [Enterprise Managed Users (EMU)](./04-enterprise-managed-users.md) — Limitations section
- [Reference Architecture](./10-reference-architecture.md) — End-state diagrams and patterns

---

## 3. Module 1 — Enterprise Hierarchy, Organization Design & EMU (20 min)

**Maps to:** Adoption Plan Phase 0 (Discovery) and Phase 2 (Organization Structure & Policies).

### Learning objectives

By the end of this module, you will be able to:

1. **Describe** the Enterprise → Organization → Repository → Team hierarchy and identify which settings live at each level.
2. **Select** an organization model (single org, business-unit split, or Red / Green / Sandbox / Archive) and justify it against EMU constraints.
3. **Enumerate** the EMU-specific limits that shape every later decision and call out which "standard" practices do not apply on EMU.

### Key concepts (10 min)

**Hierarchy and what each level controls**

| Level | Scope | Typical controls |
|---|---|---|
| **Enterprise** | All organizations under the account | SSO, SCIM, IP allow list, audit log streaming, base permission, repo-creation policy, public-repo block, PAT policies, GHAS availability, Copilot availability, Actions allow-list |
| **Organization** | All repos in one org | Default repo visibility, team creation, security configurations, organization rulesets, runner groups, Copilot exclusions |
| **Repository** | One repo | Rulesets (when allowed), CODEOWNERS, environments, secrets, repo-specific Copilot exclusions |

Enterprise policies cascade down; an enforced enterprise policy cannot be relaxed at the org or repo level.

**EMU at a glance — what changes vs. a standard enterprise**

| Topic | EMU behavior |
|---|---|
| Username | Always `{idp_username}_{enterprise_shortcode}` (for example, `octocat_acme`) |
| Authentication | SSO required for every action; OIDC supported **only with Microsoft Entra ID**; Okta and PingFederate use **SAML 2.0 only** |
| Provisioning | SCIM is mandatory. Users and IdP groups flow from the IdP; manual invites are not used |
| Public repositories | Cannot be created from EMU accounts |
| User-namespace repositories | Disabled by default. If enabled by enterprise policy, they are **private only** and collaboration is restricted to enterprise members |
| External collaboration | Outside collaborators are blocked by default (controlled by enterprise policy) |
| PATs | Classic PATs governed by enterprise policy; fine-grained PATs can require approval |
| 2FA | Inherited from the IdP; the enterprise "Require 2FA" policy does **not** apply to EMU because authentication happens upstream |
| GitHub-hosted runners | **Not available for repositories owned by managed user accounts**; only org-owned repos can use them |
| Copilot | EMU users cannot subscribe to Copilot Pro or Free — only Copilot Business or Enterprise, assigned by the enterprise |
| Codespaces | Available for organization repositories only |
| Gists, Sponsors, Certifications | Not available to EMU accounts |

**Recommended starting organization shape**

| Org | Purpose | Base permission | Default visibility |
|---|---|---|---|
| `company-green` (~90% of repos) | Standard development, innersource | None | Internal (or Private — confirm in Phase 0) |
| `company-red` | Confidential / regulated code | None | Private |
| `company-sandbox` | Proofs of concept, experiments | None | Internal (or Private) |
| `company-archive` | Retired or historical repos | None | Internal (or Private) |

Naming is effectively immutable: a rename cascades to Copilot, SSO endpoints, automation, and every internal/external link — plan the names you can live with for years.

### Decision moment (8 min)

> **How many organizations will you run, and what is each one for?**
> Discuss the trade-off with your team: more organizations improve blast-radius control and policy scoping, but they add administrative overhead and make cross-team collaboration harder. The Red / Green / Sandbox / Archive model is a defensible default; choose a different structure only if you have a clear reason.

### Reference reading

- [Enterprise Hierarchy](./01-enterprise-hierarchy.md)
- [Organization Strategies](./02-organization-strategies.md)
- [Enterprise Managed Users (EMU)](./04-enterprise-managed-users.md) — Limitations and Configuration Best Practices
- [Impact of Renaming a GitHub Organization](./18-github-rename-org-impact.md)
- [Adoption Plan](./21-github-enterprise-adoption-plan.md) — §0.2 (EMU constraints), §0.3 (Org structure), §2.1 (Create organizations)

---

## 4. Module 2 — EMU Identity, Access & Teams (25 min)

**Maps to:** Adoption Plan Phase 1 (Enterprise Configuration & Identity Validation) and Phase 3 (Teams, Permissions & Access Model).

### Learning objectives

By the end of this module, you will be able to:

1. **Choose** the right protocol and IdP combination for your EMU enterprise.
2. **Validate** that break-glass access via the setup user works *before* enforcing SSO.
3. **Design** a team hierarchy (maximum 3–4 levels) synced from IdP groups, with explicit team maintainers for business continuity.
4. **Map** ADO security constructs to GitHub teams and CODEOWNERS.

### Key concepts (15 min)

**IdP protocol support for EMU**

| Identity provider | SAML 2.0 | OIDC | SCIM 2.0 | Notes |
|---|:---:|:---:|:---:|---|
| Microsoft Entra ID (Azure AD) | ✅ | ✅ | ✅ | Recommended; only IdP that supports OIDC for EMU |
| Okta | ✅ | ❌ | ✅ | SAML-only for EMU |
| PingFederate | ✅ | ❌ | ✅ | SAML-only for EMU |
| Other IdPs | ✅ | ❌ | ✅ (via REST API) | SAML 2.0 required |

You cannot mix protocols — choose one and standardize.

**The setup user is your only break-glass.** Each EMU enterprise is bootstrapped with a setup user (`{shortcode}_admin`). Credentials must be stored in a secure secret vault, accessible to at least two named owners, and tested at least quarterly. If the IdP fails or is misconfigured, the setup user is the only path back in.

**SCIM provisioning is the migration gate.** Any ADO committer who is not SCIM-provisioned at migration time becomes a mannequin whose contribution history cannot be reattributed afterwards — that attribution is permanently lost. Validate the SCIM coverage of pilot repositories before Phase 8 of the adoption plan.

**Network and access boundaries**

- Configure the enterprise **IP allow list** with corporate VPN, office, and cloud egress ranges; add GitHub-hosted runner ranges if you plan to use them.
- Configure **SSO auto-redirect** so unauthenticated users land on the IdP sign-in instead of a 404.
- Conditional Access policies on Entra ID (if applicable) apply to GitHub sign-ins automatically.

**Teams are the unit of access — never grant repository permissions to individuals.**

- Maximum three to four levels of nested teams. Child teams inherit parent team membership and permissions (not the other way around).
- Sync each team to an IdP group; synced teams cannot be managed manually inside GitHub.
- Assign **at least three team maintainers per team** for business continuity, and prefer **Visible** team type by default (use **Secret** only for security or incident-response teams; secret child teams cannot live under visible parents).

**Repository permission levels (least → most)**

| Level | Can do |
|---|---|
| **Read** | Clone, view, comment, open issues |
| **Triage** | + Manage issues and pull requests, apply labels |
| **Write** | + Push, merge PRs, manage releases, run workflows |
| **Maintain** | + Manage repo settings (no danger zone), webhooks, deploy keys, branch protection, Pages, Actions secrets and variables |
| **Admin** | + Delete repo, change visibility, transfer, manage security and analysis |

For narrower scopes, create **custom repository roles** (for example, Release Engineer, Security Reviewer) rather than handing out Admin.

**ADO → GitHub mapping cheat sheet**

| ADO concept | GitHub equivalent |
|---|---|
| ADO Organization | GitHub Organization |
| ADO Team Project | **Team** (not a separate org) |
| ADO Security Group | GitHub Team (synced from IdP) |
| Area Path | Parent Team |
| Feature Squad | Child Team |
| ADO Branch Policy | Organization or repository ruleset |
| ADO Code Owners | `CODEOWNERS` file + required-review rule |

**CODEOWNERS essentials**

- Stored at `/CODEOWNERS`, `/.github/CODEOWNERS`, or `/docs/CODEOWNERS`.
- More specific patterns override less specific ones; the **last** matching pattern wins for a given file.
- Pair with the "Require review from Code Owners" rule on the default branch for automatic enforcement.
- Use child teams in CODEOWNERS for precise ownership scopes (avoid making the whole engineering org responsible for everything).

### Decision moment (8 min)

> **What is your team hierarchy, and which IdP groups feed it?**
> Sketch the parent/child team tree using one real example from your organization. Validate that every leaf team has at least three maintainers and a matching IdP group, and that no team has more than four levels of nesting.

### Reference reading

- [Identity and Access Management](./03-identity-access-management.md)
- [Enterprise Managed Users (EMU)](./04-enterprise-managed-users.md) — Supported Identity Providers, IdP Group Mapping Strategy
- [Teams and Permissions](./05-teams-permissions.md) — Nested Teams, CODEOWNERS Best Practices
- [Adoption Plan](./21-github-enterprise-adoption-plan.md) — §1.1–1.5 (Identity validation), §3.1–3.4 (Teams)

---

## ☕ Break — 10 min

---

## 5. Module 3 — Policies, Inheritance & Repository Governance (25 min)

**Maps to:** Adoption Plan Phase 2 (Enterprise/Org policies) and Phase 5 (Rulesets, templates, custom properties).

### Learning objectives

By the end of this module, you will be able to:

1. **Explain** how policy inheritance flows from enterprise → organization → repository.
2. **Configure** the non-negotiable enterprise policies for an EMU enterprise.
3. **Design** organization-level rulesets for default branch protection, push rules, and code-scanning gates that replace ADO branch policies.
4. **Use** repository templates and custom properties to make governance scale.

### Key concepts (15 min)

**Inheritance rule of thumb.** If a setting is "Enforced" at the enterprise level, lower levels cannot relax it. If it is "Allow" or "No policy", organizations and repositories can tighten further but not loosen.

**Day-1 enterprise policies (EMU baseline)**

| Policy | Recommended setting | Notes |
|---|---|---|
| Base repository permissions | **No permission** | Least privilege; teams grant explicit access |
| Repository creation | **Organization Owners only** | Or via an automated request workflow |
| Public repository creation | **Disabled** | EMU blocks this anyway; explicit policy is documentation |
| Repository visibility changes | **Restrict to Organization Owners** | Prevents accidental exposure |
| Repository deletion / transfer | **Restrict to Organization Owners** | Prevents accidental data loss |
| Forking private/internal repos | **Restrict to same organization** | EMU also blocks forking to user namespaces |
| Default branch name | **Enforce `main`** | Consistency across the enterprise |
| Outside collaborators | **Restrict to Org Owners** (or disable) | Document an approval workflow |
| **Block user-namespace repos (EMU)** | **Enable** | Prevents user-owned repos on EMU |
| Deploy keys | **Restrict** | Prefer GitHub Apps |
| Issue deletion | **Restrict to Organization Owners** | Preserves history |
| IP allow list | **Enable** | Include corporate VPN + runner ranges |
| Audit log streaming | **Enable from day 1** | Retention is ~180 days for events, ~7 days for Git events; stream to SIEM |
| 2FA enforcement | **N/A on EMU** | Handled by the IdP upstream |
| Verified domains | **Configure** | Restrict notification domains |

**PAT policy (EMU)**

| Policy | Recommended setting |
|---|---|
| Fine-grained PAT access | Allow with approval |
| Classic PAT access | Restrict or block (note: GEI still requires a classic PAT for migration) |
| Fine-grained PAT approval | Require Organization Owner approval |
| Maximum lifetime | 90–365 days (default for fine-grained: 366 days; classic PATs have no default expiration) |

**Rulesets supersede legacy branch protection.** Rulesets stack across layers, can target by repository property, and have explicit bypass actors with full audit trail.

**Default-branch ruleset starter (apply organization-wide)**

| Rule | Setting |
|---|---|
| Require pull request | Enabled |
| Required approvals | ≥ 1 (≥ 2 for production-tier repos) |
| Dismiss stale reviews | Enabled |
| Require review from CODEOWNERS | Enabled |
| Require conversation resolution | Enabled |
| Block force pushes | Enabled |
| Block branch deletion | Enabled |
| Require up-to-date branches | Enabled |
| Required status checks | CI + security scans |
| Bypass actors | Release automation + a named break-glass admin group only |

**Push and tag rulesets to consider:** restrict file paths (`/.github/`, `CODEOWNERS`, security configs), restrict file extensions (`.exe`, `.dll`), cap file size (50 MiB), and protect release tags (`v*`, `release-*`) to the release group.

**Templates carry policy by example.** Every new repository should start from a template with `README`, `LICENSE`, `.gitignore`, `CODEOWNERS`, `SECURITY.md`, `CONTRIBUTING.md`, PR + issue templates, Dependabot config, and a reusable CI workflow.

**Custom properties drive targeted rulesets.** Define properties early — for example, `security-tier` (`tier-1-critical`, `tier-2-important`, `tier-3-standard`), `compliance` (`pci`, `hipaa`, `sox`, `gdpr`, `none`), and `production-status` (`production`, `staging`, `development`, `archive`). Targeted rulesets apply stricter rules only where needed. (The Adoption Plan §5.3 uses the same property names — keep them aligned to avoid duplicate definitions.)

### Decision moment (5 min)

> **Which two organization-level rulesets are non-negotiable for your environment, and who is the single break-glass bypass group?**
> Keep bypass actors minimal — typically release automation and one named break-glass admin group. Every bypass is auditable, which preserves accountability.

### Reference reading

- [Policy Inheritance](./06-policy-inheritance.md)
- [Repository Governance](./07-repository-governance.md)
- [Security-by-Default Policies](./11-security-by-default-policies.md)
- [Adoption Plan](./21-github-enterprise-adoption-plan.md) — §2.2–2.4 (policies), §5.1–5.3 (rulesets and templates)

---

## 6. Module 4 — Security-by-Default & GitHub Advanced Security (30 min)

**Maps to:** Adoption Plan Phase 4 (Security-by-Default & GHAS) and Phase 7 (Global Security Review).

### Learning objectives

By the end of this module, you will be able to:

1. **Distinguish** the two GHAS SKUs and what each one buys you.
2. **Build** an organization security configuration and apply it organization-wide so every new repository is secure by default.
3. **Sequence** a GHAS rollout in stages without overwhelming triage.
4. **Reconcile** an ADO Advanced Security alert baseline against the first GHAS scan.
5. **Stream** audit logs to a SIEM from day 1 and define alerting on privilege and policy changes.

### Key concepts (20 min)

**GHAS is now two separately licensed SKUs**

| SKU | What's included | Billing unit |
|---|---|---|
| **GitHub Secret Protection** | Secret scanning, push protection, AI detection for secrets, non-provider patterns, custom patterns | Per active committer / month |
| **GitHub Code Security** | CodeQL code scanning, dependency review, premium Dependabot features (e.g., custom auto-triage), Copilot Autofix for security, security overview enhancements | Per active committer / month |

> 💡 Dependency graph, Dependabot alerts, and Dependabot security updates are **free** for all repositories regardless of GHAS — they are not part of the paid Code Security SKU.

Budget and enable each independently. Repository administrators only gain access if the enterprise policy allows GHAS for their organization; organization owners and security managers can always enable security features.

**Security configurations are the unit of scale.** Build a default organization security configuration that turns on dependency graph, Dependabot alerts and security updates, secret scanning, push protection (with restricted bypass), CodeQL default setup, and non-provider pattern detection. Apply it to all repositories org-wide, and create a stricter custom configuration for `security-tier=tier-1-critical` repos.

**Push protection prevents secrets from ever reaching the remote.** Bypass should be restricted to a small Security-team workflow with documented approval and audit trail. Configure custom patterns for internal tokens and connection strings, and enable non-provider pattern detection for SSH keys, PGP keys, and database connection strings.

**Recommended staged rollout**

1. Enable dependency graph and Dependabot alerts (low risk, high value).
2. Pilot secret scanning and push protection on 2–3 sandbox repos (estimate the **historical alert flood** before going wide).
3. Enable CodeQL default setup on pilot repos — shadow-run alongside ADO Advanced Security for ~2 weeks to validate coverage parity.
4. Expand organization-wide; switch to CodeQL advanced setup only for repos with custom builds.
5. Add rulesets that require security checks to pass before merge (block on Critical/High).
6. Retire ADO Advanced Security per repository/wave after parity sign-off.

**ADO Advanced Security alert state does NOT migrate.** Export the open / dismissed / fixed baseline (with rationale) before migration. After the first GHAS scan, reconcile manually and carry forward known-false-positive dismissals. Plan triage capacity — secret-scanning backfill can generate hundreds of alerts per repo.

**Copilot Autofix** for code-scanning findings can materially shorten remediation time, but it still produces a pull request that requires CODEOWNERS approval — it is a suggestion, not a merge bypass.

**Audit log retention is finite**

| Event type | Default retention in GitHub | Mitigation |
|---|---|---|
| Most enterprise audit events | ~180 days | Stream to SIEM from day 1 |
| Git events (push, clone) | ~7 days | Stream to SIEM from day 1 |

Configure alerting on privilege changes (Enterprise Owner / Organization Owner changes), policy changes (ruleset bypass, GHAS toggles), and suspicious activity (PAT creation, SSO disable). Enable source-IP display in the audit log for forensics.

**Optional but recommended: SSH Certificate Authority.** Issuing short-lived SSH certificates from an enterprise CA replaces user-managed SSH keys for repository access.

### Decision moment (5 min)

> **Who owns triage for the secret-scanning backfill, and where do alerts go?**
> Agree on a routing target (a dedicated channel, not individual email), an SLA per severity, and which alert classes may be auto-closed (for example, documented mock secrets in test fixtures).

### Reference reading

- [Security and Compliance](./08-security-compliance.md)
- [Security-by-Default Policies](./11-security-by-default-policies.md) — Enterprise / Organization / Repository tables
- [GitHub Actions Security: Echo Command Injection](./17-github-actions-security-echo-command-injection.md) — Worked Actions hardening example
- [Adoption Plan](./21-github-enterprise-adoption-plan.md) — §1.5 (Audit logging), §4.1–4.4 (GHAS), §7.1 (Security review checklist)

---

## ☕ Break — 10 min

---

## 7. Module 5 — GitHub Actions & GitHub Copilot Governance on EMU (25 min)

**Maps to:** Adoption Plan Phase 6 (Actions, Copilot & Developer Tooling).

### Learning objectives

By the end of this module, you will be able to:

1. **Configure** enterprise-level Actions policies and decide a runner strategy that works under EMU constraints.
2. **Build** reusable workflows and environments with required reviewers and deployment-branch policies.
3. **Apply** EMU-aware Copilot governance — licensing, policies, content exclusions, and network requirements.

### Key concepts (15 min)

> ⚙️ **What EMU changes here:** GitHub-hosted runners are **not available for user-namespace repositories** (only org-owned repos). EMU users **cannot subscribe to Copilot Pro or Free** — they must be assigned a Copilot Business or Copilot Enterprise seat. The Copilot **cloud agent** depends on GitHub-hosted runners, so it cannot run from user-namespace repositories.

**Day-1 Actions policies**

| Policy | Recommended setting | Notes |
|---|---|---|
| Actions availability | Enable for all orgs | Cascade controls follow |
| Allowed actions | Restrict to Enterprise + GitHub-authored + explicit allow-list | Do **not** rely on "verified creators" alone |
| Require Actions SHA pinning | **Enforce** (native enterprise policy) | Requires full-length commit SHA for all actions. Optionally augment with a CI lint (`zizmor`, StepSecurity Harden-Runner) to catch drift in PRs |
| Default workflow permissions | **Read-only** | Enterprises created on or after 2 Feb 2023 default to read-only; older enterprises may default to read-write |
| Allow Actions to create or approve PRs | Disable | Unless you have a controlled bot identity |
| Fork PR workflows | Require approval for **all outside collaborators** | `pull_request_target` always runs regardless |
| Repository-level self-hosted runners | Disable | Force runners to org or enterprise level |

**Runner strategy on EMU**

| Option | When to use | EMU note |
|---|---|---|
| GitHub-hosted | Standard CI workloads | **Not available on user-namespace repositories** — only org-owned repos |
| Larger GitHub-hosted | CPU/RAM-heavy builds | Same restriction as standard |
| Self-hosted (ephemeral) | Network access, legacy tools, compliance | Manage at org or enterprise level; never repo-scoped where avoidable |

Estimate monthly minutes using `gh actions-importer forecast` before configuring spending limits.

**Reusable workflows and environments**

- Publish a reusable CI workflow (build + test) and a reusable security-scan workflow (CodeQL + dependency review) from a central repo.
- Create environments `development`, `staging`, `production` with required reviewers and deployment-branch policies on `production`.
- For cloud deployments, prefer **OIDC workload-identity federation** to long-lived cloud secrets.

**Copilot on EMU — licensing reality**

- EMU users **cannot** subscribe to Copilot Pro or Copilot Free; they must be assigned a **Copilot Business** or **Copilot Enterprise** seat by the enterprise.
- The Copilot **cloud agent** requires GitHub-hosted runners, so it is not usable from user-namespace repositories on EMU; evaluate carefully before enabling at the enterprise level.

**Security-by-default Copilot policy set**

| Policy | Setting | Rationale |
|---|---|---|
| Copilot in IDE | Enabled | Core productivity |
| Copilot Chat (IDE + GitHub.com) | Enabled | Context-aware assistance |
| Copilot CLI | Enabled | Command-line workflows |
| Copilot code review *(workshop recommendation; evaluate before enabling)* | Optional | Improves code quality, but adds latency on PRs and incurs usage |
| Suggestions matching public code | **Blocked** | Reduces IP / licensing risk |
| Prompt and suggestion collection | **Blocked** | Data privacy — code not retained |
| Preview features | Disabled | Avoid in production |
| MCP servers (Model Context Protocol — external integration surface) | Disabled | External integrations require security review |
| Copilot cloud agent | Disabled / No Policy | Allows autonomous changes — requires careful evaluation |

**Recommended content exclusion patterns** (apply at the organization level, layer on per repo)

| Pattern | What it protects |
|---|---|
| `**/secrets/**`, `**/.env*`, `**/credentials/**` | Credentials and environment files |
| `**/*.pem`, `**/*.key`, `**/*.pfx`, `**/*.p12` | Private keys and certificates |
| `**/config/production*` | Production configuration files |
| `**/database/migrations/sensitive/**` | Sensitive schema or seed data |

**Network configuration.** Add Copilot endpoints to your firewall and proxy allow-list, and configure SSL inspection exceptions if you use TLS interception.

### Decision moment (5 min)

> **What is your runner strategy, and what is your cost model?**
> Decide GitHub-hosted vs. self-hosted per workload class (knowing GitHub-hosted is unavailable for user-namespace repos under EMU), estimate monthly minutes using `gh actions-importer forecast`, assign a budget owner, and configure spending limits.

### Reference reading

- [GitHub Copilot Governance](./12-github-copilot-governance.md) — Security-by-Default Enterprise Policy Configuration, Content Exclusions
- [GitHub Actions Security: Echo Command Injection](./17-github-actions-security-echo-command-injection.md)
- Governed AI SDLC: [executive summary](./20-ai-sdlc-executive-summary.md) / [adoption plan](./20-governed-ai-sdlc-plan.md)
- [Adoption Plan](./21-github-enterprise-adoption-plan.md) — §6.1–6.4 (Actions, runners, Copilot)

---

## 8. Module 6 — Migration Readiness, Cutover & Pilot Decisioning (20 min)

**Maps to:** Adoption Plan Phase 8 (Migration Readiness & Azure Pipelines), Phase 9 (Go/No-Go), and Phase 10 (Pilot).

> **Note on scope.** Day-2 operations (chargeback, exception process, AI SDLC governance) are summarized in the wrap-up and have their own deep-dive references. This module focuses on the decisions and risks you must close out before pilot migration.

### Learning objectives

By the end of this module, you will be able to:

1. **Run** the GEI inventory and assessment workflow.
2. **Plan** mannequin reclamation (SCIM-only on EMU) and Git LFS migration (manual, not handled by GEI).
3. **Operate** the Azure Pipelines hybrid model during the transition.
4. **Execute** a Go/No-Go checklist and cutover runbook with a rollback / reverse-sync grace window.

### Key concepts (15 min)

> ⚙️ **What EMU changes here:** Mannequins (placeholder identities created for ADO committers) can only be reclaimed to **SCIM-provisioned** EMU users — there is no second chance after migration. The Azure Pipelines hybrid model requires a **GitHub App service connection installed by an Enterprise Owner**; PAT-based service connections do not work on EMU. GEI itself requires a **classic PAT** (fine-grained PATs are not supported).

**GEI scope at a glance**

| Migrated by GEI | NOT migrated by GEI |
|---|---|
| Git source code and full commit history | Azure Pipelines (Phase 2 — use `gh actions-importer`) |
| Pull requests with user history, attachments, and work-item links | Work items (Azure Boards) |
| Some branch policies | Artifacts, Test Plans, Releases, Dashboards |
| | Repository permissions (re-create via teams) |
| | Service hooks (re-create as webhooks / Apps / Actions) |
| | **Git LFS objects** (push as a follow-up) |
| | ADO Advanced Security alert state |

GEI supports **Azure DevOps Cloud only**, not Azure DevOps Server (migrate to ADO Cloud first). Fine-grained PATs are **not supported** by GEI — you must use a classic PAT (`repo`, `admin:org`, `workflow`).

**Platform and GEI limits to validate**

| Limit | Value |
|---|---|
| Max single Git commit size | 2 GiB |
| Max file size post-migration | 100 MiB |
| Max Git repo size (GEI, public preview) | 40 GiB (source code only) |
| Max file size during migration | 400 MiB |

**TFVC repositories** are not supported by GEI — convert to Git (e.g., `git-tfs`) before migration.

**Mannequins on EMU — the hard rule.** A mannequin (placeholder identity) can be reclaimed only by a **SCIM-provisioned** EMU user. Practical implications:

- Build the ADO user → GitHub EMU user mapping before migration.
- Verify every pilot-repo committer is present in SCIM before cutover.
- Mannequin reclamation is a slow manual CSV workflow at scale — budget time.
- Unmapped users leave their historical contributions linked to a mannequin that cannot be reattributed after migration. The user account itself can be created later via SCIM; the historical attribution cannot be recovered.

**Git LFS — do it manually, immediately after GEI, before developer unfreeze**

```bash
git clone --mirror https://dev.azure.com/ORG/PROJECT/_git/REPO
cd REPO.git
git lfs fetch --all
git remote set-url origin https://github.com/ORG/REPO.git
git push --mirror
git lfs push --all origin
```

Broken LFS = broken builds.

**Azure Pipelines hybrid is the highest-risk surface**

| Impact area | What changes | Severity |
|---|---|---|
| Pipeline templates (`extends`, `template`) | Update `type: git` → `type: github`, add `endpoint` | 🔴 High |
| Repository resources | `name` format `Project/Repo` → `Org/Repo`; service connection required | 🔴 High |
| Service connections | Must use **GitHub App service connection** (PAT-based does not work on EMU; the App must be installed by an Enterprise Owner; create one per ADO org) | 🔴 High |
| `resources.repositories` triggers | **Do not work for GitHub repos** — implement webhooks or Actions-based triggers (`resources.pipelines` triggers are unaffected) | 🔴 High |
| CI / PR triggers | Generally continue to work; validate names, branch and path filters per repo | 🟡 Medium |
| Status-check names | Check names may change when source changes; re-bind PR gates | 🟡 Medium |
| Variable groups, secrets, artifact publishing | No change | 🟢 Low |

Central template repositories must be updated **atomically** with every pipeline that references them — you cannot migrate them incrementally.

**Cutover discipline (per batch)**

1. Freeze the source repos in ADO.
2. Temporarily bypass org rulesets (add "Repository migrations" bypass).
3. `gh ado2gh migrate-repo` → `gh ado2gh wait-for-migration`.
4. Reclaim mannequins.
5. **Migrate Git LFS objects.**
6. Apply template settings (CODEOWNERS, Dependabot, workflows).
7. Verify GHAS activates on the migrated repos.
8. Deploy the prepared Azure Pipeline YAML updates.
9. Rotate all credentials; revoke migration PATs.
10. Remove temporary allow-list entries and ruleset bypasses.
11. Notify developers with new repo URLs.

**Rollback strategy.** GEI does not provide an undo step. Mitigate with: a frozen source, a 24–48 hour commit grace window on the GitHub side, a documented reverse `git push` procedure during that window, and a defined ADO retention policy (recommended: keep ADO read-only for 30 days after validation before deleting anything).

### Decision moment (3 min)

> **What are your pilot-selection criteria?**
> Agree on the criteria for choosing 3–5 representative low-risk repositories (for example: low PR velocity, no LFS, no central-template dependencies, contained team). Selecting the actual repositories and pre-agreeing rollback triggers (pipeline-failure SLA, push-protection-blocking-hotfix, mannequin gaps) is a follow-up task immediately after the session.

### Reference reading

- [GitHub Onboarding Implementation Plan](./13-github-onboarding-implementation-plan.md)
- [GitHub Enterprise Importer (ADO) Guide](./14-github-enterprise-importer-ado-guide.md)
- [Azure Pipelines with GitHub Repos Integration](./15-azure-pipelines-github-repos-integration.md)
- [ADO → GitHub Migration Pain Points](./16-azure-devops-to-github-migration-analysis.md)
- [GitHub Chargeback System Design](./22-github-chargeback-system-design.md)
- [Adoption Plan](./21-github-enterprise-adoption-plan.md) — §8, §9, §10

---

## 9. Module 7 — Wrap-up: Common Pitfalls & Next Steps (5 min)

### Top pitfalls to keep in mind

1. **Starting migration before governance is approved.** Treat the Phase 7 review as a prerequisite, not a milestone. Phase 7 also includes **§7.2 documentation deliverables** (developer quick-start, branch strategy, PR best practices, security and Copilot usage guides) and **§7.3 training sessions** — schedule these before the pilot, not after.
2. **Incomplete SCIM coverage.** A single unprovisioned committer leaves historical contributions linked to a mannequin that cannot be reattributed after migration.
3. **Forgetting LFS and Azure Pipelines templates** until cutover day.
4. **Bypass actor sprawl.** Every bypass is a control gap; review them on a fixed cadence.
5. **Not streaming audit logs from day 1.** Historical events cannot be back-filled once they age out of GitHub (~180 days for most events, ~7 days for Git events).
6. **Renaming an organization later.** Cascading impact on Copilot, SSO, automation, and links — treat the name as effectively immutable.
7. **Assuming GitHub-hosted runners are available everywhere on EMU.** They are not available for user-namespace repositories — design Actions around organization-owned repos.
8. **Trying to use fine-grained PATs for GEI.** GEI requires a classic PAT; plan for it explicitly.
9. **Skipping the pilot.** Three to five real repositories teach more than ten weeks of planning.

### Recommended next steps

| When         | Action                                                                                 | Suggested output                                | Reference                                           |
|--------------|----------------------------------------------------------------------------------------|-------------------------------------------------|-----------------------------------------------------|
| Same day     | Bookmark the adoption plan and reference architecture.                                  | Shared reading list                              | [Adoption Plan](./21-github-enterprise-adoption-plan.md), [Reference Architecture](./10-reference-architecture.md) |
| Week 1       | Complete Phase 0 discovery (ADO inventory, organization-structure decision, EMU acknowledgments). | Discovery output document                       | [Adoption Plan §0](./21-github-enterprise-adoption-plan.md)  |
| Week 2       | Validate identity (SSO, SCIM, break-glass) and stream audit logs to a SIEM.             | Identity validation sign-off                     | [Identity and Access Management](./03-identity-access-management.md), [Adoption Plan §1](./21-github-enterprise-adoption-plan.md) |
| Weeks 3–6    | Roll out enterprise and organization policies, teams, security configuration, rulesets, and templates. | Governance baseline live                         | [Teams and Permissions](./05-teams-permissions.md), [Policy Inheritance](./06-policy-inheritance.md), [Repository Governance](./07-repository-governance.md), [Security-by-Default Policies](./11-security-by-default-policies.md) |
| Weeks 7–10   | Configure Actions and Copilot governance; complete the global security review.          | Phase 7 sign-off                                 | [GitHub Copilot Governance](./12-github-copilot-governance.md), [Adoption Plan §6–7](./21-github-enterprise-adoption-plan.md) |
| Weeks 11–14  | Run migration readiness, Go/No-Go, and pilot migration.                                 | Pilot migration report and lessons learned       | [GEI Guide](./14-github-enterprise-importer-ado-guide.md), [Azure Pipelines Integration](./15-azure-pipelines-github-repos-integration.md), [Adoption Plan §8–10](./21-github-enterprise-adoption-plan.md) |
| Day 2        | Stand up cost allocation (chargeback) and an exception-request process.                 | Chargeback model and exception workflow          | [GitHub Chargeback System Design](./22-github-chargeback-system-design.md)     |

### Hands-on labs (optional, after the workshop)

The [`labs/`](../labs/) folder contains short guided exercises that build foundational GitHub mechanics (webhooks, Actions settings, branch protection, repository templates, the REST and GraphQL APIs). They are useful skill-builders for individual contributors, but they were written before this workshop's EMU refocus and **do not directly reinforce the EMU-specific governance content** of Modules 1–6.

| Lab                                  | Topic                                              | Closest workshop touchpoint |
|--------------------------------------|----------------------------------------------------|------------------------------|
| [`lab01.md`](../labs/lab01.md)       | Repository webhooks and events                     | Module 4 (audit / event surface) |
| [`lab02.md`](../labs/lab02.md)       | Managing GitHub Actions settings for a repository  | Module 5                       |
| [`lab03.md`](../labs/lab03.md)       | Branch protection (legacy UI; see Module 3 for the modern Rulesets equivalent) | Module 3                       |
| [`lab04.md`](../labs/lab04.md)       | Issue and pull-request templates                   | Module 3 (repo templates)      |
| [`lab05.md`](../labs/lab05.md)       | GitHub REST and GraphQL APIs                       | Module 5 (automation)          |

> ⚠️ **EMU note for [`labs/setup.md`](../labs/setup.md):** Step 1 asks you to **fork** the reference repo into your personal namespace. EMU enterprises typically block forking into user namespaces. If you are on EMU, start with the *"Create a repository from this template"* step instead and use a sandbox organization.

---

## 10. Using this workshop with your team

Use this document as both a session script and a leave-behind:

- Spend the time on the **decision moments**. They are the part that produces durable artifacts.
- Before the session, tailor the examples — organization names, identity provider, ADO inventory numbers — to your environment.
- If you demonstrate live, work in a non-production sandbox organization and avoid production changes.
- Before you close the session, capture open questions, decisions, and owners in a shared follow-up list; route deeper technical questions to a follow-up office-hours session rather than stretching the clock.
- Leave with at least two artifacts: an updated copy of the [Go/No-Go checklist](./21-github-enterprise-adoption-plan.md#91-gono-go-checklist) marked with your current state, and a named owner for each open item.

---

## Appendix A — Full Reference Matrix

| Doc | Title                                                              | Primary module(s) |
|----:|--------------------------------------------------------------------|-------------------|
|  01 | [Enterprise Hierarchy](./01-enterprise-hierarchy.md)                | Module 1          |
|  02 | [Organization Design Patterns & Strategies](./02-organization-strategies.md) | Module 1          |
|  03 | [Identity and Access Management (IAM)](./03-identity-access-management.md) | Module 2          |
|  04 | [Enterprise Managed Users (EMU)](./04-enterprise-managed-users.md)  | Modules 1, 2      |
|  05 | [Teams and Permissions](./05-teams-permissions.md)                  | Module 2          |
|  06 | [Policy Enforcement and Inheritance](./06-policy-inheritance.md)    | Module 3          |
|  07 | [Repository Governance](./07-repository-governance.md)              | Module 3          |
|  08 | [Security and Compliance](./08-security-compliance.md)              | Module 4          |
|  09 | [Well-Architected Best Practices](./09-best-practices-waf.md)       | Module 0 (framing) |
|  10 | [Reference Architecture](./10-reference-architecture.md)            | Module 0 (framing) |
|  11 | [Security-by-Default Policies](./11-security-by-default-policies.md) | Modules 3, 4      |
|  12 | [GitHub Copilot Governance](./12-github-copilot-governance.md)      | Module 5          |
|  13 | [GitHub Onboarding Implementation Plan](./13-github-onboarding-implementation-plan.md) | Module 6          |
|  14 | [GitHub Enterprise Importer (ADO) Guide](./14-github-enterprise-importer-ado-guide.md) | Module 6          |
|  15 | [Azure Pipelines + GitHub Repos Integration](./15-azure-pipelines-github-repos-integration.md) | Module 6          |
|  16 | [ADO → GitHub Migration Pain Points](./16-azure-devops-to-github-migration-analysis.md) | Module 6          |
|  17 | [Actions Security: Echo Command Injection](./17-github-actions-security-echo-command-injection.md) | Modules 4, 5      |
|  18 | [Impact of Renaming a GitHub Organization](./18-github-rename-org-impact.md) | Module 1 (pitfalls) |
|  20 | Governed AI SDLC: [executive summary](./20-ai-sdlc-executive-summary.md) / [adoption plan](./20-governed-ai-sdlc-plan.md) | Module 5 (Copilot)  |
|  21 | [GitHub Enterprise Cloud Adoption Plan](./21-github-enterprise-adoption-plan.md) | **All modules — anchor document** |
|  22 | [GitHub Chargeback System Design](./22-github-chargeback-system-design.md) | Module 6 (day-2)    |

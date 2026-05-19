---
render_with_liquid: false
---

# Azure DevOps to GitHub Migration Assessment

> **Document status**
>
> - **Last reviewed:** 2026-05-19
> - **Authorship:** Drafted with AI assistance (GitHub Copilot, multi-model review) and reviewed by a human maintainer before publication.
> - **Sources:** Based on public documentation — primarily [docs.github.com](https://docs.github.com), [learn.microsoft.com](https://learn.microsoft.com), and official vendor blogs cited inline.
> - **Verify before acting:** GitHub and Microsoft update product documentation continuously. Re-confirm against the live source pages before relying on this content for production decisions.

> **Context:** Organization currently uses Azure DevOps for **Repos and Pipelines only** (no Boards, no Artifacts) and **JIRA** for project management.
>
> **Source Document:** Azure DevOps DevSecOps Assessment — Recommendations and Optimizations

## Comprehensive Analysis: ADO DevSecOps Recommendations Mapped to GitHub

---

## Table of Contents

- [1. R01–R71 Recommendations Mapped to GitHub](#1-r01r71-recommendations-mapped-to-github)
  - [1.1 Organization-Level Governance (R01–R21)](#11-organization-level-governance-r01r21)
  - [1.2 Project-Level Governance (R22–R34)](#12-project-level-governance-r22r34)
  - [1.3 Repository and Branching (R35–R49)](#13-repository-and-branching-r35r49)
  - [1.4 CI/CD Pipelines and Service Connections (R50–R63)](#14-cicd-pipelines-and-service-connections-r50r63)
  - [1.5 DevSecOps (R64–R71)](#15-devsecops-r64r71)
- [2. GitHub vs Azure DevOps Comparison Table](#2-github-vs-azure-devops-comparison-table)
  - [2.1 Feature-by-Feature Comparison (Present State)](#21-feature-by-feature-comparison-present-state)
  - [2.2 Strategic Innovation: GitHub-Exclusive Capabilities](#22-strategic-innovation-github-exclusive-capabilities)
  - [2.3 Roadmap and Investment Direction](#23-roadmap-and-investment-direction)
- [3. Impact Analysis: Staying on ADO vs Migrating to GitHub](#3-impact-analysis-staying-on-ado-vs-migrating-to-github)
  - [3.1 Risks of Staying on Azure DevOps](#31-risks-of-staying-on-azure-devops)
  - [3.2 Benefits and Costs of Migrating](#32-benefits-and-costs-of-migrating)
  - [3.3 JIRA Integration: GitHub vs ADO](#33-jira-integration-github-vs-ado)
- [4. Native AI and DevSecOps: GitHub vs ADO](#4-native-ai-and-devsecops-github-vs-ado)
  - [4.1 AI-Powered Development (Copilot)](#41-ai-powered-development-copilot)
  - [4.2 GitHub Secret Protection + GitHub Code Security vs GHAzDO and Third-Party Tools](#42-github-secret-protection--github-code-security-vs-ghazdo-and-third-party-tools)
- [5. All Advantages of Moving to GitHub](#5-all-advantages-of-moving-to-github)
- [6. References](#6-references)

---

## 1. R01–R71 Recommendations Mapped to GitHub

The following tables map each of the 71 recommendations from the ADO DevSecOps Assessment to their **GitHub equivalent**. For each recommendation:

- **ADO Recommendation** — The original assessment finding.
- **GitHub Equivalent** — How GitHub Enterprise Cloud (GHEC) addresses the same concern.
- **GitHub Feature / Mechanism** — The specific GitHub feature, setting, or tool.
- **Reference** — Official documentation link.

> **Key structural difference:** ADO uses a 3-tier hierarchy (Organization → Project → Repos). GitHub uses a different model: **Enterprise → Organization(s) → Repositories**. GitHub has no "Project" boundary between orgs and repos; instead, governance is enforced via **Organizations**, **Repository Rulesets**, **Teams**, and **Enterprise policies**.

---

### 1.1 Organization-Level Governance (R01–R21)

| # | ADO Recommendation | Priority | GitHub Equivalent | GitHub Feature / Mechanism | Reference |
|---|---|---|---|---|---|
| R01 | Review organization inventory linked to Entra tenant; restrict organization creation | P1 | Enterprise account provides a single governance boundary. Enterprise owners control org creation. With EMU, all accounts are provisioned/deprovisioned via SCIM from Entra ID. | Enterprise Managed Users (EMU) + SCIM provisioning from Entra ID | [EMU Docs](https://docs.github.com/en/enterprise-cloud@latest/admin/identity-and-access-management/understanding-iam-for-enterprises/about-enterprise-managed-users) |
| R02 | Disable Application connection policies (SSH, OAuth) if not used | P2 | Enterprise policies allow restricting personal access tokens (classic and fine-grained), SSH certificate authorities, and OAuth app policies at the enterprise or org level. Fine-grained PATs can be required, and classic PATs can be blocked. | Enterprise → Policies → Personal access tokens; SSH certificate authorities | [PAT Policies](https://docs.github.com/en/enterprise-cloud@latest/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-policies-for-personal-access-tokens-in-your-enterprise) |
| R03 | Disable external guest access policy | P1 | EMU enterprises prevent managed users from interacting outside the enterprise boundary. Managed users cannot collaborate on public repos, create public repos, or be invited to non-enterprise organizations. Outside collaborators can be restricted at the enterprise level. | EMU boundary restrictions + Enterprise policy: Restrict outside collaborators | [EMU Restrictions](https://docs.github.com/en/enterprise-cloud@latest/admin/identity-and-access-management/understanding-iam-for-enterprises/abilities-and-restrictions-of-managed-user-accounts) |
| R04 | Configure auditing to stream to Azure Monitor / Sentinel | P1 | GitHub Enterprise Cloud supports audit log streaming to Azure Blob Storage, Azure Event Hubs, Amazon S3, Google Cloud Storage, Splunk, and Datadog. Azure Event Hubs can feed into Azure Monitor and Microsoft Sentinel. The audit log captures 30+ event categories. | Audit log streaming to Azure Event Hubs → Azure Monitor / Sentinel | [Audit Log Streaming](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/streaming-the-audit-log-for-your-enterprise) |
| R05 | Avoid direct member assignment; use groups | P1 | With EMU, IdP groups from Entra ID are synchronized to GitHub Teams via SCIM. Permissions are assigned to Teams, not individual users. Team membership is managed entirely from Entra ID. | EMU + SCIM Team sync from Entra ID groups | [Team Sync with IdP](https://docs.github.com/en/enterprise-cloud@latest/admin/identity-and-access-management/provisioning-user-accounts-for-enterprise-managed-users/managing-team-memberships-with-identity-provider-groups) |
| R06 | Require JIT access for admin groups using Entra PIM | P1 | GitHub EMU with OIDC supports Entra ID Conditional Access Policies (CAP). Combined with Entra PIM, admin group membership can be JIT-activated by the admin, and CAP enforces the same conditions on GitHub access. Enterprise owner role can be scoped to IdP-synced teams. | EMU OIDC + Entra Conditional Access + Entra PIM | [EMU with OIDC CAP](https://docs.github.com/en/enterprise-cloud@latest/admin/identity-and-access-management/configuring-authentication-for-enterprise-managed-users/about-support-for-your-idps-conditional-access-policy) |
| R07 | Review custom group permissions for least privilege | P1 | GitHub provides predefined repository roles (Read, Triage, Write, Maintain, Admin) and supports **custom repository roles** at the organization level. Enterprise owners can also create custom roles with fine-grained permissions. | Custom repository roles at org level | [Custom Repository Roles](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-user-access-to-your-organizations-repositories/managing-repository-roles/managing-custom-repository-roles) |
| R08 | Pipeline Settings — review critical high-risk policies at org level | P1 | GitHub Actions policies are configurable at enterprise, org, and repo levels. Policies include: which actions are allowed (all, local only, selected), default workflow permissions (read-only vs read-write), whether actions can create/approve PRs, and fork PR policies. | Enterprise → Policies → Actions; Org → Settings → Actions | [Actions Policies](https://docs.github.com/en/enterprise-cloud@latest/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-policies-for-github-actions-in-your-enterprise) |
| R09 | Limit variables at queue time | P2 | GitHub Actions uses **Secrets** (encrypted, masked in logs) and **Variables** (plaintext configuration). Both are scoped to organization, repository, or environment level. Environment-scoped secrets require environment protection rules (approvals) before access. Manual workflow dispatch (`workflow_dispatch`) allows input parameters with defined types and options. | Actions Secrets + Variables + Environment scoping + `workflow_dispatch` inputs | [Encrypted Secrets](https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions) |
| R10 | Limit job auth scope to current project for non-release pipelines | P1 | GitHub Actions `GITHUB_TOKEN` is automatically scoped to the repository running the workflow. It **cannot** access other repositories by default. The default permission is read-only (configurable). This is more restrictive than ADO's default behavior. | `GITHUB_TOKEN` permissions — repository-scoped by default | [GITHUB_TOKEN Permissions](https://docs.github.com/en/actions/security-for-github-actions/security-guides/automatic-token-authentication) |
| R11 | Limit job auth scope to current project for release pipelines | P1 | Same as R10 — `GITHUB_TOKEN` is always repository-scoped. For cross-repo access, a GitHub App token or fine-grained PAT must be explicitly configured, providing full audit trail. | `GITHUB_TOKEN` scoping + GitHub Apps for cross-repo | [GITHUB_TOKEN](https://docs.github.com/en/actions/security-for-github-actions/security-guides/automatic-token-authentication) |
| R12 | Protect access to repos in YAML pipelines | P1 | `GITHUB_TOKEN` permissions can be restricted to read-only at organization level (`Settings → Actions → General → Workflow permissions`). Workflows must explicitly request elevated permissions via the `permissions:` key. | Organization-level default permissions + per-workflow `permissions:` block | [Workflow Permissions](https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/controlling-permissions-for-github_token) |
| R13 | Disable stage chooser | P2 | GitHub Actions does not have a "stage chooser" concept. Deployment stages are defined in workflow YAML and controlled by **environments** with protection rules. Users cannot skip or select stages at runtime unless explicitly coded. | Environments with protection rules enforce sequential stages | [Environments](https://docs.github.com/en/actions/managing-workflow-runs-and-deployments/managing-deployments/managing-environments-for-deployment) |
| R14 | Disable implied YAML CI trigger | P3 | GitHub Actions workflows have **no implied trigger**. Every workflow must explicitly define triggers via the `on:` key. If no `on:` is specified, the workflow never runs. This is fundamentally safer than ADO's implied CI trigger behavior. | Explicit `on:` trigger required — no implied behavior | [Workflow Triggers](https://docs.github.com/en/actions/writing-workflows/choosing-when-your-workflow-runs/events-that-trigger-workflows) |
| R15 | Disable creation of classic build / release pipelines | P1 | GitHub Actions has only one pipeline format: **YAML workflow files** stored in `.github/workflows/`. There is no GUI-based "classic" pipeline concept, eliminating this risk entirely. | Single format: YAML workflows only | [GitHub Actions Overview](https://docs.github.com/en/actions/about-github-actions/understanding-github-actions) |
| R16 | Enable shell tasks arguments validation | P3 | GitHub Actions `run:` steps execute shell commands. Security is addressed via: (1) using `${{ }}` expressions carefully to avoid injection, (2) always passing untrusted input via environment variables, not inline, (3) using step-level controls. GitHub provides security hardening guidance. | Actions security hardening + input sanitization patterns | [Security Hardening for Actions](https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions) |
| R17 | Disable auto-provisioning for agent pools in new projects | P1 | GitHub runner groups at enterprise/org level control which repositories can use which runners. By default, runners in a group are not available to all repositories — administrators must explicitly grant access. | Runner groups with repository access controls | [Runner Groups](https://docs.github.com/en/enterprise-cloud@latest/actions/hosting-your-own-runners/managing-self-hosted-runners/managing-access-to-self-hosted-runners-using-groups) |
| R18 | Minimize shared infrastructure across projects | P2 | Runner groups can be scoped to specific organizations and repositories within each organization. Runner labels and workflow targeting ensure workloads run on dedicated infrastructure. Reusable workflows can enforce runner selection. | Runner groups + runner labels + organization-scoped allocation | [Runner Groups](https://docs.github.com/en/enterprise-cloud@latest/actions/hosting-your-own-runners/managing-self-hosted-runners/managing-access-to-self-hosted-runners-using-groups) |
| R19 | Review inactive users | P1 | With EMU and SCIM provisioning, user deprovisioning is automated from Entra ID. When a user is disabled/removed in Entra ID, their GitHub EMU account is suspended. Enterprise audit log tracks last activity. The **dormant users** report shows users who have not been active. | EMU SCIM auto-deprovision + Dormant users report | [Dormant Users](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-accounts-and-repositories/managing-users-in-your-enterprise/managing-dormant-users) |
| R20 | Review installed extensions (user-installed vs org-installed) | P3 | GitHub Apps and OAuth Apps can be restricted at the organization level. An org can require admin approval before any GitHub App or OAuth App is installed. Enterprise policies can restrict app installations across all orgs. | Org settings → Third-party access → Require approval for apps | [App Installation Policy](https://docs.github.com/en/organizations/managing-oauth-access-to-your-organizations-data/about-oauth-app-access-restrictions) |
| R21 | Only allow admins to install extensions | P1 | Organization-level setting: **Third-party application access policy** can be set to require owner approval. Enterprise owners can enforce a policy that restricts GitHub/OAuth App installations enterprise-wide. | Enterprise policy → GitHub Apps + OAuth app restrictions | [App Policy](https://docs.github.com/en/organizations/managing-oauth-access-to-your-organizations-data/about-oauth-app-access-restrictions) |

---

### 1.2 Project-Level Governance (R22–R34)

> **Note:** GitHub does not have a "Project" construct equivalent to ADO Projects. GitHub Organizations serve as the primary boundary. Within an org, governance is applied via Teams, Rulesets, and repository-level settings. For ADO recommendations relating to Boards/Agile/Work Items: the organization uses **JIRA** for project management, so these translate to JIRA + GitHub integration patterns.

| # | ADO Recommendation | Priority | GitHub Equivalent | GitHub Feature / Mechanism | Reference |
|---|---|---|---|---|---|
| R22 | Unify Agile/Scrum process across projects | — | Not applicable (org uses JIRA). GitHub Projects can standardize templates across the org, but JIRA is the PM tool. In JIRA, standardize project schemes across all JIRA projects. | N/A — JIRA is the PM tool | — |
| R23 | Add process descriptions to projects | — | Not applicable (JIRA). In GitHub, repository descriptions and README files serve as project documentation. Org-level profile README provides organizational context. | Org profile README + Repo descriptions | [Org Profile](https://docs.github.com/en/organizations/collaborating-with-groups-in-organizations/customizing-your-organizations-profile) |
| R24 | Limit number of projects (avoid sprawl) | P1 | In GitHub, limit the number of organizations to what is necessary. Within each org, use topics/naming conventions for discoverability. Archive inactive repositories. Enterprise can restrict org creation. | Enterprise policy: restrict org creation + Archive repos | [Archive Repos](https://docs.github.com/en/repositories/archiving-a-github-repository/archiving-repositories) |
| R25 | Move test projects to a sandbox | P2 | Create a dedicated "sandbox" organization for experimentation. Enterprise policies ensure sandbox org has different security/governance rules. Repository visibility can be restricted. | Separate sandbox organization with distinct policies | [Multiple Orgs](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-accounts-and-repositories/managing-organizations-in-your-enterprise/adding-organizations-to-your-enterprise) |
| R26 | Review project descriptions | P3 | All repositories should have a description, topics, and a README.md. Organization-level README provides context. GitHub's search indexes descriptions and topics. | Repository descriptions + topics + README | [About READMEs](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes) |
| R27 | Review permissions per project | P1 | Permissions in GitHub are managed via Teams (mapped from Entra ID groups via SCIM). Each team has a role per repository (Read/Triage/Write/Maintain/Admin). Custom roles are available. Enterprise security overview shows permission distribution. | Teams + Custom repository roles + Security overview | [Repository Permissions](https://docs.github.com/en/organizations/managing-user-access-to-your-organizations-repositories/managing-repository-roles/repository-roles-for-an-organization) |
| R28 | Use teams for granular repo access | P1 | GitHub Teams are the primary mechanism for repository access. Teams can be nested (parent/child). With EMU, teams sync from Entra ID groups. Each team gets a role per repository. | Teams (IdP-synced) with repository role assignments | [Teams](https://docs.github.com/en/organizations/organizing-members-into-teams/about-teams) |
| R29 | Add team descriptions | P3 | GitHub Teams support descriptions, profile pictures, and visibility settings (visible or secret). Team discussions and team-level code review assignments are available. | Team settings: description, visibility | [Team Settings](https://docs.github.com/en/organizations/organizing-members-into-teams/about-teams) |
| R30 | Boards — include sub-areas only for parent teams | — | Not applicable (JIRA). In JIRA, configure project category hierarchies and permission schemes. GitHub Projects supports cross-repo views if needed as supplementary. | N/A — JIRA is the PM tool | — |
| R31 | Boards — use work item templates | — | Not applicable (JIRA). In GitHub, **Issue forms** and **Issue templates** provide structured templates. JIRA has its own issue type schemes and templates. | GitHub Issue Forms (if using GitHub Issues alongside JIRA) | [Issue Forms](https://docs.github.com/en/communities/using-templates-to-encourage-useful-contributions/syntax-for-issue-forms) |
| R32 | Boards — use Analytics views for Power BI | — | Not applicable (JIRA). JIRA provides its own analytics and reporting. GitHub provides Insights (Actions usage, traffic, dependency graphs). For advanced analytics, the GitHub API and GraphQL enable custom dashboards. | JIRA analytics + GitHub Insights API | — |
| R33 | Project-level pipeline policies enabled at org level | P1 | GitHub Actions policies cascade from Enterprise → Org → Repo. Organization-level policies override repository settings. Enterprise policies can enforce across all orgs: allowed actions, workflow permissions, fork PR handling, artifact/log retention. | Enterprise/Org-level Actions policies with inheritance | [Enterprise Actions Policies](https://docs.github.com/en/enterprise-cloud@latest/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-policies-for-github-actions-in-your-enterprise) |
| R34 | Review agent pools per project | P1 | Runner groups at enterprise and org level scope runners to specific repos/orgs. Each runner group has an explicit list of repos/orgs that can use it. Usage and billing reports show runner consumption. | Runner groups with repo/org access lists | [Runner Groups](https://docs.github.com/en/enterprise-cloud@latest/actions/hosting-your-own-runners/managing-self-hosted-runners/managing-access-to-self-hosted-runners-using-groups) |

---

### 1.3 Repository and Branching (R35–R49)

| # | ADO Recommendation | Priority | GitHub Equivalent | GitHub Feature / Mechanism | Reference |
|---|---|---|---|---|---|
| R35 | Protect production pipeline resources with permissions and approvals | P1 | GitHub Actions **Environments** provide deployment gates: required reviewers, wait timers, deployment branch restrictions, and custom protection rules (via API). Production environment can require 1–6 approvals before deployment proceeds. | Environments with protection rules (required reviewers, wait timers, branch restrictions) | [Environment Protection Rules](https://docs.github.com/en/actions/managing-workflow-runs-and-deployments/managing-deployments/managing-environments-for-deployment) |
| R36 | Convert to workload identity federation for service connections | P1 | GitHub Actions natively supports **OIDC (OpenID Connect)** for secretless authentication to Azure, AWS, and GCP. Short-lived tokens are issued per workflow run — no secrets stored. Federated credentials are scoped to specific repos, branches, or environments. | OIDC Workload Identity Federation via `azure/login@v2` | [OIDC for Actions](https://docs.github.com/en/actions/security-for-github-actions/security-hardening-your-deployments/about-security-hardening-with-openid-connect) |
| R37 | No shared service connections across projects | P1 | In GitHub, OIDC federated credentials in Entra ID app registrations are scoped per repository (via the `subject` claim filter). Environment-level secrets further restrict access. There is no concept of a "shared service connection" that can leak across repos. | OIDC subject claim scoping per repo + Environment secrets | [Configuring OIDC in Azure](https://docs.github.com/en/actions/security-for-github-actions/security-hardening-your-deployments/configuring-openid-connect-in-azure) |
| R38 | Enforce approvals for production service connections | P1 | Environment protection rules require designated reviewers to approve before a workflow job targeting that environment can proceed. This gates access to environment-scoped secrets (including OIDC configuration). | Environment required reviewers | [Required Reviewers](https://docs.github.com/en/actions/managing-workflow-runs-and-deployments/managing-deployments/managing-environments-for-deployment#required-reviewers) |
| R39 | Enable pipeline permissions; restrict to allowed YAML pipelines | P1 | In GitHub, workflows are defined only in `.github/workflows/` YAML files. Repository rulesets can require designated workflow checks to pass before merge, enforcing approved CI/CD paths on selected repositories. | Require workflows to pass before merging (ruleset rule) + required status checks | [Available Ruleset Rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets) |
| R40 | Review repo settings — case enforcement, commit author validation | P1 | Repository rulesets can enforce: commit message patterns, commit author email patterns (e.g., must match `@company.com`), branch naming conventions, and tag protections. EMU restricts commit authorship to the IdP identity. | Rulesets: commit metadata rules (email pattern, message pattern) | [Ruleset Rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets) |
| R41 | Branch policies on all repos (build validation required) | P1 | **Repository rulesets** at org or enterprise level enforce branch protection across all repos matching a pattern. Rules include: require status checks to pass, require PR before merge, require signed commits, block force pushes, block deletions. | Org-level rulesets targeting all repos and branches | [Rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets) |
| R42 | Review repo security permissions for least privilege | P1 | GitHub's role model (Read, Triage, Write, Maintain, Admin) plus custom repository roles enables granular least privilege. Base permissions can be set at the org level (e.g., "Read" for all members). CODEOWNERS enforces review requirements. | Org base permissions + Custom roles + CODEOWNERS | [Repository Roles](https://docs.github.com/en/organizations/managing-user-access-to-your-organizations-repositories/managing-repository-roles/repository-roles-for-an-organization) |
| R43 | Keep branch strategy simple (GitHub Flow, Release Flow, trunk-based) | P1 | GitHub Flow is the native default — develop on feature branches, merge to `main` via PRs. Merge queue supports high-frequency trunk-based development. Release branches and tags support release flow. GitHub's own documentation recommends GitHub Flow. | GitHub Flow (native) + Merge Queue for trunk-based dev | [GitHub Flow](https://docs.github.com/en/get-started/using-github/github-flow) |
| R44 | Branch name consistency | P3 | Repository rulesets can enforce **branch naming conventions** via regex patterns (e.g., `feature/*`, `bugfix/*`, `release/*`). This can be applied at org level across all repos. | Rulesets: branch name pattern rules | [Branch Rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets) |
| R45 | Protect important branches with branch policies | P1 | Repository rulesets protect branches with: require PR reviews, require status checks, block force push, block deletion, require linear history, require signed commits, lock branch. Applied at enterprise, org, or repo level. | Rulesets (enterprise/org/repo level) | [Rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets) |
| R46 | PR templates with Definition of Done (DoD) | P1 | GitHub supports **pull request templates** (`.github/pull_request_template.md`) with checklists, DoD items, and structured sections. Multiple templates can be offered. | Pull request templates with DoD checklists | [PR Templates](https://docs.github.com/en/communities/using-templates-to-encourage-useful-contributions/creating-a-pull-request-template-for-your-repository) |
| R47 | Code review from PRs with dedicated expert teams | P1 | **CODEOWNERS** file routes review requests to specific teams based on file paths. Rulesets enforce minimum reviewer count. Copilot code review provides AI-assisted review. Team review assignments distribute reviews. | CODEOWNERS + Rulesets (required reviewers) + Copilot Code Review | [CODEOWNERS](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners) |
| R48 | Enforce CI build validation | P1 | Rulesets enforce **required status checks** before merge. The status check must pass from a specified GitHub Actions workflow or external CI. Multiple checks can be required. | Rulesets: required status checks | [Required Status Checks](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets#require-status-checks-to-pass) |
| R49 | Disable repository forking | P1 | Enterprise/Org policy can **disable forking** for all repositories. This can be enforced at the enterprise level, preventing any org from overriding it. EMU accounts cannot fork repos outside the enterprise regardless. | Enterprise policy: Disable forking + EMU boundary | [Forking Policy](https://docs.github.com/en/enterprise-cloud@latest/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-repository-management-policies-in-your-enterprise#enforcing-a-policy-for-forking-private-or-internal-repositories) |

---

### 1.4 CI/CD Pipelines and Service Connections (R50–R63)

| # | ADO Recommendation | Priority | GitHub Equivalent | GitHub Feature / Mechanism | Reference |
|---|---|---|---|---|---|
| R50 | Define naming conventions | P1 | GitHub supports naming conventions via: org-level rulesets (repository naming patterns via regex), branch naming rules, and tag naming rules. Custom properties on repos enable categorization and filtering. | Rulesets: naming pattern enforcement + Custom repository properties | [Custom Properties](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-organization-settings/managing-custom-properties-for-repositories-in-your-organization) |
| R51 | Implement CI/CD strategy | P1 | GitHub Actions is the native CI/CD platform. Starter workflows provide language/framework-specific templates. Reusable workflows and composite actions enable standardization. Repository rulesets can require designated workflow checks to pass before merging for compliance. | GitHub Actions + Starter workflows + Reusable workflows + rulesets requiring workflows to pass | [Starter Workflows](https://docs.github.com/en/actions/writing-workflows/using-starter-workflows) |
| R52 | At least 2 pipelines (Non-Prod, Prod) with shared templates | P1 | GitHub Actions Environments (e.g., `staging`, `production`) with **reusable workflows** achieve the same pattern. A single workflow file can deploy to multiple environments sequentially, each with its own protection rules. Reusable workflows serve as shared templates. | Environments + Reusable workflows as shared templates | [Reusable Workflows](https://docs.github.com/en/actions/sharing-automations/reusing-workflows) |
| R53 | Protect production pipelines | P1 | Production environment with protection rules: required reviewers (1–6 approvals), wait timer, deployment branch restrictions (only `main` can deploy to prod), and custom deployment protection rules via API. | Environment protection rules for production | [Deployment Protection](https://docs.github.com/en/actions/managing-workflow-runs-and-deployments/managing-deployments/managing-environments-for-deployment) |
| R54 | Protect pipeline resources with approvals/checks | P1 | Environment protection rules require approval before runner jobs proceed. OIDC credentials are scoped to environments. Rulesets require status checks before merge. Custom deployment protection rules enable external system approval (ServiceNow, JIRA, etc.). | Environment approvals + Custom deployment protection rules | [Custom Deployment Protection](https://docs.github.com/en/actions/managing-workflow-runs-and-deployments/managing-deployments/creating-custom-deployment-protection-rules) |
| R55 | Branch policies + service connection checks for main branch | P1 | Rulesets on `main` enforce PR reviews, status checks, and signed commits. Environment secrets for production are only accessible from workflows triggered on `main` (via deployment branch policy). | Rulesets on main + Environment deployment branch policies | [Deployment Branches](https://docs.github.com/en/actions/managing-workflow-runs-and-deployments/managing-deployments/managing-environments-for-deployment#deployment-branches-and-tags) |
| R56 | Required templates for service connection access | P1 | Repository rulesets can require workflows to pass before merging, and callers can be limited to approved reusable workflows to access environment secrets. | Require workflows to pass before merging (ruleset rule) + reusable workflow call enforcement | [Available Ruleset Rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets) |
| R57 | Restrict pipelines for service connections + approval | P1 | OIDC federated credentials filter by subject claims (repo, branch, environment). Only workflows matching the filter can obtain tokens. Environment approvals add a human gate. | OIDC subject claims + Environment required reviewers | [OIDC Subject Claims](https://docs.github.com/en/actions/security-for-github-actions/security-hardening-your-deployments/about-security-hardening-with-openid-connect#customizing-the-subject-claims) |
| R58 | Use workload identity federation; restrict SC to resource group | P1 | OIDC with Azure federated credentials. The Azure service principal can be scoped to specific resource groups via Azure RBAC. No secrets stored in GitHub. Short-lived tokens only. | OIDC + Azure RBAC scoping on service principal | [OIDC in Azure](https://docs.github.com/en/actions/security-for-github-actions/security-hardening-your-deployments/configuring-openid-connect-in-azure) |
| R59 | Don't over-share service connections | P1 | OIDC credentials are naturally scoped per repo/environment. Organization-level secrets can be restricted to selected repositories only. Environment secrets are scoped to the environment. | Org secret access policies + Environment-scoped secrets | [Org Secrets Access](https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions#creating-secrets-for-an-organization) |
| R60 | Scope service connections to resource groups only | P1 | The Azure service principal used with OIDC is scoped via Azure RBAC assignments. Best practice: assign Contributor or specific roles at the resource group level, not subscription level. | Azure RBAC on the federated service principal | [Azure RBAC Best Practice](https://learn.microsoft.com/en-us/azure/role-based-access-control/best-practices) |
| R61 | Naming convention for service connections | P2 | GitHub uses environment names, secret names, and OIDC audience identifiers. Naming conventions for environments (e.g., `production-eastus`, `staging-centralus`) and secrets provide the same organizational benefit. | Environment and secret naming conventions | [Environments](https://docs.github.com/en/actions/managing-workflow-runs-and-deployments/managing-deployments/managing-environments-for-deployment) |
| R62 | Link secrets from Azure Key Vault; use variable groups | P1 | GitHub Actions can retrieve secrets from Azure Key Vault at runtime using the `azure/get-keyvault-secrets` action with OIDC authentication. This avoids storing secrets in GitHub. Organization-level secrets serve as the equivalent of variable groups. | `azure/get-keyvault-secrets` action + OIDC + Org secrets | [Key Vault Secrets Action](https://github.com/Azure/get-keyvault-secrets) |
| R63 | Reusable CI/CD YAML templates library | P1 | **Reusable workflows** stored in a central repository can be called by any workflow across the org. **Composite actions** encapsulate multi-step processes. Rulesets requiring workflows to pass before merging can enforce approved template-backed checks. A dedicated `.github` repo provides org-wide defaults. | Reusable workflows + Composite actions + rulesets requiring workflows to pass + `.github` org repo | [Reusable Workflows](https://docs.github.com/en/actions/sharing-automations/reusing-workflows) |

---

### 1.5 DevSecOps (R64–R71)

| # | ADO Recommendation | Priority | GitHub Equivalent | GitHub Feature / Mechanism | Reference |
|---|---|---|---|---|---|
| R64 | Dedicated DevSecOps team | P1 | GitHub supports security teams via: **Security managers** role at the org level (access to all security alerts without code access), **CODEOWNERS** for security-sensitive files, and **Security overview** dashboard for enterprise-wide visibility. | Security manager role + CODEOWNERS + Security overview | [Security Manager Role](https://docs.github.com/en/organizations/managing-peoples-access-to-your-organization-with-roles/managing-security-managers-in-your-organization) |
| R65 | Define DevSecOps strategy across all projects | P1 | GitHub **Security configurations** at enterprise/org level can push GitHub Secret Protection and GitHub Code Security settings to all repos. Code scanning default setup auto-enables CodeQL. Secret scanning and push protection can be enabled org-wide. Both products are available on GitHub Team and Enterprise Cloud. | Security configurations (enterprise/org level) | [Security Configurations](https://docs.github.com/en/enterprise-cloud@latest/code-security/securing-your-organization/introduction-to-securing-your-organization-at-scale/about-security-configurations) |
| R66 | Automated DevSecOps pipelines | P1 | **Code scanning default setup** automatically configures CodeQL analysis on every push and PR without any workflow configuration. Dependabot runs automatically. Secret scanning runs on every push. All findings appear directly in PRs. | Code scanning default setup + Dependabot + Secret scanning (all automatic) | [Code Scanning Default Setup](https://docs.github.com/en/code-security/code-scanning/enabling-code-scanning/configuring-default-setup-for-code-scanning) |
| R67 | Enforce DevSecOps controls; fail builds on critical issues | P1 | Code scanning can be configured to **block PR merges** when security alerts of specified severity are found. Rulesets can require code scanning results and block merges on critical/high findings. Dependabot security updates auto-create PRs for vulnerable dependencies. | Rulesets: require code scanning results + Severity-based merge blocking | [Code Scanning Merge Protection](https://docs.github.com/en/code-security/code-scanning/managing-your-code-scanning-configuration/set-code-scanning-merge-protection) |
| R68 | Secret Scanning, SCA, SAST, DAST tools | P1 | GitHub Secret Protection provides **secret scanning** with 200+ patterns, custom patterns, AI-powered generic detection, push protection, delegated bypass, and Copilot secret scanning. Dependabot **alerts, security updates, and version updates are free on all GitHub plans**. GitHub Code Security adds dependency review and custom auto-triage rules on top of free Dependabot capabilities; CodeQL and Copilot Autofix are also part of GitHub Code Security. DAST can be integrated via the Actions marketplace (OWASP ZAP, etc.). | GitHub Secret Protection + free Dependabot + GitHub Code Security + DAST via Actions | [Legacy GHAS overview](https://docs.github.com/en/get-started/learning-about-github/about-github-advanced-security) |
| R69 | Security culture across organization | P1 | GitHub fosters security culture via: **Security campaigns** (coordinate org-wide remediation), **Security overview** dashboards (trends, metrics), **Dependabot alerts** visible to all developers, **Copilot Autofix** (one-click security fixes), and **security advisories** for responsible disclosure. | Security campaigns + Security overview + Copilot Autofix + Security advisories | [Security Campaigns](https://docs.github.com/en/enterprise-cloud@latest/code-security/securing-your-organization/fixing-security-alerts-at-scale/about-security-campaigns) |
| R70 | Configure GitHub Advanced Security for ADO (GHAzDO) | P1 | **Migrate to GitHub Secret Protection and GitHub Code Security on GitHub directly.** The legacy bundled GHAS name still appears in older materials, but the current model splits secret protection from code security, and both products are available on GitHub Team and Enterprise Cloud. Together they are significantly more comprehensive than GHAzDO: Copilot Autofix, AI-powered secret detection, security campaigns, free Dependabot capabilities plus premium dependency review, push protection with delegated bypass, Security overview, and artifact attestations are **not available in GHAzDO.** | GitHub Secret Protection + GitHub Code Security (superset of GHAzDO) | [GitHub product split vs GHAzDO comparison below](#42-devsecops-github-secret-protection--github-code-security-vs-ghazdo-and-third-party-tools) |
| R71 | Microsoft Defender for Cloud for DevOps environments | P1 | Microsoft Defender for DevOps supports **GitHub natively** (alongside ADO). Connect GitHub organizations to Defender for Cloud for centralized security posture management, DevOps security findings, and compliance reporting. GitHub is a first-class citizen in Defender for DevOps. | Microsoft Defender for DevOps — GitHub connector | [Defender for DevOps + GitHub](https://learn.microsoft.com/en-us/azure/defender-for-cloud/quickstart-onboard-github) |

---

## 2. GitHub vs Azure DevOps Comparison Table

### 2.1 Feature-by-Feature Comparison (Present State)

| Capability | Azure DevOps | GitHub Enterprise Cloud | Advantage |
|---|---|---|---|
| **Source Control** | Azure Repos (Git + TFVC) | Git repositories | **Parity** — Both offer Git. GitHub has no TFVC (legacy, not needed). |
| **CI/CD** | Azure Pipelines (YAML + Classic) | GitHub Actions (YAML only) | **GitHub** — No legacy GUI pipelines to manage. 20,000+ marketplace actions vs smaller ADO extensions catalog. |
| **Pull Requests** | ADO Pull Requests | GitHub Pull Requests | **GitHub** — Draft PRs, merge queue, Copilot code review, suggested changes, auto-merge. |
| **Branch Protection** | Branch policies (repo-level only) | Repository Rulesets (enterprise/org/repo level, layered, importable) | **GitHub** — Rulesets offer hierarchical enforcement, regex targeting, and org/enterprise-wide application. ADO branch policies are repo-by-repo only. |
| **Code Review** | Manual review + optional policies | Manual review + **Copilot AI review** + CODEOWNERS | **GitHub** — AI-powered code review is exclusive to GitHub. |
| **Merge Queue** | Not available | Native Merge Queue | **GitHub** — Unique capability preventing broken main branches in high-throughput repos. |
| **Identity Management** | Entra ID (AAD) backing + group sync | EMU with SCIM + SAML/OIDC + Entra Conditional Access | **GitHub** — Full lifecycle management (SCIM). Conditional Access via OIDC. JIT admin via Entra PIM integration. |
| **Audit Logging** | Organization-level audit | Enterprise-level audit log + streaming (Azure Blob Storage, Azure Event Hubs, Amazon S3, Google Cloud Storage, Splunk, and Datadog) | **GitHub** — Enterprise-wide audit with streaming to SIEM. More granular event categories. |
| **Secret Management (CI/CD)** | Service connections (secret/certificate-based) | OIDC Workload Identity Federation (secretless) | **GitHub** — Secretless authentication eliminates rotation burden and secret exposure risk. |
| **SAST** | GHAzDO Code Scanning (CodeQL, limited) | GitHub Code Security code scanning (CodeQL, full + Copilot Autofix) | **GitHub** — Same CodeQL engine but with Copilot Autofix, security campaigns, default setup, and deeper integration. |
| **Secret Scanning** | GHAzDO Secret Scanning (basic) | GitHub Secret Protection secret scanning (200+ patterns + AI generic detection + push protection + delegated bypass) | **GitHub** — Significantly more comprehensive. AI-powered detection and push protection are exclusive. |
| **SCA (Dependency Scanning)** | GHAzDO Dependency Scanning (basic alerts only) | Free Dependabot alerts/security updates/version updates + GitHub Code Security dependency review, custom auto-triage, and SBOM | **GitHub** — Full lifecycle dependency management. GHAzDO has alerts only; no auto-remediation PRs. |
| **Push Protection** | GHAzDO Push Protection (basic) | GitHub Secret Protection push protection with delegated bypass and audit trail | **GitHub** — Delegated bypass workflow and richer audit capabilities. |
| **Security Dashboard** | GHAzDO security hub (project-scoped) | GitHub Code Security Security Overview (enterprise/org-wide, trends, insights) | **GitHub** — Enterprise-wide visibility with trend analysis. ADO is project-scoped only. |
| **AI Code Completion** | None | GitHub Copilot (IDE-integrated) | **GitHub exclusive** |
| **AI Coding Agent** | None | Copilot cloud agent, Claude, Codex (assign issues to AI) | **GitHub exclusive** |
| **AI Code Review** | None | Copilot code review in PRs | **GitHub exclusive** |
| **AI Security Fix** | None | Copilot Autofix for code scanning alerts | **GitHub exclusive** |
| **AI in CLI** | None | Copilot CLI (`gh copilot`) | **GitHub exclusive** |
| **Cloud Dev Environments** | None | GitHub Codespaces (full IDE in browser) | **GitHub exclusive** |
| **Mobile App** | Azure DevOps Mobile (limited, no longer updated) | GitHub Mobile (iOS/Android, full feature PR review, deploy approval) | **GitHub** — Actively maintained and feature-rich. |
| **Project Management** | Azure Boards (Work Items, Sprints, Backlogs) | GitHub Projects + GitHub Issues (or JIRA integration) | **ADO** — Azure Boards is more mature for complex project management. However, the org uses JIRA, making this irrelevant. |
| **Artifact Management** | Azure Artifacts (NuGet, npm, Maven, Python, Universal) | GitHub Packages (npm, Maven/Gradle, NuGet, Container registry [Docker/OCI], RubyGems; **no Python/PyPI support**) | **Parity** — Both offer package hosting. The org does not use ADO Artifacts. |
| **Wiki/Documentation** | Azure Wiki | GitHub Wiki + GitHub Pages + Markdown everywhere | **GitHub** — Pages provides free static hosting. Richer Markdown (Mermaid, math, footnotes). |
| **Community & Ecosystem** | Smaller community | 150M+ developers, 420M+ repos, largest OSS community | **GitHub** — Overwhelmingly larger community, ecosystem, and talent pool. |
| **API** | REST API | REST API + GraphQL API + GitHub CLI | **GitHub** — GraphQL for efficient queries. GitHub CLI for scriptable operations. |
| **JIRA Integration** | "Azure DevOps for Jira" (basic) | "GitHub for Atlassian" (comprehensive, 364K installs, free) | **GitHub** — Richer integration with JIRA (Smart Commits, deployments, builds, Rovo AI, automation triggers). |

---

### 2.2 Strategic Innovation: GitHub-Exclusive Capabilities

The following features exist **only on GitHub** and have **no Azure DevOps equivalent** (current or planned):

| Feature | Description | Impact |
|---|---|---|
| **Copilot Code Completion** | AI-powered code suggestions in IDE across all major editors | Productivity: 55%+ faster task completion (GitHub research) |
| **Copilot Cloud Agent** | Autonomous AI agent assigned to GitHub Issues — writes code, creates PRs, responds to reviews | Multiply team capacity — AI handles routine tasks |
| **Copilot Code Review** | AI-powered PR review identifying bugs, security issues, style violations | Faster, more consistent code review |
| **Copilot Autofix** | AI-generated fixes for code scanning security alerts — one-click apply | Drastically reduce MTTR for security vulnerabilities |
| **Copilot CLI** | Natural language shell commands via `gh copilot` | Developer experience improvement |
| **Copilot Spaces** | Shared team knowledge bases for consistent AI context (formerly Copilot Knowledge Bases) | Organizational knowledge capture |
| **Copilot Extensions / MCP** | Connect Copilot to organizational tools via Model Context Protocol | Custom AI-powered workflows |
| **Third-Party Coding Agents** | Claude (Anthropic), Codex (OpenAI) assignable directly from Issues | Multi-model AI development |
| **Merge Queue** | Automated merge sequencing ensuring main branch is never broken | CI reliability at scale |
| **Security Campaigns** | Coordinate org-wide security remediation across hundreds of repos | Security at scale |
| **GitHub Codespaces** | Cloud dev environments — productive in minutes | Onboarding acceleration, consistency |
| **Dependabot Auto-Fix PRs** | Automated PRs for vulnerable dependency updates | Automated supply chain security |
| **Artifact Attestations** | Cryptographic build provenance (SLSA compliance) | Supply chain integrity |
| **SBOM Generation** | SPDX-compatible Software Bill of Materials per repo | Regulatory compliance |
| **GitHub Discussions** | Threaded forum-style conversations per repo/org | Reduce noise in Issues |
| **GitHub Pages** | Free static site hosting from repositories | Documentation, team sites |
| **InnerSource (Internal Repos)** | Enterprise-wide repo discoverability with fork-and-contribute model | Internal collaboration at scale |
| **GitHub Mobile (Active)** | Full-featured mobile app for PR review, deploy approval | On-the-go development management |
| **Custom Deployment Protection Rules** | External approval gates (ServiceNow, JIRA, etc.) via API | Enterprise change management |
| **AI-Powered Generic Secret Detection** | Copilot-powered detection of non-pattern-based secrets | Catches secrets no regex pattern can find |
| **Push Protection Delegated Bypass** | Structured bypass workflow with audit trail for secret scanning | Compliance-friendly secret handling |

---

### 2.3 Roadmap and Investment Direction

| Signal | Azure DevOps | GitHub |
|---|---|---|
| **Feature release cadence** | Three-week sprint releases; feature scope narrower than GitHub | Weekly releases via GitHub Changelog; accelerating innovation |
| **AI investment** | Limited AI integration: MCP Server for Azure DevOps (2025 Q4), Copilot cloud agent for Azure Boards (2025 Q4). No Copilot platform integration for Repos or Pipelines. | Copilot is Microsoft's flagship AI product — billions invested; expanding monthly |
| **Public roadmap** | [Features Timeline](https://learn.microsoft.com/en-us/azure/devops/release-notes/features-timeline) — public roadmap with quarterly feature planning | [github.com/github/roadmap](https://github.com/github/roadmap) — public roadmap, community-engaged |
| **Microsoft internal usage** | Significant Microsoft teams continue to use ADO (e.g., Windows, Azure DevOps itself) | GitHub used internally by a large portion of Microsoft engineering |
| **Security innovation** | GHAzDO receives delayed, subset features from GitHub Secret Protection and GitHub Code Security | GitHub Secret Protection and GitHub Code Security receive innovations first; GHAzDO is always behind |
| **Marketplace growth** | Smaller extension marketplace with slower growth | 20,000+ Actions, growing weekly, supported by community + vendors |
| **Executive messaging** | Microsoft leadership refers customers to GitHub for new investments | GitHub positioned as "the world's developer platform" |
| **Conference investment** | No dedicated ADO conference | GitHub Universe (annual), GitHub Galaxy (regional) — significant marketing/product investment |
| **ADO's stated direction** | "Make it easier for customers to move their repositories to GitHub **while continuing to use Azure Boards, Pipelines, and Test Plans**" ([ADO roadmap](https://learn.microsoft.com/en-us/azure/devops/release-notes/features-timeline)) — focused on hybrid coexistence | GitHub positioned as the destination for full-platform consolidation |
| **Copilot integration** | Not planned | Deeply integrated and expanding (code completion, review, agents, CLI, security) |
| **GitHub security innovations** | GHAzDO is actively expanding: CodeQL default setup (2026 Q2), Dependabot security updates (Future), status check policies (2026 Q1). It remains a subset of GitHub Secret Protection and GitHub Code Security, so features arrive later. | Security innovations ship to GitHub Secret Protection and GitHub Code Security first; GHAzDO receives a delayed subset |

> **ADO roadmap context:** The ADO team's publicly stated direction includes *"make it easier for customers to move their repositories to GitHub while continuing to use Azure Boards, Pipelines, and Test Plans."* ([Source](https://learn.microsoft.com/en-us/azure/devops/release-notes/features-timeline)) This indicates Microsoft's strategy supports a hybrid model (GitHub Repos + ADO Boards/Pipelines) as well as full GitHub consolidation. The investment emphasis, however, favors GitHub for new platform-level capabilities (AI, security, developer experience).

---

## 3. Impact Analysis: Staying on ADO vs Migrating to GitHub

### 3.1 Risks of Staying on Azure DevOps

| Risk Category | Description | Severity |
|---|---|---|
| **Platform stagnation** | ADO receives incremental updates on a three-week sprint cadence, but the scope is narrower than GitHub. ADO has introduced some AI features (MCP Server, Copilot cloud agent for Boards) and GHAzDO is expanding — however, the pace and breadth of new capabilities (Copilot integration, security innovations, developer experience) remain significantly behind GitHub. | **High** |
| **Missing AI productivity** | No Copilot code review, Autofix, or cloud agent integration at the ADO platform level. ADO has MCP Server and Copilot cloud agent for Boards, but these do not address core development AI. Teams miss 55%+ productivity gains documented by GitHub research. | **High** |
| **Weaker security posture** | GHAzDO is a subset of GitHub Secret Protection and GitHub Code Security. Missing: Copilot Autofix, security campaigns, AI secret detection, premium Dependabot features, SBOM, artifact attestations, and delegated-bypass push protection. | **High** |
| **Talent challenges** | Developers prefer GitHub (150M+ users). ADO skills are niche. Recruiting and retention are harder with a less desirable toolchain. | **Medium** |
| **JIRA integration gap** | JIRA + ADO integration is less comprehensive than JIRA + GitHub. The "GitHub for Atlassian" app (364K installs) provides deeper features, AI integration (Rovo Dev), and more active development. | **Medium** |
| **Ecosystem limitations** | ADO marketplace is smaller with many unmaintained extensions. GitHub has 20,000+ Actions and first-party vendor support. | **Medium** |
| **Vendor lock-in risk** | ADO’s YAML pipeline syntax is proprietary. Migration cost increases with time. Classic pipelines are not receiving new features and Microsoft recommends migrating to YAML. | **Medium** |
| **InnerSource barriers** | ADO's project-based model is less suited for InnerSource. GitHub's fork, discover, contribute model is industry standard. | **Low-Medium** |
| **Mobile experience** | ADO mobile app receives limited updates. GitHub Mobile is actively maintained with full PR review and deploy approval. | **Low** |
| **Community isolation** | ADO has minimal community presence. Solutions, tutorials, and integrations primarily target GitHub. | **Medium** |

### 3.2 Benefits and Costs of Migrating

#### Migration Effort (Repos + Pipelines Only)

Since the organization uses **only Repos and Pipelines** (no Boards, no Artifacts), the migration surface is minimal:

| Component | Tool | Automation Level | Effort |
|---|---|---|---|
| **Repositories** | GitHub Enterprise Importer (GEI) | High — bulk migration of repos + history + PRs | Low |
| **Pipelines** | GitHub Actions Importer | ~80% automated conversion per pipeline | Medium |
| **Service Connections** | Manual → OIDC federation | Scripted with Azure CLI + GitHub config | Low-Medium |
| **JIRA Integration** | Install "GitHub for Atlassian" | Plugin install + Smart Commit convention | Low |
| **Branch Policies** | Configure Repository Rulesets | Org-level rulesets (one-time) | Low |
| **Team Training** | GitHub Skills + workshops | Standard change management | Medium |

#### Migration Tools Available

- **[GitHub Enterprise Importer (GEI)](https://docs.github.com/en/migrations/using-github-enterprise-importer):** Migrates source code, commit history, PRs, and metadata in bulk from ADO. Supports bulk migration of entire ADO organizations with migration logs and mannequin reclamation (mapping ADO users to GitHub accounts).
  - **Limitations:** Does not migrate ADO Boards, work items, or Artifacts. Does not migrate pipelines. GEI *does* migrate work item links on pull requests (preserving PR-to-work-item traceability). The 40 GiB repository size limit (currently in public preview) applies; repos above this limit require `git-sizer` assessment and remediation before migration.
- **[GitHub Actions Importer](https://docs.github.com/en/actions/tutorials/migrate-to-github-actions/automated-migrations/use-github-actions-importer):** Converts ADO YAML and Classic pipelines to GitHub Actions YAML. Achieves ~80% automated conversion. Key commands:
  - `audit` — Analyze your current ADO CI/CD footprint to plan migration timelines.
  - `forecast` — Forecast GitHub Actions usage from historical ADO pipeline utilization.
  - `dry-run` — Convert an ADO pipeline to GitHub Actions workflow YAML locally for review.
  - `migrate` — Convert and open a pull request with the converted workflow.
  - Supports **IssueOps** pattern for teams to self-service migrate pipelines via GitHub Issues.
  - Distributed as a GitHub CLI extension (`gh extension install github/gh-actions-importer`).
- **[GitHub Professional Services](https://services.github.com/):** Expert-led migration assistance.

#### Pipeline Migration: ADO YAML to GitHub Actions

| Aspect | Azure DevOps YAML | GitHub Actions |
|---|---|---|
| **Trigger syntax** | `trigger:`, `pr:` | `on: push`, `on: pull_request`, `on: merge_group` |
| **Job/Stage structure** | `stages:` → `jobs:` → `steps:` | `jobs:` → `steps:` (simpler, flatter) |
| **Reusable components** | Templates (`template:`) | Reusable workflows, composite actions |
| **Variables** | `variables:`, variable groups, pipeline variables | `env:`, secrets, variables, environment variables |
| **Service connections** | Service connections (certificate, secret-based) | OIDC/Workload Identity Federation (secretless) |
| **Hosted agents** | Microsoft-hosted agents | GitHub-hosted runners (including larger runners) |
| **Self-hosted** | Self-hosted agents, agent pools | Self-hosted runners, runner groups |
| **Marketplace** | Extensions marketplace | GitHub Marketplace (20,000+ actions) |
| **Matrix builds** | `strategy: matrix` | `strategy: matrix` (similar concept) |
| **Conditionals** | `condition:` | `if:` expressions |
| **Artifacts** | `PublishBuildArtifacts`, `DownloadBuildArtifacts` | `actions/upload-artifact`, `actions/download-artifact` |
| **Caching** | Cache task | `actions/cache` |
| **Environments** | Environments with approvals | Environments with protection rules, required reviewers, wait timers |

#### Timeline Estimate (Phased Approach)

| Phase | Duration | Activities |
|---|---|---|
| **Phase 1: Pilot** | 4–6 weeks | Migrate 2–3 teams (repos + pipelines), validate JIRA integration, establish rulesets, train champions |
| **Phase 2: Broad Migration** | 6–10 weeks | Migrate remaining repos/pipelines in waves, enable GitHub Secret Protection and GitHub Code Security org-wide, roll out Copilot |
| **Phase 3: Optimization** | Ongoing | Tune rulesets, enable advanced features (merge queue, Codespaces, security campaigns), deprecate ADO |

#### ROI Drivers Post-Migration

- **Copilot productivity gains** — 55%+ faster task completion (GitHub research, 2022), reduced context switching. In a Grupo Boticário internal survey, **94% of developers reported feeling more productive** with Copilot ([customer story](https://github.com/customer-stories/grupoboticario)).
- **Reduced security tool cost** — GitHub Secret Protection and GitHub Code Security reduce or replace third-party SAST/SCA/secrets tooling
- **Eliminated secret rotation** — OIDC removes service connection secret management
- **Faster vulnerability remediation** — Copilot Autofix and Dependabot auto-fix PRs
- **Reduced onboarding time** — Codespaces provides productive environments in minutes
- **Better JIRA integration** — Richer data flow, AI-powered insights via Rovo

#### Training and Adoption Considerations

| Area | Effort | Notes |
|---|---|---|
| **Git operations** | Minimal | Identical — ADO Repos and GitHub both use Git. |
| **PR workflow** | Low | GitHub PRs are similar but have enhanced features (draft PRs, merge queue, Copilot review). |
| **Branch policies → Rulesets** | Low-Medium | Concepts map well; GitHub Rulesets offer more flexibility. |
| **Pipeline syntax** | Medium | Main learning curve. ADO YAML → GitHub Actions YAML requires syntax education, but the ~80% auto-conversion by Actions Importer reduces effort. |
| **Security tools** | Low | GitHub Secret Protection and GitHub Code Security features are self-service and mostly auto-enabled. |
| **Admin / governance** | Medium | New concepts: Enterprise Managed Users, Rulesets, organization settings. |
| **JIRA integration** | Low | Plugin install + smart commit convention adoption. |

**Recommended training approach:**

1. Platform champions (2–3 per team) complete GitHub Skills learning paths.
2. Hands-on migration workshops for pipeline engineers.
3. Short "What's different" brown bag sessions for all developers.
4. Gradual rollout: pilot teams first, then broader waves.

#### Short-Term Disruption vs. Long-Term Gain

**Short-term (0–3 months):**

- Pipeline conversion and testing (partially automated via Actions Importer).
- Team training and familiarization.
- Service connection migration to OIDC.
- JIRA plugin reconfiguration (install GitHub for Atlassian, remove ADO connector).
- Temporary productivity dip during transition.

**Long-term (3+ months):**

- Access to all GitHub AI tools (Copilot, Copilot cloud agent, third-party coding agents, Autofix).
- Comprehensive security posture via GitHub Secret Protection and GitHub Code Security.
- Faster CI/CD with GitHub Actions marketplace ecosystem.
- Improved developer satisfaction and productivity.
- Better talent attraction and retention.
- Reduced operational burden (OIDC, Dependabot automation, Copilot Autofix).
- Future-proofed on Microsoft's primary developer platform.
- Unified JIRA + GitHub experience with better data flow.

### 3.3 JIRA Integration: GitHub vs ADO

Since the organization uses JIRA for project management, this comparison is critical:

| Capability | JIRA + GitHub | JIRA + Azure DevOps |
|---|---|---|
| **Official Integration** | "GitHub for Atlassian" (Atlassian-maintained, 364K+ installs, **free**) | "Azure DevOps for Jira" (Atlassian-maintained, smaller install base) |
| **Smart Commits** | Full support — transitions, comments, time logging | Limited support |
| **PR/Branch/Commit Linking** | Comprehensive — auto-links from branch names and commit messages | Basic linking |
| **Build/Deploy Status** | CI/CD results and deployment status synced to JIRA in real time | Basic build status |
| **Automation Triggers** | Rich GitHub event triggers in JIRA Automation (PR created, merged, deploy success, build fail) | Fewer ADO-specific triggers |
| **Vulnerability Data** | GitHub security findings flow to JIRA | Minimal security integration |
| **AI Integration** | Rovo Dev — AI code review against JIRA acceptance criteria | No equivalent |
| **Branch Creation from JIRA** | Supported — "Create branch" button pre-fills GitHub branch name | Supported |
| **Deployment Tracking** | Full pipeline visibility showing which environments contain a change | Limited |
| **Atlassian Investment** | Active development, Teamwork Graph integration | Maintenance level |

**Conclusion:** Migrating to GitHub **improves** the JIRA integration story, not degrades it.

#### Smart Commit Message Examples

Include the JIRA issue key in commit messages (e.g., `PROJ-123 fix login bug`). Smart Commits allow transition commands directly from commits:

- `PROJ-123 #done` — transitions the issue to Done.
- `PROJ-123 #comment Fixed the null pointer` — adds a comment to the issue.
- `PROJ-123 #time 2h` — logs work time against the issue.

Branches with JIRA issue keys (e.g., `feature/PROJ-123-login-fix`) automatically link to the corresponding JIRA issue. PRs from those branches appear in JIRA's development panel in real time.

#### JIRA Automation Triggers with GitHub

- **JIRA Automation rules** trigger on GitHub events:
  - PR created → transition issue to "In Review."
  - PR merged → transition issue to "Done."
  - Branch created → transition issue to "In Progress."
  - Deployment succeeds → add a comment or transition.
  - Build fails → flag the issue.
- **GitHub Actions → JIRA** via `atlassian/gajira-*` actions:
  - `gajira-login` — authenticate to JIRA.
  - `gajira-create` — create JIRA issues from workflows.
  - `gajira-comment` — add comments to JIRA issues.
  - `gajira-transition` — transition issue statuses.
  - `gajira-find-issue-key` — extract JIRA issue keys from branch names or commits.
- **Rovo integration:** Atlassian's AI (Rovo) can search and reason about development data from GitHub, providing AI-powered insights across JIRA and GitHub.

---

## 4. Native AI and DevSecOps: GitHub vs ADO

### 4.1 AI-Powered Development (Copilot)

| AI Capability | GitHub | Azure DevOps | Gap |
|---|---|---|---|
| **Code Completion** | Copilot: Multi-line suggestions, context-aware, supports 30+ languages, works in VS Code, Visual Studio, JetBrains, Xcode, Neovim, Eclipse, Zed | Not available | GitHub exclusive |
| **AI Chat (IDE)** | Copilot Chat: Explain code, generate tests, debug, refactor — in IDE and on github.com | Not available (Copilot works in IDE but not integrated with ADO) | GitHub exclusive (platform integration) |
| **Copilot Cloud Agent** | Copilot cloud agent: Assign issues to Copilot — autonomous code writing, PR creation, review response. Runs in cloud VM. | Not available | GitHub exclusive |
| **Third-Party AI Agents** | Claude (Anthropic), Codex (OpenAI): Assign issues to third-party AI agents directly from GitHub | Not available | GitHub exclusive |
| **AI Code Review** | Copilot code review: AI reviews PRs, identifies bugs, security issues, suggests improvements | Not available | GitHub exclusive |
| **AI Security Fix** | Copilot Autofix: AI-generated fixes for CodeQL code scanning alerts — one-click apply | Not available (GHAzDO has no Autofix) | GitHub exclusive |
| **AI Secret Understanding** | Copilot for secret scanning: AI explains leaked secrets and remediation | Not available | GitHub exclusive |
| **AI PR Summaries** | Copilot generates PR descriptions and summaries | Not available | GitHub exclusive |
| **Natural Language CLI** | `gh copilot suggest` / `gh copilot explain` — natural language to shell commands | Not available | GitHub exclusive |
| **AI Workspace Knowledge** | Copilot Spaces: Team knowledge bases for consistent AI context (formerly Copilot Knowledge Bases) | Not available | GitHub exclusive |
| **Multi-Model Support** | Choose from GPT-4o, Claude Sonnet, Claude Haiku, Gemini — optimized for different tasks | N/A | GitHub exclusive |
| **MCP (Model Context Protocol)** | Connect Copilot to organizational tools (databases, APIs, internal systems) | N/A | GitHub exclusive |
| **Copilot Extensions** | Third-party tools extend Copilot capabilities (Docker, Azure, Sentry, LaunchDarkly, etc.) | N/A | GitHub exclusive |

> **Summary:** Azure DevOps has very limited AI capabilities at the platform level. ADO has introduced MCP Server for ADO (Done Q4 2025) and Copilot cloud agent for Azure Boards (Done Q4 2025), but these are narrowly scoped. The vast majority of AI-powered development features — cloud agent, code review, Autofix, AI secret detection, multi-model support — are GitHub-exclusive. While Copilot works in IDEs regardless of where code is hosted, the platform-level integrations require GitHub.

### 4.2 GitHub Secret Protection + GitHub Code Security vs GHAzDO and Third-Party Tools

GitHub's current code-security model is split between **GitHub Secret Protection** and **GitHub Code Security**. The legacy bundled **GHAS** name still appears in older materials, but the primary model is the two-product split, and both products are available on **GitHub Team** as well as **Enterprise Cloud**. GHAzDO (GitHub Advanced Security for Azure DevOps) remains a **limited subset** ported to ADO. The following table shows the gap:

| DevSecOps Feature | GitHub products on GitHub | GHAzDO (on ADO) | Third-Party Alternative (for ADO) |
|---|---|---|---|
| **Code Scanning (SAST)** | GitHub Code Security — CodeQL default setup (zero-config), advanced setup, **12 languages including GitHub Actions workflows** (security scanning of `.github/workflows/*.yml` and `**/action.yml`), custom queries, autofix suggestions | CodeQL — basic scanning, no default setup, no autofix | SonarQube, Checkmarx, Fortify |
| **Copilot Autofix** | GitHub Code Security — AI-generated fixes for code scanning alerts, one-click apply in PR | **Not available** | None equivalent |
| **Secret Scanning** | GitHub Secret Protection — 200+ partner patterns, custom patterns, AI-powered generic detection, Copilot secret scanning | Basic partner pattern matching; no AI detection; no custom patterns | GitLeaks, TruffleHog |
| **Push Protection** | GitHub Secret Protection — blocks pushes with secrets before they reach the repo + delegated bypass with audit trail | Basic push protection; no delegated bypass | Pre-commit hooks (GitLeaks) |
| **Dependabot Alerts** | Free (all plans) vulnerability alerts for supported ecosystems; GitHub Code Security adds custom auto-triage rules | Basic dependency alerts (limited ecosystems) | Snyk, Mend (WhiteSource) |
| **Dependabot Security Updates** | Free (all plans) auto-generated PRs to fix vulnerable dependencies | **Not available** | Snyk, Renovate |
| **Dependabot Version Updates** | Free (all plans) auto-generated PRs to keep dependencies current | **Not available** | Renovate |
| **Dependency Review** | GitHub Code Security — PR diff shows exact security impact of dependency changes | **Not available** | None natively |
| **SBOM Generation** | GitHub Code Security — SPDX-compatible Software Bill of Materials per repo | **Not available** | Third-party SBOM tools |
| **Artifact Attestations** | GitHub Code Security — cryptographic build provenance (SLSA Level 2+) | **Not available** | Sigstore, in-toto |
| **Security Overview** | GitHub Code Security — enterprise/org-wide dashboard with trends, risk scores, coverage metrics | Project-scoped only; less comprehensive | Azure Dashboards (custom) |
| **Security Campaigns** | GitHub Code Security — coordinate remediation of specific alert types across 100s of repos at scale | **Not available** | Manual coordination |
| **Custom Auto-Triage Rules** | GitHub Code Security — automatically dismiss/snooze alerts based on rules (dev dependencies, test code, etc.) | **Not available** | Manual triage |
| **Security Advisories** | GitHub — create, publish, request CVEs for responsible vulnerability disclosure | **Not available** | Manual process |
| **GitHub Advisory Database** | GitHub — curated, community-contributed vulnerability database | Uses same data (transitive) | NVD, OSV |
| **Defender for DevOps** | First-class GitHub connector in Microsoft Defender for Cloud | First-class ADO connector in Microsoft Defender for Cloud | Parity |
| **Third-Party SAST/DAST Integration** | Upload SARIF results from any tool to code scanning | Upload SARIF results (similar capability) | Parity (SARIF upload) |
| **Branch Protection for Security** | Rulesets block merge when security alerts exist above threshold | Branch policies + build validation | Similar (manual config) |

> **Key finding:** GitHub Secret Protection and GitHub Code Security on GitHub expose **16+** capabilities beyond GHAzDO. Organizations using GHAzDO on ADO get a fraction of the security value compared to the full GitHub product set, much of which is available on GitHub Team as well as Enterprise Cloud.

---

## 5. All Advantages of Moving to GitHub

### 5.1 AI-Native Platform

- **Copilot everywhere:** Code completion, chat, cloud agent, code review, CLI, spaces, extensions, autofix, PR summaries
- **Multi-model choice:** GPT-4o, Claude, Gemini — choose the best model per task
- **Third-party agents:** Claude (Anthropic), Codex (OpenAI) assignable directly from Issues
- **MCP protocol:** Connect AI to organizational tools and data sources
- **Minimal AI capabilities on ADO** — ADO has MCP Server and Copilot cloud agent for Boards, but lacks Copilot code review, Autofix, cloud agent, CLI, multi-model support, and extensions. This remains the single largest strategic gap.

### 5.2 Comprehensive Native Security (GitHub Secret Protection + GitHub Code Security)

- **Code scanning (CodeQL):** GitHub Code Security provides SAST with default setup (zero-config), Copilot Autofix, and **12 languages including GitHub Actions workflows**
- **Secret scanning + push protection:** GitHub Secret Protection provides 200+ patterns, AI generic detection, custom patterns, delegated bypass, and Copilot secret scanning
- **Dependabot:** Alerts, security updates, and version updates are free on all plans; GitHub Code Security adds dependency review and custom auto-triage
- **SBOM generation:** GitHub Code Security supports SPDX output for regulatory compliance
- **Artifact attestations:** GitHub Code Security supports supply-chain provenance (SLSA)
- **Security campaigns:** GitHub Code Security enables org-wide remediation at scale
- **Security overview:** GitHub Code Security provides enterprise-wide visibility and trends
- **Replaces multiple third-party tools** (SonarQube, Snyk, GitLeaks, etc.) when combined with free Dependabot capabilities

### 5.3 Largest Developer Ecosystem

- **150M+ developers** on GitHub — largest developer community ([source](https://github.com/customer-stories))
- **420M+ repositories** — most extensive open-source ecosystem
- **20,000+ marketplace Actions** with first-party vendor support
- **Developer hiring:** GitHub proficiency is the industry standard; ADO skills are niche

### 5.4 Superior JIRA Integration

- **"GitHub for Atlassian":** 364K+ installs, free, comprehensive, actively developed by Atlassian
- **Smart Commits, deployment tracking, automation triggers, Rovo Dev AI**
- **Better than ADO + JIRA** in every measured capability
- **No additional licensing cost** for the integration

### 5.5 Modern Governance and Compliance

- **Enterprise Managed Users (EMU):** Full lifecycle management via SCIM from Entra ID
- **Repository Rulesets:** Hierarchical enforcement at enterprise → org → repo level
- **Audit log streaming:** Azure Blob Storage, Azure Event Hubs, Amazon S3, Google Cloud Storage, Splunk, and Datadog
- **Conditional Access:** Entra ID CAP support via OIDC
- **JIT administration:** Entra PIM integration for admin roles
- **Custom repository roles:** Fine-grained least-privilege permissions

### 5.6 Secretless CI/CD

- **OIDC Workload Identity Federation:** Eliminate stored secrets for Azure/AWS/GCP
- **Short-lived tokens:** No rotation needed — tokens expire per workflow run
- **Scoped by repo, branch, and environment** — granular access control
- **Replaces ADO secret-based service connections** entirely

### 5.7 Developer Experience

- **GitHub Codespaces:** Cloud dev environments — productive in minutes
- **GitHub Mobile:** Full-featured iOS/Android app for PR review and deploy approval
- **Merge Queue:** Automated merge sequencing — never break main
- **Draft PRs, suggested changes, auto-merge, rich Markdown**
- **GitHub Discussions:** Forum-style conversations beyond Issues
- **GitHub Pages:** Free documentation hosting from repos

### 5.8 InnerSource and Open-Source Alignment

- **Internal repositories:** Enterprise-wide discoverability with fork-and-contribute model
- **Open-source contribution:** Seamless since code already lives on GitHub
- **CODEOWNERS:** Clear ownership and review routing
- **Code search across the enterprise** for discoverability
- **Stars, watching, and social discovery** for internal projects

### 5.9 Faster Innovation Cycle

- **Weekly releases** via GitHub Changelog
- **Public roadmap** at [github.com/github/roadmap](https://github.com/github/roadmap)
- **GitHub Universe** (annual conference) with major product launches
- **Feature previews** for early access to upcoming capabilities
- **ADO ships in three-week sprints** but with narrower feature scope compared to GitHub's weekly releases

### 5.10 Reduced Total Cost of Ownership

- **Eliminate third-party security tools:** GitHub Secret Protection and GitHub Code Security replace or reduce SonarQube, Snyk, GitLeaks, and similar tools.
- **Eliminate secret rotation burden:** OIDC removes service connection secret management
- **Faster onboarding:** Codespaces provides productive environments in minutes vs. hours/days
- **Copilot productivity gains:** 55%+ faster task completion documented by GitHub research
- **Better community support:** Larger ecosystem means more self-service solutions
- **Single platform:** No dual ADO + GitHub overhead

### 5.11 Future-Proofing

- **Microsoft's primary developer platform:** Strategic investment in AI and developer experience flows primarily to GitHub
- **ADO's own roadmap** focuses on hybrid coexistence — improving GitHub Repos + ADO Boards/Pipelines integration ([Features Timeline](https://learn.microsoft.com/en-us/azure/devops/release-notes/features-timeline))
- **AI features will continue to be GitHub-first** — Copilot is Microsoft's core AI product (ADO receives limited AI integrations like MCP Server and Copilot cloud agent for Boards)
- **Security innovations ship to GitHub Secret Protection and GitHub Code Security first,** with GHAzDO receiving delayed subsets (CodeQL default setup expected 2026 Q2, Dependabot security updates marked "Future")
- **Migrating now** avoids accumulating technical debt and higher future migration costs

### 5.12 Minimal Migration Risk (for This Organization)

- **Only Repos and Pipelines:** No Boards or Artifacts to migrate — simplest migration scenario
- **GitHub Enterprise Importer:** Bulk repo migration with history and PRs
- **GitHub Actions Importer:** ~80% automated pipeline conversion
- **JIRA stays:** No project management migration — just swap the integration plugin
- **Git is Git:** Source control operations are identical
- **Phased approach:** Pilot → broad rollout minimizes disruption risk

---

## 6. References

### Official GitHub Documentation

| Resource | URL |
|---|---|
| Enterprise Managed Users (EMU) | <https://docs.github.com/en/enterprise-cloud@latest/admin/identity-and-access-management/understanding-iam-for-enterprises/about-enterprise-managed-users> |
| EMU with OIDC & Conditional Access | <https://docs.github.com/en/enterprise-cloud@latest/admin/identity-and-access-management/configuring-authentication-for-enterprise-managed-users/about-support-for-your-idps-conditional-access-policy> |
| EMU SCIM Provisioning | <https://docs.github.com/en/enterprise-cloud@latest/admin/identity-and-access-management/provisioning-user-accounts-for-enterprise-managed-users/configuring-scim-provisioning-for-enterprise-managed-users> |
| Repository Rulesets | <https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets> |
| Available Ruleset Rules | <https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets> |
| Audit Log Streaming | <https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/streaming-the-audit-log-for-your-enterprise> |
| GitHub Actions — Security Hardening | <https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions> |
| GITHUB_TOKEN Permissions | <https://docs.github.com/en/actions/security-for-github-actions/security-guides/automatic-token-authentication> |
| OIDC for GitHub Actions | <https://docs.github.com/en/actions/security-for-github-actions/security-hardening-your-deployments/about-security-hardening-with-openid-connect> |
| Configuring OIDC in Azure | <https://docs.github.com/en/actions/security-for-github-actions/security-hardening-your-deployments/configuring-openid-connect-in-azure> |
| Environments & Deployment Protection | <https://docs.github.com/en/actions/managing-workflow-runs-and-deployments/managing-deployments/managing-environments-for-deployment> |
| Custom Deployment Protection Rules | <https://docs.github.com/en/actions/managing-workflow-runs-and-deployments/managing-deployments/creating-custom-deployment-protection-rules> |
| Reusable Workflows | <https://docs.github.com/en/actions/sharing-automations/reusing-workflows> |
| Require workflows to pass before merging (ruleset rule) | <https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets> |
| Runner Groups | <https://docs.github.com/en/enterprise-cloud@latest/actions/hosting-your-own-runners/managing-self-hosted-runners/managing-access-to-self-hosted-runners-using-groups> |
| Actions Policies (Enterprise) | <https://docs.github.com/en/enterprise-cloud@latest/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-policies-for-github-actions-in-your-enterprise> |
| PAT Policies (Enterprise) | <https://docs.github.com/en/enterprise-cloud@latest/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-policies-for-personal-access-tokens-in-your-enterprise> |
| Encrypted Secrets | <https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions> |
| GitHub Secret Protection / GitHub Code Security (legacy GHAS overview) | <https://docs.github.com/en/get-started/learning-about-github/about-github-advanced-security> |
| Code Scanning Default Setup | <https://docs.github.com/en/code-security/code-scanning/enabling-code-scanning/configuring-default-setup-for-code-scanning> |
| Code Scanning Merge Protection | <https://docs.github.com/en/code-security/code-scanning/managing-your-code-scanning-configuration/set-code-scanning-merge-protection> |
| Secret Scanning | <https://docs.github.com/en/code-security/secret-scanning/introduction/about-secret-scanning> |
| Push Protection | <https://docs.github.com/en/code-security/secret-scanning/introduction/about-push-protection> |
| Dependabot | <https://docs.github.com/en/code-security/dependabot> |
| Security Overview | <https://docs.github.com/en/enterprise-cloud@latest/code-security/security-overview/about-security-overview> |
| Security Configurations | <https://docs.github.com/en/enterprise-cloud@latest/code-security/securing-your-organization/introduction-to-securing-your-organization-at-scale/about-security-configurations> |
| Security Campaigns | <https://docs.github.com/en/enterprise-cloud@latest/code-security/securing-your-organization/fixing-security-alerts-at-scale/about-security-campaigns> |
| Security Manager Role | <https://docs.github.com/en/organizations/managing-peoples-access-to-your-organization-with-roles/managing-security-managers-in-your-organization> |
| Custom Repository Roles | <https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-user-access-to-your-organizations-repositories/managing-repository-roles/managing-custom-repository-roles> |
| Repository Roles | <https://docs.github.com/en/organizations/managing-user-access-to-your-organizations-repositories/managing-repository-roles/repository-roles-for-an-organization> |
| Dormant Users | <https://docs.github.com/en/enterprise-cloud@latest/admin/managing-accounts-and-repositories/managing-users-in-your-enterprise/managing-dormant-users> |
| Teams | <https://docs.github.com/en/organizations/organizing-members-into-teams/about-teams> |
| CODEOWNERS | <https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners> |
| PR Templates | <https://docs.github.com/en/communities/using-templates-to-encourage-useful-contributions/creating-a-pull-request-template-for-your-repository> |
| GitHub Flow | <https://docs.github.com/en/get-started/using-github/github-flow> |
| Merge Queue | <https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue> |
| Forking Policy | <https://docs.github.com/en/enterprise-cloud@latest/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-repository-management-policies-in-your-enterprise> |
| Custom Properties | <https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-organization-settings/managing-custom-properties-for-repositories-in-your-organization> |
| Starter Workflows | <https://docs.github.com/en/actions/writing-workflows/using-starter-workflows> |
| GitHub Codespaces | <https://docs.github.com/en/codespaces> |
| GitHub Discussions | <https://docs.github.com/en/discussions> |
| GitHub Pages | <https://docs.github.com/en/pages> |
| GitHub Projects | <https://docs.github.com/en/issues/planning-and-tracking-with-projects> |
| GitHub Copilot | <https://github.com/features/copilot> |
| GitHub Public Roadmap | <https://github.com/github/roadmap> |
| GitHub Changelog | <https://github.blog/changelog/> |
| GitHub Enterprise Importer | <https://docs.github.com/en/migrations/using-github-enterprise-importer> |
| GitHub Actions Importer | <https://docs.github.com/en/actions/tutorials/migrate-to-github-actions/automated-migrations/use-github-actions-importer> |

### JIRA Integration

| Resource | URL |
|---|---|
| GitHub for Atlassian App (Marketplace) | <https://github.com/marketplace/jira-software-github> |
| Integrate Jira with GitHub (Atlassian Support) | <https://support.atlassian.com/jira-cloud-administration/docs/integrate-jira-software-with-github/> |
| Smart Commits (Atlassian) | <https://support.atlassian.com/jira-software-cloud/docs/process-issues-with-smart-commits/> |
| JIRA Automation | <https://www.atlassian.com/software/jira/features/automation> |
| Gajira GitHub Actions | <https://github.com/atlassian/gajira-create> |

### Microsoft / Azure

| Resource | URL |
|---|---|
| Azure DevOps Roadmap (Features Timeline) | <https://learn.microsoft.com/en-us/azure/devops/release-notes/features-timeline> |
| Defender for DevOps — GitHub Connector | <https://learn.microsoft.com/en-us/azure/defender-for-cloud/quickstart-onboard-github> |
| Azure RBAC Best Practices | <https://learn.microsoft.com/en-us/azure/role-based-access-control/best-practices> |
| Azure Key Vault Secrets Action | <https://github.com/Azure/get-keyvault-secrets> |
| Azure Login Action | <https://github.com/Azure/login> |

### Migration Resources

| Resource | URL |
|---|---|
| Migrate from Azure DevOps to GitHub Actions | <https://docs.github.com/en/actions/tutorials/migrate-to-github-actions> |
| GitHub Professional Services | <https://services.github.com/> |
| GitHub Skills | <https://skills.github.com/> |
| Actions Importer Labs | <https://github.com/actions/importer-labs> |
| Actions Importer IssueOps | <https://github.com/actions/importer-issue-ops> |

---

> **Document generated from:** Azure DevOps DevSecOps Assessment — 71 Recommendations (R01–R71) mapped to GitHub Enterprise Cloud equivalents, with comprehensive research on AI, DevSecOps, migration impact, and strategic positioning.

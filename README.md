# GitHub Administration & Governance Workshop (L400)

> **Advanced Workshop** | Expert-level training for GitHub Enterprise Cloud administration, governance, and best practices. This workshop covers enterprise hierarchy, organization strategies, identity management (including Enterprise Managed Users), policy enforcement, security compliance, and the GitHub Well-Architected Framework.

## Workshop Documentation

Comprehensive L400-level technical documentation for GitHub Enterprise Cloud administration and governance.

### Workshop Guide
- [🎓 Mastering GitHub Administration on EMU — 3-Hour Workshop (Markdown)](docs/00-mastering-github-administration-workshop.md) - Instructor-led workshop for Enterprise Managed Users enterprises, anchored to the Enterprise Adoption Plan; clear learning objectives, decision moments, EMU-specific limits and pitfalls, and embedded reference tables so participants don't need to flip away from the deck
- [🖥️ Mastering GitHub Administration on EMU — HTML Slide Deck](docs/00-mastering-github-administration-workshop.html) - Customer-facing slide-by-slide presentation of the same content (37 slides, GitHub-themed dark UI, keyboard nav, overview mode, fullscreen, print-as-handout). Open in any modern browser — single self-contained file, no dependencies

### Enterprise Administration
- [📘 Enterprise Hierarchy](docs/01-enterprise-hierarchy.md) - GHEC structure, roles, and multi-org management
- [🏢 Organization Strategies](docs/02-organization-strategies.md) - Single/multi-org patterns, red-green-sandbox-archive

### Identity & Access Management
- [🔐 Identity & Access Management](docs/03-identity-access-management.md) - SAML SSO, SCIM, enterprise type selection
- [⭐ Enterprise Managed Users (EMU)](docs/04-enterprise-managed-users.md) - EMU deep dive, advantages, best practices

### Teams & Permissions
- [👥 Teams and Permissions](docs/05-teams-permissions.md) - Team structures, nested teams, permission models
- [📋 Policy Inheritance](docs/06-policy-inheritance.md) - Enterprise → Org → Repo policy enforcement

### Repository Governance
- [📦 Repository Governance](docs/07-repository-governance.md) - Rulesets, branch protection, templates
- [🏷️ Custom Properties for Governance & Compliance](docs/23-github-custom-properties.md) - Repository metadata schema design, governance taxonomy, ruleset targeting by property, REST API/Terraform automation, and compliance framework mapping
- [🔒 Security & Compliance](docs/08-security-compliance.md) - GHAS split SKUs (Secret Protection + Code Security), code scanning, secret scanning, dependency review, audit logs

### Best Practices & Architecture
- [✅ Best Practices & WAF](docs/09-best-practices-waf.md) - Azure WAF pillars applied to GitHub Enterprise Cloud (Reliability, Security, Operational Excellence, Performance Efficiency, Cost Optimization); see also wellarchitected.github.com for GitHub's native WAF
- [🏗️ Reference Architecture](docs/10-reference-architecture.md) - Architecture diagrams and patterns

### Security Policies
- [🛡️ Security-by-Default Policies](docs/11-security-by-default-policies.md) - Comprehensive security settings and policy recommendations for Enterprise, Organization, and Repository levels
- [⚠️ GitHub Actions Security: Echo Command Injection](docs/17-github-actions-security-echo-command-injection.md) - Echo command injection vulnerability (HackerBot Claw attack) prevention in GitHub Actions workflows

### AI & Copilot Governance
- [🤖 GitHub Copilot Governance](docs/12-github-copilot-governance.md) - Enterprise Copilot policies, settings, content exclusions, license management, and best practices, including Copilot cloud agent governance and Copilot Spaces (formerly Knowledge Bases)
- [🖥️ GitHub Copilot App — Agent-Native Desktop Development](docs/24-github-copilot-app.md) - The agent-native desktop app: parallel agent sessions and worktrees, session modes, canvases, automations, Agent Merge, sandboxes, extensibility (MCP/skills/SDK), demo-ready examples, and training resources
- [💳 GitHub Copilot Usage-Based Billing Research](docs/GitHub-Copilot-Usage-Based-Billing-Research.md) - Premium requests, AI credits, cost-center allocation, and budget controls for Copilot consumption
- [📊 GitHub Chargeback System Design](docs/22-github-chargeback-system-design.md) - Internal cost allocation framework for GitHub Enterprise spend (seats, Actions minutes, Copilot premium requests, GHAS committers)
- [🔄 GitHub Organization Rename Impact](docs/18-github-rename-org-impact.md) - Impact analysis of renaming a GitHub organization on Copilot, EMU authentication, and post-rename actions

### Implementation Guides
- [🚀 GitHub Onboarding Implementation Plan](docs/13-github-onboarding-implementation-plan.md) - Comprehensive priority task list for GitHub Enterprise onboarding including governance, compliance, security-by-default configuration, repository rulesets, migration readiness, and Copilot governance
- [☁️ GitHub Enterprise Cloud Adoption Plan](docs/21-github-enterprise-adoption-plan.md) - Phased adoption plan for Azure DevOps to GitHub Enterprise Cloud migration covering repos migration, Azure Pipelines to GitHub Actions, and DevSecOps enablement
- [🤖 Governed AI SDLC - Enterprise Adoption Plan](docs/20-governed-ai-sdlc-plan.md) - Enterprise adoption plan for a governed AI SDLC practice powered by an internal fleet of AI agents, covering golden paths, policy gating, observability, and DORA/SPACE + AI-specific KPIs
- [📋 Governed AI SDLC - Executive Summary](docs/20-ai-sdlc-executive-summary.md) - Two-page executive summary of the Governed AI SDLC plan for leadership stakeholders

### Azure DevOps to GitHub Migration
- [📊 ADO to GitHub Migration Assessment](docs/ado-to-github-migration-assessment.md) - Comprehensive mapping of ADO DevSecOps recommendations to GitHub equivalents
- [📄 ADO to GitHub Migration Business Case (Markdown)](docs/ADO-to-GitHub-Migration-Business-Case.md) - Strategic business case for migrating from Azure DevOps to GitHub
- [📄 ADO to GitHub Migration Business Case (HTML)](docs/ADO-to-GitHub-Migration-Business-Case.html) - Formatted business case document
- [🔀 GitHub Enterprise Importer ADO Guide](docs/14-github-enterprise-importer-ado-guide.md) - Step-by-step guide for using GitHub Enterprise Importer with Azure DevOps
- [� Azure Pipelines with GitHub Repos Integration](docs/15-azure-pipelines-github-repos-integration.md) - Impact analysis of using Azure Pipelines with GitHub repositories after migration
- [🔍 Azure DevOps to GitHub Migration Analysis](docs/16-azure-devops-to-github-migration-analysis.md) - Detailed technical analysis of the migration process
- [🗺️ ADO to GitHub Structural Mapping (Visual)](docs/ado-to-github-structural-mapping.md) - High-level Mermaid visuals mapping ADO concepts (Organization, Project, Repos, Teams, Security, Pipelines, Governance) onto GitHub's Enterprise/Org/Repo tiers; explains the project-based vs repo-based shift and the Red-Green-Sandbox target org model
- [🔑 ADO REST API Authentication Without PATs](docs/ado-rest-api-auth-without-pat.md) - Alternatives to Personal Access Tokens for Azure DevOps REST API authentication in CI/CD pipelines
- [🧹 ADO Tenant & Org Cleanup](docs/ADO-Tenant-Org-Cleanup.md) - Post-migration cleanup of Azure DevOps tenant connections, PAT policies, orphaned orgs
- [❓ ADO to GitHub Migration Q&A Guide](docs/ADO-to-GitHub-Migration-QA.md) - Detailed questions and answers about migrating from Azure DevOps to GitHub using GEI
- [💬 Workshop FAQ](docs/FAQ-workshop.md) - Frequently asked questions from GitHub Enterprise Admin workshops, including migration-related topics

---

## Hands-on Labs

Short guided exercises covering **foundational GitHub mechanics** (webhooks, Actions settings, branch protection, repository templates, REST and GraphQL APIs). These predate the EMU workshop refocus and are useful as standalone skill-builders rather than direct reinforcement of the EMU governance modules — see the workshop's [§9 lab map](docs/00-mastering-github-administration-workshop.md#hands-on-labs-optional-after-the-workshop) for closest touchpoints and an EMU caveat on `setup.md`.

### Hands-on Labs Setup
- [ ]  [Lab Setup](/labs/setup.md)

### Lab 01: Introduction to Repository Webhooks and Events
- [ ]  _Hands-on Lab:_ > [Activity 1](/labs/lab01.md)

### Lab 02: Managing GitHub Actions settings for a repository
- [ ]  _Hands-on Lab:_ > [Activity 2](/labs/lab02.md)

### Lab 03: Managing a branch protection rule
- [ ]  _Hands-on Lab:_ > [Activity 3](/labs/lab03.md)

### Lab 04: GitHub Templates
- [ ]  _Hands-on Lab:_ > [Activity 4](/labs/lab04.md)

### Lab 05: GitHub API
- [ ]  _Hands-on Lab:_ > [Activity 5](/labs/lab05.md)

---

## Additional Resources
> Additional resources to continue your GitHub Admin learning journey.

### Learning GitHub Admin
- [Microsoft Learn - GitHub Administration Collection](https://learn.microsoft.com/en-us/users/githubtraining/collections/mom7u1gzjdxw03)
- [GitHub Enterprise Onboarding Guide](https://docs.github.com/en/enterprise-cloud@latest/admin/overview/setting-up-a-trial-of-github-enterprise-cloud) (Enterprise Cloud)
- [The Book on GitHub Enterprise Cloud Adoption](https://resources.github.com/devops/get-started-with-github-enterprise-cloud/)
- [GitHub Skills](https://skills.github.com/)

### GitHub Admin Documentation
- [Enterprise administrators](https://docs.github.com/en/enterprise-cloud@latest/admin)
- [Organizations](https://docs.github.com/en/enterprise-cloud@latest/organizations)
- [Repositories](https://docs.github.com/en/enterprise-cloud@latest/repositories)
- [Roles in an organization](https://docs.github.com/en/organizations/managing-peoples-access-to-your-organization-with-roles/roles-in-an-organization#about-predefined-organization-roles)
- [Configuring SCIM provisioning for Enterprise Managed Users](https://docs.github.com/en/enterprise-cloud@latest/admin/identity-and-access-management/using-enterprise-managed-users-and-saml-for-iam/configuring-scim-provisioning-for-enterprise-managed-users)
- [About Enterprise Managed Users](https://docs.github.com/en/enterprise-cloud@latest/admin/identity-and-access-management/using-enterprise-managed-users-for-iam/about-enterprise-managed-users)
- [Managing a branch protection rule](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/defining-the-mergeability-of-pull-requests/managing-a-branch-protection-rule)
- [GitHub Blog Enterprise](https://github.blog/category/enterprise/)
- [GitHub Actions - Security guides](https://docs.github.com/en/actions/security-guides)

### Admin Changelog
- [GitHub Changelog](https://github.blog/changelog/)
- [enterprise Archives | The GitHub Blog](https://github.blog/changelog/label/enterprise/)
- [admin Archives | The GitHub Blog](https://github.blog/changelog/label/admin/)

### Videos
> Note: The videos below are from GitHub Universe 2021 and may show superseded UI. For current sessions see https://www.youtube.com/githubtraining .
- [What's new for GitHub Enterprise - GitHub Universe 2021 - YouTube](https://www.youtube-nocookie.com/embed/ZZviWZgrqhM)
- [GitHub in the Enterprise - GitHub Universe 2021 - YouTube](https://www.youtube.com/watch?v=1-i39RqaxRs)
- [Enforcing information security policy through GitHub Enterprise - GitHub Universe 2021 - YouTube](https://www.youtube-nocookie.com/embed/DCu-ZTT7WTI)
- [GitHub Universe](https://githubuniverse.com/)

### Articles & Guides
- [Best practices for organizations and teams using GitHub Enterprise Cloud](https://github.blog/2023-08-02-best-practices-for-organizations-and-teams-using-github-enterprise-cloud/)
- [Everything new from GitHub Universe 2022](https://github.blog/2022-11-09-everything-new-from-github-universe-2022/) (2022 — refer to GitHub's blog for more recent announcements)
- [Improved management for GitHub Enterprise owners | The GitHub Blog](https://github.blog/2022-03-10-improved-management-github-enterprise-owners/)
- [How to secure your GitHub organization and enterprise account | The GitHub Blog](https://github.blog/2020-07-23-how-to-secure-your-github-organization-and-enterprise-account/)
- [Connect GitHub Enterprise Cloud to Defender for Cloud Apps | Microsoft Docs](https://learn.microsoft.com/en-us/defender-cloud-apps/connect-github-ec)
- [How Defender for Cloud Apps helps protect your GitHub Enterprise environment | Microsoft Docs](https://learn.microsoft.com/en-us/defender-cloud-apps/protect-github)
- [GitHub Workflow Guide](https://docs.github.com/en/get-started/using-github/github-flow)
- [Removing sensitive data from a repository - GitHub Docs](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
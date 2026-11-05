# Business Case: Azure DevOps to GitHub Migration

> **Document status**
>
> - **Last reviewed:** 2026-11-04
> - **Authorship:** Drafted with AI assistance (GitHub Copilot, multi-model review) and reviewed by a human maintainer before publication.
> - **Sources:** Based on public documentation, primarily [docs.github.com](https://docs.github.com), [learn.microsoft.com](https://learn.microsoft.com), the [Azure DevOps roadmap](https://learn.microsoft.com/en-us/azure/devops/release-notes/features-timeline), and official vendor blogs cited inline.
> - **Verify before acting:** GitHub and Microsoft ship updates every few weeks, and several items below are in preview. Re-confirm against the live source pages before relying on this content for production or contractual decisions.

## Table of Contents

- [Executive Summary](#executive-summary)
- [1. Strategic Context: Why Now](#1-strategic-context-why-now)
- [2. GitHub vs Azure DevOps: The 2026 Feature Reality](#2-github-vs-azure-devops-the-2026-feature-reality)
- [3. Pillar 1: Agentic Software Delivery](#3-pillar-1-agentic-software-delivery)
- [4. Pillar 2: Standardisation and InnerSource](#4-pillar-2-standardisation-and-innersource)
- [5. Pillar 3: Governance and Security](#5-pillar-3-governance-and-security)
- [6. Financial Analysis](#6-financial-analysis)
- [7. For Developers Who Love Azure DevOps](#7-for-developers-who-love-azure-devops)
- [8. Migration Approach: The Hybrid Strategy](#8-migration-approach-the-hybrid-strategy)
- [9. Risk Assessment and Mitigation](#9-risk-assessment-and-mitigation)
- [10. Executive Recommendation](#10-executive-recommendation)
- [11. References and Sources](#11-references-and-sources)

---

## Executive Summary

Azure DevOps (ADO) is no longer an "AI-free" platform. During 2026 Microsoft brought GitHub Copilot code review to Azure Repos (public preview, with Lite and Balanced effort levels), added agentic Copilot Autofix to GitHub Advanced Security for Azure DevOps (limited public preview, closed to new participants; broader availability targeted for 2026 Q4), and shipped an Azure DevOps MCP Server. Any business case that still argues "AI only exists on GitHub" is out of date and will not survive scrutiny from engineers who know ADO well.

The case for GitHub is stronger, and more honest, when framed differently:

> **AI features can be added to any platform. Agentic software delivery needs the code, the compute, the identity, the policy, and the audit trail to live in one place. That place is GitHub.**

Four facts carry the decision:

1. GitHub-native cloud agents only work where the code lives. The Copilot cloud agent (formerly "coding agent"), which turns any issue or work item into a draft pull request in the cloud, runs against GitHub repositories, as do Agentic Workflows and the third-party agents in Agent HQ (Claude, Codex). Local agent sessions in the IDE or Copilot app work with any Git host, but the cloud, asynchronous workflow does not. Even the Azure Boards "Create a pull request with Copilot" button requires the target repository to be on GitHub; Microsoft documents that Azure Repos is not supported for this integration. ADO's cloud-side agentic capability is limited to security fixes (Autofix, closed preview).
2. The economics shifted in GitHub's favour. Since 28 October 2026, eligible GitHub Enterprise Cloud (GHEC) customers can move, through their account team, to "Copilot access": a $0 Copilot seat charge for GHEC-licensed users, with all usage billed as AI credits. Azure DevOps Basic is already included with GHEC licences. For eligible enterprises, one GHEC licence covers source control, Azure Boards access, and Copilot entitlement.
3. GitHub burns down security debt; ADO mostly reports it. Both platforms now detect vulnerabilities with the same engines (CodeQL, secret scanning, push protection) at the same price. Detection is no longer the bottleneck; remediation is. ADO added "security campaigns" in April 2026, but there they are shared, filtered views of alerts. **GitHub security campaigns** are a full remediation workflow: the security team selects a related set of alerts across repositories, sets a due date and a campaign manager, notifies the right developers inside their normal workflow, has code scanning alerts submitted to Copilot Autofix automatically, and (with agentic Autofix enabled) assigns up to 25 code scanning alerts at a time to Copilot, which opens a fix pull request for review. Code scanning campaigns are GA; secret scanning campaigns are in public preview. ADO's Autofix is a closed preview, with "batch alert selection" on its 2026 Q4 roadmap.
4. GitHub governs agents, not only code. Enterprise AI Controls and the agent control plane (GA February 2026) give administrators a dedicated AI admin role, enterprise-wide agent policies, and audit visibility into Copilot and third-party agent sessions. ADO governs its AI features (code review, Autofix) individually through org, project, and repo settings.

Microsoft's own Azure DevOps product team states the direction plainly:

> *"Over the last few years, we've encouraged customers to move their repositories from Azure Repos to GitHub, where the newest AI-powered and agentic development experiences land first."*
> Laura Jiang, Senior Product Manager, Azure DevOps (June 2026)

**Recommendation:** approve a funded pilot and phased migration of source code to GitHub Enterprise Cloud. Keep Azure Boards, Azure Test Plans, and (where they add value) Azure Pipelines and Azure Artifacts in a hybrid model, and govern AI spend with AI credit budgets from day one.

**Key financial and adoption signals:**

- **376% ROI** and **$67.9M NPV** over three years for a composite 5,000-developer enterprise ([Forrester TEI of GitHub Enterprise Cloud](https://tei.forrester.com/go/github/enterprisecloud/))
- **$48.3M** developer efficiency and **$9.3M** security and compliance efficiency (three-year present value) in the same study
- **More than 40%** of pull requests on GitHub started with an agent's first draft in September 2026, up from 17% in March ([Octoverse 2026](https://github.blog/news-insights/octoverse/octoverse-commits-pushes-reach-new-highs-in-2026-as-developers-build-with-agents/))
- **225M+ developers** on GitHub (Octoverse 2026)
- **$0 Copilot seat charge** for GHEC-licensed users under "Copilot access" (eligible enterprises; usage billed as AI credits)

---

## 1. Strategic Context: Why Now

### 1.1 Microsoft's Official Position

| Date | Announcement | Source |
|------|-------------|--------|
| Feb 2025 | Azure DevOps Basic licence included with GitHub Enterprise Cloud | [Azure DevOps Blog](https://devblogs.microsoft.com/devops/azure-devops-basic-usage-included-with-github-enterprise/) |
| May 2025 | "Azure DevOps with GitHub Repositories: Your Path to Agentic AI" | [Azure DevOps Blog](https://devblogs.microsoft.com/devops/azure-devops-with-github-repositories-your-path-to-agentic-ai/) |
| May 2025 | Build 2025 "Agentic DevOps" keynote | [Azure Blog](https://azure.microsoft.com/en-us/blog/agentic-devops-evolving-software-development-with-github-copilot-and-microsoft-azure/) |
| Nov 2025 | ADO-to-GitHub Migration Playbook published by Microsoft | [All Things Azure](https://devblogs.microsoft.com/all-things-azure/azure-devops-to-github-migration-playbook-unlocking-agentic-devops/) |
| Feb 2026 | Agent HQ: Claude and Codex join Copilot inside GitHub | [GitHub Blog](https://github.blog/news-insights/company-news/pick-your-agent-use-claude-and-codex-on-agent-hq/) |
| Feb 2026 | Enterprise AI Controls and agent control plane GA | [GitHub Changelog](https://github.blog/changelog/2026-02-26-enterprise-ai-controls-agent-control-plane-now-generally-available/) |
| Jun 2026 | Copilot Autofix for GHAzDO (limited preview) positioned for teams "not ready yet" to migrate | [Azure DevOps Blog](https://devblogs.microsoft.com/devops/copilot-autofix-for-github-advanced-security-for-azure-devops/) |
| Q3 2026 | Copilot code review for Azure Repos (public preview) | [Azure DevOps Blog](https://devblogs.microsoft.com/devops/copilot-code-reviews-for-azure-repos-public-preview/) |
| Oct 2026 | GitHub Universe: Copilot app, Copilot projects (preview), code review Max (preview) and Copilot approvals (GA), "Copilot access" at $0 seat for GHEC | [GitHub Blog](https://github.blog/news-insights/company-news/github-universe-2026-evolving-every-layer-of-the-stack/) |

The pattern is consistent: Microsoft brings selected AI capabilities to Azure DevOps so that customers who cannot migrate yet are not left behind, while the agentic platform (general-purpose cloud agents, multi-agent orchestration, automations, agent governance) is built on GitHub.

### 1.2 What Changed in 2026: Azure DevOps Caught Up on Some AI Features

A credible business case acknowledges where ADO has closed gaps. Earlier versions of this document claimed that ADO had no Copilot for Azure Repos and only third-party security scanning. Both statements are no longer accurate.

| Capability now in Azure DevOps | Status (Nov 2026) | Practical limits |
|-------------------------------|-------------------|------------------|
| Copilot code review for Azure Repos | Public preview | Lite and Balanced effort levels (no Max); runs as an Azure Pipelines job on Microsoft-hosted agents or Managed DevOps Pools (self-hosted agents not supported); billed on a separate Azure meter |
| GitHub Advanced Security for Azure DevOps (GHAzDO) | GA | Secret scanning with push protection, CodeQL code scanning, dependency scanning with EPSS prioritisation; malware alerts in preview |
| Agentic Copilot Autofix for GHAzDO | Limited public preview, closed to new participants | In the limited preview, opens fix pull requests for code scanning alerts and dependency vulnerability alerts using repository instructions; broader availability targeted for 2026 Q4; AI detections for non-CodeQL languages and code-to-cloud with Defender listed as "Future" |
| Azure DevOps MCP Server | Local server available; remote endpoint in public preview | Lets Copilot (in the IDE) read and act on work items, PRs, pipelines, and wikis |
| Copilot in the IDE and the Copilot app's local sessions (completions, chat, agent mode, model routing) | GA | Host-agnostic: works against any Git remote, including Azure Repos |
| Start Copilot from an Azure Boards work item | GA | **Requires a GitHub repository.** Azure Repos is not supported |

### 1.3 Why the Gap Persists

The remaining gap is structural, not a matter of a few missing checkboxes:

- An autonomous agent needs a sandboxed compute environment, a scoped identity, branch and ruleset enforcement, a network firewall, and an audit trail on the same platform that hosts the code. On GitHub these are platform primitives (Actions runners, GitHub Apps, rulesets, the agent firewall, the enterprise audit log). On ADO, AI features are delivered as add-ons that run inside Azure Pipelines jobs and are scoped to specific tasks (review, security fixes).
- GitHub ships the agentic layer first. Copilot code review on GitHub adds a multi-model Max level (preview) and GA Copilot approvals that count toward required reviews; ADO offers Lite and Balanced in preview.
- The ADO roadmap is focused on parity and platform hygiene (YAML pipeline parity, credential-theft reduction, Boards usability, Test Plans language support). These are valuable, but they are not general-purpose agentic-delivery investments.

### 1.4 The Risk of Inaction

| Risk | What it means |
|------|---------------|
| Agent gap | Teams on Azure Repos cannot delegate backlog items to the Copilot cloud agent, cannot run Claude or Codex as GitHub-native agents, and cannot use cloud-orchestrated Copilot projects or automations. In September 2026 more than 40% of pull requests on GitHub started from an agent's draft. |
| Lagging AI security coverage | GHAzDO is close to parity on core scanning, and its "security campaigns" are shared alert views. It lacks campaign deadlines, owners, developer notifications, tracking issues, and automatic Autofix, and trails on Autofix availability, AI Scan for non-CodeQL languages, AI-application scanning, and scheduled dependency update pull requests. Security debt keeps accumulating faster than teams can fix it alert by alert. |
| Split AI spend and policy | Running Copilot on GitHub for some teams and Azure-metered Copilot code review on ADO for others splits budgets, policies, and telemetry across two systems. |
| Talent | Most developers already use GitHub; onboarding to ADO-specific workflows is an extra cost for every new hire. |

---

## 2. GitHub vs Azure DevOps: The 2026 Feature Reality

The table compares **source code hosting on GitHub Enterprise Cloud** with **Azure Repos**, as of November 2026. "Verdict" is the honest call for a decision maker. Preview features are labelled; the recommendation in section 10 rests on GA capabilities, and previews are upside.

### 2.1 AI and Agents

| Capability | GitHub Enterprise Cloud | Azure DevOps (Azure Repos) | Verdict |
|-----------|------------------------|----------------------------|---------|
| Copilot in the IDE and Copilot app local sessions (completions, chat, agent mode, Copilot Fusion model routing) | GA | GA (host-agnostic) | Parity |
| Copilot code review on pull requests | GA (Lite, Balanced); Max multi-model review in preview; custom instructions; automatic review via rulesets | Public preview (Lite, Balanced); Microsoft-hosted agents or Managed DevOps Pools only | GitHub ahead |
| Copilot approvals that count toward required reviews | GA October 2026, scoped by file path | Not available | **GitHub only** |
| Copilot cloud agent (issue or work item to pull request, autonomously) | GA, from issues, Azure Boards, Slack, Teams, Jira, VS Code, CLI, and mobile | Not available for Azure Repos | **GitHub only** |
| Agent HQ: third-party coding agents (Claude, Codex) alongside Copilot and custom agents | Public preview (Copilot Pro+ / Enterprise) | Not available | **GitHub only** |
| Copilot projects (multi-repo parallel agent sessions) and cloud session continuity | Public preview, October 2026 | Not available | **GitHub only** |
| Copilot automations and GitHub Agentic Workflows (triage, CI failure analysis, docs, tests) | Agentic Workflows GA; shared automations rolling out | Not available (build your own pipeline scripts) | **GitHub only** |
| Enterprise AI governance (AI admin role, agent policies, agent session audit) | GA February 2026 | Org/project/repo enablement per feature; audit events for code review configuration | GitHub ahead |
| MCP integration | GitHub MCP Server; managed MCP connections across app, CLI, VS Code, web, and code review | Azure DevOps MCP Server (local; remote in preview) | Both; complementary in a hybrid model |

### 2.2 Security and Supply Chain

| Capability | GitHub Enterprise Cloud | Azure DevOps (GHAzDO) | Verdict |
|-----------|------------------------|----------------------|---------|
| Secret scanning with push protection | GA | GA | Parity |
| CodeQL code scanning | GA; default setup with no YAML | GA (pipeline tasks or default setup); PR-triggered default setup targeted 2026 Q4 | Near parity |
| Security campaigns | Remediation workflow across repositories: due date, campaign manager, developer notifications, tracking issues (code scanning), automatic Autofix submission (code scanning), and assignment of 1-25 code scanning alerts per agentic Autofix session to Copilot; requires Secret Protection or Code Security. Code scanning campaigns GA; secret scanning campaigns in public preview | "Security campaigns" in security overview (April 2026) are shared, filtered alert views; "batch alert selection for Copilot Autofix" on the 2026 Q4 roadmap | GitHub well ahead |
| Copilot Autofix for code scanning | GA, including batch fixes through campaigns | Agentic fix PRs in limited public preview, closed to new participants | GitHub ahead |
| AI Scan for languages CodeQL does not cover (PHP, Bash, Terraform, Dockerfiles, Blazor, and more) | GA for pull requests (advisory; does not block merges); whole-repository scan in preview | Listed as "Future" | **GitHub only** |
| Code scanning for AI applications | Public preview, October 2026; currently detects indirect prompt injection, with more AI-specific risks planned | Not available | **GitHub only** |
| Monitoring for enterprise secrets leaked publicly anywhere on GitHub | GA, October 2026 | Not available | GitHub entitlement, not tied to repository hosting |
| Dependency alerts | Dependabot alerts; reachability analysis in preview (JavaScript/TypeScript) | Dependency scanning alerts with EPSS; malware alerts in preview | GitHub ahead |
| Automated dependency update pull requests | Dependabot security and scheduled version updates | Autofix fix PRs for dependency alerts (closed preview); no scheduled version updates | GitHub ahead |
| Install-time package firewall for agents, runners, and IDEs | Public preview October 2026 (npm first); a GHEC entitlement usable from any endpoint, including Azure Pipelines agents | Not available | GHEC entitlement, not tied to repository hosting |
| Code quality (maintainability, reliability, coverage) | GitHub Code Quality GA July 2026 (separately licensed) | Code coverage branch policies; no native maintainability analysis | GitHub ahead |
| Security overview and posture dashboards | GA, enterprise and organisation level | Advanced Security overview with a combined alerts view across the organisation (April 2026) | Near parity |
| Pricing (per active committer per month) | Secret Protection $19; Code Security $30 | Same SKUs and prices, billed via Azure | Parity |

### 2.3 Developer Workflow and Platform

| Capability | GitHub Enterprise Cloud | Azure DevOps | Verdict |
|-----------|------------------------|--------------|---------|
| Pull requests | Merge queue, stacked pull requests (GA October 2026), Copilot summaries and approvals, suggested changes | Mature PR iterations, auto-complete, suggested changes, required reviewers by path | GitHub ahead on velocity features; ADO PR UI remains well liked |
| Enterprise-wide policy | Enterprise and org rulesets, custom properties, evaluate mode, rule insights | Branch policies per repo, cross-repo policies per project | GitHub ahead |
| Cloud development environments | Codespaces | Not native (Microsoft Dev Box is a separate Azure service) | GitHub ahead |
| CI/CD | GitHub Actions (hosted runner prices cut up to 39% in January 2026) | Azure Pipelines (mature checks, approvals, classic releases) | Both; keep Pipelines where invested |
| Work management | Issues, Projects, sub-issues, issue types | Azure Boards (process templates, hierarchies, delivery plans, analytics) | **ADO ahead: keep Boards** |
| Manual test management | Not native | Azure Test Plans | **ADO ahead: keep Test Plans** |
| Package management | GitHub Packages, package firewall | Azure Artifacts (upstream sources, universal packages) | Context dependent: keep Artifacts if needed |
| Ecosystem | 225M+ developers; Actions Marketplace with tens of thousands of actions | Visual Studio Marketplace extensions | GitHub ahead |
| Data residency | EU (including EFTA, Norway, and Switzerland), Australia, US, Japan | Region selected per organisation | Both |

**Reading the tables:** ADO wins on work management and manual testing, which is exactly why the hybrid model keeps them. Copilot in the IDE is the same on both platforms. GitHub wins wherever an agent or a security programme must act on the repository itself: autonomous pull requests, AI approvals, multi-agent choice, security campaigns with automatic and agentic Autofix, and agent governance.

---

## 3. Pillar 1: Agentic Software Delivery

### 3.1 From AI Assistant to Agent Fleet

GitHub's Universe 2026 vision describes a delivery system where developers set direction and stay accountable, while agents implement and verify changes. The building blocks on GitHub (status in brackets):

| Capability | What it does | Business impact |
|-----------|-------------|-----------------|
| Copilot cloud agent (GA) | Picks up an issue or Azure Boards work item, creates a branch, writes code and tests in an Actions sandbox, and opens a draft pull request for human review | Routine backlog items move without consuming senior engineer time |
| Copilot code review and approvals (GA; Max in preview) | AI review on every pull request, with depth matched to risk; Copilot can approve low-risk paths and count toward required approvals | Shorter review queues; humans focus on design and intent |
| Agentic Workflows (GA) and Copilot automations (rolling out) | Event-driven or scheduled AI workflows (issue triage, CI failure analysis, documentation, test improvement) that learn from outcomes | Continuous maintenance without bespoke scripts |
| Agent HQ (preview) | Assign the same task to Copilot, Claude, Codex, or a custom agent and compare results inside GitHub | Avoids lock-in to a single model vendor; best agent per task |
| Copilot projects (preview) | Parallel cloud agent sessions across multiple repositories, followed from phone, VS Code, CLI, or web | Cross-repo changes (framework upgrades, API migrations) handled as one coordinated project |
| GitHub intelligence | Agents use repository conventions, custom instructions, skills, and history | Changes follow team standards with less rework |

### 3.2 Why This Matters to the Business

- The unit of output is moving from "lines of code" to "completed work items". GitHub's Octoverse 2026 reports that agent-involved pull requests merged within two weeks at a 90% rate in September 2026, compared with about 86% for other pull requests. This is an observational adoption signal, not a controlled productivity measurement.
- Agents scale with the backlog rather than with headcount, which changes capacity planning for maintenance-heavy portfolios.
- Repositories that stay on Azure Repos keep IDE Copilot, preview AI review, and (for some customers) preview security Autofix. They do not get the cloud agent, AI approvals, Agent HQ, Copilot projects, or Agentic Workflows. The pilot should compare "GitHub with agents" against "ADO plus the Copilot you already have", not against an AI-free baseline.

### 3.3 Productivity Evidence

| Metric | Result | Source |
|--------|--------|--------|
| Agent-started pull requests | More than 40% of all pull requests on GitHub (Sept 2026) | [Octoverse 2026](https://github.blog/news-insights/octoverse/octoverse-commits-pushes-reach-new-highs-in-2026-as-developers-build-with-agents/) |
| Coding task speed | 55% faster task completion in a controlled experiment (2022) | GitHub research |
| PR merge rate | 15% increase after Copilot adoption | [Accenture joint study](https://github.blog/news-insights/research/research-quantifying-github-copilots-impact-in-the-enterprise-with-accenture/) |
| Task completion rate | 78% with Copilot vs 70% without | [Communications of the ACM](https://cacm.acm.org/research/measuring-github-copilots-impact-on-productivity/) |
| Developer efficiency value | $48.3M three-year present value for a 5,000-developer composite | [Forrester TEI](https://tei.forrester.com/go/github/enterprisecloud/) |

> [!NOTE]
> Earlier studies measured constrained task completion and enterprise PR and build outcomes, not cloud-agent throughput. Set a baseline (lead time, PR cycle time, backlog throughput) during the pilot rather than relying on vendor averages.

### 3.4 Modernised Developer Workflow

**Before (Azure Repos with IDE Copilot):**

```text
Developer -> picks work item -> codes with IDE assistant -> opens PR ->
optional Copilot review (preview) -> human review -> pipeline -> deploy
```

**After (GitHub with agents, Azure Boards retained):**

```text
Work item in Azure Boards -> "Create a pull request with Copilot" ->
cloud agent drafts PR on GitHub -> Copilot code review + CodeQL (+ advisory AI Scan) ->
Autofix proposes fixes -> developer reviews and merges ->
Azure Pipelines or Actions deploy -> Agentic Workflows triage follow-up issues
```

---

## 4. Pillar 2: Standardisation and InnerSource

### 4.1 Enterprise-Wide Consistency with Rulesets

GitHub Enterprise Cloud provides enterprise-level rulesets: centrally managed policy collections that enforce consistent standards across every repository and organisation.

| Feature | Description |
|---------|------------|
| Enterprise rulesets | Baseline protections across every default branch: required pull requests, reviews, status checks, linear history |
| Custom properties | Classify repositories (production, innersource, legacy, sandbox) and target governance rules dynamically |
| Evaluate mode | Trial a ruleset in monitoring mode before enforcement |
| Required workflows (ruleset rule) | Mandate specific Actions workflows (security scans, compliance checks) to pass before merge |
| Automatic Copilot code review | Request AI review on targeted repositories through rulesets |
| Commit metadata rules | Enforce commit message formats, author email domains, and signed commits |
| Push rules | Restrict by file path, extension, and size to block binaries or oversized assets |

### 4.2 InnerSource at Scale

- Internal repository visibility makes code discoverable across the enterprise
- Fork-and-pull-request contribution works across team boundaries
- CODEOWNERS routes reviews to domain experts automatically
- Repository templates and starter workflows standardise new projects
- The Actions Marketplace provides reusable, composable automation
- Codespaces gets new developers productive in minutes, not days
- Shared Copilot automations and custom agents let teams share proven AI workflows

### 4.3 Unified Toolchain in the Hybrid Model

| Aspect | Azure DevOps today | Target state |
|--------|-------------------|--------------|
| Code hosting | Azure Repos | GitHub repositories |
| CI/CD | Azure Pipelines | Azure Pipelines (retained) and GitHub Actions (new and migrated workloads) |
| Security scanning | GHAzDO or third-party | GitHub Secret Protection and Code Security (including AI Scan); GitHub Code Quality licensed separately where needed |
| Package management | Azure Artifacts | Azure Artifacts and/or GitHub Packages; package firewall (preview) for installs from any endpoint |
| Work management | Azure Boards | Azure Boards (retained, linked to GitHub with AB# and Copilot integration) |
| Test management | Azure Test Plans | Azure Test Plans (retained) |
| AI assistance | IDE Copilot; Copilot code review (preview); Autofix (closed preview) | Agent platform: cloud agent, code review with approvals, Autofix, Agentic Workflows, Agent HQ (preview) |

---

## 5. Pillar 3: Governance and Security

### 5.1 GitHub Advanced Security

#### Code Security (CodeQL and AI)

- Static analysis for injection, XSS, insecure deserialisation, and other vulnerability classes across the major languages
- Results inline in pull requests so developers fix before merge
- Copilot Autofix proposes remediation for CodeQL alerts; security campaigns (section 5.2) turn those fixes into a managed remediation programme
- AI Scan for pull requests (GA October 2026) covers languages and formats CodeQL does not, including PHP, Bash, Terraform, Dockerfiles, and Blazor. Findings are advisory with suggested fixes; they do not fail the code scanning check or block merges, and they do not run on fork or Dependabot pull requests. Whole-repository AI Scan is in public preview
- Code scanning for AI applications (public preview, October 2026) currently detects indirect prompt injection in agent and LLM code, with more AI-specific risk categories planned

#### Secret Protection

- Detection of 200+ secret types, AI-assisted password detection, and custom patterns
- Push protection blocks secrets before they reach the repository. A classifier that blocks secrets without a predefined format is in public preview (October 2026); it is off by default, requires AI-detected secrets and push protection, and consumes AI credits
- Public monitoring (GA October 2026) alerts the enterprise when its secrets are exposed publicly anywhere on GitHub
- Delegated bypass and audit-ready alert tracking

#### Supply Chain

- Dependency graph, SBOM export, and Dependabot alerts
- Reachability analysis (public preview, JavaScript and TypeScript) ranks alerts by whether your code calls the vulnerable function
- Dependabot security and scheduled version update pull requests
- Package firewall (public preview, npm first) blocks known malware, critical vulnerabilities, and brand-new package versions at install time for developers, CI runners (including Azure Pipelines agents), and coding agents

#### Code Quality (GA July 2026, $10 per active committer plus AI usage)

- CodeQL plus AI detection of maintainability and reliability issues, with org-level dashboards and coverage metrics

**Measured outcomes:**

- $9.3M three-year present value from security and compliance efficiency for the 5,000-developer composite ([Forrester TEI](https://tei.forrester.com/go/github/enterprisecloud/))
- Interviewee evidence of broader SAST coverage and security-process benefits ([Forrester TEI Spotlight: GHAS and Copilot](https://tei.forrester.com/go/GitHub/GitHubAdvancedSecuritySpotlight/)); treat individual interviewee figures as anecdotes, not forecasts

> [!IMPORTANT]
> GHAzDO offers the same core scanning engines and the same per-committer prices on Azure Repos, and Microsoft is previewing agentic Autofix there. The security argument for GitHub is not "scanning vs no scanning". It is **remediation at scale**: security campaigns with deadlines, owners, and automatic Autofix, GA Autofix with agentic assignment to Copilot, plus AI Scan, AI-application scanning, Dependabot updates, and one policy and audit plane for code and agents.

### 5.2 Fixing Security Debt at Scale: Security Campaigns

Most enterprises do not lack security findings; they lack the capacity to fix them. Thousands of open alerts sit in dashboards, and security teams spend their time chasing owners instead of reducing risk. Every scanner on the market, including GHAzDO, now finds the same classes of vulnerabilities. The differentiator is how quickly findings turn into merged fixes.

GitHub security campaigns are built for that problem. Azure DevOps uses the same name for something lighter: since April 2026, GHAzDO "security campaigns" let administrators create and share filtered views of alerts in the security overview. GitHub's campaigns are a managed remediation workflow.

| Step | What happens on GitHub |
|------|------------------------|
| 1. Select | The security team picks a related set of alerts (for example, every SQL injection alert, starting from a built-in template) across repositories in the organisation |
| 2. Commit | The campaign gets a name, a due date, and a campaign manager for questions and reviews |
| 3. Notify | Developers with write access are notified and see the campaign alerts in their normal workflow; for code scanning campaigns, tracking issues can be created per repository |
| 4. Fix | Code scanning alerts in the campaign are submitted to Copilot Autofix automatically (suggestions are generated where Autofix can produce one). Alerts can be assigned to developers or, with agentic Autofix enabled, assigned to Copilot in groups of 1-25; each assignment starts one agent session that opens one fix pull request and requests review. Agentic Autofix consumes AI credits and Actions minutes |
| 5. Track | Campaign progress is visible to the security team in the campaign view and available through the REST API for reporting |

**Why this matters to the business:**

- Security debt becomes a time-boxed programme with an owner and a deadline, which is what auditors and boards ask for.
- Fix work moves from scarce senior engineers to Autofix and Copilot, with humans reviewing the pull requests.
- Developers fix a cluster of similar issues at once, which builds skills and avoids context switching.
- Secret scanning campaigns (public preview) extend the same model to leaked credentials.

**What Azure DevOps offers instead:** a combined alerts view and shareable filtered alert views ("security campaigns") in the security overview, plus Copilot Autofix in a closed preview. Teams can track remediation as Azure Boards work items, but GHAzDO has no campaign deadlines, owners, developer notifications, or automatic Autofix, and "batch alert selection for Copilot Autofix" is listed for 2026 Q4.

> [!TIP]
> Make a security campaign part of the pilot. Pick one high-impact vulnerability class in the pilot repositories, run it as a campaign with a two-week deadline, and report alerts closed, mean time to remediate, and engineer hours spent. This gives the security leadership direct evidence, not vendor claims.

### 5.3 Governing AI Agents

As agents write a growing share of code, the governance question shifts from "who pushed this?" to "which agent, under whose authority, with what permissions?"

| Control | GitHub Enterprise Cloud | Azure DevOps |
|---------|------------------------|--------------|
| Dedicated AI administrator role | Yes (enterprise custom role) | No |
| Enterprise policies for agents, models, and MCP servers | Yes | Per-feature enablement (Copilot code review, Autofix) at org, project, or repo level |
| Audit of agent sessions, including third-party agents | Yes | Audit events for Copilot code review configuration |
| Agent firewall and sandboxed execution | Yes (Actions-based sandbox) | Autofix and code review run as pipeline jobs; no general-purpose cloud agent |
| AI spend budgets | Enterprise, org, cost-centre, and SKU-level budgets for AI credits | Azure Cost Management budgets on the Copilot meters, filterable by project tag |

### 5.4 Identity, Audit, and Compliance

**Enterprise Managed Users (EMU)** with Microsoft Entra ID:

- The identity provider is the single source of truth for user lifecycle
- SCIM deprovisioning suspends the GitHub account when Entra ID sends the request (subject to provisioning-cycle latency)
- Entra ID Conditional Access and Privileged Identity Management are supported
- Managed users cannot create public content or collaborate outside the enterprise; plan for this restriction if teams contribute to open source

**Audit log streaming** to Azure Event Hubs, Microsoft Sentinel, Splunk, and other SIEMs, with API and Git events, supports SOC 2, ISO 27001, and FedRAMP evidence collection.

| Capability | Description |
|-----------|-------------|
| Enterprise audit log | User, repository, security, and agent events with API access and streaming |
| Ruleset history and insights | Change history, rollback, bypass analytics |
| Data residency | GHE.com in the EU (including EFTA, Norway, and Switzerland), Australia, US, and Japan |
| Network controls | IP allow lists and Entra Conditional Access policy support |
| Bypass controls | Auditable bypass lists for rulesets and push protection; pair with Entra PIM for time-bound elevation |

### 5.5 Governance Comparison

| Governance area | Azure DevOps | GitHub Enterprise Cloud |
|----------------|-------------|------------------------|
| Branch protection | Per-repository branch policies; cross-repo policies per project | Enterprise, organisation, and repository rulesets with layered inheritance |
| Secret prevention | Push protection (GHAzDO) | Push protection, delegated bypass, AI password detection |
| Code scanning | CodeQL via pipeline tasks or default setup (GHAzDO); Autofix in closed preview | CodeQL default setup, AI Scan, GA Autofix |
| Security remediation programmes | Shared filtered alert views ("security campaigns"); remediation can be tracked manually in Azure Boards | Security campaigns with due dates, campaign managers, notifications, automatic Autofix, and agentic Autofix assignment to Copilot |
| Dependency security | Alerts with EPSS; malware alerts in preview | Alerts, Dependabot update PRs, reachability (preview) |
| AI governance | Per-feature enablement | Enterprise AI Controls and agent control plane |
| Audit logging | Organisation auditing and streaming in public preview ("Auditing GA" listed as "Future" on the ADO roadmap) | Enterprise audit log (GA) with streaming, Git events, and agent activity |
| Policy model | Organisation and project settings | Enterprise to organisation to repository cascade |

---

## 6. Financial Analysis

### 6.1 Licensing in November 2026

| Component | Price | Notes |
|-----------|-------|-------|
| GitHub Enterprise Cloud | $21/user/month | Includes Azure DevOps Basic access for matched Entra ID identities |
| Azure DevOps Basic | **Included** with GHEC | Keeps Boards, Pipelines, Test Plans viewing, and Artifacts access |
| Copilot access (new, eligible enterprises via account team) | **$0 seat** for GHEC-licensed users | No included credits; usage billed as AI credits from first use; same features and models as Copilot Enterprise; seats must still be assigned |
| Copilot Standalone (part of Copilot access) | $10/user/month | For users without a GHEC licence; usage billed separately |
| Copilot Business | $19/user/month | Includes 1,900 AI credits per user, pooled |
| Copilot Enterprise | $39/user/month | Includes 3,900 AI credits per user, pooled |
| GitHub Secret Protection | $19/active committer/month | Same price on GHAzDO |
| GitHub Code Security | $30/active committer/month | Same price on GHAzDO; AI Scan consumes Code Security AI credits |
| GitHub Code Quality | $10/active committer/month | Separately licensed; plus AI usage and Actions minutes |

> [!NOTE]
> Since June 2026, Copilot Business and Copilot Enterprise use **GitHub AI credits** (1 credit = $0.01) based on token consumption. Inline code completions and next edit suggestions remain unlimited and do not consume credits. Copilot code review also consumes Actions minutes. The billing model is chosen for the whole enterprise: "Copilot access" cannot be combined with Copilot Business or Enterprise seats in the same enterprise. Model the trade-off (predictable seats with included credits vs. no seat and pure consumption) with your account team before choosing.

### 6.2 Why the Economics Favour GitHub

- For eligible enterprises on "Copilot access", one GHEC licence covers GitHub, Azure DevOps Basic, and Copilot entitlement, with spend driven only by AI credit consumption. On ADO alone, Copilot code review and Autofix are additional Azure meters, and the cloud agent is not available at any price.
- Organisations already licensing GHAzDO can move the same Secret Protection and Code Security SKUs to GitHub at the same price and gain GA Autofix, AI Scan, and Dependabot updates.
- AI credits are pooled and governed by budgets at enterprise, organisation, and cost-centre level, which supports chargeback.
- GitHub-hosted runner prices fell by up to 39% in January 2026. A proposed per-minute platform charge for self-hosted runners was announced in December 2025 and then postponed; finance should track its status.
- Build the decision on incremental hybrid TCO (GHEC and AI credits, minus retired ADO and tooling costs) rather than on vendor ROI studies alone.

### 6.3 Forrester Total Economic Impact

Forrester's TEI study of GitHub Enterprise Cloud (commissioned by GitHub; composite: global organisation with 5,000 developers) quantified three-year, risk-adjusted present values:

| Benefit category | Impact |
|-----------------|--------|
| Total ROI | **376%** over three years |
| Net present value | **$67.9M** |
| Developer efficiency and productivity | $48.3M |
| Revenue impact of faster time to market | $18.4M |
| Security and compliance efficiency | $9.3M |
| Retiring the legacy tech stack | $8.2M |
| Faster time to productivity for new developers | $1.7M |

*Sources: [Forrester TEI of GitHub Enterprise Cloud](https://tei.forrester.com/go/github/enterprisecloud/) and [Forrester TEI Spotlight: GHAS and Copilot](https://tei.forrester.com/go/GitHub/GitHubAdvancedSecuritySpotlight/). Treat composite results as a benchmark, not a forecast for your estate. The study does not quantify cloud-agent throughput, which the pilot should measure directly.*

### 6.4 Migration Cost Considerations

| Item | Estimate |
|------|----------|
| Migration tooling | Free (GitHub Enterprise Importer, `gh ado2gh` CLI) |
| Migration effort | Minutes for small repositories to several hours for large repositories with thousands of pull requests; run a trial migration to calibrate (see the QA guide, section 4.2) |
| Pipeline rewiring | Script-assisted with `--rewire-pipelines`; validate every pipeline. Multi-repo pipelines, custom checkout steps, and environment-specific configuration typically need fixes (QA guide, section 4.4) |
| TFVC repositories | Convert to Git before migration |
| Git LFS and large repositories | LFS objects are transferred separately; very large repositories may need history clean-up |
| Training and enablement | Microsoft Learn and GitHub learning pathways (free) |
| Expert services | Optional GitHub Expert Services for complex estates |
| User reclamation | One-time mannequin remapping after migration |
| AI consumption | Budget AI credits explicitly; start with conservative budgets per cost centre and adjust from pilot telemetry |

---

## 7. For Developers Who Love Azure DevOps

Skeptical developers are usually right about something. Address the objection directly, acknowledge what ADO does well, and show what changes on their first day.

### 7.1 Objections and Honest Answers

| What developers say | Honest answer |
|--------------------|---------------|
| "Azure Boards is better than GitHub Issues." | Agreed for many teams, so Boards stays. You keep your process template, backlogs, and delivery plans. You gain the ability to click "Create a pull request with Copilot" on a work item, which only works when the repository is on GitHub. |
| "ADO now has Copilot code review, so why move?" | It is a public preview (Lite and Balanced) running as a pipeline job, and it is genuinely useful. On GitHub, review is GA, adds a multi-model Max level (preview), and Copilot approvals can count toward required reviews. More importantly, review is one capability among many: the cloud agent, Agentic Workflows, GA Autofix, and AI Scan all act on the same pull request. |
| "Our pipelines work. I do not want to rewrite YAML." | You do not have to. Azure Pipelines builds GitHub repositories, and `gh ado2gh` rewires pipelines. Move workloads to Actions opportunistically, not as a big bang. |
| "I prefer the ADO pull request UI." | Fair: ADO iterations, comment status, and suggestions are well liked. GitHub adds merge queue, stacked pull requests (GA; repositories using stacks saw 9% more merged code than peers), and Copilot approvals. Run the pilot and let the team compare on real work. |
| "Migration will lose history and links." | GitHub Enterprise Importer migrates Git history, branches, tags, pull requests with comments, and AB# work item links, within documented limits (LFS objects move separately; branch policies are recreated as rulesets). Boards and Test Plans data never moves. |
| "Test Plans has no GitHub equivalent." | Correct, so Test Plans stays and keeps working with the build outputs. |
| "This is a vendor push." | Microsoft owns both products and is the one recommending the move. The Azure DevOps team itself describes GitHub as where agentic experiences "land first". |
| "It will cost more." | GHEC includes Azure DevOps Basic, and eligible enterprises can move to "Copilot access" with a $0 Copilot seat charge. Spend is governed with AI credit budgets. Validate with an incremental TCO model during the pilot. |
| "Agents will flood us with low-quality PRs." | Agent PRs are drafts that require human approval and must pass the same rulesets, CodeQL, and required checks as human PRs (AI Scan adds advisory findings). Octoverse 2026 shows agent PRs merging at a slightly higher two-week rate than other PRs. |
| "We have TFVC or huge monorepos." | Correct concern. TFVC must be converted to Git first, and very large repositories may exceed importer limits until history is trimmed. These can block a specific repository's migration until resolved, so schedule them in later waves. |

### 7.2 What Developers Keep

- Azure Boards work items, queries, sprints, dashboards, and AB# links
- Azure Test Plans, test suites, and manual test runs
- Azure Pipelines definitions, service connections, environments, and approvals
- Azure Artifacts feeds and upstream sources
- The same Git workflow and the same IDE

### 7.3 What Developers Gain on Day One

- Assign a well-scoped work item or issue to the cloud agent and review a draft PR instead of writing boilerplate
- AI review on every PR, and Copilot approvals for low-risk paths your admins allow
- Autofix suggestions for CodeQL alerts in the PR, plus advisory AI Scan findings for Terraform, Dockerfiles, and scripts
- Dependabot PRs that keep dependencies current without manual tracking
- Codespaces for consistent, ready-to-code environments
- Merge queue and stacked PRs for breaking large changes into reviewable pieces
- Skills on the platform most of the industry uses (EMU accounts stay inside the enterprise; open source work uses a separate personal account)

> [!TIP]
> Recruit two or three respected ADO champions into the pilot. Let them choose the repositories, define the success criteria, and present the results. Peer evidence persuades developers more than any slide.

---

## 8. Migration Approach: The Hybrid Strategy

### 8.1 Recommended Architecture

```text
+--------------------------------------------------+
|              GITHUB ENTERPRISE CLOUD              |
|                                                  |
|  +------------+  +------------+  +------------+  |
|  |   Source   |  |  GitHub    |  |  GitHub    |  |
|  |   Code     |  |  Actions   |  |  Advanced  |  |
|  |  (Repos)   |  |  (CI/CD)   |  |  Security  |  |
|  +------------+  +------------+  +------------+  |
|  +------------+  +------------+  +------------+  |
|  |  Copilot   |  | Agent HQ & |  |  AI        |  |
|  |  cloud     |  | automations|  |  Controls  |  |
|  |  agent     |  |            |  |  & audit   |  |
|  +------------+  +------------+  +------------+  |
+----------------------+---------------------------+
                       | AB# links, Copilot from work items,
                       | pipeline triggers, MCP
+----------------------v---------------------------+
|              AZURE DEVOPS (RETAINED)              |
|                                                  |
|  +------------+  +------------+  +------------+  |
|  |   Azure    |  |   Azure    |  |   Azure    |  |
|  |   Boards   |  |  Pipelines |  | Test Plans |  |
|  | (Work Mgmt)|  | (Optional) |  | (Testing)  |  |
|  +------------+  +------------+  +------------+  |
+--------------------------------------------------+
```

### 8.2 Migration Phases

#### Phase 1: Pilot (4-6 weeks)

- Select 2-3 representative repositories with ADO champions on the team
- Migrate with `gh ado2gh`; validate Azure Boards and Azure Pipelines integration
- Enable Copilot (seat-based plans or "Copilot access"; the choice applies enterprise-wide), Copilot code review, and GHAS
- Connect Azure Boards to GitHub and test "Create a pull request with Copilot" from work items
- Run one security campaign on a high-impact vulnerability class with a two-week deadline
- Set AI credit budgets and capture baseline DORA, PR, and security remediation metrics

#### Phase 2: Expansion (8-12 weeks)

- Migrate remaining repositories in waves grouped by team or product
- Enable enterprise rulesets in evaluate mode, then enforce
- Roll out Copilot, GHAS, and Code Quality organisation-wide
- Configure Enterprise AI Controls: AI admin role, agent and MCP policies, third-party agent enablement
- Establish InnerSource practices and repository standards

**Governance implementation priority (from the [ADO migration assessment](./ado-to-github-migration-assessment.md)):**

- P1 critical: enable EMU with SCIM from Entra ID; stream audit logs to Sentinel; require fine-grained PATs; restrict outside collaborators; set the default `GITHUB_TOKEN` to read-only; implement JIT access with Entra PIM; create custom repository roles; require admin approval for GitHub App installs; define AI credit budgets and agent policies
- P2 enhanced: environment protection rules for deployment approvals; runner groups for workload isolation; quarterly dormant-user reviews; enable the package firewall for CI and agents
- P3 operational excellence: Actions security hardening; continuous monitoring of app and agent activity

#### Phase 3: Optimisation (ongoing)

- Scale cloud agent usage across backlogs; evaluate Agent HQ third-party agents as they reach GA
- Introduce Agentic Workflows and shared Copilot automations for triage, CI failure analysis, and documentation
- Migrate CI/CD from Azure Pipelines to GitHub Actions where it simplifies operations
- Build custom agents and MCP servers for organisation-specific tooling
- Refine governance with rule insights and agent audit data

### 8.3 What Gets Preserved

| Artifact | Preserved? |
|----------|-----------|
| Complete commit history | Yes |
| All branches and tags | Yes |
| Pull requests, comments, and reviews | Yes, within documented importer limits |
| AB# work item links on pull requests | Yes |
| Git LFS objects | Transferred separately |
| Branch policies | Recreated as rulesets |
| Azure Pipelines | Yes, after rewiring and validation |
| Azure Boards work items | Retained in ADO (not migrated) |
| Azure Test Plans | Retained in ADO (not migrated) |
| User attribution | Yes, through mannequin reclaim |

### 8.4 Success Metrics

**DORA hypotheses** (validate against the pilot baseline; these are targets to test, not guarantees):

| Metric | Target improvement |
|--------|-------------------|
| Deployment frequency | 2-3x increase |
| Lead time for changes | 50% reduction |
| Change failure rate | 30% reduction |
| Mean time to recovery | 40% reduction |

**Agentic delivery and platform KPIs:**

| Metric | Target |
|--------|--------|
| Share of eligible backlog items started by an agent | 25%+ after six months |
| Agent PR merge rate | At or above the human PR merge rate |
| Pull request cycle time | 25-35% reduction |
| Copilot code review coverage | 100% of PRs on production repositories |
| GHAS coverage | 80%+ of repositories with code scanning |
| Secret scanning coverage | 100% of repositories with push protection |
| Vulnerability remediation time | 50-75% reduction |
| Security campaign completion | 80%+ of campaign alerts closed by the campaign due date |
| Open critical and high alerts | Downward trend quarter over quarter |
| Ruleset compliance | 95%+ of repositories |
| AI spend vs budget | Within ±10% per cost centre |
| Developer satisfaction | 70%+ positive in quarterly survey |

---

## 9. Risk Assessment and Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Developer resistance ("ADO already has AI") | High | Medium | Use section 7; involve ADO champions; publish the honest feature comparison; measure pilot results |
| Developer disruption during migration | Medium | Medium | Phased waves; off-hours execution; communication plan |
| Pipeline breakage after rewiring | Medium | High | Trial migrations; validation checklist per pipeline; rollback by keeping source repos read-only until sign-off |
| Unpredictable AI consumption costs | Medium | Medium | AI credit budgets at enterprise, org, and cost-centre level; model policies; compare seat-based plans with "Copilot access" (enterprise-wide choice) before committing |
| Low-quality or risky agent output | Medium | High | Draft PRs only; rulesets require human approval and passing checks; CodeQL on agent PRs; package firewall for agent installs; restrict Copilot approvals to low-risk paths |
| Preview features change or slip | Medium | Low | Base the business case on GA features; treat previews as upside |
| Data residency requirements | Low | High | GHE.com regions in EU, Australia, US, Japan; confirm Copilot data residency and model availability for your region |
| Integration gaps with Azure Boards | Low | Medium | Boards integration is GA and actively developed (Copilot from work items, AB# in PR Development section) |
| Security policy migration complexity | Medium | Medium | Map ADO branch policies to rulesets; roll out in evaluate mode |
| EMU restrictions surprise developers | Medium | Low | Communicate early that managed accounts cannot contribute publicly; document the personal-account path for open source |

**When to wait:** if a team relies on TFVC without a conversion plan, needs Azure DevOps Server on-premises with no cloud option, or is in the middle of a regulated release freeze, schedule it in a later wave. The hybrid model allows teams to move independently.

---

## 10. Executive Recommendation

### The Case in Six Points

1. **Microsoft recommends it.** Azure DevOps leadership and product managers direct customers to GitHub repositories for agentic AI, and the ADO AI features shipped in 2026 are explicitly positioned for teams that are "not ready yet".
2. **Cloud agent workflows require GitHub.** The Copilot cloud agent, Copilot approvals, Agentic Workflows, and enterprise-wide agent session governance require code on GitHub, and Agent HQ and Copilot projects extend that lead in preview. Local agent sessions work with Azure Repos, and ADO now offers AI review (preview) and agentic security fixes (closed preview), but no cloud agent that takes a work item to a pull request on Azure Repos.
3. **The economics have shifted.** GHEC includes Azure DevOps Basic, and eligible enterprises can move to "Copilot access" with no Copilot seat charge for GHEC users. Security SKUs cost the same on both platforms, with more GA capability on GitHub.
4. **Security debt gets fixed, not just found.** GitHub security campaigns, backed by GA Autofix and agentic Autofix assignment to Copilot, turn alert backlogs into owned, time-boxed remediation programmes; ADO's campaigns are shared alert views. Together with AI Scan and Dependabot updates, this has no GA equivalent on Azure Repos, and AI-application scanning, reachability analysis, and the package firewall are arriving in preview.
5. **The risk is managed.** The hybrid model keeps Azure Boards, Test Plans, Pipelines, and Artifacts. GitHub Enterprise Importer migrates history and pull requests, and migration proceeds in waves.
6. **The opportunity cost grows.** More than 40% of pull requests on GitHub already start from an agent. The pilot will show how much of that throughput your teams can capture; every quarter without it is a quarter without that data or that capacity.

### Recommended Action

**Approve a funded pilot followed by phased migration of source code repositories from Azure DevOps to GitHub Enterprise Cloud**, following the hybrid model in this document, with an incremental TCO model, explicit expansion gates after the pilot, and AI credit budgets and Enterprise AI Controls configured from day one.

---

## 11. References and Sources

### Microsoft Official Sources

1. [Azure DevOps with GitHub Repositories: Your Path to Agentic AI](https://devblogs.microsoft.com/devops/azure-devops-with-github-repositories-your-path-to-agentic-ai/), Azure DevOps Blog
2. [Azure DevOps and GitHub: Next Steps in the Path to Agentic AI](https://devblogs.microsoft.com/devops/azure-devops-and-github-repositories-next-steps-in-the-path-to-agentic-ai/), Azure DevOps Blog
3. [Agentic DevOps: Evolving Software Development with GitHub Copilot and Microsoft Azure](https://azure.microsoft.com/en-us/blog/agentic-devops-evolving-software-development-with-github-copilot-and-microsoft-azure/), Azure Blog
4. [Azure DevOps to GitHub Migration Playbook](https://devblogs.microsoft.com/all-things-azure/azure-devops-to-github-migration-playbook-unlocking-agentic-devops/), All Things Azure
5. [Azure DevOps Basic Usage Included with GitHub Enterprise](https://devblogs.microsoft.com/devops/azure-devops-basic-usage-included-with-github-enterprise/), Azure DevOps Blog
6. [Azure DevOps Roadmap](https://learn.microsoft.com/en-us/azure/devops/release-notes/features-timeline), Microsoft Learn
7. [Copilot Code Reviews for Azure Repos (public preview)](https://devblogs.microsoft.com/devops/copilot-code-reviews-for-azure-repos-public-preview/), Azure DevOps Blog
8. [Copilot Autofix for GitHub Advanced Security for Azure DevOps](https://devblogs.microsoft.com/devops/copilot-autofix-for-github-advanced-security-for-azure-devops/), Azure DevOps Blog
9. [Sprint 280 update: Copilot Autofix agentic foundation](https://learn.microsoft.com/en-us/azure/devops/release-notes/2026/sprint-280-update), Microsoft Learn
10. [Use GitHub Copilot with Azure Boards](https://learn.microsoft.com/en-us/azure/devops/boards/github/work-item-integration-github-copilot), Microsoft Learn
11. [Billing for GitHub Advanced Security for Azure DevOps](https://learn.microsoft.com/en-us/azure/devops/repos/security/github-advanced-security-billing), Microsoft Learn
12. [Introduction to Azure DevOps to GitHub Migration](https://learn.microsoft.com/en-us/training/modules/introduction-to-ado-to-github-migration/), Microsoft Learn
13. [Copilot Autofix for Code Security Alerts in Azure Repos (Preview)](https://learn.microsoft.com/en-us/azure/devops/repos/security/github-advanced-security-autofix), Microsoft Learn
14. [Azure DevOps Auditing](https://learn.microsoft.com/en-us/azure/devops/organizations/audit/azure-devops-auditing), Microsoft Learn

### GitHub Official Sources

15. [GitHub Universe 2026: Evolving Every Layer of the Stack](https://github.blog/news-insights/company-news/github-universe-2026-evolving-every-layer-of-the-stack/), GitHub Blog
16. [Octoverse 2026: Commits and Pushes Reach New Highs as Developers Build with Agents](https://github.blog/news-insights/octoverse/octoverse-commits-pushes-reach-new-highs-in-2026-as-developers-build-with-agents/), GitHub Blog
17. [Pick Your Agent: Use Claude and Codex on Agent HQ](https://github.blog/news-insights/company-news/pick-your-agent-use-claude-and-codex-on-agent-hq/), GitHub Blog
18. [Enterprise AI Controls and Agent Control Plane GA](https://github.blog/changelog/2026-02-26-enterprise-ai-controls-agent-control-plane-now-generally-available/), GitHub Changelog
19. [Copilot Code Review: Max and Approvals](https://github.blog/changelog/2026-10-28-copilot-code-review-merge-with-confidence-with-max-and-approvals/), GitHub Changelog
20. [GitHub Copilot App Universe Releases (Copilot projects)](https://github.blog/changelog/2026-10-28-github-copilot-app-universe-releases/), GitHub Changelog
21. [Integrating Copilot Cloud Agent with Azure Boards](https://docs.github.com/en/copilot/how-tos/copilot-integrations/integrate-cloud-agent-with-azure-boards), GitHub Docs
22. [What's Changing with GitHub Enterprise and Copilot Billing](https://docs.github.com/en/copilot/get-started/whats-changing-with-github-enterprise-and-copilot), GitHub Docs
23. [GitHub Copilot Is Moving to Usage-Based Billing](https://github.blog/news-insights/company-news/github-copilot-is-moving-to-usage-based-billing/), GitHub Blog
24. [GitHub Well-Architected: Azure DevOps Migration Guide](https://wellarchitected.github.com/library/scenarios/migrations/azure-devops-migration-guide/), GitHub Well-Architected
25. [About Migrations from Azure DevOps to GitHub](https://docs.github.com/en/migrations/ado/understand-migrations-from-azure-devops-to-github), GitHub Docs

### Security and Governance

26. [AI Scan for Pull Requests GA](https://github.blog/changelog/2026-10-15-ai-scan-for-pull-requests-generally-available/), GitHub Changelog
27. [About Security Campaigns](https://docs.github.com/en/enterprise-cloud@latest/code-security/concepts/security-at-scale/about-security-campaigns), GitHub Docs
28. [Fixing Alerts in a Security Campaign (assigning alerts to Copilot)](https://docs.github.com/en/enterprise-cloud@latest/code-security/how-tos/manage-security-alerts/remediate-alerts-at-scale/fixing-alerts-in-security-campaign), GitHub Docs
29. [GHAzDO Sprint 272 Update: combined alerts view and security campaigns in security overview](https://learn.microsoft.com/en-us/azure/devops/release-notes/2026/ghazdo/sprint-272-update), Microsoft Learn
30. [Push Protection Beyond Predefined Secret Patterns (public preview)](https://github.blog/changelog/2026-10-28-push-protection-beyond-predefined-secret-patterns/), GitHub Changelog
31. [October 2026 Changelog: AI-application scanning, repository AI Scan, push protection classifier, public monitoring](https://github.blog/changelog/month/10-2026/), GitHub Changelog
32. [Prioritize Dependabot Alerts with Reachability Analysis](https://github.blog/changelog/2026-10-28-prioritize-dependabot-alerts-with-reachability-analysis/), GitHub Changelog
33. [GitHub Package Firewall in Public Preview](https://github.blog/changelog/2026-10-20-github-package-firewall-in-public-preview/), GitHub Changelog
34. [GitHub Code Quality Is Now Generally Available](https://github.blog/changelog/2026-07-20-github-code-quality-is-now-generally-available/), GitHub Changelog
35. [Introducing GitHub Secret Protection and GitHub Code Security](https://github.blog/changelog/2025-03-04-introducing-github-secret-protection-and-github-code-security/), GitHub Changelog
36. [Enforcing Code Governance with Rulesets](https://docs.github.com/en/enterprise-cloud@latest/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-policies-for-code-governance), GitHub Docs
37. [About GitHub Enterprise Cloud with Data Residency](https://docs.github.com/en/enterprise-cloud@latest/admin/data-residency/about-github-enterprise-cloud-with-data-residency), GitHub Docs

### Research and Economics

38. [Forrester Total Economic Impact of GitHub Enterprise Cloud](https://tei.forrester.com/go/github/enterprisecloud/)
39. [Forrester TEI Spotlight: GHAS and Copilot](https://tei.forrester.com/go/GitHub/GitHubAdvancedSecuritySpotlight/)
40. [Quantifying GitHub Copilot's Impact in the Enterprise with Accenture](https://github.blog/news-insights/research/research-quantifying-github-copilots-impact-in-the-enterprise-with-accenture/), GitHub Blog
41. [Measuring GitHub Copilot's Impact on Productivity](https://cacm.acm.org/research/measuring-github-copilots-impact-on-productivity/), Communications of the ACM

### Related Documents in This Repository

42. [ADO to GitHub Migration Assessment](./ado-to-github-migration-assessment.md)
43. [ADO to GitHub Migration QA](./ADO-to-GitHub-Migration-QA.md)
44. [ADO to GitHub Migration Executive Summary](./ADO-to-GitHub-Migration-Executive-Summary.md)

---

*Document prepared with data sourced from official Microsoft, GitHub, and Azure documentation as of November 2026.*

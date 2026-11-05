# Executive Summary: Moving Source Code from Azure DevOps to GitHub

> **Document status**
>
> - **Last reviewed:** 2026-11-04
> - **Audience:** Executive sponsors, CIO/CTO, finance, and engineering leadership
> - **Detail:** Every claim below is sourced and expanded in the full [Business Case](./ADO-to-GitHub-Migration-Business-Case.md). Preview features are labelled; the recommendation rests on generally available (GA) capabilities.
> - **Authorship:** Drafted with AI assistance (GitHub Copilot, multi-model review) and reviewed by a human maintainer before publication.

## The Decision

We recommend approving a **funded 4-6 week pilot, followed by a phased migration of source code repositories from Azure DevOps (ADO) to GitHub Enterprise Cloud (GHEC)**. Azure Boards, Azure Test Plans, and (where they add value) Azure Pipelines and Azure Artifacts stay in place. Nothing that teams rely on for planning, testing, or releasing is switched off.

## What Changed in 2026, Honestly

Azure DevOps is no longer an AI-free platform. In 2026 Microsoft added GitHub Copilot code review to Azure Repos (public preview), an agentic Copilot Autofix for security alerts (closed preview), and an Azure DevOps MCP Server. Copilot in the IDE works the same on both platforms.

So the case for GitHub is not "AI only exists on GitHub." It is this:

> **AI features can be added to any platform. Agents that deliver work need the code, compute, identity, policy, and audit trail in one place. That place is GitHub.**

Microsoft's own Azure DevOps product team says the same: GitHub is "where the newest AI-powered and agentic development experiences land first" (Azure DevOps Blog, June 2026).

## Four Reasons to Invest

### 1. Cloud agents only work where the code lives

The Copilot cloud agent turns an issue or an Azure Boards work item into a tested, draft pull request with no developer at the keyboard. It runs only against GitHub repositories. Microsoft documents that even the Azure Boards "Create a pull request with Copilot" button does not support Azure Repos.

On GitHub, more than **40% of pull requests** in September 2026 started from an agent's first draft, up from 17% in March (Octoverse 2026). Teams that stay on Azure Repos cannot take part in that shift.

### 2. Security debt gets fixed, not just found

Both platforms now find vulnerabilities with the same engines (CodeQL, secret scanning, push protection) at the same price. Finding is no longer the problem; fixing is. Thousands of open alerts sit in dashboards while security teams chase owners.

**GitHub security campaigns turn findings into fixes.** Azure DevOps added a feature with the same name in April 2026, but there it is a shared, filtered view of alerts. On GitHub, the security team selects a related set of alerts across repositories (for example, every SQL injection finding), sets a deadline and a campaign manager, and GitHub runs the workflow:

- developers are notified inside their normal workflow
- code scanning alerts are submitted to Copilot Autofix automatically, which suggests fixes where it can
- with agentic Autofix enabled, up to 25 code scanning alerts at a time can be assigned to Copilot, which opens a fix pull request for human review
- progress is tracked for the security team and for audit reporting

On Azure DevOps, Autofix is a closed preview, batch selection is on the 2026 Q4 roadmap, and campaigns carry no deadlines, owners, or notifications. GitHub also adds scanning for AI-application risks, starting with prompt injection (preview), and alerts when our secrets leak publicly anywhere on GitHub (GA).

The result is what boards and auditors ask for: security debt run as an owned, time-boxed programme with measurable burn-down.

### 3. The economics now favour GitHub

| Item | What it means for us |
|------|---------------------|
| GitHub Enterprise Cloud, $21/user/month | Includes Azure DevOps Basic for matched Entra ID users, so Boards access stays covered (full Test Plans authoring still needs its own licence) |
| "Copilot access" (since 28 Oct 2026, eligible enterprises via account team) | **$0 Copilot seat charge** for GHEC users; pay only for AI credits used, under enterprise budgets; an enterprise-wide choice that cannot be combined with Copilot Business or Enterprise seats |
| Security (Secret Protection $19, Code Security $30 per active committer) | Same price on GitHub and on ADO, with more GA capability on GitHub |
| Forrester TEI (commissioned by GitHub, 5,000-developer composite) | **376% ROI**, **$67.9M NPV** over three years; $48.3M from developer efficiency |

We will validate these numbers with an incremental total cost of ownership model during the pilot rather than rely on vendor studies.

### 4. GitHub governs agents, not just code

As agents write more of our code, the control question becomes "which agent, under whose authority, with what permissions?" GitHub's Enterprise AI Controls (GA February 2026) provide an AI administrator role, enterprise-wide agent and model policies, agent session audit (including third-party agents), and AI spend budgets by cost centre. ADO manages its AI features one at a time.

## Where GitHub Is Decisively Ahead

| Capability | GitHub | Azure DevOps |
|-----------|--------|--------------|
| Cloud agent: work item to pull request | GA | Not available for Azure Repos |
| Copilot code review | GA, plus multi-model Max (preview) | Public preview |
| Copilot approvals counting toward required reviews | GA | Not available |
| Security campaigns with deadlines, owners, notifications, and automatic Autofix | GA (code scanning); secret scanning in preview | Shared filtered alert views only |
| Copilot Autofix for security alerts | GA | Closed preview |
| AI security scanning for languages CodeQL does not cover | GA for pull requests (advisory); repository scan in preview | Roadmap "Future" |
| Scheduled dependency update pull requests (Dependabot) | GA | Not available (dependency fix PRs in closed Autofix preview) |
| Agentic Workflows (triage, CI failure analysis, docs) | GA | Not available |
| Enterprise AI and agent governance | GA | Per-feature settings |
| Stacked pull requests and merge queue | GA | Not available |
| Third-party agents (Claude, Codex) and multi-repo Copilot projects | Preview | Not available |

**Where ADO stays ahead, and stays in use:** work management (Azure Boards) and manual test management (Azure Test Plans). The hybrid model keeps both.

## Bringing Developers With Us

Many of our engineers like ADO, and they have good reasons. We will win them over with evidence, not mandates.

| They will say | Our answer |
|--------------|------------|
| "ADO already has Copilot." | It does, in the IDE and in preview for reviews. It does not have cloud agents, AI approvals, or Dependabot. The pilot will compare GitHub against ADO plus the Copilot we already have. |
| "Boards and Test Plans are better." | Agreed. They stay, and Boards gains a "Create a pull request with Copilot" button once the repository is on GitHub. |
| "I don't want to rewrite pipelines." | You don't have to. Azure Pipelines builds GitHub repositories; move to GitHub Actions only where it helps. |
| "We will lose history." | GitHub Enterprise Importer migrates Git history, branches, pull requests, comments, and work item links within documented limits. |

Respected ADO champions will choose the pilot repositories, define success criteria, and present the results.

## Risks and Controls

| Risk | Control |
|------|---------|
| AI consumption costs | AI credit budgets at enterprise, organisation, and cost-centre level from day one |
| Low-quality agent output | Agent pull requests are drafts that require human approval and pass the same rulesets and checks |
| Pipeline disruption | Trial migrations, per-pipeline validation, source repositories kept read-only until sign-off |
| Developer resistance | Honest feature comparison, ADO champions in the pilot, decisions based on measured results |
| Preview features slipping | The decision rests on GA features; previews are upside |
| Edge cases (TFVC, very large repositories) | Converted or trimmed first and scheduled in later waves |

## The Ask

| Phase | Duration | Scope | Exit gate |
|-------|----------|-------|-----------|
| Pilot | 4-6 weeks | 2-3 representative repositories; Copilot, code review, GHAS, one security campaign, Boards integration, AI budgets | Measured improvement in PR cycle time, backlog throughput, and security alerts closed vs baseline; no pipeline regressions; positive champion and CISO review |
| Expansion | 8-12 weeks | Remaining repositories in waves; enterprise rulesets; AI governance | Ruleset compliance above 95%; AI spend within budget |
| Optimisation | Ongoing | Scale cloud agents and Agentic Workflows; move pipelines to Actions where it simplifies | Quarterly review of DORA metrics, agent PR share, and cost |

**Decision requested:** approve the pilot budget and executive sponsorship now, with expansion contingent on the pilot exit gate.

## Key Sources

- [Full Business Case](./ADO-to-GitHub-Migration-Business-Case.md) (detailed comparison, risks, and references)
- [Azure DevOps Roadmap](https://learn.microsoft.com/en-us/azure/devops/release-notes/features-timeline), Microsoft Learn
- [Use GitHub Copilot with Azure Boards](https://learn.microsoft.com/en-us/azure/devops/boards/github/work-item-integration-github-copilot), Microsoft Learn
- [Copilot Autofix for GitHub Advanced Security for Azure DevOps](https://devblogs.microsoft.com/devops/copilot-autofix-for-github-advanced-security-for-azure-devops/), Azure DevOps Blog
- [About Security Campaigns](https://docs.github.com/en/enterprise-cloud@latest/code-security/concepts/security-at-scale/about-security-campaigns), GitHub Docs
- [GitHub Universe 2026](https://github.blog/news-insights/company-news/github-universe-2026-evolving-every-layer-of-the-stack/), GitHub Blog
- [Octoverse 2026](https://github.blog/news-insights/octoverse/octoverse-commits-pushes-reach-new-highs-in-2026-as-developers-build-with-agents/), GitHub Blog
- [What's Changing with GitHub Enterprise and Copilot Billing](https://docs.github.com/en/copilot/get-started/whats-changing-with-github-enterprise-and-copilot), GitHub Docs
- [Forrester Total Economic Impact of GitHub Enterprise Cloud](https://tei.forrester.com/go/github/enterprisecloud/)

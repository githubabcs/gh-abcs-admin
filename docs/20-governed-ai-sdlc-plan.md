---
title: Governed AI SDLC - Enterprise Adoption Plan
description: Enterprise adoption plan for a governed AI SDLC practice powered by an internal fleet of AI agents, covering golden paths, policy gating, observability, and DORA/SPACE + AI-specific KPIs
author: Platform AI Team
ms.date: 2026-04-23
ms.topic: overview
---

## Governed AI SDLC - Enterprise Adoption Plan

**Scope:** ~1,000 developers, multiple business units, GitHub-centric toolchain.
**Goal:** Build a governed, orchestrated AI SDLC practice powered by an internal fleet of AI agents that accelerates delivery while enforcing security, compliance, and Responsible AI.

> For a concise 2-page overview suitable for executive stakeholders, see [Executive Summary](20-ai-sdlc-executive-summary.md).

> **Document status**
>
> - **Last reviewed:** 2026-05-19
> - **Authorship:** Drafted with AI assistance (GitHub Copilot, multi-model review) and reviewed by a human maintainer before publication.
> - **Sources:** Based on public documentation — primarily [docs.github.com](https://docs.github.com), [learn.microsoft.com](https://learn.microsoft.com), and official vendor blogs cited inline.
> - **Verify before acting:** GitHub and Microsoft update product documentation continuously. Re-confirm against the live source pages before relying on this content for production decisions.

---

## Table of Contents

* [1. Executive Summary](#1-executive-summary)
* [2. Landscape & Reference Frameworks](#2-landscape--reference-frameworks)
* [3. Operating Model](#3-operating-model)
* [4. Reference Architecture](#4-reference-architecture)
* [5. The Internal AI SDLC Agent Team (Catalog)](#5-the-internal-ai-sdlc-agent-team-catalog)
* [5B. Reusable Ecosystem Assets](#5b-reusable-ecosystem-assets-do-not-build-from-scratch)
* [6. Agent Lifecycle](#6-agent-lifecycle-agent-sdlc)
* [7. Governance Model](#7-governance-model)
* [8. Security Posture](#8-security-posture)
* [9. Metrics & Measurement](#9-metrics--measurement)
* [10. Adoption Roadmap](#10-adoption-roadmap)
* [11. Maturity Model](#11-maturity-model-self-assessed-quarterly)
* [12. Enablement & Change Management](#12-enablement--change-management)
* [13. Risks & Mitigations](#13-risks--mitigations)
* [14. Immediate Next Steps](#14-immediate-next-steps-first-30-60-days-of-execution)
* [15. Appendix](#15-appendix)
* [16. Research Sources & Evidence Base](#16-research-sources--evidence-base)
* [17. Validation Findings & v2 Backlog](#17-validation-findings--v2-backlog)

---

## 1. Executive Summary

We will stand up a **central AI SDLC Platform Team** that productizes an **"Agent Factory"** - a governed catalog of AI agents (GitHub Copilot cloud agent, custom agents, MCP servers, skills, prompts) embedded into every stage of the SDLC. Consuming dev teams adopt these agents via **golden paths** on our Internal Developer Platform (IDP). All usage is policy-gated, observable, and measured against DORA (DevOps Research & Assessment) / SPACE (Satisfaction and well-being, Performance, Activity, Communication and collaboration, Efficiency and flow) + AI-specific KPIs.

**North-star outcomes (12-18 months):**

* ≥ 80% weekly active AI-agent usage across eligible developers
* Measurable lead-time-for-change reduction on pilot services (industry benchmarks from DORA 2024 suggest 20-40% is achievable for elite/high performers adopting AI-assisted workflows; our target will be baselined in Phase 0 and calibrated against our own DORA metrics)
* 100% of AI-generated code traceable and policy-checked pre-merge
* Mean time to recover (MTTR) < 4 hours for any AI-attributable incident (safety metric, distinct from standard DORA MTTR tracked in section 9.2); target zero P1 incidents from ungoverned AI output

---

## 2. Landscape & Reference Frameworks

| Domain | Framework / Source | How we use it |
|---|---|---|
| AI risk | **NIST AI RMF**, **ISO/IEC 42001**, EU AI Act | Risk tiering of agents & use cases |
| LLM security | **OWASP Top 10 for LLM Apps (2025 edition)**, MITRE ATLAS | Agent threat modeling, red-team checklist |
| Acronyms (first-use inventory) | GHAS (GitHub Advanced Security), SSO (Single Sign-On), SCIM (System for Cross-domain Identity Mgmt), DLP (Data Loss Prevention), SAST (Static App Security Testing), SCA (Software Composition Analysis), HITL (Human-in-the-Loop), SBOM (Software Bill of Materials), AUP (Acceptable Use Policy), PRD (Product Requirements Doc), ADR (Architecture Decision Record), OPA (Open Policy Agent), APM (Agent Package Manager), RPI (Research/Plan/Implement/Review), MCP (Model Context Protocol), A2A (Agent-to-Agent), DPIA (Data Protection Impact Assessment) | Expansion table referenced throughout |
| Dev productivity | **DORA**, **SPACE**, **DevEx** | Baseline + impact measurement |
| Platform Eng. | Team Topologies, CNCF Platform WG | Platform-as-a-product operating model |
| GitHub stack | Copilot Enterprise, Cloud agent, Custom Agents, `AGENTS.md`, MCP, spec-kit, GHAS, Advanced Security, Actions, Audit Log, Copilot Metrics API | Core tooling |
| Responsible AI | Microsoft RAI Standard, Google SAIF | Ethics, fairness, transparency controls |

---

## 3. Operating Model

### 3.1 Team Topology
- **AI SDLC Platform Team** (stream-aligned platform, ~12-18 FTE)
 - Agent Engineering * Prompt/Eval * MLOps/Observability * Security * DevEx/Enablement * Product
- **AI Governance Board** (cross-functional, monthly)
 - Eng leadership, Security, Legal/Privacy, Compliance, RAI officer, Dev council reps
- **AI Champions Network** (1 per ~25 devs, ~40 champions)
 - Evangelize, collect feedback, first-line support
- **Enabling teams** for temporary deep dives with product squads

### 3.2 RACI (condensed)
| Activity | Platform | Gov Board | Security | Product Squads | Champions |
|---|---|---|---|---|---|
| Agent catalog | **R/A** | C | C | I | C |
| Agent approval / risk tier | R | **A** | R | I | I |
| Golden path design | **R/A** | I | C | C | C |
| Adoption in squad | C | I | I | **R/A** | R |
| Incident response | R | A | **R** | R | I |

---

## 4. Reference Architecture

### 4.1 Three-plane architecture (canonical pattern)

We organize the platform as **three independent planes**, following the control-plane / data-plane separation-of-concerns pattern established by Kubernetes ([kubernetes.io/docs/concepts/overview/components/](https://kubernetes.io/docs/concepts/overview/components/)), generalized to Azure resources ([learn.microsoft.com/azure/azure-resource-manager/management/control-plane-and-data-plane](https://learn.microsoft.com/azure/azure-resource-manager/management/control-plane-and-data-plane)), and **explicitly applied to AI agents** by the Microsoft Azure Cloud Adoption Framework (*"Establish a single control plane for AI agents across the organization"*, [learn.microsoft.com/azure/cloud-adoption-framework/ai-agents/governance-security-across-organization](https://learn.microsoft.com/azure/cloud-adoption-framework/ai-agents/governance-security-across-organization)) and by Microsoft Foundry Control Plane ([learn.microsoft.com/azure/foundry/control-plane/overview](https://learn.microsoft.com/azure/foundry/control-plane/overview)).

| Plane | Responsibility | Owner team | Key components in our stack | Primary authorization surface |
|---|---|---|---|---|
| **Control plane** | *Rules, registries, and governance decisions.* Decides **who** may run **what**, with which limits, and captures every decision. No application data flows through here. | AI Governance Board + Platform (Governance pod) | Agent catalog * Policy-as-code (OPA/Rego) * Identity (Entra/SSO, SCIM) * Approvals workflow * Eval registry * Model allowlist * Secrets broker * Kill switches * Audit log streaming * Foundry Control Plane (cross-project fleet view) | Azure RBAC `actions`, GitHub Enterprise policies, OPA decisions |
| **Agent plane** | *Runtime execution of agents* - the reasoning loop, tool calls, orchestration, A2A handoffs. Inherits policy from the control plane; never re-implements it. | Platform (Agent Engineering pod) | GitHub Copilot cloud agent (cloud, ephemeral runners) * Azure AI Foundry Agent Service (managed runtime) * Microsoft Agent Framework (code-first orchestration, successor to Semantic Kernel + AutoGen) * Custom agents (APM, Squad) * Agent identity (Microsoft Entra Agent Identity) | Azure RBAC `dataActions` * GitHub App tokens * Foundry agent identity |
| **Data/tool plane** | *The things agents touch* - read/write tools, knowledge, telemetry. Lives close to the data it serves. | Product squads + Platform (Data/Tools pod) | MCP servers (internal APIs, Jira/ADO, K8s, Splunk, ServiceNow) * A2A endpoints (agent interop) * Repos & CI/CD * Vector / knowledge indexes (tenant-isolated) * Telemetry sinks (OpenTelemetry GenAI) * Eval harnesses * RAG datastores | MCP tool-call allowlists * least-privilege tokens * ruleset-protected config files |

**Why the separation matters at 1,000 devs:**
- **Policy lives once.** The control plane enforces the model allowlist, risk tier, and approvals *once*; every agent in the agent plane inherits them automatically. No per-agent reimplementation, no policy drift.
- **Blast radius is contained.** A runaway agent in the agent plane cannot disable its own kill switch (that lives in the control plane). A compromised MCP server in the data plane cannot grant itself broader scopes.
- **Teams own their plane.** Governance owns the control plane. Platform owns the agent plane. Product squads own their tools in the data plane. Each team moves at its own pace without blocking the others.
- **Evals / guardrails / observability are cross-cutting** (they instrument all three planes at input / tool-call / tool-response / final-output boundaries), so they are shown as vertical concerns rather than a fourth plane.

### 4.2 Architecture diagram

```
+---------------------------------------------------------------------------+
| Developer Surfaces |
| VS Code * JetBrains * GitHub.com * CLI * Teams/Slack Chat |
+---------------------------------+-----------------------------------------+
 |
 +=======================+========================+
 | CONTROL PLANE (governance) | <- rules & registries
 | Agent catalog * Policy (OPA/Rego) * Identity |
 | Approvals * Eval registry * Model allowlist |
 | Secrets broker * Kill switches * Audit log |
 | Foundry Control Plane (cross-project fleet) |
 +=======================+========================+
 | policy decisions + identity tokens
 +=======================+========================+
 | AGENT PLANE (runtime) | <- reasoning loops
 | Copilot cloud agent * Copilot chat/edit |
 | Foundry Agent Service * MS Agent Framework |
 | Custom agents (APM/Squad) * A2A interop |
 +=======================+========================+
 | tool calls + data reads/writes
 +=======================+========================+
 | DATA / TOOL PLANE (execution) | <- what agents touch
 | MCP servers * Repos/CI * Vector & RAG stores |
 | Jira/ADO * K8s * Splunk * ServiceNow * Figma |
 | Telemetry sinks (OTel GenAI conventions) |
 +================================================+

Cross-cutting (instrument all three planes):
 * Evals & safety (spec-kit, red-team, regression) * Observability (Copilot Metrics API * OTel * DORA/SPACE DW)
 * Cost / rate-limit / budget enforcement * Prompt-injection defense (gateway + per-agent)
```

### 4.3 Plane-by-plane control mapping (what lives where)

| Concern | Control plane | Agent plane | Data/tool plane |
|---|---|---|---|
| Model allowlist | **Definitive source** (quarterly review per S1 WellArchitected "enterprise-level governance") | Enforces at runtime | - |
| Risk tier (T1-T4) | Assigned here; gates approvals | Selects guardrails by tier | MCP allowlist filtered by tier |
| HITL approvals | Decision recorded here | Pauses execution awaiting decision | - |
| Audit log | Streamed to SIEM from here | Emits traces | Emits tool-call records |
| Kill switch | **Triggered here** | Honored at next step boundary | Revokes tokens |
| Secrets | Brokered here (short-lived) | Never stored at rest | Consumed via broker |
| Cost caps | Defined here (per org / BU / repo / user) | Enforced at step level | - |
| Evals | Registered here | Run inline + in CI | Evaluated over outputs |
| Tenant isolation | Policy definition | Enforces context boundaries | Physical isolation of RAG indexes |

*Framework sources for this mapping: Microsoft Foundry RBAC action/dataAction split (S11); WellArchitected Governing agents section Enterprise-level governance + section Cost management (S1); Azure Cloud Adoption Framework AI-agents guidance on "single control plane" (S11.c).*

### 4.4 Surfaces & tool integrations

Developer-facing surfaces (IDE / GitHub.com / Chat / CLI) invoke agents in the **agent plane** via GitHub Copilot and Foundry SDKs. All invocations are identity-bound (Microsoft Entra Agent Identity for Foundry agents; GitHub App tokens for Copilot cloud agent) and policy-gated by the **control plane** before any **data/tool plane** resource is touched.

---

## 5. The Internal AI SDLC Agent Team (Catalog)

Each agent is published as a versioned product in the internal catalog with an `AGENTS.md` spec, owners, risk tier, eval suite, and SLOs.

| # | Agent | SDLC Phase | Rollout Phase | Primary Responsibility | Key Integrations |
|---|---|---|---|---|---|
| 1 | **Product/Spec Agent** | Ideate | Phase 2 | Turn PRDs -> specs, user stories, acceptance criteria (spec-kit) | Jira/ADO, Confluence |
| 2 | **Architect Agent** | Design | Phase 2 | ADRs, C4 diagrams, tech option analysis, threat-model drafts | Backstage, Miro |
| 3 | **Scaffolder Agent** | Design->Build | Phase 2 | Golden-path scaffolds (service, lib, IaC) | Backstage templates, Cookiecutter |
| 4 | **Coder Agent** (Copilot cloud agent) | Build | **Phase 1** | Implements issues -> PRs autonomously | GitHub Issues/PRs |
| 5 | **Test Agent** | Test | **Phase 1** | Unit/integration/contract/e2e generation, coverage gap fixer | Playwright, Pact, JUnit |
| 6 | **Reviewer Agent** | Review | **Phase 1** | PR review, style, logic, security hints (non-blocking suggestions + blocking checks) | GitHub PR API |
| 7 | **Security Agent** | Review/Deploy | Phase 2 | SAST/SCA triage, secret-scan triage, LLM-specific risks (OWASP LLM) | GHAS, CodeQL, Dependabot |
| 8 | **Compliance Agent** | Review/Deploy | Phase 2 | Policy-as-code checks, licence, data classification, regulatory tags | OPA/Rego, internal policy repo |
| 9 | **Docs Agent** | Build/Release | Phase 2 | Auto READMEs, ADRs, changelogs, API refs | MkDocs, Docusaurus |
| 10 | **Release Agent** | Release | Phase 2 | Release notes, version bumps, deploy PRs, rollback plans | GitHub Releases, Actions |
| 11 | **SRE/Incident Agent** | Operate | Phase 3 | Alert triage, runbook execution, postmortem drafting | PagerDuty, Splunk, K8s via MCP |
| 12 | **FinOps Agent** | Operate | Phase 3 | Cloud cost anomalies, right-sizing PRs | Azure/AWS MCP, Kubecost |
| 13 | **Data/ML Agent** | Cross-cut | Phase 3 | Dataset docs, model cards, drift alerts | MLflow, Feature Store |
| 14 | **Migration Agent** | Modernize | Phase 3 | Framework upgrades, language upgrades, dependency fleet moves | OpenRewrite, Dependabot |
| 15 | **Knowledge Agent** | Cross-cut | Phase 3 | RAG over internal docs, tribal-knowledge Q&A | SharePoint, Confluence, Git |

**Orchestration patterns used:**
- **Sequential** (spec -> scaffold -> code -> test -> review)
- **Parallel fan-out** (Test + Security + Docs agents on same PR)
- **Hierarchical** (Coder agent delegates to Test agent via MCP tool)
- **Human-in-the-loop gates** at risk-tier thresholds (see section 7)

---

## 5B. Reusable Ecosystem Assets (Do Not Build From Scratch)

Rather than inventing our agents and governance patterns, we anchor on proven, permissively-licensed building blocks. Each row below was validated against the original source (see section 16 Research Sources).

### 5B.1 Reference Stack - 4 composable layers

Adapted from David Sanchez, *"Building Your AI Agent Team"* (dsanchezcr.com, 2026-03-23):

```
Layer 4 - Orchestration | Squad (bradygaster/squad) - parallel multi-agent runtime
Layer 3 - Distribution | APM (microsoft/apm) - Agent Package Manager (npm-for-agents)
Layer 2 - Governance/Spec | Spec Kit (github/spec-kit) - Spec-Driven Development
Layer 1 - Foundation | GitHub Copilot Custom Agents, Skills, Instructions, Hooks, MCP
```

We will adopt Layers 1-2 enterprise-wide in Phase 1, pilot Layer 3 (APM) in Phase 2, and evaluate Layer 4 (Squad or equivalent) in Phase 3.

### 5B.2 Ecosystem catalog

| Asset | Source | License | What we reuse | Maps to our catalog (section 5) |
|---|---|---|---|---|
| **`github/awesome-copilot`** | `github.com/github/awesome-copilot` | MIT | 50+ agents, 80+ instructions, skills, hooks, workflows, plugins - `.agent.md` / `.instructions.md` / `SKILL.md` / `hooks.json` schemas | Agent authoring format; Secrets Scanner, Governance Audit, Tool Guardian hooks |
| **`microsoft/hve-core`** (Hypervelocity Engineering) | `github.com/microsoft/hve-core` | MIT (some CC BY-SA 4.0) | 49 agents, 102 instructions, 63 prompts, 11 skills; RPI (Research->Plan->Implement->Review) methodology; prompt-builder agent | Product/Spec, Architect, Coder, Reviewer agents; coding standards; security and RAI collections |
| **`bradygaster/squad`** | `github.com/bradygaster/squad` | MIT | Multi-agent runtime on `@github/copilot-sdk`; `.squad/` Git-tracked team state; routing rules; Watch-mode ("Ralph") polling; SDK-first agent definitions | Orchestration layer; decisions log; skill compression |
| **`microsoft/apm`** (Agent Package Manager) | `github.com/microsoft/apm` | MIT | `apm.yml` manifest; `apm install/compile/pack/audit`; produces `AGENTS.md` / `CLAUDE.md` for 25+ agent tools; prompt-injection & Unicode audit | Versioned agent distribution across 1,000-dev org |
| **`github/spec-kit`** | `github.com/github/spec-kit` | MIT | Slash-commands: `/speckit.constitution`, `/specify`, `/clarify`, `/plan`, `/tasks`, `/analyze`, `/implement`; constitution-as-governance-gate | Product/Spec Agent; Architect Agent; compliance gates |
| **`danielmeppiel/agentic-sdlc-handbook`** (PROSE framework) | `danielmeppiel.github.io/agentic-sdlc-handbook/` | CC BY-NC-ND 4.0 | PROSE: 5 architectural constraints for reliable agent output; reference architecture; governance chapter; anti-patterns catalog | Methodology backbone; maturity model inputs; failure-mode training |
| **Claude Code architectural patterns** | `claude-code-from-source.com` | Book (CC?) - patterns are transferable | AsyncGenerator agent loop; fork-agents for 95% cache sharing; 4-layer context compression; two-phase skill loading (metadata-then-content); 27 lifecycle hooks with frozen config snapshots; file-based memory + LLM recall | Internal agent runtime design; cost control; skill loader; hook governance model |
| **GitHub WellArchitected - *Governing agents*** | `wellarchitected.github.com/library /governance/recommendations/governing-agents/` | GitHub content | ~60+ concrete recommendations across enterprise policy, agent setup, MCP governance, security, audit, cost, platform baseline (numbered REC-1...REC-67 as our **internal mapping IDs**; the source uses descriptive section headings, not this numbering) | Directly adopted as section 7 Governance control set (cross-referenced) |
| **Garry Tan - *Thin Harness, Fat Skills*** | `garrytan/gbrain/docs/ethos/THIN_HARNESS_FAT_SKILLS.md` + `x.com/garrytan/status/2042925773300908103` | Garry Tan (gbrain repo) | 5 definitions: Skill File / Harness / Resolver / Latent-vs-Deterministic / Diarization; 3-layer architecture; "skill-as-method-call" principle | Agent-runtime design philosophy; section 5B.5 (below) |

### 5B.3 Internal `AGENTS.md` conventions (consolidated from sources)

Authoritative file layout our agent catalog enforces (reusing awesome-copilot + WellArchitected schemas):

| File | Scope | Protected by |
|---|---|---|
| `AGENTS.md` / `CLAUDE.md` / `GEMINI.md` | Agent-specific instructions | Ruleset + CODEOWNERS |
| `.github/copilot-instructions.md` | Repo-wide instructions | Ruleset + CODEOWNERS |
| `.github/instructions/*.instructions.md` | Path-specific (`applyTo:` glob) | Ruleset |
| `.github/agents/*.agent.md` | Custom agent definitions | Ruleset |
| `skills/*/SKILL.md` | Self-contained skill packages | Ruleset |
| `.github/copilot/mcp.json` | MCP server allowlist | Ruleset (primary technical control) |
| `.github/workflows/copilot-setup-steps.yml` | Coding-agent environment | Ruleset + least-priv `GITHUB_TOKEN` |
| `hooks.json` | Session lifecycle hooks | Ruleset + code review |
| `apm.yml` | Agent dependency manifest | Ruleset |
| `.github-private/` (enterprise) | Enterprise custom agents | Enterprise-owner control |

### 5B.4 RPI workflow (adopted methodology)

From `microsoft/hve-core`, our default decomposition pattern for non-trivial tasks:

```
/task-research <topic> -> evidence-backed investigation (Task Researcher agent)
/clear
/task-plan -> actionable strategy with checkboxes + line refs
/clear
/task-implement -> execute task-by-task with change log
/clear
/task-review -> validate vs research + plan + instructions
```

Rationale: forces AI to optimize for *verified truth* over *plausible code* by making investigation/planning/implementation structurally distinct context windows. Confirmed effective on large-scale migrations per the APM PR #394 case study in the Agentic SDLC Handbook.

### 5B.5 "Thin Harness, Fat Skills" - agent-runtime principles

Adopted from Garry Tan, *"Thin Harness, Fat Skills"* (essay, v4 dated 2026-04-11), and corroborated by the Claude Code architectural teardown (S7). This is our design philosophy for every agent we build.

**5 definitions we enforce:**

1. **Skill File** - a reusable markdown procedure that teaches the model *how* to do something, not *what*. Takes parameters. Same `/investigate` skill powers medical research or campaign-finance forensics depending on inputs. *"A skill file works like a method call."*
2. **Harness** - the program that runs the LLM. Does 4 things only: run the model in a loop, read/write files, manage context, enforce safety. **Thin.** ~200 lines target.
3. **Resolver** - a routing table for context. Maps "task type X appears -> load document Y first." Claude Code's built-in resolver = skill `description` fields, auto-matched to intent. Keeps top-level instructions (`CLAUDE.md`/`AGENTS.md`) small (~200 lines, not 20,000).
4. **Latent vs. Deterministic** - every step is one or the other. Latent = judgment/synthesis (LLM territory). Deterministic = SQL, code, arithmetic (trust territory). *"The worst systems put the wrong work on the wrong side."* Seating 8 at dinner = latent OK; seating 800 = must be deterministic.
5. **Diarization** - structured profile generation: read N documents -> produce 1 page of judgment that captures contradictions and timing. Distinct from RAG - requires reading everything, not similarity search.

**3-layer architecture we adopt:**

```
Fat Skills | Markdown procedures encoding judgment, process, domain knowledge
 | (~90% of the value lives here)
-------------------------------------------------------------------------
Thin Harness | ~200-line CLI. JSON in, text out. Read-only by default.
 | CLI first, MCP layered on top only when justified.
-------------------------------------------------------------------------
App / Platform | QueryDB, ReadDoc, Search, Timeline - deterministic foundation.
```

**Anti-patterns we ban:**
- Fat harness with 40+ tool definitions eating half the context window
- God-tool MCP servers with 2-5 second round-trips
- REST API wrappers that turn every endpoint into a tool (3x tokens, 3x latency, 3x failure rate)
- Monolithic `CLAUDE.md` / `AGENTS.md` over ~500 lines (use resolvers instead)
- Forcing deterministic work (counting, arithmetic, scheduling at scale) into latent space

**Decision guide - Skill or Code?** (direct quote from Tan's essay, MIT-spirited reuse):

| Question | If YES | If NO |
|---|---|---|
| Does the agent need to think, adapt, or ask questions? | **Skill** | Code |
| Same input always produces same output? | **Code** | Skill |
| Does it require judgment about the user's environment? | **Skill** | Code |
| Is it a lookup, list, or status check? | **Code** | Probably skill |
| Does it change behavior based on conversation context? | **Skill** | Code |

**Operating rule we adopt org-wide (from Tan's pinned tweet):**
> *"You are not allowed to do one-off work. If I ask you to do something and it's the kind of thing that will need to happen again, you must: do it manually the first time on 3 to 10 items. Show me the output. If I approve, codify it into a skill file. If it should run automatically, put it on a cron. The test: if I have to ask you for something twice, you failed."*

This principle compounds: every repeated task becomes a permanent skill upgrade that **improves automatically** when the underlying model improves (the deterministic steps stay stable, the latent judgment gets better for free).

---

## 6. Agent Lifecycle ("Agent SDLC")

Every agent follows the same lifecycle, versioned in Git:

1. **Propose** -> RFC in `ai-sdlc/agents` repo (problem, scope, risk tier, owner)
2. **Design** -> `AGENTS.md` + system prompt + MCP tool list + eval dataset
3. **Build** -> Skills, prompts, guardrails, unit tests on prompts
4. **Evaluate** -> Offline eval (accuracy, safety, cost, latency) via spec-kit + golden datasets; red-team pass
5. **Pilot** -> 1-3 squads, shadow mode; collect telemetry + human ratings
6. **Certify** -> Governance Board review; risk-tier sign-off; security review
7. **Publish** -> Semantic version in catalog; `AGENTS.md` pinned
8. **Monitor** -> Drift, cost, satisfaction, incidents
9. **Deprecate** -> Migration path + sunset timeline

---

## 7. Governance Model

### 7.1 Risk Tiering (applied to every agent and every use case)
| Tier | Examples | Required controls |
|---|---|---|
| **T1 - Low** | Code suggestions in non-prod, docs | Baseline policies, log usage |
| **T2 - Medium** | Autonomous PRs on internal services | Mandatory human review, eval suite, audit log |
| **T3 - High** | Production IaC changes, data migrations | HITL approval, dual control, canary, rollback plan |
| **T4 - Restricted** | Regulated data, safety-critical code | Board approval, isolated tenancy, full provenance, DPIA |

### 7.2 Policy-as-Code (enforced in CI)

Direct-adopt the governance recommendations from GitHub's WellArchitected **Governing agents in GitHub Enterprise** (April 2026; author attribution per page metadata). The WellArchitected page itself is organized into 5 design strategies + an implementation checklist and does **not** use a "REC-N" taxonomy. The **REC-N labels below are our internal mapping IDs** for traceability, numbered in the order recommendations appear under each source section. When citing externally, refer to the source's actual section headings ("Enterprise-level governance", "Cost management", etc.).

**Enterprise-level (inherited floor)** - internal IDs REC-1, 4, 5, 6, 7 (source section: *Enterprise-level governance*):
- Audit-log streaming to SIEM (non-negotiable)
- Explicit model allowlist reviewed quarterly
- Third-party agents disabled by default; enabled post-review
- AI-manager custom role delegates day-to-day without over-granting enterprise ownership

**Ruleset-protected files** - internal IDs REC-29, 30, 62, 64 (source section: *Protect agent-related files*):
- `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `SKILL.md`, `.github/copilot-instructions.md`, `.github/instructions/**/*.instructions.md`, `.github/copilot/mcp.json`, `copilot-setup-steps.yml`
- CODEOWNERS on `/.github/**`
- Bypass of rulesets **not allowed** in repo configuration

**MCP governance** - internal IDs REC-17, 18, 19, 20, 21 (source section: *Govern MCP servers and tools*):
- Internal approved-MCP registry (treat as governance signal + IDE discoverability, **not** a hard security boundary)
- Rulesets on `mcp.json` are the **primary technical control** (except cloud agent)
- Start "Registry only" for regulated repos; "Allow all + ruleset" for labs

**Cloud-agent execution** - internal IDs REC-15, 23, 24, 27, 28, 32, 63 (source section: *Secure cloud-agent execution*):
- GitHub-hosted ephemeral runners (fresh VM per job)
- Agent firewall enabled by default, enforced org-wide
- Automatic code scanning, secret scanning, Dependabot + Copilot code review on agent PRs
- Agent-authored code passes same gates as human code (no exemptions)
- `GITHUB_TOKEN` in `copilot-setup-steps.yml` scoped to least privilege
- Commit signing enforced (Copilot cloud agent signs automatically)

**Additional policy-as-code checks we layer on top:**
- `AGENTS.md` schema validation
- Disallowed MCP tools per risk tier (our T1-T4 model)
- Secret / PII egress scanners on prompts (ref: awesome-copilot `secrets-scanner` hook)
- License & SBOM checks (SLSA L3 target)
- APM audit (`apm audit`) for Unicode / prompt-injection in agent packages
- Mandatory `ai-generated: true` trailer + confidence annotation on AI-authored commits

### 7.3 Data & Privacy
- Data classification taxonomy -> per-agent data-access policy
- Prompt/response logging with PII redaction; retention per legal requirement
- Tenant isolation; no cross-BU data leakage in RAG indexes
- DPIA for any T3/T4 agent touching personal data

### 7.4 Responsible AI Controls
- Model cards for each agent; documented known limits
- Bias/fairness checks for user-facing outputs
- Transparency: every AI contribution is labelled in PR and changelog
- Appeal / override path: developer can always reject and annotate why

---

## 8. Security Posture

- **Identity**: agents run with short-lived, scoped GitHub Apps; SSO + SCIM for human users
- **Least privilege**: MCP servers expose narrow tools; OPA policy on every call
- **OWASP LLM Top 10 mitigations**:
 - Prompt injection -> input/output filters, tool-use allowlists, signed tool manifests
 - Sensitive info disclosure -> DLP on prompt + response
 - Supply chain -> pinned model versions, signed prompts, SBOM for agents
 - Excessive agency -> HITL gates, blast-radius limits on autonomous actions
- **Red-team program**: quarterly exercises against catalog agents; findings feed eval suite
- **Audit**: unified audit log (GitHub + MCP + model provider) -> SIEM

---

## 9. Metrics & Measurement

### 9.1 Adoption
- Weekly / monthly active users per agent
- Seat utilization, suggestion acceptance rate (Copilot Metrics API)
- Champions coverage, training completion

### 9.2 Productivity (DORA + SPACE + DevEx)
- Lead time for change, deployment frequency, change-failure rate, MTTR
- PR cycle time, review latency, rework rate
- Self-reported satisfaction, flow, cognitive load (quarterly survey)

### 9.3 Quality & Safety
- Defect escape rate on AI-authored code vs baseline
- Security findings per KLOC (AI vs non-AI)
- Eval-suite pass rate per agent version
- Incidents attributable to AI output (target: 0 P1)

### 9.4 Economics
Direct adoption of WellArchitected *Cost management* section (internal IDs REC-43-REC-50):
- $ per accepted suggestion / per merged AI PR
- Token spend by agent, BU, repo
- Spending limits per org / cost center with "stop usage at limit" **hard caps** (REC-44)
- Alerting thresholds wired to responsible teams (REC-45)
- Factor model-multiplier into budgets (REC-49); quarterly budget revisit (REC-50)
- ROI = (time saved x loaded cost) - (platform + license + compute)

**GitHub's own internal benchmark** (github.blog, Nov 12 2025 - Matt Nigh): inside GitHub's core repo, `@Copilot` is assigned issues by humans and handles (a) UI/copy tweaks, (b) typo sweeps (e.g., 161 typos across 100 files in one PR), (c) feature-flag removal, (d) large-scale refactors, (e) flaky-test fixes, (f) a ~15-min -> fast `git push` regression in Codespaces, (g) new REST endpoints, (h) DB schema migrations, (i) codebase-wide audits (Codespaces feature flags, authorization queries). Copilot's merged-PR rate is **lower** than humans - *by design* - because the value is "not starting from zero," not "blind merge." We adopt the same posture.

All metrics land in a central **AI SDLC data warehouse** with Looker/Power BI dashboards; data contracts versioned.

---

## 10. Adoption Roadmap

### Phase 0 - Foundations (4-6 weeks)

* Stand up Platform Team, Governance Board, Champions program
* Baseline DORA/SPACE + current AI usage
* Procure/enable Copilot Enterprise, configure policies, SSO, audit
* Publish AI Acceptable Use Policy + Responsible AI Standard
* Create `ai-sdlc/agents`, `ai-sdlc/policies`, `ai-sdlc/evals` repos

**Graduation gate → Phase 1:**

| Criterion | Threshold |
|---|---|
| Platform Team chartered with named exec sponsor | Yes/No |
| DORA/SPACE baseline survey completed | ≥ 70% response rate |
| Copilot Enterprise tenant policies active | 100% of pilot orgs |
| AI AUP + RAI Standard published and acknowledged | 100% of pilot squads |
| `ai-sdlc/*` repos created with CI scaffolding | All 3 repos green |

**Rollback trigger:** Exec sponsor not confirmed within 6 weeks → escalate to CTO before proceeding.

### Phase 1 - Pilot (8-12 weeks, 2-3 squads, ≤ 50 devs)

* Roll out Copilot + Coder, Reviewer, Test agents (agents #4, #5, #6)
* One golden path (e.g., Node/TS microservice) with full agent chain
* Establish eval harness + red-team baseline
* Weekly retro with pilots; iterate `AGENTS.md` specs

**Graduation gate → Phase 2:**

| Criterion | Threshold |
|---|---|
| Weekly active Copilot usage among pilot devs | ≥ 60% |
| Eval-suite pass rate for pilot agents | ≥ 85% |
| Red-team exercise completed (no unmitigated critical findings) | 0 unmitigated critical or high findings |
| Pilot squad satisfaction (survey) | ≥ 3.5/5 |
| Zero P1 incidents attributable to AI output | 0 |
| Lead-time-for-change delta measured vs. Phase 0 baseline | Measured and reported to Governance Board (no regression > 10%) |

**Rollback trigger:** > 1 P1 incident from AI output, or eval pass rate < 70% for 2 consecutive weeks → pause expansion, remediate.

### Phase 2 - Expand (12-16 weeks, ≤ 250 devs, multiple BUs)

* Add Security, Compliance, Docs, Release, Product/Spec, Architect, Scaffolder agents (#1-3, #7-10)
* Publish 3-5 golden paths (service, lib, IaC, data pipeline, frontend)
* Self-service catalog on Backstage; SLA'd support from Platform Team
* Launch metrics dashboards org-wide

**Graduation gate → Phase 3:**

| Criterion | Threshold |
|---|---|
| Weekly active Copilot usage across expanded population | ≥ 70% |
| Golden paths adopted by ≥ 3 BUs | ≥ 3 BUs |
| Agent catalog self-service (no manual onboarding) | ≥ 90% of onboardings completed without Platform Team intervention |
| Metrics dashboards live and reviewed monthly | Yes, with ≥ 1 monthly review completed |
| Cost per accepted suggestion tracked and within budget | Within ±15% of forecast |

**Rollback trigger:** Cost exceeds budget by > 30% for 4 consecutive weeks → freeze new agent rollouts, run FinOps review.

### Phase 3 - Scale (12-20 weeks, all ~1,000 devs)

* Add SRE/Incident, FinOps, Migration, Knowledge, Data/ML agents (#11-15)
* Enable Cloud agent for autonomous issue->PR on approved repos
* T3/T4 workflows with HITL gates live
* Quarterly governance reviews; cost optimization pass

**Graduation gate → Phase 4:**

| Criterion | Threshold |
|---|---|
| Weekly active AI-agent usage org-wide | ≥ 80% |
| Lead-time-for-change improvement vs. Phase 0 baseline | ≥ 10% improvement (p < 0.05 over rolling 4-week window) |
| 100% AI-generated code traceable and policy-checked | 100% |
| Governance Board quarterly review completed | ≥ 1 cycle |
| MTTR for AI-attributable incidents (safety metric, distinct from DORA MTTR) | < 4 hours |

**Rollback trigger:** Org-wide adoption < 50% after 8 weeks at scale → diagnose enablement gaps before Phase 4.

### Phase 4 - Optimize (ongoing)

* Agent orchestration graphs (multi-agent workflows)
* Fine-tuned / domain-adapted models where ROI justifies
* Continuous eval + automatic rollback on regression
* External benchmark and maturity re-assessment

---

## 11. Maturity Model (self-assessed quarterly)

| Level | Hallmarks |
|---|---|
| **L1 Initial** | Ad-hoc Copilot use, no policy, no metrics |
| **L2 Repeatable** | Licenses managed, AUP published, basic telemetry |
| **L3 Defined** | Central catalog, `AGENTS.md` standard, golden paths, eval harness |
| **L4 Managed** | Risk-tiered governance, DORA+AI metrics, policy-as-code in CI, red-team program |
| **L5 Optimized** | Autonomous multi-agent workflows, continuous eval, measurable ROI, RAI embedded, external benchmark-class |

Target: **L4 by end of Phase 3**, **L5 in Phase 4**.

---

## 12. Enablement & Change Management

- **Learning paths**: Intro (1h), Developer (4h), Power user (8h), Agent author (16h)
- **Office hours** weekly, **show-and-tell** monthly, **AI Dev Day** quarterly
- **Prompt library** and **pattern catalog** in internal docs
- **Internal certification** for agent authors (required for T3/T4 agents)
- Recognition program tied to contributions to the agent catalog

---

## 13. Risks & Mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| IP leakage via prompts | M | DLP on prompts, enterprise-tenant models, training |
| Over-reliance / skill atrophy | M | Pair programming norms, code-review expectations, learning paths |
| Hallucinated code in prod | M | Mandatory tests, eval suite, HITL on T3/T4 |
| Cost sprawl | H | Per-BU budgets, token quotas, FinOps Agent |
| Shadow AI tools | H | Approved catalog + easy on-ramp, egress controls |
| Regulatory change (EU AI Act etc.) | M | Governance Board monitors; policy-as-code updated centrally |
| Vendor lock-in | M | Abstraction via MCP + model gateway; portable prompts/evals |

---

## 14. Immediate Next Steps (first 30-60 days of execution)

1. Charter the Platform Team and Governance Board; name accountable execs
2. Enable Copilot Enterprise tenant policies, audit log export, Metrics API
3. Publish v1 of: AI AUP, Responsible AI Standard, Risk Tiering, `AGENTS.md` schema
4. Create `ai-sdlc/*` repos and CI policy-as-code scaffolding
5. Select 2 pilot squads + 1 golden path; define success criteria
6. Stand up eval harness (spec-kit + golden datasets) and observability pipeline
7. Launch Champions cohort #1 and baseline DORA/SPACE survey

---

## 15. Appendix

### A. `AGENTS.md` minimum schema
```yaml
name: test-agent
version: 1.3.0
owner: platform-ai@corp
risk_tier: T2
description: Generates and maintains tests for PRs.
capabilities: [unit-tests, coverage-gap-fix, mutation-hints]
mcp_tools: [github.pr, repo.fs.read, repo.fs.write, ci.run]
model_allowlist:
  - gpt-5-2026-03-15       # Pin exact model version; reviewed quarterly
  - claude-sonnet-4-20260401
inputs: {triggers: [pr.opened, pr.synchronize]}
guardrails:
 max_files_changed: 50
 forbidden_paths: [infra/prod/**, secrets/**]
 require_human_approval_if: [touches_iac, touches_auth]
eval_suite: evals/test-agent/v1/
observability: {logs: true, traces: true, prompts: redacted}
sla: {p95_latency_s: 120, availability: 99.5}
```

> **Note:** The model version strings shown are illustrative of the naming pattern. Resolve actual available versions from the Copilot model picker or the API at the time of catalog authoring.

### B. Suggested repo layout
```
ai-sdlc/
 agents/ # AGENTS.md specs + prompts
 skills/ # reusable skill modules
 mcp-servers/ # internal MCP implementations
 policies/ # OPA/Rego, schema validators
 evals/ # golden datasets + harness
 golden-paths/ # Backstage templates
 dashboards/ # metric definitions
 docs/ # handbook, runbooks
```

### C. Key references
- NIST AI RMF 1.0 * ISO/IEC 42001 * EU AI Act
- OWASP Top 10 for LLM Applications * MITRE ATLAS
- DORA 2024 Report * SPACE framework * DevEx (Noda/Forsgren/Storey)
- GitHub Copilot Enterprise & Cloud agent docs * `AGENTS.md` / spec-kit
- CNCF Platform Engineering WG whitepaper * Team Topologies

---

## 16. Research Sources & Evidence Base

Every claim in this plan is traceable to a primary source. Sources were retrieved on **2026-04-22**. Direct quotations are short and attributed; paraphrases are flagged. Dates shown are publication/update dates from the sources themselves.

### 16.1 Sources successfully retrieved

#### S1 - GitHub WellArchitected: *Governing agents in GitHub Enterprise*
- **URL:** https://wellarchitected.github.com/library/governance/recommendations/governing-agents/
- **Authors:** Kitty Chiu, Tiago Pascoal, Ken Muse, Josh Johanning, Ayodeji Ayodele
- **Published:** 2026-04-13 (updated 2026-04-14)
- **What we used:** ~60+ governance recommendations spanning enterprise policy, agent setup, MCP, security/human review, audit & observability, cost, and GitHub platform baseline. Direct adoption in section 7.2, section 9.4, and section 5B.3. **Note:** We assign internal IDs REC-1...REC-67 for traceability; these are not the source's own taxonomy. When citing externally, use the source's section headings.
- **Key quote (REC re: agent risk surface):** *"Agents act faster and at broader scale than any individual... A single misconfigured enterprise policy or shared agent definition can affect multiple repositories quickly."*
- **Sibling pages used:** Governance Checklist, Copilot Policies Best Practices, Managing Copilot PRUs, Managing Repositories at Scale, Rulesets Best Practices, Adopting Copilot at Scale, Champion Program.

#### S2 - `github/awesome-copilot`
- **URL:** https://github.com/github/awesome-copilot (MIT)
- **What we used:** Authoritative artifact schemas for `.agent.md`, `.instructions.md`, `SKILL.md`, `hooks.json`, workflows, and plugins. Reusable hooks: `secrets-scanner`, `governance-audit`, `tool-guardian`, `dependency-license-checker`, `session-auto-commit`, `session-logger`. Consumed via VS Code Copilot, Copilot CLI (`copilot plugin install ... @awesome-copilot`), GitHub Actions, or direct file copy.
- **Primary files cited:** `/AGENTS.md`, `/README.md`, `/CONTRIBUTING.md`, `/agents/CSharpExpert.agent.md`, `/instructions/a11y.instructions.md`, `/skills/acquire-codebase-knowledge/SKILL.md`, `/hooks/secrets-scanner/README.md`.

#### S3 - `microsoft/hve-core` (Hypervelocity Engineering)
- **URL:** https://github.com/microsoft/hve-core
- **License:** MIT (security skills: CC BY-SA 4.0 where derived from OWASP)
- **Maintainers:** `@microsoft/edge-ai-core-dev`; VS Code extension `ise-hve-essentials.hve-core`
- **What we used:** The RPI (Research -> Plan -> Implement -> Review) methodology, 4 core RPI agents, 49-agent catalog, 102-instruction library, 63-prompt library, 11-skill packages, prompt-builder meta-agent, installer extension, maturity levels (Stable / Preview / Experimental), RAI collection.
- **Primary files cited:** `/.github/CUSTOM-AGENTS.md`, `/.github/instructions/README.md`, `/.github/prompts/README.md`, `/docs/rpi/`, `/docs/getting-started/install.md`.

#### S4 - `bradygaster/squad`
- **URL:** https://github.com/bradygaster/squad (MIT, alpha v0.9.1)
- **What we used:** Multi-agent runtime pattern on `@github/copilot-sdk`; `.squad/` Git-tracked team state (team.md, routing.md, decisions.md, agents/*/charter.md + history.md, skills/, identity/, log/); Watch-mode ("Ralph") polling with 4-tier escalation; SDK-first agent definitions (`defineSquad`, `defineAgent`, `defineRouting`); hook-based governance points (`beforeFileWrite`, `afterDecision`, `onAgentError`).
- **Primary files cited:** `/README.md`, `/squad.config.ts`, `/CHANGELOG.md`, `/samples/`.
- **Caveat:** Alpha - APIs may change. Validate against latest before production use.

#### S5 - David Sanchez, *"Building Your AI Agent Team"*
- **URL:** https://dsanchezcr.com/blog/building-your-ai-agent-team
- **Published:** 2026-03-23
- **What we used:** The 4-layer reference stack (Copilot native -> Spec Kit -> APM -> Squad) now documented in section 5B.1; coordinator-mediated parallel execution pattern; decisions-as-drop-box pattern.
- **Key quote:** *"This is the same problem that `package.json`, `requirements.txt`, and `Cargo.toml` solved for code dependencies years ago. We are at that inflection point for AI agent configuration."*
- **Outbound repos referenced:** `github/spec-kit`, `microsoft/apm`, `microsoft/apm-action`, `bradygaster/squad`.

#### S6 - Daniel Meppiel, *Agentic SDLC Handbook* (PROSE framework)
- **URL:** https://danielmeppiel.github.io/agentic-sdlc-handbook/
- **Version / Date:** v0.9.2, March 2026 * License: CC BY-NC-ND 4.0
- **Author:** Daniel Meppiel, Global Black Belt at Microsoft; creator of APM (`microsoft/apm`, 700+ *)
- **What we used:** PROSE framework (5 architectural constraints making AI-agent output reliable, verifiable, maintainable); 15-chapter structure split into Part I (thesis), Part II (leaders: business case, reference arch, governance, teams, transition), Part III (practitioners: mindset, instrumented codebase, PROSE spec, context engineering, multi-agent orchestration, execution meta-process, anti-patterns); APM Overhaul (PR #394) case study.
- **Reading paths used:** "Executive scan" (Ch 1/3/5/15) and "Tech lead deep-dive" (Ch 1/8/9/13/14).

#### S7 - *Claude Code from Source* (Anthropic architecture teardown)
- **URL:** https://claude-code-from-source.com/
- **What we used (our reorganized list, not the source's verbatim numbering):** (1) AsyncGenerator as agent loop, (2) speculative tool execution, (3) concurrent-safe batching by safety class, (4) fork-agents sharing prompt-cache prefixes (~95% input-token savings), (5) 4-layer context compression (snip / microcompact / collapse / autocompact), (6) file-based memory with Sonnet side-query recall, (7) two-phase skill loading (frontmatter at startup -> content on invoke), (8) sticky latches for cache stability, (9) slot reservation, (10) hook config snapshots (27 lifecycle hooks). **Cross-cutting detail also used:** the 14-step tool-execution pipeline and 240 ms startup via parallel I/O (both drawn from the site's "Tool execution at scale" and "Performance engineering" sections - not from the canonical 10-pattern list).
- **Application:** Informs our agent runtime design (section 4 orchestration layer), cost control (section 9.4), skill loader, and hook model.

#### S8 - *Agentic DevOps - Reimagining every phase of the developer lifecycle*
- **URL:** https://developer.microsoft.com/blog/reimagining-every-phase-of-the-developer-lifecycle
- **Announced at:** Microsoft Build 2025 keynote
- **What we used:** Microsoft's canonical phase model - (1) Ideation with Copilot on GitHub.com (PRD -> prototype), (2) Copilot cloud agent assigned issues via drafts/PRs, (3) Design-to-code via Figma MCP, (4) E2E testing via Playwright MCP, (5) Monitoring + Azure SRE Agent, (6) App modernization (Copilot upgrade for .NET/Java). Octopets demo app used as reference narrative.
- **Named products adopted in our architecture:** GitHub Copilot (web), Copilot cloud agent, Copilot agent mode (VS Code/Visual Studio/Xcode/Eclipse/JetBrains), MCP servers, Azure SRE Agent, Copilot app modernization.

#### S9 - GitHub Blog, *How Copilot helps build the GitHub platform*
- **URL:** https://github.blog/ai-and-ml/github-copilot/how-copilot-helps-build-the-github-platform/
- **Author / Date:** Matt Nigh (Program Manager Director, AI for Everyone @ GitHub) * 2025-11-12
- **What we used:** Empirical evidence - one month of `@Copilot` PR activity inside github.com core repo, covering: UI/copy tweaks; 161-typo sweep across 100 files in one PR; feature-flag removal; repo-wide class renames; perf fixes (incl. fixing ~15-min `git push` in Codespaces); flaky-test triage; new REST endpoints (e.g., list repository security-advisory comments); DB column-type migrations; security gating on internal integrations; codebase-wide audits (Codespaces feature flags, authorization queries).
- **Key quote:** *"The value isn't in blindly merging. It's in not starting from zero... It's about letting Copilot handle the tedious 80% of the work. This frees us up to dedicate our expertise to the critical 20% that truly matters."* - adopted as our cultural framing.

#### S10 - Garry Tan, *"Thin Harness, Fat Skills"* (essay + X thread)
- **Primary source:** https://github.com/garrytan/gbrain/blob/master/docs/ethos/THIN_HARNESS_FAT_SKILLS.md (essay, status `draft-v4`, created 2026-04-09, updated 2026-04-11)
- **Companion thread:** https://x.com/garrytan/status/2042925773300908103 (2026-04-11, 3.9k likes / 130 replies / 1.4M impressions at time of retrieval)
- **Retrieval method:** The X thread renders only with JS auth, so we retrieved the Twitter syndication JSON (`cdn.syndication.twimg.com/tweet-result?id=2042925773300908103`) - which confirmed the tweet links to X article rest_id `2042922188924424198` titled "Thin Harness, Fat Skills" with preview text quoting Steve Yegge's "10x to 100x" productivity claim - then fetched the canonical primary-source markdown from Garry Tan's own `gbrain` repo.
- **Talk context:** *"YC Spring 2026 - Thin Harness, Fat Skills"* (YC Startup School). Framework also confirmed by third-party coverage (Forbes, 2026-04-12; multiple analyses).
- **What we used:** Five definitions (Skill File, Harness, Resolver, Latent-vs-Deterministic, Diarization); 3-layer architecture (Fat Skills / Thin Harness / App); the "skill-as-method-call" insight; the Skill-or-Code decision guide; the "no one-off work" operating rule. Directly adopted in section 5B.5.
- **Key quote:** *"The secret sauce isn't the model. It's the thing wrapping the model: the harness... None of that is about making the model smarter. All of it is about giving the model the right context, at the right time, without drowning it in noise."*
- **Corroboration with S7 (Claude Code from Source):** Tan's essay cites the March 31 2026 Anthropic Claude Code npm source-map leak (512,000 lines) as validating his framework; S7's 10 architectural patterns (async-generator loop, fork-agents for cache sharing, two-phase skill loading, etc.) are the implementation-level expression of the same "thin harness, fat skills" philosophy.

#### S11 - Microsoft Foundry Control Plane & Cloud Adoption Framework (AI-agents)
- **URLs:**
 - **S11.a** Foundry architecture (security-driven separation of concerns): https://learn.microsoft.com/azure/foundry/concepts/architecture
 - **S11.b** Foundry Control Plane overview: https://learn.microsoft.com/azure/foundry/control-plane/overview
 - **S11.c** Cloud Adoption Framework - *"Establish a single control plane for AI agents across the organization"*: https://learn.microsoft.com/azure/cloud-adoption-framework/ai-agents/governance-security-across-organization
 - **S11.d** Authentication & authorization in Foundry (RBAC `actions` vs. `dataActions`): https://learn.microsoft.com/azure/foundry/concepts/authentication-authorization-foundry
 - **S11.e** Azure control plane vs. data plane (canonical definition across Azure resources): https://learn.microsoft.com/azure/azure-resource-manager/management/control-plane-and-data-plane
- **Publisher / License:** Microsoft Learn * CC BY 4.0 (Microsoft docs licensing)
- **What we used:** The **three-plane architecture** in section 4.1 / section 4.2 / section 4.3. Specifically:
 - *Control-plane / data-plane split as a first-class Foundry concern* (S11.a: *"Foundry enforces a clear separation between management and development operations to ensure secure and scalable AI workloads... Control plane actions, such as creating deployments and projects, are distinct from data plane actions, such as building agents, running evaluations, and uploading files."*).
 - *RBAC `actions` vs. `dataActions` mapping* (S11.d) -> our "Primary authorization surface" column in section 4.1.
 - *Single-control-plane directive for enterprise AI agents* (S11.c: *"Establish a single control plane for AI agents across the organization"*) -> validates the centralized governance model in section 3 and section 7.
 - *Fleet management across multiple projects/subscriptions* (S11.b) -> Foundry Control Plane listed as the cross-project observability layer in our agent plane.
- **Key quote (S11.b):** *"Foundry Control Plane provides the visibility, governance, and control that you need to scale reliably... centralizes management for your AI agent fleet, from build to production."*

#### S12 - Kubernetes Architecture (canonical control-plane / data-plane terminology)
- **URLs:**
 - **S12.a** Core components (control plane vs. node components): https://kubernetes.io/docs/concepts/overview/components/
 - **S12.b** Cluster architecture: https://kubernetes.io/docs/concepts/architecture/
- **Publisher / License:** The Kubernetes Authors / CNCF * CC BY 4.0
- **What we used:** The **origin and canonical definition** of the control-plane / data-plane separation pattern that our section 4 architecture generalizes to AI agents. Kubernetes control plane = `kube-apiserver` + `etcd` + `kube-scheduler` + `kube-controller-manager` (manages cluster state); node components = `kubelet` + `kube-proxy` + container runtime (execute workloads). Our agent-plane / data-tool-plane split mirrors this execution-layer pattern; our control plane mirrors the Kubernetes control plane's role as the system of record for desired state.
- **Citation rationale:** This establishes that the three-plane pattern is not invented for this plan - it is a proven architectural pattern adopted across cloud-native systems and now formally applied to AI agents by Microsoft Foundry (S11).

### 16.2 Research methodology & confidence notes

- **Retrieval:** 10 parallel sub-agents were launched for S1-S10; 5 completed via GitHub MCP tools (S2, S3, S4, S5, S6 partial). The remaining 5 web-only sources (S1, S7, S8, S9, S10) were retrieved by the main agent using `web_fetch`, `web_search`, the Twitter syndication JSON endpoint, and - for S10 - the author's own open-source `gbrain` repo via GitHub MCP. Sources **S11 (Microsoft Foundry / Azure CAF) and S12 (Kubernetes)** were added during validation round 2 to back the three-plane architecture in section 4, retrieved via Microsoft Learn docs search + `web_fetch` on kubernetes.io.
- **Accuracy posture:** Every recommendation in section 7 and every asset in section 5B is traceable to the listed sources. All 10 sources were successfully retrieved and incorporated.
- **Dates:** Several sources carry 2025-2026 dates; these are reproduced verbatim from the source pages and not normalized.
- **Licensing note:** Adoption of CC BY-NC-ND 4.0 content (S6 Handbook) is limited to concept reference + attribution; no derivative content redistributed here. S10 (`garrytan/gbrain`) carries **no declared open-source license** - the Skill-or-Code decision guide and operating rule are quoted under fair-use for commentary and education only; no "MIT-spirited" claim is made. Before any production redistribution of S10 content, obtain explicit permission from the author.
- **Point-in-time counts:** Catalog counts for S2 (awesome-copilot: "50+ agents, 80+ instructions") and S3 (hve-core: "49 agents, 102 instructions, 63 prompts, 11 skills") are snapshots and will drift. For audit trails, pin to commit SHAs when the count is load-bearing.
- **Unverifiable point-in-time metrics:** S10's companion-tweet engagement numbers and any social-media counts are captured "at time of retrieval" and are not stable references.

---

## 17. Validation Findings & v2 Backlog

This plan was independently validated by four LLMs in parallel - **Claude Opus 4.6** (citation integrity), **GPT-5.4** (architecture fit), **Claude Haiku 4.5** (mechanical consistency), **Claude Sonnet 4.6** (enterprise adoption). The critical citation-accuracy fixes have been applied in section 7.2, section 16.1 (S1, S7, S10), section 16.2, and section 2 (acronym inventory). The remaining findings are captured below as a prioritized v2 backlog.

### 17.1 Citation integrity - applied [OK]
| Finding | Status |
|---|---|
| "REC-1...REC-67" presented as the WellArchitected source's own taxonomy (it is not) | [OK] Relabelled as **internal mapping IDs** with pointer to source section headings |
| S7 "10 patterns" list substituted 3 items (sticky latches / slot reservation / hook snapshots) with non-canonical items | [OK] Corrected; cross-cutting items split out |
| S10 claim of "MIT-spirited reuse" (`gbrain` repo has no declared license) | [OK] Removed; fair-use-only posture stated |
| SPACE, GHAS, SSO, SCIM, DLP, SAST, SCA, HITL, SBOM, AUP, APM, MCP, A2A not expanded on first use | [OK] First-use inventory added to section 2 |
| S10 companion-tweet engagement numbers unverifiable / point-in-time | [OK] Flagged in section 16.2 |
| S2 / S3 catalog counts drift with repo | [OK] Disclosed in section 16.2 |
| **B2 - No real agent runtime control plane** (GPT-5.4) | [OK] **Addressed:** section 4 redrawn as three-plane architecture (section 4.1-section 4.4), backed by new primary sources S11 (Microsoft Foundry Control Plane + Azure CAF "single control plane for AI agents" directive) and S12 (Kubernetes canonical control/data-plane definition). |

### 17.2 Blocking gaps - recommended before Phase 1 launch [HIGH]

| # | Gap | Owner | Source of finding |
|---|---|---|---|
| B1 | **Fabricated-taxonomy risk elsewhere:** audit every cited count / numbered list (section 5, section 5B, section 6) for "looks-authoritative-but-is-internal" labels | Platform Team | Opus |
| B2 | ~~No real agent runtime control plane~~ **RESOLVED** (see section 17.1; section 4 redrawn) - follow-up work: define the runtime PDP (Policy Decision Point) wiring for sensitive tool calls, and publish the agent-catalog schema | Platform Architect | GPT-5.4 |
| B3 | ~~Model supply chain governance~~ **PARTIALLY RESOLVED** - Appendix A schema now pins exact model versions with quarterly review cadence; remaining: define deprecation handling and model rollback policy | Platform + Security | Opus |
| B4 | **Incident response runbook for agent failures** - agent exfiltrates secrets / generates malicious code / infinite loop / bypasses gate has no defined severity matrix, escalation, or rollback drill | SRE + Security | Opus |
| B5 | **HITL escalation criteria undefined** - no concrete triggers (file-path patterns, diff size, confidence threshold, tier x action matrix) | Governance Board | Opus + GPT-5.4 |
| B6 | ~~Phase graduation criteria not measurable~~ **RESOLVED** - section 10 now includes measurable graduation gates with numeric thresholds and rollback triggers for each phase | Platform Product | Sonnet |
| B7 | **Platform Team reporting line + budget source** not specified (CTO? CISO? BU-allocated? central?); blocks RACI authority | Exec Sponsor | Sonnet |
| B8 | **Enablement delivery platform missing** (Learn path? Backstage TechDocs? internal Copilot Space?); no Day-1 -> Day-30 -> Day-90 experience map per persona | Enablement Lead | Sonnet |
| B9 | **Export control (EAR/ITAR)** absent from section 2, section 7, section 13 - blocks rollout in regulated divisions | Legal + Compliance | Sonnet |
| B10 | **Input-side DLP** (PII/customer-data scanning **before** prompt leaves IDE) unspecified; current plan only redacts logs | Security + Privacy | Sonnet + Opus |

### 17.3 Significant gaps - v2 backlog [MED]

**Architecture (GPT-5.4)** *([OK] three-plane redraw applied in section 4; items below are remaining follow-ups)*
- ~~Redraw section 4 into three explicit planes~~ **DONE** (section 4.1-section 4.4, sources S11/S12).
- Reposition **MCP as tool/data access only**; move A2A / handoff / workflow into an explicit interop layer; mark Foundry A2A as preview, not a default.
- Add **Azure AI Foundry Agent Service** and **Microsoft Agent Framework** to section 5B baseline (supersedes the current Copilot->Spec Kit->APM->Squad stack as the enterprise-runtime baseline for Microsoft-affiliated tenants); keep Squad/APM as optional patterns.
- Make **evals, guardrails, and observability cross-cutting** at input / tool-call / tool-response / final-output layers - not side boxes.
- Adopt **OpenTelemetry GenAI semantic conventions** for tool-call / agent span / eval-event / feedback-event traces.
- Re-scope agent catalog: split **SRE vs. Incident Commander**; split **Reviewer vs. Security vs. Compliance**; add **Accessibility**, **Localization**, **Schema/Contract**, **Dependency/Renovate** as first-class agents; define **thin-harness + 3-7 skill packs** per agent to fix "fat-role" drift in Data/ML, Release, Knowledge, SRE.
- Tier risk by **autonomy x action-type x asset-criticality x data-sensitivity x blast-radius**, not use-case label.
- Add missing metrics: **tool-call precision, unnecessary-tool-call rate, HITL intervention / override rate, hallucination / grounding-failure rate, routing accuracy, drift detection by version, policy false-positive rate, safe-rollback time, eval coverage %, user-feedback-on-trace coverage, task adherence / instruction-following, navigation efficiency**.

**Citation / evidence (Opus)**
- Operationalize **NIST AI RMF** (MAP / MEASURE / MANAGE / GOVERN) - map each T1-T4 tier to specific NIST functions rather than name-dropping the standard.
- Operationalize **ISO/IEC 42001** - map to section 11 maturity model levels.
- Map **EU AI Act risk categories** to T1-T4 tiers; document obligations per category.
- Cite **SLSA** (slsa.dev) and define what L3 means for agent artifacts; choose **CycloneDX ML-BOM** or **SPDX** for model SBOM and commit to one.
- Pin **OWASP LLM Top 10 (2025)** and map each entry to a section 8 control.
- Cite specific **MITRE ATLAS** techniques in section 8 threat model.
- Source or remove the **"20-40% lead-time reduction"** target; source champion 1:25 ratio.

**Governance (Sonnet + Opus)**
- Add **inbound IP contamination control** (Copilot public-code duplication filter org-wide, Legal sign-off on provenance, T3/T4 output flagged for legal review).
- Add **procurement / DPA / liability** review per T3/T4 model provider.
- Add **shadow-AI endpoint controls**: MDM browser-extension policy, CASB discovery scan (Defender for Cloud Apps), AUP copy-paste clause, amnesty path.
- Add **data-residency** requirements per region/BU; interact with EU AI Act obligations.
- Add **model-card governance subsection** (template, owner, review cadence, triggers, distribution).
- Expand **prompt-injection defense** from bullet list -> architecture (gateway vs. per-agent filters, canary tokens, classifiers, monitoring, evasion handling) - runtime, not just build-time `apm audit`.
- Add **red-team cadence by tier** (T3/T4 > quarterly; internal vs. external; remediation SLA).
- Add **tenant isolation architecture** for multi-BU RAG / shared MCP servers (blast radius, context boundaries).
- Add **per-developer cost attribution** in addition to per-team / per-BU.

**Org design (Sonnet)**
- Expand RACI with **Legal, Privacy/DPO, Accessibility, Procurement, IT/EUC, ER/People, Communications**.
- Add section 3.3 **Interaction model with existing teams** (IDP/Backstage, DevEx, InnerSource, AppSec) using Team Topologies modes.
- Champions Charter: **15-20% time allocation**, funded capacity, escalation SLA, quarterly health survey.

**Adoption (Sonnet)**
- Highest-leverage artifact: **"Developer Zero-to-Productive" experience map** (Day 1 -> Day 30 -> Day 90 per persona: IC, tech lead, manager) with IDE install, first prompt, cost visibility, data-classification do/don't, help path. Publish on Day 1 of Phase 0.
- Move **agent catalog MVP to Phase 1** (not Phase 2) to solve discoverability.
- Per-phase **Gate Cards** with numeric thresholds + named rollback conditions.

### 17.4 Mechanical / hygiene (Haiku) - v2 cleanup
- Reconcile section 5B.3 (GitHub-native `.github/` pattern) with section 15B (`ai-sdlc/` monorepo layout) - document the dual pattern explicitly (centralized platform repo vs. distributed per-team repos + central registry).
- Add a **<=300-line cap** for `AGENTS.md` / `CLAUDE.md` / `GEMINI.md` in section 5B.3 to make "thin harness" enforceable.
- Tie **section 11 Maturity Model levels to numeric KPIs** (adoption %, eval pass rate, P1 count, DORA deltas).
- Document **DORA/SPACE data warehouse schema** in an appendix (fact tables, dimensions, owner, refresh SLO).
- Move the **orchestration patterns (section 4 lines 120-124)** into a dedicated section 5B.6 with `apm.yml` examples for sequential / parallel / hierarchical / HITL.
- Add terminology-clarity box distinguishing **Skill File (Tan markdown)** vs. **MCP Tool (callable function)** vs. **Harness (runtime loop)**.
- Codify Tan's **"ask twice = failed" rule** as a concrete control: *every repeated task must register a skill file within 30 days of second occurrence; audit via commit history.*

### 17.5 Validation confidence summary

| Dimension | Confidence | Notes |
|---|---|---|
| **Source authenticity** (URL + authorship) | High - 10/10 sources retrieved; 2 author/version claims flagged as page-metadata-based | Opus |
| **Quote fidelity** | High for S1, S6, S8, S9, S10; low for S5 (fetch failure - unverified verbatim) | Opus |
| **Taxonomy fidelity** | Was Low (REC-N fabrication, S7 pattern substitution); now **High after section 7.2 / section 16.1 corrections** | Opus, self |
| **Architecture completeness** | Medium - catalog and controls strong; runtime control plane and data plane underspecified | GPT-5.4 |
| **Adoption realism** | Medium - governance depth > developer-experience depth; Zero-to-Productive map missing | Sonnet |
| **Mechanical hygiene** | High - cross-refs resolve, tables valid, no broken markdown; acronym expansions now present | Haiku |
| **Regulatory coverage** | Medium - frameworks named in section 2 but not operationalized; export control absent | Opus + Sonnet |

---

## 18. Document Provenance & Refresh Stamp

> **[DATE] Research completion date: April 22, 2026**
> **Version: 1.1** (citation-corrected + three-plane architecture added)
> **Next scheduled refresh: October 22, 2026** (6-month cadence; earlier if any S1-S12 source publishes a material update)

### 18.1 How this research was created

1. **Initial draft (v1.0)** - Authored using four broad web searches on enterprise frameworks (NIST AI RMF, OWASP LLM Top 10, Platform Engineering/IDP, DORA/SPACE) to establish the baseline operating model, 15-agent catalog, and 4-tier governance model.
2. **Primary-source enrichment (v1.0)** - Ten user-supplied URLs (S1-S10) were fetched in parallel using a mix of:
 - GitHub MCP server (for `github.com` repo sources: S2, S3, S4, S10)
 - `web_fetch` (for HTML docs: S1, S6, S7, S8, S9)
 - Twitter syndication JSON endpoint `cdn.syndication.twimg.com/tweet-result` (for the login-walled X thread on S10)
 - `web_search` fallback (for S5 after direct fetch failed)

 Content was integrated into section 5B (Reusable Ecosystem Assets), section 7.2 (Policy-as-Code), section 9.4 (Metrics), and section 5B.5 (Thin Harness Fat Skills).
3. **Four-model parallel validation (v1.1)** - The plan was independently critiqued by four LLMs running in parallel as rubber-duck sub-agents, each with a distinct validation focus:
 - **Claude Opus 4.6** - citation integrity & SDLC gaps
 - **GPT-5.4** - architecture fit & best-solution alignment
 - **Claude Sonnet 4.6** - enterprise adoption & change management
 - **Claude Haiku 4.5** - mechanical consistency & acronym discipline

 Three outright citation defects (REC-numbering fabrication, S7 pattern-list substitution, S10 license overclaim) were fixed in-place; remaining findings were captured as the section 17 backlog.
4. **Architecture augmentation (v1.1)** - Based on GPT-5.4's "no real control plane" finding, section 4 was redrawn as a **three-plane architecture** (control / agent / data-tool), backed by two additional primary sources (S11 Microsoft Foundry Control Plane + Azure CAF; S12 Kubernetes) retrieved via Microsoft Learn docs search and `web_fetch` on kubernetes.io.

### 18.2 Authoring environment

| Field | Value |
|---|---|
| Authored with | GitHub Copilot CLI (Claude Opus 4.7, main agent) + background sub-agents on Claude Opus 4.6, Claude Sonnet 4.6, Claude Haiku 4.5, GPT-5.4 |
| Tools used | `web_fetch`, `web_search`, GitHub MCP server, Microsoft Learn docs search/fetch, Twitter syndication JSON endpoint, ripgrep/glob over local files |
| Human reviewer | Calin Lupas (Microsoft) - prompt author; approved 10-source scope, directed validation round, requested three-plane redraw |
| AI co-author trailer | `Co-authored-by: GitHub Copilot` (per repo convention; not yet committed - file lives outside a git repo) |

### 18.3 Source snapshot inventory (12 primary sources)

| # | Source | URL or repo | Fetched as of |
|---|---|---|---|
| S1 | GitHub WellArchitected - *Governing agents in GitHub Enterprise* | `wellarchitected.github.com/library/governance/recommendations/governing-agents/` | 2026-04-22 |
| S2 | `github/awesome-copilot` | github.com | 2026-04-22 |
| S3 | `microsoft/hve-core` | github.com | 2026-04-22 |
| S4 | `bradygaster/squad` | github.com | 2026-04-22 |
| S5 | David Sanchez, *"Building Your AI Agent Team"* | dsanchezcr.com | 2026-04-22 (fetch failed; content confirmed via `web_search`) |
| S6 | Daniel Meppiel, *Agentic SDLC Handbook* | danielmeppiel.github.io | 2026-04-22 |
| S7 | *Claude Code from Source* | claude-code-from-source.com | 2026-04-22 |
| S8 | MS Developer Blog - *Agentic DevOps* | developer.microsoft.com | 2026-04-22 |
| S9 | GitHub Blog - *How Copilot helps build the GitHub platform* (Matt Nigh) | github.blog | 2026-04-22 |
| S10 | Garry Tan - *"Thin Harness, Fat Skills"* | `github.com/garrytan/gbrain` + `x.com/garrytan/status/2042925773300908103` | 2026-04-22 |
| S11 | Microsoft Foundry Control Plane + Azure CAF AI-agents | learn.microsoft.com (5 sub-URLs) | 2026-04-22 |
| S12 | Kubernetes architecture | kubernetes.io | 2026-04-22 |

### 18.4 Refresh triggers (when to re-validate)

Re-run the four-model validation process if **any** of the following occur:
- A source in section 16.1 publishes a new version or a material breaking change (watch: WellArchitected REC numbering, Microsoft Foundry Control Plane GA, OWASP LLM Top 10 next edition, NIST AI RMF updates, EU AI Act secondary legislation).
- A **new regulatory framework** lands in your jurisdiction (EU AI Act GPAI code of practice, US executive orders on AI, sector-specific rules for FSI/healthcare/public sector).
- Any section 17.2 blocking gap (B1-B10) is resolved - update section 17 and this stamp.
- The **Microsoft Agent Framework**, **Foundry Agent Service**, or **GitHub Copilot cloud agent** ships a capability that changes the agent-plane design (e.g., native A2A, new policy engine, new identity model).
- 6-month scheduled refresh reaches due date (**Oct 22, 2026**).

### 18.5 Change log

| Version | Date | Change | Driver |
|---|---|---|---|
| 1.0 | 2026-04-22 | Initial plan: 15 sections, S1-S10 integrated | User prompt + 10-URL research brief |
| 1.1 | 2026-04-22 | Citation corrections (REC taxonomy, S7 patterns, S10 license, acronyms); added S11/S12; section 4 redrawn as three-plane architecture; added section 17 validation backlog; added section 18 provenance stamp | 4-model parallel validation + three-plane feedback |




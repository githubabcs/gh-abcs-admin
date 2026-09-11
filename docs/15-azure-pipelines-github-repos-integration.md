---
title: Azure Pipelines with GitHub Repositories
description: Migration guidance for Azure Pipelines using GitHub repositories, templates, authentication, triggers, and throttling controls.
render_with_liquid: false
---

## Azure Pipelines with GitHub Repositories

> **Document status**
>
> - Last technical review: 2026-09-11
> - Review status: AI-assisted documentation review; human maintainer approval is required before publication.
> - Sources: Public [GitHub documentation](https://docs.github.com) and [Microsoft Learn](https://learn.microsoft.com), cited inline and in the references.
> - **Verify before acting:** GitHub and Microsoft update product documentation continuously. Re-confirm against the live source pages before relying on this content for production decisions.

## Executive Summary

Azure DevOps Services supports GitHub repositories as sources for Azure Pipelines. Migrating from Azure Repos requires updating external repository resources, configuring authentication, and revalidating triggers and permissions. Same-repository template paths often remain unchanged. A phased migration is supported, provided referenced repositories and versions remain accessible during the transition.

GitHub API throttling can affect YAML retrieval before jobs start, while agent checkouts create separate Git traffic. Retain useful template reuse, but validate shared quota usage and peak workload. This guidance targets Azure DevOps Services with GitHub.com and GitHub Enterprise Cloud; do not assume identical support or limits for Azure DevOps Server or GitHub Enterprise Server.

---

## Table of Contents

1. [Understanding the Hybrid Model](#understanding-the-hybrid-model)
2. [Critical Impact Areas](#critical-impact-areas)
3. [Pipeline Template References](#pipeline-template-references)
4. [Repository Resources and Checkout](#repository-resources-and-checkout)
5. [Service Connections Requirements](#service-connections-requirements)
6. [GitHub Throttling and Pipeline Reliability](#github-throttling-and-pipeline-reliability)
7. [Triggers and Automation Impact](#triggers-and-automation-impact)
8. [Authentication and Authorization](#authentication-and-authorization)
9. [Migration Scenarios and Solutions](#migration-scenarios-and-solutions)
10. [Phase 2: GitHub Actions Multi-Repo Checkout](#phase-2-github-actions-multi-repo-checkout)
11. [Step-by-Step Remediation Guide](#step-by-step-remediation-guide)
12. [Best Practices and Recommendations](#best-practices-and-recommendations)
13. [Summary: Key Takeaways](#summary-key-takeaways)
14. [References](#references)

---

## Understanding the Hybrid Model

### The Scenario

Many organizations choose a phased migration approach:

1. Migrate repositories from Azure Repos to GitHub while retaining Azure Pipelines for CI/CD.
2. Optionally migrate CI/CD to GitHub Actions later. Remaining on Azure Pipelines is also a supported choice.

This creates a **hybrid model** where:

- Source code resides in **GitHub**
- CI/CD pipelines remain in **Azure Pipelines**
- Pipeline templates may reference repositories in **both locations**

### Why This Matters

Azure Pipelines supports both providers, but their integration details differ:

- Repository resource types change from `git` (Azure Repos) to `github`
- Service connections become mandatory for GitHub repos
- Trigger mechanisms work differently
- External repository names, connections, and permissions must match the destination

---

## Critical Impact Areas

### Impact Matrix

| Area | Impact Level | Effort to Fix | Description |
| ------ | ------------- | --------------- | ------------- |
| Pipeline templates (`extends`, `template`) | High for external references | Varies | Update migrated repository resources; local paths can remain unchanged |
| Repository resources (`checkout`) | 🔴 **High** | Medium | Multi-repo checkout requires service connections |
| CI/CD triggers | 🟡 **Medium** | Medium | Trigger configuration differs for GitHub |
| Variable groups & secrets | Low | Varies | Usually remain in Azure DevOps; verify permissions, fork restrictions, and repo-specific values |
| Artifact publishing | Low | Low | Azure Pipelines artifact tasks remain available; verify paths and permissions |
| Service connections | High | Medium | Create or reuse an authorized connection covering each referenced GitHub repository |
| GitHub throttling | Workload-dependent | Varies | Assess API quota sharing, template retrieval bursts, and Git read traffic |

### The Biggest Challenges

1. Update the repository resource definitions that point to migrated template repositories. Keep the same alias and template paths where possible.

2. Replace repository resource triggers for migrated GitHub resources. Native repository resource triggers support only Azure Repos Git, with additional constraints described below.

3. Scope connections and installation access by trust boundary. One authorized connection can serve multiple repositories; a connection per repository is not mandatory.

4. Coordinate dependent migrations. A phased approach works if old references remain available until consumers are updated; an atomic cutover is needed only when that compatibility cannot be maintained.

---

## Pipeline Template References

### How Templates Work Today (Azure Repos)

```yaml
# Current: Template in Azure Repos
resources:
  repositories:
    - repository: templates
      type: git                          # Azure Repos type
      name: MyProject/PipelineTemplates  # Project/Repo format

extends:
  template: ci-template.yml@templates
```

### After Migration (GitHub)

```yaml
# After: Template in GitHub
resources:
  repositories:
    - repository: templates
      type: github                                    # Changed type
      name: MyOrg/PipelineTemplates                   # Org/Repo format
      endpoint: GitHubServiceConnection               # Required!

extends:
  template: ci-template.yml@templates
```

### Key Differences

| Aspect | Azure Repos (`git`) | GitHub (`github`) |
| -------- | --------------------- | ------------------- |
| Type | `type: git` | `type: github` |
| Name format | `Project/Repository` | `Organization/Repository` |
| Service connection | Optional (same org) | **Required** |
| External resource `ref` when omitted | Defaults to `refs/heads/main` | Defaults to `refs/heads/main` |
| Repository resource triggers | Supported with documented constraints | Not supported; main-repository CI/PR triggers still work |

The resource `ref` is not automatically the branch of `self`. Set it explicitly when a repository uses another branch. Source: [repository resource schema](https://learn.microsoft.com/en-us/azure/devops/pipelines/yaml-schema/resources-repositories-repository?view=azure-pipelines).

### Template Extends Pattern Impact

An `extends` template can define a controlled pipeline structure. This skeleton shows parameter insertion only; echo statements are not security scans, and unrestricted `stepList` input does not enforce an approved task policy:

```yaml
# Central template repository (security-enforced)
# File: templates/secure-pipeline.yml
parameters:
- name: buildSteps
  type: stepList

stages:
- stage: Build
  jobs:
  - job: SecureBuild
    steps:
    - script: echo "Security scan starting"
    - ${{ parameters.buildSteps }}
    - script: echo "Security scan complete"
```

When the external template repository moves, update its consuming repository resource definitions:

1. Update the repository resource type to `github`
2. Add a service connection reference
3. Update the repository name format

The `extends.template` or `template` path can remain unchanged if the alias and file layout are preserved. For actual policy enforcement, use approved tasks, template validation, and required-template checks as appropriate. See [template-based pipeline security](https://learn.microsoft.com/en-us/azure/devops/pipelines/process/templates?view=azure-devops).

---

## Repository Resources and Checkout

### Multi-Repo Checkout Before Migration

```yaml
# Before: All repos in Azure DevOps
resources:
  repositories:
  - repository: tools
    type: git
    name: MyProject/BuildTools
  - repository: shared
    type: git
    name: MyProject/SharedLibraries

steps:
- checkout: self
- checkout: tools
- checkout: shared
```

### Multi-Repo Checkout After Migration

```yaml
# After: Repos migrated to GitHub
resources:
  repositories:
  - repository: tools
    type: github
    name: MyOrg/BuildTools
    endpoint: GitHubConnection
  - repository: shared
    type: github
    name: MyOrg/SharedLibraries
    endpoint: GitHubConnection

steps:
- checkout: self
- checkout: tools
- checkout: shared
```

### Mixed Scenario (Partial Migration)

During migration, you may have repositories in both locations:

```yaml
# Mixed: Some repos in Azure DevOps, some in GitHub
resources:
  repositories:
  # Already migrated to GitHub
  - repository: app-code
    type: github
    name: MyOrg/ApplicationCode
    endpoint: GitHubConnection
  
  # Still in Azure DevOps
  - repository: legacy-tools
    type: git
    name: MyProject/LegacyTools

steps:
- checkout: self
- checkout: app-code
- checkout: legacy-tools
```

This mixed model supports phased migration. Keep old resources available for consumers that have not moved, and authorize access to Azure Repos resources using the pipeline's Azure DevOps build identity as well as access to GitHub through its service connection.

With multiple checkouts, default folders use repository names, not resource aliases. Adding a second checkout also changes the default location of `self`. Set explicit `path` values relative to `$(Pipeline.Workspace)` where scripts depend on stable locations. See [multi-repository checkout paths](https://learn.microsoft.com/en-us/azure/devops/pipelines/repos/multi-repo-checkout?view=azure-devops#checkout-path).

---

## Service Connections Requirements

### Types of GitHub Service Connections

| Connection Type | Use Case | Recommendations |
| ----------------- | ---------- | ----------------- |
| GitHub App | CI integration using the Azure Pipelines identity | Microsoft's recommended authentication type; supports GitHub Checks |
| OAuth | Integration acting on behalf of an authorized GitHub user | Depends on that user's continued access; does not support GitHub Checks |
| Personal access token (PAT) | Token-based integration acting on behalf of a GitHub user | Protect and rotate the token; does not support GitHub Checks |

GitHub App, OAuth, and PAT authentication are distinct. The service-connection creation dialog's **Grant authorization** option is an OAuth flow; it must not be treated as proof of GitHub App authentication. Inspect the connection's actual authentication type: `Azure Pipelines app`, `oauth`, or `personalaccesstoken`.

Source: [GitHub authentication and connection types](https://learn.microsoft.com/en-us/azure/devops/pipelines/repos/github?view=azure-devops#connection-types).

### Creating a GitHub Service Connection

1. For the recommended App integration, have an authorized administrator install the [Azure Pipelines GitHub App](https://github.com/apps/azure-pipelines) for the required repositories.
2. Associate the installation with the intended Azure DevOps organization and project during setup.
3. Create a pipeline using that installation, or change an existing pipeline's GitHub connection to the App connection using the [documented switching procedure](https://learn.microsoft.com/en-us/azure/devops/pipelines/repos/github?view=azure-devops#how-do-i-switch-my-pipeline-to-use-github-app-instead-of-oauth).
4. For OAuth or PAT integration instead, use **Project Settings > Service connections > New service connection > GitHub**, then select the appropriate authentication option.
5. Authorize each consuming pipeline to use the connection and confirm access to every referenced repository.

### GitHub App Authentication Benefits

- Builds use **Azure Pipelines identity** (not personal identity)
- Supports **GitHub Checks** for PR status
- Installation-scoped API quota instead of a personal user's quota when using installation tokens
- Can be configured for **specific repositories only**

### Service Connection Authorization

```yaml
# In pipeline YAML
resources:
  repositories:
  - repository: myrepo
    type: github
    name: MyOrg/MyRepo
    endpoint: MyGitHubServiceConnection  # Must be authorized for this pipeline
```

**First-time authorization**: When a pipeline first uses a GitHub repository, you may see:

- "This pipeline needs permission to access a resource"
- Click "Authorize resources" to grant access

---

## GitHub Throttling and Pipeline Reliability

GitHub-side throttling is a documented integration risk, not evidence that templates or multi-repository pipelines are inherently unreliable. Assess peak request volume and authentication scope before classifying the risk as low. This section covers Azure DevOps Services with GitHub.com, including GitHub Enterprise Cloud; GitHub Enterprise Server limits require a separate assessment of the server configuration.

### Template Retrieval and Checkout Are Different

| Activity | Where and when it occurs | Throttling exposure |
| ---------- | -------------------------- | --------------------- |
| Trigger evaluation and template expansion | Azure Pipelines retrieves YAML, repository metadata, and referenced templates before requesting an agent. | GitHub API requests can be limited, preventing trigger evaluation or pipeline preparation. |
| Repository checkout | An agent performs Git fetch and checkout operations during a job. | Git read traffic has separate operational limits and can experience slowdowns or failures. |
| Check and status reporting | Azure Pipelines sends results back to GitHub. | API failures can delay or prevent status updates, leaving required checks unresolved. |

The use of `extends` and include templates increases retrieval work. Both templates in the main repository and templates in external repositories must be available during expansion. Referencing a template does not automatically check out its repository onto the agent; explicitly check it out only when jobs need its scripts or other files.

Once templates are expanded, jobs use the resulting pipeline definition. Do not assume one template reference equals one API request, that each job reloads every template, or that templates are cached across runs. The public documentation does not provide a fixed request-count or cache contract for capacity planning.

Sources: [GitHub integration limitations](https://learn.microsoft.com/en-us/azure/devops/pipelines/repos/github?view=azure-devops#limitations), [pipeline processing order](https://learn.microsoft.com/en-us/azure/devops/pipelines/process/runs?view=azure-devops#pipeline-processing), and [templates in other repositories](https://learn.microsoft.com/en-us/azure/devops/pipelines/process/templates?view=azure-devops#store-templates-in-other-repositories).

### API Quotas and Their Scope

| Authentication | Published primary REST API allowance | Scope |
| ---------------- | --------------------------------------- | ------- |
| Personal access token | Normally 5,000 requests per hour | Per user, shared with other requests charged to that user's quota |
| OAuth user access token | Normally 5,000 requests per hour; qualifying Enterprise Cloud OAuth apps can receive 15,000 | Per user, not per pipeline or token |
| GitHub App installation token | Minimum 5,000 requests per hour; eligible non-Enterprise installations scale up to 12,500 | Per installation |
| GitHub App installation token on a GitHub Enterprise Cloud organization | 15,000 requests per hour | Per installation, shared by consumers of that installation |

OAuth's higher allowance requires an app owned or approved by a GitHub Enterprise Cloud organization and a user who is a member of that organization. Enterprise Cloud does not automatically increase a PAT's allowance. GitHub App *user* tokens follow user quotas rather than installation quotas.

Creating additional PATs for the same user or service connections backed by the same installation does not create independent quota. Requests across repositories can share the same allowance. GitHub Actions `GITHUB_TOKEN` limits are not the limits for an Azure Pipelines GitHub service connection.

GitHub also enforces secondary limits for bursts, concurrency, and expensive requests. These can apply while hourly quota remains available, and some thresholds are unpublished or subject to change. A higher primary allowance does not eliminate secondary throttling.

Source: [GitHub REST API rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api).

### Separate Git Read Limits

GitHub recommends staying within 15 Git read operations per second per repository, including fetches and clones. This is an operational recommendation, not a guaranteed safe threshold or the REST API hourly quota. Many simultaneous jobs checking out the same shared repository can concentrate this load. Git LFS also has a separate API rate-limit bucket.

Reduce redundant checkouts and use shallow fetches or disable tag fetching where the build does not need history or tags. These changes reduce Git traffic; they do not reduce the server-side API requests needed to load templates. The same distinction applies to agent-side caches and self-hosted agents.

Source: [GitHub repository activity limits](https://docs.github.com/en/repositories/creating-and-managing-repositories/repository-limits#activity).

### Assess Peak Load, Not Only Template Count

- Inventory the connection type and underlying user or App installation for the main repository and each external repository.
- Measure peak push and PR activity, pipeline starts, template-file dependencies, simultaneous checkouts, and other automation sharing the same quota.
- Count pipeline definitions per repository. Microsoft recommends a maximum of 50 for best performance and 100 for acceptable performance. These are recommendations about definitions, not concurrent runs or templates.
- Account for trigger evaluation: a push causes Azure Pipelines to load pipeline YAML to decide what should run, so even pipelines that do not execute can generate retrieval traffic.
- Validate representative peak workloads with operational headroom. There is no published safe number of templates or universal pipelines-per-hour threshold.

Keep useful template reuse and security controls. Consolidate unnecessarily fragmented templates only where it reduces retrieval work without weakening maintainability or governance. Use branch/path filters and CI batching where appropriate, avoid redundant CI/PR runs, and stagger schedules. Filters reduce downstream work but do not eliminate all trigger-evaluation requests; CI batching is not supported for repository resource triggers.

Limiting agent concurrency does not necessarily limit template expansion, because expansion happens before an agent is requested. Pinning template versions improves reproducibility but is not a documented throttling mitigation.

### Detect and Recover from Throttling

| Signal | Interpretation and response |
| -------- | ----------------------------- |
| GitHub API HTTP 403 or 429 | Inspect the error body and available headers. A 403 alone is not proof of throttling; it can also indicate authorization problems. |
| `x-ratelimit-remaining: 0` | Primary quota is exhausted. Wait until `x-ratelimit-reset` before retrying. |
| Secondary-limit error | Honor `Retry-After` when present. Otherwise follow GitHub's guidance: wait until the primary reset if quota is exhausted, or at least one minute, then use bounded exponential backoff for repeated failures. |
| Canceled informational run, duration under one second, no jobs or steps | YAML retrieval failed. Throttling is one cause; outages and authentication errors can produce similar symptoms. Inspect the run's retrieval error. |
| Missing trigger, checkout error, or unresolved GitHub check | Investigate the relevant phase and service status; do not assume all such failures are rate limits. |

Use response headers or `GET /rate_limit` only under the relevant identity to assess primary quota. A personal PAT cannot reveal the Azure Pipelines App installation's remaining quota. GitHub does not expose a secondary-quota status endpoint, and service-managed API response headers may not be available in pipeline logs.

Retries in a job or script cannot repair YAML retrieval failures that occur before jobs exist. For API calls under your control, implement bounded retries and respect reset/backoff guidance. Do not assume Azure Pipelines guarantees replay of every failed trigger or transparent recovery from every throttled request. Verify required validations actually ran before allowing a merge or release.

For recurring service-managed failures, collect UTC timestamps, run IDs, repository references, connection authentication types, and sanitized errors or request IDs. Escalate through Microsoft and GitHub support to correlate traffic and quota usage; do not include access tokens or authorization headers. Preserve required checks rather than bypassing them to work around an incident.

Sources: [informational runs](https://learn.microsoft.com/en-us/azure/devops/pipelines/process/information-run?view=azure-devops), [GitHub rate-limit recovery](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api#exceeding-the-rate-limit), and [GitHub integration troubleshooting](https://learn.microsoft.com/en-us/azure/devops/pipelines/repos/github?view=azure-devops#faq).

---

## Triggers and Automation Impact

### Repository Resource Triggers

> [!IMPORTANT]
> Repository resource triggers support Azure Repos Git repositories in the same organization, and the pipeline's `self` repository must also be Azure Repos Git. They do not support GitHub or Bitbucket repository resources. Main-repository GitHub CI and PR triggers are separate features and are supported.

Source: [multi-repository trigger constraints](https://learn.microsoft.com/en-us/azure/devops/pipelines/repos/multi-repo-checkout?view=azure-devops#triggers).

### What This Means

**Before (Azure Repos)** - This worked:

```yaml
resources:
  repositories:
  - repository: shared-lib
    type: git
    name: MyProject/SharedLibrary
    trigger:              # ✅ Triggers when SharedLibrary changes
      branches:
        include:
        - main
        - releases/*

# Pipeline runs when SharedLibrary repo is updated
```

**After (GitHub)** - This does NOT work:

```yaml
resources:
  repositories:
  - repository: shared-lib
    type: github
    name: MyOrg/SharedLibrary
    endpoint: GitHubConnection
    trigger:              # Unsupported for GitHub repository resources
      branches:
        include:
        - main

# Pipeline does NOT run when SharedLibrary repo is updated
```

### Alternative Solutions for Triggers

#### Option 1: Use GitHub Webhooks

Create an Azure DevOps **Incoming WebHook** service connection, distinct from the GitHub repository service connection. Configure a GitHub webhook for the required events with content type `application/json`, using the Azure DevOps webhook URL from the [setup documentation](https://learn.microsoft.com/en-us/azure/devops/pipelines/process/resources?view=azure-devops#webhooks-resource).

Configure a shared secret on both sides and the documented `X-Hub-Signature` header for verification. The endpoint is public; payload filters alone are not authentication. Authorize the incoming webhook connection for the pipeline and validate a signed delivery before enabling it in production.

Put the webhook resource in the intended **Default branch for manual and scheduled builds** and run that pipeline once to register the webhook before testing delivery. Check the configured WebHook Name against the endpoint URL if registration fails. See [webhook validation and troubleshooting](https://learn.microsoft.com/en-us/azure/devops/pipelines/process/resources?view=azure-devops#how-can-i-validate-and-troubleshoot-my-webhook).

```yaml
resources:
  webhooks:
  - webhook: SharedLibraryUpdated
    connection: GitHubWebhookConnection
    filters:
    - path: repository.full_name
      value: MyOrg/SharedLibrary
    - path: ref
      value: refs/heads/main
```

This is a resource fragment, not a complete pipeline. Configure the sending webhook for push events. Validate and explicitly select the repository version to build if exact triggering-commit fidelity is required; receiving a webhook does not automatically reproduce native repository resource version selection. Do not interpolate untrusted payload text into shell commands.

#### Option 2: Use GitHub Actions to Trigger Azure Pipelines

Use a workflow in the dependency repository to call the Azure DevOps [Run Pipeline REST API](https://learn.microsoft.com/en-us/rest/api/azure/devops/pipelines/runs/run-pipeline?view=azure-devops-rest-7.1). Authenticate to Azure DevOps with an identity authorized to queue the target pipeline; a GitHub `GITHUB_TOKEN` is not an Azure DevOps credential.

Prefer Microsoft Entra authentication for new automation where supported. If a PAT is required, use an Azure DevOps PAT with the minimum necessary Build scope and queue permissions, store it as a GitHub Actions secret, and set an expiry/rotation policy. See [Azure DevOps authentication guidance](https://learn.microsoft.com/en-us/azure/devops/integrate/get-started/authentication/authentication-guidance?view=azure-devops).

For a push to the shared-library repository, construct a request body like the following using a JSON serializer. Replace the placeholders with validated full commit SHAs; `shared-lib` must match the alias in the target pipeline, not the GitHub repository name. Select an approved pipeline revision for `self` separately from the dependency event's revision.

```json
{
  "resources": {
    "repositories": {
      "self": {
        "refName": "refs/heads/main",
        "version": "<approved-pipeline-commit-sha>"
      },
      "shared-lib": {
        "refName": "refs/heads/main",
        "version": "<validated-dependency-push-commit-sha>"
      }
    }
  }
}
```

For this example, accept only pushes to `refs/heads/main` in the expected dependency repository; reject deletion events and invalid SHAs. Use the event's `after` commit for the dependency rather than resolving the latest branch tip later. The target pipeline still needs its authorized repository service connection; the queueing identity is a separate permission boundary.

Record the returned run ID and compare the run's `resources.repositories["shared-lib"].version` and the checked-out `HEAD` with the requested SHA. Do the same for `self` when pipeline-version fidelity matters. Handle API errors and avoid duplicate queueing on retries. Queueing is not completion: follow the run result and implement status reporting if this workflow is a required validation.

#### Option 3: Scheduled Pipeline Runs

```yaml
schedules:
- cron: "0 */4 * * *"  # Every 4 hours
  displayName: Regular sync
  branches:
    include:
    - main
  always: true
```

---

## Authentication and Authorization

### Personal Access Tokens (Classic) vs Fine-Grained PATs

Prefer the GitHub App for CI. If a GitHub PAT is necessary, Microsoft recommends fine-grained tokens for least privilege, but validate the complete integration rather than treating a successful checkout as proof that trigger setup and status reporting also work.

| PAT Type | Guidance | Notes |
| --- | --- | --- |
| Classic PAT | Documented by the GitHub integration setup guide | Listed scopes are `repo`, `admin:repo_hook`, `read:user`, and `user:email`; the generic service-connection dialog may recommend the broader `user` scope |
| Fine-grained PAT | Preferred over classic PATs when compatible with the required operations | Restrict repository permissions, confirm organization approval/policies, and test YAML loading, checkout, triggers, and status reporting |

These are GitHub tokens for repository integration, not Azure DevOps tokens used to queue pipelines. Sources: [secure repository access](https://learn.microsoft.com/en-us/azure/devops/pipelines/security/secure-access-to-repos?view=azure-devops#github-repositories) and [GitHub PAT integration setup](https://learn.microsoft.com/en-us/azure/devops/pipelines/repos/github?view=azure-devops#personal-access-token-pat-authentication).

### Required Permissions for GitHub App

| Permission | Purpose |
| ------------ | --------- |
| Write access to code | Allows the setup experience to commit YAML when explicitly requested |
| Read access to metadata | Fetch repo info |
| Read/write to checks | Display build status |
| Read/write to pull requests | Retrieve PR metadata and create setup PRs when explicitly requested |

These are the permissions documented for the Azure Pipelines App. Confirm the current installation consent screen rather than treating this table as a manifest for a custom app.

### Cross-Organization Access

If your GitHub repos are in different organizations:

- Install and approve the GitHub App separately in each required organization; select connections corresponding to those installations.
- Reuse a connection for repositories it is authorized to access. Separate connections are appropriate for distinct credentials, installations, or trust boundaries, not automatically for every repository.
- Apply organization policies, SSO authorization where applicable, and explicit pipeline permission to use each service connection.

When the Azure Pipelines App connects one GitHub repository to multiple Azure DevOps organizations, Microsoft documents that only the first organization's pipelines receive automatic CI/PR triggers; secondary organizations can use manual or scheduled runs.
Plan and test repository-to-organization mapping. See [pipelines across organizations and projects](https://learn.microsoft.com/en-us/azure/devops/pipelines/repos/github?view=azure-devops#create-pipelines-in-multiple-azure-devops-organizations-and-projects).

---

## Migration Scenarios and Solutions

### Scenario 1: Central Template Repository Migration

**Problem**: You have a central `PipelineTemplates` repo that 50+ pipelines extend from.

**Solution**:

1. Create and test an authorized GitHub connection.
2. Publish and validate the intended template version in GitHub.
3. Keep the Azure Repos version available while consumers migrate; define which location accepts changes to prevent divergence.
4. Update consumers in tested batches, preserving aliases and template paths where possible.
5. Retire the old location after all consumers have moved and the rollback window closes. Use a coordinated cutover if the old location cannot remain available.

**Updated Pipeline Example**:

```yaml
# Before
resources:
  repositories:
  - repository: templates
    type: git
    name: CentralProject/PipelineTemplates
```

```yaml
# After
resources:
  repositories:
  - repository: templates
    type: github
    name: MyGitHubOrg/PipelineTemplates
    endpoint: GitHub-CentralTemplates
    ref: refs/tags/v1.0.0

extends:
  template: dotnet-ci.yml@templates
```

The referenced tag must exist and be protected against movement or deletion.

### Scenario 2: Application with Shared Library Dependency

**Problem**: Application repo depends on a shared library repo for build-time resources.

**Before**:

```yaml
resources:
  repositories:
  - repository: shared-lib
    type: git
    name: MyProject/SharedLibrary
    trigger:
      branches:
        include:
        - main

steps:
- checkout: self
  path: s/app
- checkout: shared-lib
  path: s/shared-lib
- script: |
    cp "$(Pipeline.Workspace)"/s/shared-lib/config/*.json src/
  workingDirectory: $(Pipeline.Workspace)/s/app
```

**After**:

```yaml
resources:
  repositories:
  - repository: shared-lib
    type: github
    name: MyOrg/SharedLibrary
    endpoint: GitHubConnection
    # Note: trigger removed - not supported for GitHub

steps:
- checkout: self
  path: s/app
- checkout: shared-lib
  path: s/shared-lib
- script: |
    cp "$(Pipeline.Workspace)"/s/shared-lib/config/*.json src/
  workingDirectory: $(Pipeline.Workspace)/s/app
```

These script fragments assume a Linux agent, an existing application `src` directory, and matching configuration files in the dependency repository. Explicit paths preserve the layout across migration.

**Workaround for Trigger**:

- Use a signed GitHub webhook or a GitHub Actions workflow that queues the Azure pipeline through its API
- Or use scheduled builds

### Scenario 3: Monorepo with Multiple Pipelines

**Problem**: Single repo with multiple applications, each with its own pipeline.

**Solution**: Path-based triggers work for GitHub repos:

```yaml
# Pipeline for Service A
trigger:
  branches:
    include:
    - main
  paths:
    include:
    - services/service-a/**
    - shared/**

pr:
  branches:
    include:
    - main
  paths:
    include:
    - services/service-a/**
    - shared/**
```

  Azure Repos build-validation branch policies do not migrate into GitHub YAML `pr` triggers. Configure `pr` explicitly and configure required GitHub checks through branch protection or rulesets. Review implied CI settings, draft/fork PR settings, and any UI trigger overrides; test pushes and PRs independently. See [GitHub PR triggers](https://learn.microsoft.com/en-us/azure/devops/pipelines/repos/github?view=azure-devops#pr-triggers).

---

## Phase 2: GitHub Actions Multi-Repo Checkout

The sections above address the **hybrid model** (source in GitHub, CI/CD staying in Azure Pipelines). Once you move CI/CD into **GitHub Actions** (Phase 2), the multi-repo pattern changes again: the Azure Pipelines `resources: repositories:` declaration has **no native 1:1 equivalent**, and the default `GITHUB_TOKEN` is scoped to the workflow's own repo, so checking out a secondary private/internal repo needs explicit authentication.

That topic has its own dedicated guide:

See [GitHub Actions Multi-Repo Checkout Strategy](17-github-actions-repos-checkout-strategy.md) for `GITHUB_TOKEN` scope, internal/private repository access, short-lived App tokens, reusable workflows, artifact alternatives, and fork/submodule considerations.

---

## Step-by-Step Remediation Guide

### Pre-Migration Checklist

- [ ] **Inventory all pipelines** that reference the repos being migrated
- [ ] **Identify template dependencies** - which pipelines use `extends` or `template` from other repos
- [ ] **Create GitHub service connections** in advance
- [ ] **Test service connections** with a sample pipeline
- [ ] **Document current trigger configurations** (CI, PR, resource triggers)
- [ ] Plan for repository resource triggers that will not work after migration
- [ ] Inventory authentication quota sharing and expected peak template/checkout traffic
- [ ] Rebind or recreate the pipeline's main GitHub repository connection; changing external resources alone does not migrate `self`

### Migration Steps

#### Step 1: Create GitHub Service Connection

```text
Azure DevOps → Project Settings → Service connections → New → GitHub
```

For App authentication, follow [Creating a GitHub Service Connection](#creating-a-github-service-connection). **Grant authorization** in this dialog configures OAuth; it is not a substitute for installing and selecting the Azure Pipelines App.

#### Step 2: Update Repository Resource Definitions

Find and replace pattern:

```yaml
# Find (Azure Repos pattern)
- repository: <alias>
  type: git
  name: <Project>/<Repo>

# Replace with (GitHub pattern)
- repository: <alias>
  type: github
  name: <GitHubOrg>/<Repo>
  endpoint: <ServiceConnectionName>
```

#### Step 3: Update Triggers

For CI triggers on the main repository, review branch/path filters, implied CI settings, UI overrides, and the new GitHub connection.

For PR validation, replace Azure Repos branch-policy configuration with GitHub YAML `pr` triggers and required status checks. Validate fork and secret-access restrictions separately.

For unsupported repository resource triggers, remove them and implement a signed webhook, authenticated API integration, or a schedule. Reassess Azure Repos resource triggers too if `self` has moved to GitHub.

#### Step 4: Test in Non-Production

1. Create test branch with updated pipeline YAML
2. Run manual pipeline to verify checkout works
3. Verify template resolution succeeds
4. Test PR trigger behavior
5. Test peak-load behavior, denied access, missing templates, and failed trigger recovery

#### Step 5: Deploy Changes

Deploy tested batches while old template references remain valid. Coordinate an atomic cutover only when compatibility cannot be maintained, and retain a rollback path.

### Post-Migration Verification

- [ ] CI triggers work on push
- [ ] PR triggers work on pull requests
- [ ] Templates resolve correctly
- [ ] Multi-repo checkout works
- [ ] Artifacts publish correctly
- [ ] GitHub Checks appear for App authentication, or commit statuses for OAuth/PAT
- [ ] Required validations block merges until the expected result is reported
- [ ] Peak-load checks show acceptable preparation latency and quota headroom

---

## Best Practices and Recommendations

### 1. Use GitHub App Authentication

```yaml
# Recommended: Uses Azure Pipelines identity
resources:
  repositories:
  - repository: code
    type: github
    name: MyOrg/MyApp
    endpoint: AzurePipelines-GitHubApp  # GitHub App connection
```

### 2. Pin Template References

Set an explicit template version. A branch tracks future commits and is not immutable; use a protected release tag or an exact commit where supported and validated for the provider:

```yaml
resources:
  repositories:
  - repository: templates
    type: github
    name: MyOrg/PipelineTemplates
    endpoint: GitHubConnection
    ref: refs/tags/v2.0.0
```

  Protect release tags against movement/deletion. Pinning supports reproducibility, not a guaranteed reduction in API calls.

### 3. Centralize Service Connection Management

- Use **consistent naming conventions** for service connections
- Document which pipelines use which connections
- Restrict repository access at the credential/installation level and authorize each pipeline explicitly
- Separate connections by required security boundary; duplicating a connection alone does not isolate permissions or API quota

### 4. Plan for Trigger Limitations

Before migration, identify affected repository resource triggers and plan alternatives. Pipeline-resource completion triggers are a separate feature and are not removed merely because source repositories move to GitHub:

| Current Trigger | Alternative |
| ----------------- | ------------- |
| Resource trigger on library repo | Signed webhook or GitHub Actions calling the Azure DevOps API |
| Resource trigger on shared config | Scheduled runs, with an explicit freshness policy |
| Multi-repo trigger | External event integration with explicit repository/version selection |

### 5. Test Extensively Before Production

```yaml
# Use a test pipeline to verify configuration
trigger: none  # Manual only for testing
pr: none

pool:
  vmImage: ubuntu-latest

resources:
  repositories:
  - repository: migrated-repo
    type: github
    name: MyOrg/MigratedRepo
    endpoint: TestGitHubConnection

steps:
- checkout: migrated-repo
- bash: ls -la "$(Build.SourcesDirectory)"
```

This test requires access to Microsoft-hosted Linux agents and an authorized connection covering the example repository. It checks checkout only; validate templates, automatic triggers, and status reporting separately.

### 6. Document Your Migration

Create a tracking document with:

- [ ] All repos being migrated
- [ ] All pipelines affected
- [ ] Service connections created
- [ ] Trigger changes required
- [ ] Dependencies between pipelines
- [ ] Rollback plan

---

## Summary: Key Takeaways

| Aspect | Impact | Action Required |
| -------- | -------- | ----------------- |
| Repository type | External migrated resources change from `git` to `github` | Update affected definitions and the main source connection |
| Service connections | Required for GitHub access | Create or reuse an authorized connection |
| Template references | External resources need GitHub names and endpoints | Preserve aliases/local paths where unchanged |
| Repository resource triggers | Not supported for GitHub resources or GitHub `self` | Implement signed webhooks or authenticated API alternatives |
| CI/PR triggers | Supported, but provider configuration differs | Verify CI and configure GitHub PR validation/required checks |
| Multi-repo checkout | Works with service connection | Add endpoint to resources |
| Throttling | API and Git traffic have distinct limits | Measure shared quota usage and bursts; define recovery |

### Migration Success Criteria

- [ ] All pipelines build successfully
- [ ] Templates resolve from GitHub
- [ ] Multi-repo checkout works
- [ ] CI triggers fire on push
- [ ] PR validation triggers fire
- [ ] Expected GitHub Checks or commit statuses are displayed
- [ ] No "resource not authorized" errors occur
- [ ] Peak-load validation and incident recovery are documented

---

## References

- [Build GitHub repositories - Azure Pipelines](https://learn.microsoft.com/en-us/azure/devops/pipelines/repos/github)
- [Check out multiple repositories in your pipeline](https://learn.microsoft.com/en-us/azure/devops/pipelines/repos/multi-repo-checkout)
- [YAML templates in pipelines](https://learn.microsoft.com/en-us/azure/devops/pipelines/process/templates)
- [Resources in YAML pipelines](https://learn.microsoft.com/en-us/azure/devops/pipelines/process/resources)
- [GitHub service connection](https://learn.microsoft.com/en-us/azure/devops/pipelines/library/service-endpoints#github-service-connection)
- [Azure Pipelines GitHub App](https://github.com/apps/azure-pipelines)
- [GitHub REST API rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api)
- [GitHub repository limits](https://docs.github.com/en/repositories/creating-and-managing-repositories/repository-limits)
- [Pipeline processing and runs](https://learn.microsoft.com/en-us/azure/devops/pipelines/process/runs?view=azure-devops)
- [Informational runs](https://learn.microsoft.com/en-us/azure/devops/pipelines/process/information-run?view=azure-devops)
- [Secure repository access](https://learn.microsoft.com/en-us/azure/devops/pipelines/security/secure-access-to-repos?view=azure-devops)
- [Repository resource schema](https://learn.microsoft.com/en-us/azure/devops/pipelines/yaml-schema/resources-repositories-repository?view=azure-pipelines)
- [Incoming webhook schema and authentication](https://learn.microsoft.com/en-us/azure/devops/pipelines/yaml-schema/resources-webhooks-webhook?view=azure-pipelines)
- [GitHub Actions Multi-Repo Checkout Strategy (Phase 2)](17-github-actions-repos-checkout-strategy.md)

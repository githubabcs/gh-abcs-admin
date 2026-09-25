---
title: Azure Pipelines with GitHub Repositories
description: Migration guidance for Azure Pipelines using GitHub repositories, templates, authentication, triggers, and throttling controls.
render_with_liquid: false
---

## Azure Pipelines with GitHub Repositories

> **Document status**
>
> - Last technical review: 2026-09-25
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
6. [Multi-Project Repository Isolation](#multi-project-repository-isolation)
7. [One-Organization Project-Isolation Solutions](#one-organization-project-isolation-solutions)
8. [GitHub Throttling and Pipeline Reliability](#github-throttling-and-pipeline-reliability)
9. [Triggers and Automation Impact](#triggers-and-automation-impact)
10. [Authentication and Authorization](#authentication-and-authorization)
11. [Migration Scenarios and Solutions](#migration-scenarios-and-solutions)
12. [Phase 2: GitHub Actions Multi-Repo Checkout](#phase-2-github-actions-multi-repo-checkout)
13. [Step-by-Step Remediation Guide](#step-by-step-remediation-guide)
14. [Best Practices and Recommendations](#best-practices-and-recommendations)
15. [Summary: Key Takeaways](#summary-key-takeaways)
16. [References](#references)

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

## Multi-Project Repository Isolation

### Research Conclusion

The Azure Pipelines GitHub App and an Azure DevOps service connection enforce
different boundaries:

| Control | Boundary | What it restricts |
| --------- | ---------- | ------------------- |
| GitHub App installation repository selection | GitHub account or organization | Repositories for which GitHub can issue installation-token access |
| Azure DevOps service-connection project permissions | Azure DevOps organization containing the endpoint | Projects in that organization that can reference the endpoint |
| Azure DevOps service-connection pipeline permissions | Azure DevOps project | Pipelines that can use the endpoint |
| Azure DevOps service-connection user roles | Azure DevOps project or organization | Users and groups that can administer or use the endpoint |

Multiple Azure DevOps projects, including projects in different Azure DevOps
organizations, can create pipelines that use the installed Azure Pipelines App.
Their project-local endpoints can have different Azure DevOps owners and
pipeline permissions. No documented first-party setting gives each endpoint a
narrower subset of the repositories selected on the GitHub App installation.
If one GitHub repository is connected to pipelines in several Azure DevOps
organizations, Microsoft documents automatic GitHub CI and PR triggers only for
the first organization. Pipelines in secondary organizations can still run
manually or on a schedule. See [create pipelines in multiple Azure DevOps organizations and projects](https://learn.microsoft.com/en-us/azure/devops/pipelines/repos/github?view=azure-devops#create-pipelines-in-multiple-azure-devops-organizations-and-projects).

> [!IMPORTANT]
> If the Azure Pipelines App is installed with **All repositories**, an
> installation token can access all public and private repositories in that
> GitHub organization. Creating one service connection per Azure DevOps project
> does not reduce that GitHub-side scope.

Microsoft recommends either selecting only the repositories the App requires or
separating private repositories into another organization. GitHub manages
repository selection on the installed App through **All repositories** or
**Only select repositories**. See [secure GitHub repository access](https://learn.microsoft.com/en-us/azure/devops/pipelines/security/secure-access-to-repos?view=azure-devops#github-repositories)
and [modify an installed GitHub App](https://docs.github.com/en/apps/using-github-apps/reviewing-and-modifying-installed-github-apps).

### Documented Cross-Project Checkout Behavior

As of September 25, 2026, an authorized pipeline in Azure DevOps Project A can
declare and check out a private GitHub repository normally built by Project B
when both projects use connections backed by an Azure Pipelines App installation
with **All repositories** access.

> [!WARNING]
> A GitHub repository does not belong to an Azure DevOps project as an
> authorization boundary. Project B might contain the pipeline that normally
> builds the repository, but Project A can still request that repository if
> Project A's authorized service connection can access it.

Microsoft states that a pipeline can currently access all GitHub repositories
its service connection allows, without a per-repository Azure Pipelines
restriction. This is a documented product gap, not an inference from the user
interface. See [Control access to GitHub repositories](https://learn.microsoft.com/en-us/azure/devops/release-notes/roadmap/control-access-to-github-repos).

The supported checkout uses a GitHub repository resource:

```yaml
resources:
  repositories:
  - repository: projectBRepo
    type: github
    name: GitHubOrg/ProjectBPrivateRepo
    endpoint: ProjectA-GitHub-App-Connection
    ref: refs/heads/main

steps:
- checkout: projectBRepo
```

Changing `name` to another repository covered by the same App installation does
not introduce a documented Project B approval or GitHub repository authorization
gate. The YAML schema identifies a GitHub repository by `owner/repository` and
the service connection in `endpoint`. It does not include an Azure DevOps
project qualifier. By contrast, cross-project Azure Repos references use
`ProjectName/RepositoryName`. See the [repository resource schema](https://learn.microsoft.com/en-us/azure/devops/pipelines/yaml-schema/resources-repositories-repository?view=azure-pipelines)
and [multi-repository checkout](https://learn.microsoft.com/en-us/azure/devops/pipelines/repos/multi-repo-checkout?view=azure-devops).

The checkout succeeds when all of these conditions are true:

1. The target repository belongs to the GitHub account or organization where
   the Azure Pipelines App is installed.
2. The installation has **All repositories** access, or the target is included
   when **Only select repositories** is used.
3. The App installation has sufficient repository-content permission and is
   active.
4. Project A has a service connection backed by that installation.
5. The pipeline is explicitly authorized to use the connection, unless the
   connection was deliberately opened to all pipelines.
6. Any approvals and checks attached to the service connection pass.
7. The repository name and requested ref are valid.

The documented authorization sequence is therefore:

```text
Pipeline A
└── authorized to use Project A service connection
    └── backed by the GitHub App installation
        └── allowed to read every repository in the installation repository set
```

Azure DevOps does not add this sequence:

```text
Target GitHub repository
└── assigned to Azure DevOps Project B
    └── Project B must approve Project A
```

No documented assignment or approval relationship of that kind exists for an
external GitHub repository. Microsoft also states that **Protect access to
repositories in YAML pipelines** does not apply to GitHub repositories. The
Azure DevOps protected-resource gate is the service connection, not an
individual external GitHub repository.

This behavior can still be constrained through governance:

* Prevent unauthorized changes to effective pipeline YAML with branch
  protection, rulesets, CODEOWNERS, and required reviews.
* Restrict service-connection pipeline permissions instead of granting open
  access.
* Attach approvals, required-template checks, or other checks to the service
  connection.
* Limit who can create, edit, share, and administer service connections.

These controls can stop an unauthorized YAML change or pipeline run. They do
not narrow the GitHub repositories reachable through a connection after its
pipeline is authorized.

Do not use `persistCredentials: true` and a separate `git clone` as the
validation method. That setting only leaves the checkout credential in Git
configuration and does not document cross-repository reuse. Declare the target
under `resources.repositories` and use the supported `checkout` step when
testing this boundary.

### Why Separate Connections Do Not Segment Repositories

A project-local service connection is still valuable. It prevents an
unauthorized Azure Pipeline from using the endpoint when pipeline permissions
are restricted. It also provides project-specific ownership and audit records.
However, the connection remains a consumer of the same GitHub App installation.

The following design provides Azure DevOps administrative separation, but not
disjoint GitHub repository authorization:

```text
GitHub organization
└── Azure Pipelines App installation: All repositories
    ├── Azure DevOps Project A: local service connection A
    └── Azure DevOps Project B: local service connection B
```

Sharing a service connection through its **Project permissions** page has the
same GitHub limitation. Sharing adds project references to the existing
endpoint; it does not clone the credential or create another GitHub
installation. See [service-connection project permissions](https://learn.microsoft.com/en-us/azure/devops/pipelines/policies/permissions?view=azure-devops#set-service-connection-project-permissions)
and the [Share Service Endpoint REST API](https://learn.microsoft.com/en-us/rest/api/azure/devops/serviceendpoint/endpoints/share-service-endpoint?view=azure-devops-rest-7.1).

GitHub's installation model exposes the organization's installation of a
particular App as a singular resource. The same App can be installed in several
different GitHub organizations or accounts, but the documented model does not
provide parallel installations of that App in one organization, each with a
different repository list. GitHub documents installations across multiple
accounts in [installing a GitHub App from a third party](https://docs.github.com/en/apps/using-github-apps/installing-a-github-app-from-a-third-party)
and the singular organization lookup in [Get an organization installation for the authenticated app](https://docs.github.com/en/rest/apps/installations#get-an-organization-installation-for-the-authenticated-app).

### Controls Versus Security Boundaries

| Mechanism | Classification | Security effect |
| ----------- | ---------------- | ----------------- |
| App installation with **Only select repositories** | GitHub-enforced boundary for private repository access | GitHub denies installation-token access to private repositories outside the selected set; the set is shared by every Azure DevOps consumer of the installation, and public repository visibility still applies |
| Separate GitHub organizations and App installations | Strong hard boundary | Creates distinct installation IDs, repository sets, owners, and policies |
| Fine-grained PAT restricted to selected repositories | GitHub-enforced token boundary | Repository selection is fixed for the issued token and is stronger than mutable account membership; approval, revocation, and replacement remain administrative operations |
| Project-local connection with named pipeline permissions | Azure DevOps usage boundary | Prevents unapproved pipelines from using the endpoint, but does not narrow its GitHub repository set |
| Shared service connection | Expanded trust boundary | Allows more Azure DevOps projects to use the same endpoint and credential |
| Required templates, approvals, and pipeline policies | Governance control | Constrains approved pipeline behavior, but does not change token capabilities |
| GitHub rulesets, branch protection, and CODEOWNERS | Change governance | Protects refs and review workflows, but does not remove App read access |
| Broker, mirror, or artifact promotion | Hard boundary when credentials are separated | Keeps the broad source credential out of downstream projects |

Azure Repos repositories can have Azure Pipelines checks and pipeline
permissions configured under **Project settings > Repositories**. Microsoft
states that **Protect access to repositories in YAML pipelines** does not apply
to GitHub repositories. Declaring a GitHub repository under
`resources.repositories` does not create an additional GitHub authorization
boundary. For GitHub, protect both the service connection in Azure DevOps and
the App installation in GitHub. See [secure repository access](https://learn.microsoft.com/en-us/azure/devops/pipelines/security/secure-access-to-repos?view=azure-devops)
and [protect a repository resource](https://learn.microsoft.com/en-us/azure/devops/pipelines/process/repository-resource?view=azure-devops).

### Enterprise Implementation Patterns

#### Pattern A: One Selected-Repository Trust Domain

Use one App installation with **Only select repositories** when all consuming
Azure DevOps projects can legitimately share the union of selected
repositories.

1. Select only the repositories required by the trust domain.
2. Create a project-local service connection in each Azure DevOps project.
3. Keep **Grant access permission to all pipelines** disabled.
4. Authorize named pipelines and minimize service-connection Administrator and
   User roles.
5. Review the installation repository list and endpoint consumers
   periodically.

This pattern improves ownership and limits accidental use. It does not prevent
an authorized pipeline from attempting to access another repository in the
installation's selected set.

#### Pattern B: Separate GitHub Organizations

Use a separate GitHub organization for each regulatory, customer, subsidiary,
or high-impact trust domain. Install Azure Pipelines independently in each
organization and select only that domain's repositories.

This is the most direct supported way to obtain separate installations of the
same first-party Azure Pipelines App. The cost is additional organization
administration, policy alignment, repository moves, and cross-organization
dependency management.

Keep each Azure DevOps project authorized only for its own domain's connection.
Do not share a domain connection into another project's trust boundary or
authorize that project to use a second domain's connection.

#### Pattern C: Project-Specific Fine-Grained PATs

When repositories must remain in one GitHub organization, use a dedicated
nonhuman account and fine-grained PAT for each security domain. Restrict each
token to the required repositories and minimum permissions, then create a
project-local PAT-backed service connection.

Remove or deny access to broader App-backed and user-backed connections in
those projects. A narrow PAT does not provide isolation if the same pipeline can
use another connection with broader GitHub access.

GitHub organizations can require approval for fine-grained PATs and enforce
token-lifetime policies. See [managing fine-grained PATs](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens).

Trade-offs include secret rotation, user-linked identity lifecycle, no GitHub
Checks integration, and task-specific compatibility testing. Microsoft
recommends App authentication for normal CI, so use PATs only when the
additional repository boundary justifies these costs.

#### Pattern D: Broker, Mirror, or Artifact Promotion

For high-assurance environments, give GitHub access only to a controlled broker
pipeline or service. It can validate a commit and then:

* Mirror an approved branch or commit into a project-specific Azure Repos
  repository
* Publish an immutable source bundle
* Publish signed build artifacts with provenance and digest metadata

Downstream Azure DevOps projects consume the mirror or artifact without
receiving the source GitHub credential. This pattern enables project-scoped
Azure DevOps identities and protected-resource controls, but adds promotion,
freshness, provenance, retention, and incident-recovery responsibilities.

### High-Level Boundary Choices

See [One-Organization Project-Isolation Solutions](#one-organization-project-isolation-solutions)
for the detailed compatibility matrix, security prerequisites, and rollout
guidance.

| Requirement | Recommended pattern |
| ------------- | --------------------- |
| Several projects may access the same approved repository set | One selected-repository installation with project-local connections |
| Projects require disjoint, enforceable repository sets | Separate GitHub organizations and App installations, with no cross-domain connection sharing |
| Repositories cannot move, but per-project credential scope is mandatory | Dedicated accounts and fine-grained PATs, after compatibility validation and removal of broader connections |
| Downstream projects must never receive source credentials | Broker, mirror, or artifact promotion |
| Only project ownership and pipeline-use separation are required | Project-local connections with named pipeline permissions |
| Central endpoint administration is more important than isolation | Shared connection, documented as a common trust boundary |

### Operational Caveats

* Microsoft does not document a per-service-connection repository filter for
  the first-party Azure Pipelines App.
* Do not assume the generic GitHub API ability to mint a repository-narrowed
  installation token is used by Azure Pipelines for each service connection.
  No public Azure Pipelines contract promises this behavior.
* App-authenticated checkout and triggers do not prove that every built-in or
  marketplace task supports the `InstallationToken` authorization scheme.
  Validate every GitHub-integrated task.
* Automation support for App-backed service connections is uneven. For example,
  the Azure CLI request to create `InstallationToken` GitHub endpoints remains
  tracked in [Azure/azure-cli-extensions#1971](https://github.com/Azure/azure-cli-extensions/issues/1971).
  Test automation against the current Azure DevOps API before standardizing it.
* The Azure DevOps roadmap item [Control access to GitHub repositories](https://learn.microsoft.com/en-us/azure/devops/release-notes/roadmap/control-access-to-github-repos)
  describes the current gap and a future goal. Do not treat a roadmap item as an
  available security control.

---

## One-Organization Project-Isolation Solutions

### Product Constraint

As of September 25, 2026, Azure Pipelines has no first-party configuration that
simultaneously provides all of the following:

1. One GitHub organization
2. A different enforceable GitHub repository set for each Azure DevOps project
3. Native Azure Pipelines checkout and CI/PR triggers
4. GitHub Checks through the Microsoft-owned Azure Pipelines App

The first-party App remains the lowest-maintenance integration when all selected
repositories belong to one trust domain. It is not suitable when mutually
isolated Azure DevOps projects require different repository subsets within the
same GitHub organization.

The practical one-organization solutions make one of these trade-offs:

* Use a dedicated GitHub automation identity and retain native Azure Pipelines
  triggers, checkout, and classic commit statuses, but not GitHub Checks.
* Use GitHub Actions as the repository-scoped event and source boundary, then
  hand an immutable artifact or source bundle to Azure Pipelines.
* Operate a custom GitHub App and broker that recreates webhook, checkout, and
  Checks integration with project-specific credentials.

### Solution Comparison

| Option | Native checkout | Native CI and PR triggers | GitHub result | Repository isolation | Operational cost |
| -------- | ----------------- | --------------------------- | --------------- | ---------------------- | ------------------ |
| First-party Azure Pipelines App | Yes | Yes | GitHub Checks | Installation-wide repository set, not per Azure DevOps project | Low |
| Dedicated automation identity and OAuth | Yes | Yes when webhook operations succeed | Classic commit status | Account repository membership, subject to organization visibility and administrator changes | Medium |
| Dedicated automation identity and PAT | Yes | Yes when webhook operations succeed | Classic commit status | Account membership and, for a fine-grained PAT, selected repositories | Medium |
| GitHub Actions with artifact handoff | Azure Pipeline consumes an artifact, not GitHub checkout | GitHub Actions owns triggers | GitHub Actions check, with Azure result reconciliation | Repository-scoped workflow token and isolated artifact store | Medium to high |
| Custom GitHub App and broker | Custom checkout | Custom webhook bridge | Custom Checks or statuses | App installation and token scope per trust domain | High |
| GitHub-to-Azure-Repos mirror | Azure Pipeline checks out the mirror | Mirror event or Azure Repos trigger | Requires custom GitHub reconciliation | Azure Repos ACL and mirror credential | High |

### Native Pattern: Dedicated Automation Identity

The closest native solution is one GitHub automation account for each security
domain, normally one per Azure DevOps project or project group. Grant the
account access only to that domain's GitHub repositories, then create a
project-local OAuth- or PAT-backed GitHub service connection.

```text
GitHub organization
├── Project A repositories
│   └── Automation account A
└── Project B repositories
    └── Automation account B

Azure DevOps Project A
└── GitHub connection A
    └── authenticates as Automation account A

Azure DevOps Project B
└── GitHub connection B
    └── authenticates as Automation account B
```

The GitHub identity creates a GitHub-enforced but administratively mutable
boundary for private repositories it cannot read. If Project A requests a
Project B private repository outside that identity's access, GitHub rejects the
request.

This boundary requires all of the following:

* Set the GitHub organization base permission to **No permission**.
* Do not use internal visibility for repositories outside the identity's trust
  domain because enterprise members can read internal repositories.
* Treat public repositories as readable regardless of project assignment.
* Alert on team, collaborator, repository-role, and base-permission changes.
* Review repository administrators who can add the automation identity and
  silently widen its access.

Use a separate GitHub machine user, GitHub's term for this automation account,
for each trust domain. Do not make it an organization owner, add it to broad
teams, or reuse it for unrelated automation. Assign a named human custodian,
protect interactive login and 2FA recovery, authorize SAML SSO where required,
and use the enterprise identity lifecycle required by Enterprise Managed Users.
Private repository access can consume a GitHub license. GitHub recommends a
GitHub App over a machine user where the target platform supports it. See
[managing deploy keys and machine users](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/managing-deploy-keys).

Organization membership enables fine-grained PAT ownership but also exposes the
account to organization base permissions and internal repositories. Keeping the
account as an outside collaborator avoids those organization-wide visibility
paths, but GitHub documents that outside collaborators can use only classic
PATs. Choose this trade-off explicitly.

#### OAuth Option

OAuth is documented as a native Azure Pipelines GitHub connection type. It
supports checkout, push and PR triggers, Azure-created webhooks, and classic
commit-status reporting when the account can create and manage the required
repository webhooks. It does not support GitHub Checks. Protect and periodically
review the non-expiring OAuth authorization, and reauthorize it when identity,
SSO, or organization policy changes invalidate it.

OAuth authorization is not repository-selective. Its effective repository set
is the set visible to the authorizing account. The account's GitHub team and
repository membership must therefore remain narrow.

#### PAT Option

A fine-grained PAT adds a second GitHub-enforced restriction:

* One resource owner
* Explicit selected repositories
* Explicit repository permissions
* Organization approval
* Expiration and revocation controls

Expected permissions should be tested against the integration, but can include:

* Metadata: read
* Contents: read
* Pull requests: read
* Commit statuses: read and write
* Webhooks: read and write

Grant Contents write only when Azure Pipelines must commit pipeline YAML or
other content. Native CI and PR triggers require webhook management. The token
needs Webhooks write permission, while the automation account separately needs
repository Admin or a custom repository role that includes **Manage webhooks**.
Prefer a custom role with only the required webhook and content capabilities
over general repository administration.

> [!CAUTION]
> Microsoft security guidance recommends a fine-grained PAT when PAT
> authentication is necessary, but the main GitHub service-connection
> documentation still describes classic scopes such as `repo`, `user`, and
> `admin:repo_hook`; the GitHub integration page additionally lists
> `read:user` and `user:email`. Microsoft also discourages PAT use when App
> authentication can meet the requirement. Treat complete fine-grained PAT
> compatibility as a required pilot result, not an assumption.

The pilot must verify:

1. Service-connection creation and validation
2. Primary and additional repository checkout
3. Push trigger delivery
4. PR trigger delivery
5. Webhook creation and redelivery
6. Commit-status publication
7. Token replacement and revocation
8. User-profile and email calls used during connection validation
9. PR comment triggers
10. Every built-in or marketplace task that calls GitHub

If a fine-grained PAT does not support the complete workflow, use OAuth or a
classic PAT owned by the same narrowly entitled automation account. A classic
`repo` PAT is broad, so containment depends on the account's administratively
maintained repository visibility.

> [!WARNING]
> OAuth- and PAT-backed integrations publish classic commit statuses, which are
> weaker merge gates than GitHub App checks. Another actor with permission to
> write commit statuses can publish the same context name. Treat the Azure
> status as informational, or enforce merge through a GitHub App- or GitHub
> Actions-sourced check whose expected source can be pinned.

Assume an authorized pipeline job can exercise the connection's complete
credential authority. Do not expose the connection to untrusted YAML or fork
builds, do not enable secrets for fork validations, and do not rely on
`persistCredentials: false` as the repository boundary.

#### Azure DevOps Hardening

For every project-local connection:

1. Keep **Grant access permission to all pipelines** disabled.
2. Authorize only named pipelines.
3. Do not share the connection with other projects.
4. Restrict service-connection Administrator and User roles.
5. Restrict who can create service connections.
6. Remove the first-party Azure Pipelines App from these repositories when the
   native App is not part of the approved design.
7. Review membership in the Azure DevOps **Endpoint Creators** group and reserve
   connection creation for a central integration team.
8. Prevent human OAuth connections and broader App- or PAT-backed connections.
9. Protect pipeline YAML with GitHub rulesets, CODEOWNERS, and required reviews.
10. Query the service-endpoints API periodically and flag any unapproved
    `InstallationToken`, `OAuth`, or `PersonalAccessToken` endpoint.
11. Inventory GitHub memberships, PAT approvals, connection owners, and
    authorized pipelines across every Azure DevOps organization that can use
    the GitHub organization.

A narrowly scoped connection does not provide isolation if the same project
can create or use another connection with broader GitHub access.

### GitHub Actions as the Repository Control Plane

Organizations that prioritize repository isolation often let GitHub Actions
retain the GitHub event and source context, then use Azure Pipelines for
deployment, protected environments, approvals, or selected build stages.

```text
GitHub push or pull request
└── GitHub Actions
    ├── checks out the repository
    ├── builds or packages immutable input
    ├── records commit, PR, workflow, and artifact provenance
    └── queues Azure Pipeline
        ├── verifies provenance and digest
        └── builds or deploys the exact input
    └── polls or receives the Azure terminal result
        └── completes the GitHub check
```

The Azure Pipeline must not clone GitHub through a broad connection after being
queued. Store its YAML in Azure Repos or use a non-GitHub classic definition,
and specify `checkout: none` so the job does not implicitly check out `self`.
Transfer the exact input through an isolated store, for example:

* Container image identified by digest
* Immutable Azure Blob source bundle
* Versioned package in Azure Artifacts
* Signed artifact with provenance or attestation

Pass an event envelope containing at least:

* GitHub organization and repository
* Event name and actor
* Source ref and exact commit SHA
* PR number and PR head SHA when applicable
* GitHub workflow run ID, attempt, and URL
* Artifact URI and immutable digest
* Provenance identity
* Azure DevOps project and pipeline
* Unique correlation and deduplication key

Queue success is not pipeline success. The GitHub Actions workflow or a broker,
not the isolated Azure Pipeline, must capture the Azure run ID, keep the GitHub
check pending, reconcile Azure's terminal result, and publish that result
against the exact GitHub commit. Handle retries, cancellation, and superseded
runs.

The published [`Azure/pipelines`](https://github.com/Azure/pipelines) action
demonstrates GitHub-initiated queueing, not artifact handoff. It requires an
Azure DevOps PAT, returns after queueing, and does not provide a complete
terminal-status bridge. When the Azure definition points to the same GitHub
repository, the action passes the branch and SHA and lets Azure Pipelines clone
the source through its own GitHub connection. Its latest published release,
v1.2, is dated November 12, 2019. Review or replace it rather than adopting it
unchanged. The action cannot accept a Microsoft Entra bearer token, so an OIDC
design must call the Azure DevOps REST API directly.

For new implementations, GitHub Actions can federate to a Microsoft Entra
service principal. Use one service principal per trust domain and pin its
federated credential subject to a specific GitHub repository and protected
environment without broad subject matching. The Azure DevOps organization must
be connected to the same Microsoft Entra tenant. Add the service principal's
Enterprise applications object ID to Azure DevOps, assign the lowest validated
access level, and grant **Queue builds** only on the target pipelines. Microsoft
Entra application permissions do not grant Azure DevOps permissions.

Acquire a short-lived token for Azure DevOps resource
`499b84ac-1321-427f-aa17-267ca6975798` and call the Pipelines REST API. This
avoids storing an Azure DevOps PAT.
See [service principals and managed identities in Azure DevOps](https://learn.microsoft.com/en-us/azure/devops/integrate/get-started/authentication/service-principal-managed-identity?view=azure-devops).

Public implementations of GitHub-initiated Azure Pipeline queueing include:

| Organization | Example | Observed pattern |
| -------------- | --------- | ------------------ |
| Microsoft | [Power Query SDK release candidate workflow](https://github.com/microsoft/vscode-powerquery-sdk/blob/d596661f4b1ec72656db31ae89fd3616ab8d67ea/.github/workflows/rc.yml) | Packages in GitHub, then queues Azure Pipelines with the branch ref; the artifact is not transferred |
| National Instruments | [grpc-labview Azure DevOps trigger](https://github.com/ni/grpc-labview/blob/2f07f0318a4f26bd4a6423b387f0343813f73f29/.github/workflows/trigger_azdo_ci.yml) | Reusable workflow with canonical-repository gating and run correlation |
| SPS Commerce | [API standards release workflow](https://github.com/SPSCommerce/sps-api-standards/blob/03be383b750161618db8dfe24e90056a0fb7b20b/.github/workflows/release.yml) | GitHub release flow queues an Azure publishing pipeline without transferring an artifact |
| Public Health Agency of Canada | [IRIDA Next Azure DevOps trigger](https://github.com/phac-nml/irida-next/blob/d11b985ac7cdcbb7c77b664377bdc7e7645cb96d/.github/workflows/trigger-azure-devops.yml) | Repository-owner gating and project-specific queue parameters |

Most public examples use Azure DevOps PATs. They demonstrate the architecture,
not artifact isolation or the preferred current authentication mechanism.

### Custom GitHub App and Token Broker

When GitHub Checks, short-lived credentials, and one-organization project
isolation are all mandatory, create a different customer-owned GitHub App for
each trust domain:

```text
GitHub organization
├── Custom App for Project A
│   └── installed only on Project A repositories
└── Custom App for Project B
    └── installed only on Project B repositories
```

Distinct App registrations allow different selected-repository installations
inside one GitHub organization. A broker can mint one-hour installation tokens
further restricted to one repository and minimal permissions. See [generating an installation access token](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app).

Azure Pipelines does not document a native GitHub service-connection scheme in
which customers supply an arbitrary App ID, installation ID, and private key.
The broker must therefore implement or coordinate:

1. Webhook validation and event-to-pipeline mapping
2. Azure Pipeline queueing and cancellation
3. Repository- and permission-scoped token minting
4. Controlled checkout using the short-lived token
5. GitHub Check Run or commit-status creation
6. Terminal-result reconciliation
7. Deduplication, retry policy, rate limiting, and outage recovery
8. App-key rotation, audit records, and incident response

One App registration and root key per trust domain provides stronger
root-credential separation than one App with runtime token down-scoping. Store
private keys in a vault or signing service and do not persist installation
tokens. Use a separate broker deployment and key-vault access policy for each
trust domain. One broker identity that can read every domain's private key
collapses the intended root-credential separation.

Restrict and audit the organization owners and GitHub App managers who can
change each installation's selected-repository set. Alert on installation
repository and permission changes.

This pattern can meet all functional and isolation requirements, but it is a
custom platform capability rather than an Azure Pipelines configuration.

### Mirror and Artifact Patterns

A one-way GitHub-to-Azure-Repos mirror lets Azure Pipelines use project-scoped
Azure Repos identities and repository protected-resource controls. A true Git
mirror preserves commits, trees, parentage, branches, tags, and SHAs, but not
GitHub PR reviews, Checks, Actions runs, rulesets, or webhook actor identity.
Scope the mirror's GitHub read credential and Azure Repos write identity to one
trust domain.

Operational requirements include:

* Ref deletion and force-push handling
* Git LFS synchronization
* Mirror lag monitoring and recovery
* Prevention of writes to the mirror
* Duplicate-build suppression
* GitHub status reconciliation
* Explicit handling of `refs/pull/*` when PR validation is required
* Isolation of untrusted fork content mirrored through pull-request refs

Artifact-only promotion creates a cleaner boundary. GitHub Actions builds once,
publishes an immutable artifact, and Azure Pipelines deploys that exact digest.
Registry or feed ACLs plus mandatory provenance verification form the
consumption boundary. Mutable tags, artifact names, and workflow ordering do
not.

### Governance Controls Are Not Credential Scope

Required templates, service-connection checks, branch protection, rulesets,
and CODEOWNERS improve prevention and review. They do not change the repository
claims of a GitHub credential.

A server-side required-template check is meaningful resource-use enforcement,
but it governs only the protected resource to which it is attached. It does not
provide GitHub repository isolation, and privileged resource administrators can
bypass checks. Pin governed templates to a protected immutable tag or commit,
or protect the central template branch as a high-value dependency.

### Recommended Architecture by Requirement

| Requirement | Recommended architecture |
| ------------- | -------------------------- |
| Native Azure checkout and triggers with one GitHub organization | Dedicated automation identity and project-local OAuth or PAT connection |
| Defense-in-depth repository selection | Dedicated automation identity plus fine-grained PAT after compatibility validation |
| GitHub Checks are mandatory | Custom App and broker, or accept the first-party App's shared installation scope |
| No GitHub credential may enter Azure DevOps | GitHub Actions with immutable artifact handoff, Azure Repos-hosted pipeline YAML, and `checkout: none` |
| Azure Pipelines is primarily a deployment system | GitHub Actions CI plus Azure Pipelines CD |
| Existing task requires classic PAT scopes | Narrowly entitled automation identity plus classic PAT |
| Highest one-organization isolation | Separate customer-owned Apps and brokers per trust domain |
| Lowest operational overhead | First-party App, only when its complete repository set is one trust domain |

### Recommended Rollout

For most organizations that require native Azure Pipelines builds:

1. Pilot one dedicated GitHub automation identity for one Azure DevOps project.
2. Try a fine-grained PAT restricted to that project's repositories, while
   documenting Microsoft's preference for App authentication and the reason it
   cannot provide this project boundary.
3. Validate checkout, push and PR triggers, webhooks, statuses, rotation, and
   every GitHub-integrated task.
4. Fall back to OAuth or a classic PAT on the same narrowly entitled account
   only when compatibility requires it.
5. Restrict service-connection creation and prohibit broader connections in the
   project.
6. Treat classic Azure commit statuses as informational unless a trusted
   GitHub App or Actions workflow produces a source-pinned required check.
7. Repeat with a different identity and connection for each trust domain.

If GitHub Checks are mandatory, choose between a GitHub Actions bridge and a
custom GitHub App broker. Do not restore the broad first-party App connection
and describe the result as project isolation.

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

### Batch CI Runs and Cancel Superseded PR Validations

Audit batching and cancellation settings alongside authentication and peak load. GitHub Actions calls its cancellation setting `concurrency.cancel-in-progress`; Azure Pipelines uses different controls. Do not copy the GitHub Actions key into Azure Pipelines YAML or treat batching as cancellation.

| Situation | Azure Pipelines control | Behavior and boundary |
| --- | --- | --- |
| More pushes or merges to the same branch while its CI run is active | `trigger.batch: true` | Lets the active run finish, then starts a run containing changes not yet built. Applies per pipeline and branch; default is `false`. |
| A new commit updates an already-open GitHub PR | `pr.autoCancel: true` | Cancels superseded in-progress validation runs for that same PR. Default is `true`; confirm it has not been disabled or overridden. |
| Multiple different PRs target `main` | Keep required validation for each PR | `autoCancel` does not combine these PRs or cancel their validations merely because they share a target branch. |
| Overlapping runs reach a stage or protected resource that must be used exclusively | Exclusive lock with `lockBehavior: runLatest` or `sequential` | Controls access at the lock, not pipeline admission or template retrieval. Choose latest-only execution or execution of each waiting run according to policy. |
| Manual, scheduled, or external API/webhook runs overlap | Review that trigger's orchestration separately | These CI/PR settings are not a universal same-branch concurrency or cancellation policy. |

Approving a PR is not the same as merging it: approval alone is not a native push trigger. Ten separate merges into `main` can queue ten CI runs without batching; whether those runs execute concurrently depends on available parallel jobs and agents.

With batching enabled, if the first merge starts a CI run and the next nine arrive while it is active, the normal outcome is that active run plus one follow-up run containing the remaining changes. This is timing-dependent, not a guarantee of exactly two runs. Batching does not cancel the active run or retroactively collapse unrelated runs already queued by other mechanisms.

Use the following trigger fragment in the pipeline's main YAML file, not an included template. It validates PRs targeting `main` and batches post-merge CI on `main`; merge the settings into existing branch/path filters rather than replacing needed coverage:

```yaml
trigger:
  batch: true
  branches:
    include:
    - main

pr:
  autoCancel: true
  branches:
    include:
    - main
```

This configuration avoids an additional push-triggered CI run on each feature branch while preserving PR validation and post-merge validation. Those latter two validations serve different purposes and are not automatically redundant.

CI batching waits for the whole run to reach a terminal state, including its stages and approvals. For long-lived deployment pipelines, consider separating batched CI from deployment orchestration. Batching is not supported for repository resource triggers. It is appropriate only when validating the accumulated branch state is sufficient; retain per-commit builds when required for release artifacts, audit, or testing policy.

For stage-level serialization in Azure DevOps Services, an explicitly named stage with `lockBehavior` creates a stage lock. With `runLatest`, supersession is scoped to that stage's waiting runs on the same branch; a resource-level exclusive lock has a different scope. The active lock holder finishes before another run proceeds. This is not a whole-pipeline cancel-on-push switch. Use `sequential` when each waiting run must proceed rather than be superseded.

In GitHub Actions, scope a cancellation group to the workflow and ref, for example `${{ github.workflow }}-${{ github.ref }}`, with `cancel-in-progress: true`. Avoid grouping all PR validations by the target branch alone: different PRs must not cancel each other's required checks. This Actions configuration belongs in a GitHub workflow, not in the Azure Pipelines trigger fragment above.

Cancellation can reduce remaining job work, but it does not undo template-fetch API calls or checkouts that already occurred. These controls reduce avoidable load; they do not guarantee that GitHub throttling cannot happen. Do not cancel unrelated required PR checks or interrupt deployments without a defined cleanup and recovery policy.

Validate the effective behavior in a non-production pipeline:

- [ ] Inspect the main YAML and any CI/PR trigger overrides in pipeline settings.
- [ ] Enable CI batching where intermediate branch commits do not each need a separate build.
- [ ] Confirm a second update to the same PR cancels its older in-progress validation and starts validation for the new revision.
- [ ] Confirm two different PRs targeting `main` retain their own required validations.
- [ ] Push several changes to `main` during an active CI run and verify a subsequent batched run covers the remaining changes.
- [ ] Check schedules, manual runs, and API/webhook integrations separately for duplicate queueing.
- [ ] If using exclusive locks, test latest-only versus sequential behavior and the intended branch/resource scope.
- [ ] Confirm required checks, artifacts, and deployment approvals still behave as intended.

Sources: [CI batching syntax and defaults](https://learn.microsoft.com/en-us/azure/devops/pipelines/yaml-schema/trigger?view=azure-pipelines), [PR cancellation syntax and defaults](https://learn.microsoft.com/en-us/azure/devops/pipelines/yaml-schema/pr?view=azure-pipelines), and [batching GitHub CI runs](https://learn.microsoft.com/en-us/azure/devops/pipelines/repos/github?view=azure-devops#batching-ci-runs).

For concurrency controls, see [Azure Pipelines exclusive locks](https://learn.microsoft.com/en-us/azure/devops/pipelines/process/approvals?view=azure-devops#exclusive-lock), [stage-level lock scope](https://learn.microsoft.com/en-us/azure/devops/release-notes/2024/sprint-243-update#exclusive-lock-check-at-stage-level), and [GitHub Actions concurrency](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency).

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
- Reuse a connection for repositories it is authorized to access. Separate connections are appropriate for distinct credentials or installations. They create a GitHub repository trust boundary only when backed by different credentials or installations.
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
| Multi-project isolation | Connection permissions do not narrow the App installation's repository set | Choose an explicit trust-boundary pattern |
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
- [Authorize pipelines to use a service connection](https://learn.microsoft.com/en-us/azure/devops/pipelines/library/service-endpoints?view=azure-devops#authorize-pipelines)
- [Manage Azure Pipelines service-connection security](https://learn.microsoft.com/en-us/azure/devops/pipelines/policies/permissions?view=azure-devops#set-service-connection-security-in-azure-pipelines)
- [Share Service Endpoint REST API](https://learn.microsoft.com/en-us/rest/api/azure/devops/serviceendpoint/endpoints/share-service-endpoint?view=azure-devops-rest-7.1)
- [Azure Pipelines GitHub App](https://github.com/apps/azure-pipelines)
- [Azure Pipelines action for GitHub Actions](https://github.com/Azure/pipelines)
- [Use service principals and managed identities in Azure DevOps](https://learn.microsoft.com/en-us/azure/devops/integrate/get-started/authentication/service-principal-managed-identity?view=azure-devops)
- [Install a GitHub App from a third party](https://docs.github.com/en/apps/using-github-apps/installing-a-github-app-from-a-third-party)
- [Review and modify installed GitHub Apps](https://docs.github.com/en/apps/using-github-apps/reviewing-and-modifying-installed-github-apps)
- [Generate a GitHub App installation access token](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app)
- [Manage GitHub deploy keys and machine users](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/managing-deploy-keys)
- [Manage GitHub personal access tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)
- [GitHub REST API rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api)
- [GitHub repository limits](https://docs.github.com/en/repositories/creating-and-managing-repositories/repository-limits)
- [Pipeline processing and runs](https://learn.microsoft.com/en-us/azure/devops/pipelines/process/runs?view=azure-devops)
- [Informational runs](https://learn.microsoft.com/en-us/azure/devops/pipelines/process/information-run?view=azure-devops)
- [Secure repository access](https://learn.microsoft.com/en-us/azure/devops/pipelines/security/secure-access-to-repos?view=azure-devops)
- [Protect a repository resource](https://learn.microsoft.com/en-us/azure/devops/pipelines/process/repository-resource?view=azure-devops)
- [Azure DevOps roadmap: Control access to GitHub repositories](https://learn.microsoft.com/en-us/azure/devops/release-notes/roadmap/control-access-to-github-repos)
- [Repository resource schema](https://learn.microsoft.com/en-us/azure/devops/pipelines/yaml-schema/resources-repositories-repository?view=azure-pipelines)
- [Incoming webhook schema and authentication](https://learn.microsoft.com/en-us/azure/devops/pipelines/yaml-schema/resources-webhooks-webhook?view=azure-pipelines)
- [GitHub Actions Multi-Repo Checkout Strategy (Phase 2)](17-github-actions-repos-checkout-strategy.md)

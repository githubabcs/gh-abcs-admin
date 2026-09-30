# Azure DevOps to GitHub Migration — Detailed Q&A Guide

> **Document status**
>
> - **Last reviewed:** 2026-05-19
> - **Authorship:** Drafted with AI assistance (GitHub Copilot, multi-model review) and reviewed by a human maintainer before publication.
> - **Sources:** Based on public documentation — primarily [docs.github.com](https://docs.github.com), [learn.microsoft.com](https://learn.microsoft.com), and official vendor blogs cited inline.
> - **Verify before acting:** GitHub and Microsoft update product documentation continuously. Re-confirm against the live source pages before relying on this content for production decisions.

> **Context:** This document answers common customer questions about migrating repositories from Azure DevOps (ADO) Cloud to GitHub Enterprise Cloud using the **GitHub Enterprise Importer (GEI)**. The migration follows a phased approach, starting with a subset of repositories and expanding in subsequent waves.

---

## Table of Contents

1. [Migration Scope](#1-migration-scope)
   - [1.1 What Elements Are Migrated?](#11-what-elements-are-migrated)
   - [1.2 Special Cases: Git LFS](#12-special-cases-git-lfs)
   - [1.3 Special Cases: Go Packages](#13-special-cases-go-packages)
2. [General Effort & Team Requirements](#2-general-effort--team-requirements)
   - [2.1 Expected Effort](#21-expected-effort-from-customer-side)
   - [2.2 Team Composition](#22-team-composition)
3. [Pre-Migration Repository Analysis](#3-pre-migration-repository-analysis)
   - [3.1 Targeting Repositories for Migration](#31-targeting-repositories-for-migration)
   - [3.2 Migration Strategy & Recommendations](#32-migration-strategy--recommendations)
   - [3.3 Handling Inactive/Archived Repositories](#33-handling-inactivearchived-repositories)
   - [3.4 Archive Location: Azure Repos vs GitHub](#34-archive-location-azure-repos-vs-github)
4. [Migration Process](#4-migration-process)
   - [4.1 Dry-Run / Trial Migrations](#41-dry-run--trial-migrations)
   - [4.2 Migration Duration & Timing](#42-migration-duration--timing)
   - [4.3 Measuring Migration Success](#43-measuring-migration-success)
   - [4.4 Hybrid Model: Code in GitHub, Pipelines in ADO](#44-hybrid-model-code-in-github-pipelines-in-ado)
   - [4.5 Repository Naming Conventions](#45-repository-naming-conventions)
   - [4.6 Team Ownership & Mapping](#46-team-ownership--mapping)
   - [4.7 Repository Visibility & Permissions](#47-repository-visibility--permissions)
5. [Post-Migration](#5-post-migration)
   - [5.1 Post-Migration Automation](#51-post-migration-automation)
   - [5.2 Repository State & Remaining Work](#52-repository-state--remaining-work)
   - [5.3 Mannequin Reclaim](#53-mannequin-reclaim-user-identity-mapping)

---

## 1. Migration Scope

### 1.1 What Elements Are Migrated?

GitHub Enterprise Importer (GEI) migrates the following elements from Azure DevOps:

| Element | Migrated? | Notes |
|---------|-----------|-------|
| **Git source code** | ✅ Yes | Full repository content |
| **Commit history** | ✅ Yes | Complete Git history |
| **Pull requests** | ✅ Yes | Including status, comments, and metadata |
| **PR user history** | ✅ Yes | Attributed to mannequins if user not mapped |
| **PR file attachments** | ✅ Yes | Uploaded files on PRs |
| **Work item links on PRs** | ✅ Yes | Links are preserved (but work items themselves are NOT migrated) |
| **Branch policies (repo-level)** | ✅ Partial | Policy configuration is preserved; however, GitHub's branch protection model differs from ADO — review and adjust each policy post-migration (see mapping table below) |
| **User-scoped branch policies** | ❌ No | Must be recreated manually on GitHub |
| **Cross-repo branch policies** | ❌ No | Must be recreated manually on GitHub |
| **Azure Pipelines** | ❌ No | Require separate migration to GitHub Actions |
| **Work items (Azure Boards)** | ❌ No | Remain in Azure DevOps |
| **Artifacts** | ❌ No | Remain in Azure DevOps |
| **Test plans** | ❌ No | Remain in Azure DevOps |
| **Repository permissions** | ❌ No | Must be reconfigured on GitHub |
| **Service hooks** | ❌ No | Must be recreated on GitHub |
| **Wiki content** | ❌ No | Must be exported manually (unless wiki is stored as a Git repo) |
| **Dashboards** | ❌ No | Remain in Azure DevOps |

#### Branch Policies — Details

- **Repository-level branch policies** are migrated and translated to GitHub branch protection rules where a direct mapping exists.
- **User-scoped branch policies** (e.g., policies that apply only to specific users) are **not migrated**. These must be manually configured as GitHub branch protection rules or rulesets post-migration.
- **Cross-repository branch policies** have no equivalent in GitHub and must be manually recreated using GitHub rulesets at the organization level.
- **Recommendation:** Before migration, audit all branch policies in ADO, document which are user-scoped or cross-repo, and plan manual recreation on GitHub.

#### Branch Policy: ADO → GitHub Equivalents

| Azure DevOps Policy | GitHub Equivalent | Post-Migration Action |
|---------------------|-------------------|----------------------|
| Minimum number of reviewers | Required pull request reviews (configurable count) | Review and adjust count |
| Build validation (pipeline must pass) | Required status checks (GitHub Actions workflow) | Recreate — pipeline must also exist on GitHub |
| Comment resolution required | Require conversation resolution before merging | Review and enable |
| Linked work items required | No direct built-in equivalent; achievable via GitHub Actions | Requires custom implementation |
| Automatically included reviewers | CODEOWNERS file + required code owner reviews | Recreate via CODEOWNERS file |
| Merge strategy restrictions | Allowed merge methods (squash, merge, rebase) | Review and configure |
| Restrict who can push | Restrict pushes to specific teams/users (via rulesets) | Recreate via rulesets |

> 💡 For organizations with many repositories sharing similar policies, use **organization-level rulesets** on GitHub to apply rules across all repositories at once, preventing local overrides.

> 📖 **Reference:** [Migration support for GitHub Enterprise Importer](https://docs.github.com/en/migrations/using-github-enterprise-importer/understanding-github-enterprise-importer/migration-support-for-github-enterprise-importer)

---

### 1.2 Special Cases: Git LFS

**Git LFS objects are NOT migrated automatically by GEI.** They require a separate, manual migration step after the repository has been migrated.

#### Migration Process for Git LFS

```bash
# 1. Clone the ADO repository with LFS objects
git lfs install
git clone --mirror <AZURE_DEVOPS_REPO_URL>
cd <REPO_NAME>.git
git lfs fetch --all

# 2. After GEI has migrated the repo to GitHub, push LFS objects
git remote add github <GITHUB_REPO_URL>
git lfs push --all github

# 3. Verify LFS objects
git lfs ls-files
```

#### Key Considerations

| Aspect | Detail |
|--------|--------|
| **Automatic migration** | ❌ Not supported by GEI |
| **Manual migration** | ✅ Use `git lfs push --all` after GEI migration |
| **GitHub LFS quotas** | GitHub has storage and bandwidth quotas for Git LFS. Verify your plan includes sufficient LFS capacity. |
| **Validation** | Compare LFS objects on both sides using `git lfs ls-files` |
| **Large-scale automation** | Script the LFS push step as part of your migration pipeline |

> 📖 **Reference:** [Moving a file in your repository to Git LFS](https://docs.github.com/en/repositories/working-with-files/managing-large-files)

---

### 1.3 Special Cases: Go Packages

Go packages require **post-migration attention** because Go modules use the repository URL as part of the module path.

#### Impact on Go Modules

When a repository moves from Azure DevOps to GitHub, the module path changes:

```go
// Before (Azure DevOps)
module dev.azure.com/org/project/_git/my-module

// After (GitHub)
module github.com/org/my-module
```

#### Required Actions

| Action | Description |
|--------|-------------|
| **Update `go.mod`** | Change the `module` line to the new GitHub path |
| **Update all import paths** | All `import` statements referencing the old ADO path must be updated |
| **Update dependents** | Any other Go projects depending on this module must update their `go.mod` |
| **Configure `GOPRIVATE`** | If the GitHub org is private, set `GOPRIVATE=github.com/your-org/*` |
| **Authentication** | Configure `.netrc` or Git credential helper for private module access |

#### Automation

- Use tools like `sed`, `find-and-replace`, or Go-specific tooling to bulk-update import paths.
- Consider using a **vanity import path** or a redirect service during transition to avoid breaking existing consumers.
- Plan a **communication** to all teams using these modules, as they will need to update their dependencies.

> ⚠️ **This is a post-migration task** that must be planned and communicated to development teams before the migration.

---

## 2. General Effort & Team Requirements

### 2.1 Expected Effort from Customer Side

The customer effort depends on the migration phase:

| Phase | Customer Effort | Description |
|-------|----------------|-------------|
| **Planning** | Medium | Inventory repos, define naming conventions, map teams, decide on org structure |
| **Pre-migration analysis** | Low–Medium | Review inventory report, identify repos for archival, validate branch policies |
| **Trial migration** | Low | Validate migrated repos in a sandbox org, report issues |
| **Production migration** | Low–Medium | Coordinate freeze windows, validate results, communicate to teams |
| **Post-migration** | Medium–High | Reclaim mannequins, configure permissions, reconfigure branch policies, update pipelines, update Go module paths, push LFS objects |

#### Specific Customer Responsibilities

1. **Provide Personal Access Tokens (PATs)** for both ADO and GitHub with the required scopes
2. **Define target organizational structure** in GitHub (orgs, teams, naming)
3. **Validate migrated repositories** after trial and production migrations
4. **Freeze code changes** during production migration windows
5. **Reconfigure** branch policies, permissions, and integrations post-migration
6. **Communicate** migration timeline and impact to development teams

---

### 2.2 Team Composition

A recommended migration team includes:

| Role | Count | Responsibilities |
|------|-------|-----------------|
| **Migration Lead** | 1 | Coordinates migration waves, communicates with stakeholders |
| **DevOps/Platform Engineer** | 1–2 | Runs GEI commands, manages PATs, handles scripts, pipeline rewiring |
| **Developer Representative** | 1–2 per wave | Validates repos, tests builds/pipelines post-migration, handles Go modules |
| **GitHub Admin** | 1 | Manages GitHub org settings, teams, permissions, mannequin reclaim |

**Typical team size: 3–5 people**, depending on the number of repositories and migration waves.

For organizations migrating a few hundred repositories, **2–3 technically skilled people** (DevOps engineers or platform engineers) can handle the core migration work, with developer representatives available for validation.

---

## 3. Pre-Migration Repository Analysis

### 3.1 Targeting Repositories for Migration

Repositories can be targeted **by ADO Team Project** using the GEI CLI tools:

```bash
# Generate an inventory report for an ADO organization
gh ado2gh inventory-report \
  --ado-org ADO_ORG

# Generate a migration script for all repos in a team project
gh ado2gh generate-script \
  --ado-org ADO_ORG \
  --ado-team-project TEAM_PROJECT \
  --github-org GITHUB_ORG \
  --output migration-script.ps1
```

The **inventory report** generates a CSV file containing:
- Repository name
- Team project name
- Number of pull requests
- Repository size

This CSV can be filtered by team project, then sorted to select which repositories to include in each migration wave.

---

### 3.2 Migration Strategy & Recommendations

The migration program typically provides:

| Service | Description |
|---------|-------------|
| **Inventory analysis** | Run inventory reports on ADO org/projects to catalog all repos with metadata (size, PR count, last activity) |
| **Migration readiness assessment** | Identify repos that may have issues (oversized files, LFS usage, special configurations) |
| **Batching recommendations** | Suggest grouping repos into migration waves based on team readiness, complexity, and dependencies |
| **Naming & structure guidance** | Recommend GitHub org structure, naming conventions, and team mapping |

#### Recommended Migration Batching Strategy

| Approach | When to Use |
|----------|-------------|
| **By team project** | Simplest approach — migrate all repos from one ADO team project together |
| **By team readiness** | When different teams have different timelines |
| **By repo complexity** | Start with simple repos (small, no LFS, few PRs) to build confidence |
| **By dependency graph** | Migrate dependent repos together to avoid cross-platform references |

---

### 3.3 Handling Inactive/Archived Repositories

#### A. Multiple Destination Organizations

**Yes, it is possible to migrate repos to different GitHub organizations.** However, the `ado2gh generate-script` command targets a single GitHub organization per run. To migrate to multiple destinations:

1. **Split your repository list** into groups by destination org: copy the `repos.csv` from `inventory-report` into one CSV per destination (for example, `active-repos.csv` and `archive-repos.csv`)
2. **Run separate migration scripts** for each destination, passing each CSV with `--repo-list`:

```bash
# Active repos → primary org
gh ado2gh generate-script \
  --ado-org ADO_ORG \
  --github-org primary-org \
  --repo-list active-repos.csv \
  --output migrate-active.ps1

# Archived repos → archive org
gh ado2gh generate-script \
  --ado-org ADO_ORG \
  --github-org archive-org \
  --repo-list archive-repos.csv \
  --output migrate-archived.ps1
```

#### B. Detecting Inactive Repositories

Inactive repositories (beyond those already renamed with a common archive prefix like `zzz_` or `archived_`) can be detected using the **Azure DevOps REST API**:

```bash
# Get the last push date for each repository
GET https://dev.azure.com/{org}/{project}/_apis/git/repositories/{repoId}/pushes?$top=1&api-version=7.1
```

**Detection Strategy:**

| Method | API Endpoint | What It Detects |
|--------|-------------|-----------------|
| **Last push date** | `/pushes?$top=1` | When code was last pushed (most reliable) |
| **Last commit date** | `/commits?$top=1` | When the last commit was made |
| **Inventory report** | `gh ado2gh inventory-report` | Provides last push date in the CSV output |

**Recommended approach:**
1. Run the `inventory-report` command to get all repo metadata in a CSV
2. Filter repos where the last push date exceeds your inactivity threshold (e.g., 6+ months, 12+ months)
3. Review the list with team leads to confirm repos can be archived
4. Route inactive repos to the archive organization during migration

---

### 3.4 Archive Location: Azure Repos vs GitHub

> **Recommendation:** Migrate inactive repositories that still have reference, audit, or compliance value directly into the GitHub archive organization, then archive them there. Do not keep them in Azure Repos as the long-term archive, and do not use **Disable Repository** as an archive: a disabled repository cannot be browsed or cloned, which is why it appears to disappear from the list. Keep the Azure Repos source **read-only (locked), not disabled**, only for a defined fallback window, then retire it.

#### A. Options Compared

| Option | Read, browse, clone | Reversible | Ongoing overhead | Best fit |
|--------|---------------------|------------|------------------|----------|
| **Migrate, then archive in GitHub** | ✅ Read-only code, PRs, branches, and tags; searchable; forkable | ✅ Repository admins can unarchive (the organization itself must not be archived) | Low; single system of record | Inactive repos with reference, audit, or compliance value |
| **Keep in Azure Repos, read-only (locked)** | ✅ Browse and clone; no writes | ✅ Remove the Deny permissions | ADO org, projects, permissions, and access reviews must be maintained indefinitely | Short fallback window after migration |
| **Keep in Azure Repos, disabled** | ❌ No browse, clone, PRs, or builds | ✅ Re-enable in Project settings | Same as above, with no usable access | Short quarantine step before deletion |
| **Do not migrate, delete after retention** | ❌ | ⚠️ 30-day recycle bin only | None after deletion | Duplicates, experiments, confirmed no-value repos |

#### B. What "Disable Repository" Does in Azure Repos

- Microsoft describes the setting as disabling "access to the repository, including builds and pull requests" while keeping it "discoverable with a warning."
- Server-side access is blocked, so the repository is no longer usable from the Repos hub. This is why it appears to disappear from the day-to-day list. Administrators manage and re-enable it under **Project settings → Repositories**. Existing local clones keep working, but nobody can read the history from the server.
- The Repositories REST API returns `isDisabled: true`, which you can use to inventory disabled repositories.
- **GEI does not migrate disabled repositories.** Never disable a repository that has not been migrated yet; re-enable it first if it needs to move.
- **Conclusion:** disabling is a quarantine or pre-deletion state, not an archive.

#### C. Making an Azure Repos Repository Read-Only (Archive in Place)

Azure Repos has no native archive flag. Microsoft's tip for retiring a repository without deleting it is to rename it with an `_archived` prefix and lock its default branch, but a branch lock alone does not make the whole repository read-only. For a complete read-only state:

1. **Update the README first** with a pointer to the new GitHub location. After the lock, nobody can commit the change without a temporary unlock.
2. **Lock with GEI:** `gh ado2gh lock-ado-repo --ado-org ORG --ado-team-project PROJECT --ado-repo REPO` adds Deny permissions for the **Project Valid Users** group on the repository. It needs an ADO PAT (`ADO_PAT` or `--ado-pat`) with **Identity (Read)** and **Security (Manage)** scopes.
3. **Or lock manually** at the repository security level for every group that can write: set **Contribute**, **Contribute to pull requests**, **Create branch**, **Create tag**, **Manage notes**, **Force push (rewrite history, delete branches and tags)**, **Bypass policies when pushing**, and **Bypass policies when completing pull requests** to **Deny**. Leave **Read** as **Allow**, and check for branch-level permission overrides.
4. **Rename** with a consistent prefix or suffix (for example, `_archived-<name>` or `<name>-MIGRATED-TO-GITHUB`).
5. **Disable pipelines and service hooks** that reference the repository.
6. **Verify** effective permissions with **Why?** in the security dialog. Deny generally overrides Allow, but administrators can remove the Deny, so treat this as a process control rather than immutable storage.

> ⚠️ **GEI script flags:** `generate-script --lock-ado-repos` locks each repository immediately **before** its migration, which enforces the code freeze. `--disable-ado-repos` disables each repository **after** a successful migration, and `--all` includes both. To keep the source readable during the fallback window, use `--lock-ado-repos` without `--disable-ado-repos` or `--all` (see [Locking Source Repositories After Migration](#locking-source-repositories-after-migration)).

> ⚠️ **Licensing:** Readers still need **Basic** access. Stakeholder access provides no Azure Repos access in private projects. Since February 2025, Basic access is included for users with GitHub Enterprise Cloud licenses whose identities match in Microsoft Entra ID (see the [Business Case](./ADO-to-GitHub-Migration-Business-Case.md)).

#### D. Recommended Decision Model

| Repository category | GitHub destination | Azure Repos source |
|---------------------|--------------------|--------------------|
| **Active** | Target org by sensitivity (for example, Red or Green) | Lock for the fallback window, then disable, then delete per retention |
| **Inactive with reference, audit, or compliance value** | Dedicated archive org (for example, `company-archive` in the [Red-Green-Sandbox-Archive model](./ado-to-github-structural-mapping.md)), then archive the repository | Lock for the fallback window, then disable, then delete per retention |
| **Duplicate, experimental, or confirmed no-value** | Not migrated | Lock, then disable, then delete after owner sign-off |
| **Unknown owner** | Not migrated yet | Lock and quarantine until an owner confirms the disposition |

Suggested lifecycle for the Azure Repos copy (durations are planning recommendations, not vendor requirements):

```text
Locked before migration ──► Migrated ──► Locked fallback (90–180 days) ──► Disabled (e.g. 30 days) ──► Deleted (30-day recycle bin)
```

- Keep the lock period long enough to cover at least one release cycle and any audit that may need to compare source and target.
- Confirm retention requirements with records management or legal before deletion. A `git clone --mirror` copy or `git bundle` preserves Git data only. If a legal hold applies, preserve Git LFS objects and any required PR or audit metadata separately, and get legal approval for the method.

#### E. Archiving in GitHub After Migration

GEI does not archive repositories during migration. Archive them as a post-migration step:

```bash
gh repo archive ARCHIVE_ORG/REPO --yes
```

- **Finish post-migration work first.** Archived repositories are read-only, so push Git LFS objects ([§1.2](#12-special-cases-git-lfs)), update the README and description, and set topics or custom properties before archiving. GitHub also recommends closing open issues and pull requests before archiving.
- **Archive repositories, not the archive organization, while migration waves are running.** Archiving an organization makes every repository read-only, disables creating new repositories (which would block further GEI migrations into it), and prevents unarchiving individual repositories until the organization is unarchived. Consider organization-level archival only after the final wave.
- **Keep security visibility.** Customers using GitHub Secret Protection can enable secret scanning on archived repositories.
- **Access remains available.** Archived repositories, including their issues and pull requests, stay searchable. Users with access can still fork or star them.

> 📖 **References:** [Archiving repositories](https://docs.github.com/en/repositories/archiving-a-github-repository/archiving-repositories) · [Archiving an organization](https://docs.github.com/en/organizations/managing-organization-settings/archiving-an-organization) · [Azure Repos: Disable repository setting](https://learn.microsoft.com/en-us/azure/devops/repos/git/repository-settings?view=azure-devops#disable-repository-setting) · [Azure Repos: Delete a repo (archive tip)](https://learn.microsoft.com/en-us/azure/devops/repos/git/delete-existing-repo?view=azure-devops) · [Stakeholder access](https://learn.microsoft.com/en-us/azure/devops/organizations/security/stakeholder-access?view=azure-devops)

---

## 4. Migration Process

### 4.1 Dry-Run / Trial Migrations

**Yes, trial (dry-run) migrations are a standard and recommended part of the migration process.** They are typically referred to as "trial migrations" in GitHub's documentation.

#### How Trial Migrations Work

| Aspect | Detail |
|--------|--------|
| **Environment** | Create a dedicated sandbox/test GitHub organization (e.g., `yourcompany-migration-test`) |
| **Timing** | No downtime required — trial migrations can run anytime without freezing source repos |
| **What to validate** | Code integrity, commit history, PR history, branch policies, file integrity |
| **Who validates** | Developer representatives from each team |
| **Can be repeated** | Yes — run as many trial migrations as needed until satisfied |
| **Cost** | Trial repos can be deleted after validation |

#### Trial Migration Workflow

```
1. Create a test GitHub organization
2. Run GEI migration for a sample batch of repositories
3. Validate:
   ├── Code compiles/builds correctly
   ├── Commit history is complete
   ├── Pull request history is preserved
   ├── Branch policies are correctly translated
   └── File sizes and LFS objects (if applicable)
4. Identify and resolve any issues
5. Delete test repos and re-run if needed
6. Proceed to production migration when satisfied
```

> 📖 **Reference:** [Overview of a migration from Azure DevOps](https://docs.github.com/en/migrations/ado/)

---

### 4.2 Migration Duration & Timing

#### How Long Does Migration Take?

| Factor | Impact |
|--------|--------|
| **Main variable** | **Number of pull requests per repository** (largest factor in migration time) |
| **Repository size** | Large repos (many GBs) take longer |
| **Parallelism** | GEI supports parallel migrations, significantly reducing total elapsed time |
| **Typical guidance** | Run a **trial migration** to establish your own baseline for planning |

> ⚠️ **GitHub does not publish an official per-repository time benchmark** because migration duration varies dramatically based on PR volume. A repo with 50 PRs will migrate much faster than one with 50,000 PRs. Always use trial migrations to calibrate your estimates.

**GEI supports parallel migrations**, so multiple repositories can be migrated simultaneously.

#### Key Constraints

- **Concurrency limit:** GEI supports parallel migrations but limits the number of simultaneous repository migrations per source organization. Run a trial to confirm current throughput limits with your GitHub account team.
- **No delta/incremental migrations:** GEI does not support incremental sync. Any changes made in ADO after the migration starts will not be captured. This is why a code freeze is essential.

#### Estimated Duration by Repository Profile

| Repository Profile | Estimated Duration |
|-------------------|--------------------|
| Small (< 500 MB, < 100 PRs) | Minutes to ~30 minutes |
| Medium (1–2 GB, several hundred PRs) | 30–60 minutes |
| Large (5–10 GB or thousands of PRs) | 1–3 hours |
| Very large (approaching 40 GiB or extremely high PR counts) | 4+ hours |

#### Recommended Migration Window

| Scenario | Window |
|----------|--------|
| **Small batch (< 50 repos)** | Evening window (2–4 hours) |
| **Medium batch (50–200 repos)** | Weekend window (half day) |
| **Large batch (200+ repos)** | Weekend window (full day) |

> ⚠️ **A code freeze is recommended** during production migration to prevent data loss. Any commits pushed to ADO after migration starts will not be included in the migrated repository.
>
> ⚠️ **Organization or enterprise rulesets can block migrations. Preferred approach:** add **'Repository migrations'** to the bypass list for each applicable ruleset before running the migration. The bypass applies only during the migration; rulesets re-enforce on all new contributions afterward. Avoid disabling rulesets enterprise-wide except as a last resort.
>
> 💡 **Developer action after migration:** Each developer must update their local Git remote URL:
> ```bash
> git remote set-url origin https://github.com/ORG/REPO.git
> ```

#### Locking Source Repositories After Migration

**GEI provides opt-in flags to lock or disable ADO repositories.** When generating a migration script, you can use:

- `generate-script --lock-ado-repos`: locks each source repo (read-only) immediately **before** its migration, enforcing the code freeze
- `generate-script --disable-ado-repos`: disables each source repo **after** a successful migration. Disabled repos cannot be browsed or cloned, so omit this flag (and `--all`, which includes it) if the source should stay readable during a fallback window. See [§3.4](#34-archive-location-azure-repos-vs-github).

If you are not using `generate-script`, you should manually lock the source repos in Azure DevOps after a successful migration:

1. **Update the README** with a redirect notice pointing to the new GitHub location (before locking)
2. **Set repository permissions to read-only**: Deny "Contribute," "Contribute to pull requests," "Create branch," "Create tag," and "Force push" for all groups (full list in [§3.4 C](#c-making-an-azure-repos-repository-read-only-archive-in-place))
3. **Rename the repository** (e.g., append `-MIGRATED-TO-GITHUB`) to signal the move
4. **Disable associated pipelines** to prevent accidental builds

---

### 4.3 Measuring Migration Success

Migration success should be validated at multiple levels:

| Validation | Method |
|------------|--------|
| **Migration completion** | Check GEI migration status: `gh ado2gh wait-for-migration --migration-id ID` |
| **Migration log review** | Download and review the migration log for warnings/errors |
| **Code integrity** | Compare commit counts and branch counts between ADO and GitHub |
| **Build validation** | Run existing CI/CD pipeline against the migrated GitHub repo |
| **PR history** | Spot-check that pull requests, comments, and attachments are present |
| **Branch policies** | Verify branch protection rules on key branches (e.g., `main`) |
| **File verification** | Verify key files exist and are not corrupted |
| **LFS objects** | If applicable, verify LFS-tracked files are accessible |

#### Success Criteria Checklist

```
✅ GEI reports migration as "succeeded"
✅ Migration log has no critical errors (warnings are expected)
✅ Commit history matches (same commit SHAs)
✅ All branches are present
✅ Pull request count matches (within tolerance for very old PRs)
✅ Branch protection rules are active on main/default branch
✅ At least one build/CI run succeeds from GitHub
✅ Team leads sign off on validation
```

---

### 4.4 Hybrid Model: Code in GitHub, Pipelines in ADO

**Yes, a hybrid model (code in GitHub, pipelines in Azure DevOps) is fully supported and is a common interim approach.**

> ⚠️ **Key point: Pipelines will NOT automatically be functional after migration.** Even with the `--rewire-pipelines` option, expect to spend time validating and adjusting each pipeline. Multi-repo pipelines, custom checkout steps, and environment-specific configurations will likely require manual intervention.
>
> 💡 **Licensing note:** Since February 2025, the Basic Azure DevOps license is included with GitHub Enterprise Cloud (GHEC) at no additional cost when users authenticate via Microsoft Entra ID. This makes the hybrid model (code on GitHub + pipelines/boards on ADO) cost-effective for the transition period.

#### How It Works

After migration, Azure Pipelines can be **rewired** to point to GitHub repositories instead of ADO repos:

```
┌──────────────┐         ┌──────────────┐
│   GitHub      │ ◄────── │ Azure DevOps  │
│  (Code Repos) │  trigger │  (Pipelines)  │
└──────────────┘         └──────────────┘
```

#### Rewiring Pipelines

| Step | Action |
|------|--------|
| 1 | Create a **GitHub service connection** in Azure DevOps (Project Settings → Service Connections) |
| 2 | Edit each pipeline to change the repository source from ADO to GitHub |
| 3 | For YAML pipelines: create a new pipeline pointing to the GitHub repo and the existing YAML file |
| 4 | For classic pipelines: update the source in the pipeline editor |
| 5 | Validate triggers (PR triggers, CI triggers) work correctly |
| 6 | Test a full build/deployment cycle |

#### GEI `--rewire-pipelines` Flag (on `generate-script`)

The GEI CLI provides a `--rewire-pipelines` flag on the **`generate-script`** command (not on `migrate-repo` directly). When used, the generated migration script includes additional commands (`share-service-connection` and `rewire-pipeline`) that update Azure Pipelines to point to the new GitHub repository:

```bash
# Generate a migration script WITH pipeline rewiring
gh ado2gh generate-script \
  --ado-org ADO_ORG \
  --github-org GITHUB_ORG \
  --rewire-pipelines \
  --output migration-script.ps1

# The generated script will include, for each repo:
#   1. migrate-repo (migrates the repository)
#   2. share-service-connection (shares a GitHub service connection)
#   3. rewire-pipeline (updates each pipeline to point to GitHub)
```

> ⚠️ **Important notes on `--rewire-pipelines`:**
> - This is a **script generation** flag, not a per-repo migration flag
> - The generated script creates a GitHub service connection in ADO and rewires each pipeline individually
> - Does **not** guarantee all pipelines will work without modification — some pipeline configurations may need manual adjustments (e.g., checkout steps, resource references)
> - **Pipelines will NOT automatically work after migration** — expect to spend time validating and fixing each pipeline. Multi-repo pipelines, custom checkout steps, and environment-specific configurations will likely need manual intervention
> - **Test all pipelines** after migration regardless of whether `--rewire-pipelines` was used

#### What May Need Manual Adjustment

| Item | Reason |
|------|--------|
| **Checkout steps** | Some pipelines may have explicit ADO repo references |
| **Multi-repo pipelines** | Pipelines referencing multiple ADO repos need each reference updated |
| **Service connections** | Existing ADO-to-ADO connections need to be replaced with ADO-to-GitHub connections |
| **Pipeline variables** | Variables referencing ADO repo URLs or paths may need updating |
| **Build validation policies** | Must be reconfigured to trigger from GitHub |

---

### 4.5 Repository Naming Conventions

#### A. Correcting Repo Names During Migration

**Yes, repository names can be changed during migration** using the `--github-repo` parameter:

```bash
gh ado2gh migrate-repo \
  --ado-org ADO_ORG \
  --ado-team-project PROJECT \
  --ado-repo "Old Repo Name" \
  --github-org GITHUB_ORG \
  --github-repo "new-repo-name"   # ← specify the new name
```

#### Recommended Naming Conventions for GitHub

| Convention | Example |
|------------|---------|
| **Use kebab-case** | `payment-api` not `PaymentAPI` or `payment_api` |
| **All lowercase** | `checkout-service` not `Checkout-Service` |
| **Descriptive & concise** | `web-frontend` not `team-alpha-project-x-frontend-v2` |
| **No special characters** | Only letters, numbers, and hyphens |
| **Suffix by type (optional)** | `-api`, `-service`, `-web`, `-lib`, `-docs` |

If the customer already has a regex enforcing naming conventions in their GitHub organization, the migration script should be reviewed to ensure all target repo names comply with the regex before execution.

#### B. Prefixing with Team Project Name

**Common strategies to avoid name collisions:**

| Strategy | Example | When to Use |
|----------|---------|-------------|
| **No prefix** | `payment-api` | When repo names are already unique across team projects |
| **Team project prefix** | `team-alpha-payment-api` | When multiple team projects have repos with the same name |
| **Short domain prefix** | `payments-api` | When business domain context is needed |
| **Use GitHub Topics** | Repo: `payment-api`, Topic: `team-alpha` | Preferred — keeps names clean, adds metadata for searchability |

**Recommended approach:**
1. Run the inventory report to identify duplicate repo names across team projects
2. Only add prefixes where collisions exist
3. Use GitHub Topics and team assignments for organizational context instead of name prefixes
4. Generate the migration script with the `--github-repo` override for repos that need renaming

---

### 4.6 Team Ownership & Mapping

#### Automatic Team Creation (opt-in)

When using the **ADO2GH CLI** with the `generate-script --create-teams` (or `--all`) flag, two teams are created per ADO team project:

| Team Name Pattern | Permission Level |
|-------------------|-----------------|
| `{TeamProject}-Maintainers` | Maintain access |
| `{TeamProject}-Admins` | Admin access |

> ⚠️ **Team creation is opt-in** — it only happens when `generate-script` is run with `--create-teams` or `--all`. Running `migrate-repo` directly does **not** create teams. Special characters in team project names are replaced with dashes.

#### Correspondence Table

**Yes, a mapping table (correspondence table) is supported and recommended.** The typical approach is:

| ADO Team Project | GitHub Team | Permission |
|-----------------|-------------|------------|
| Project-Alpha | `project-alpha-maintainers` | Maintain |
| Project-Alpha | `project-alpha-admins` | Admin |
| Project-Beta | `project-beta-maintainers` | Maintain |
| Project-Beta | `project-beta-admins` | Admin |

#### Custom Team Mapping

If you want more control over team assignments:

1. **Pre-create teams** in GitHub with the desired structure
2. **Use the generated migration script** — edit it to add team assignment commands after each `migrate-repo` call
3. **Post-migration script** — use the GitHub CLI or API to assign repos to teams:

```bash
# Assign a repo to a team
gh api \
  -X PUT \
  /orgs/GITHUB_ORG/teams/TEAM_SLUG/repos/GITHUB_ORG/REPO_NAME \
  -f permission=push
```

---

### 4.7 Repository Visibility & Permissions

#### Repository Visibility: Private vs. Internal

All repositories are migrated as **private** by default. You can override this during migration using the `--target-repo-visibility` flag:

```bash
gh ado2gh migrate-repo \
  --ado-org ADO_ORG \
  --ado-team-project PROJECT \
  --ado-repo REPO \
  --github-org GITHUB_ORG \
  --github-repo REPO \
  --target-repo-visibility internal
```

Supported values: `private`, `internal`, `public`.

| Visibility | Who Can See | Who Can Clone | Who Can Push | Best For |
|------------|------------|---------------|-------------|----------|
| **Private** | Only users/teams explicitly granted access | Only users/teams with at least Read access | Only users/teams with Write+ access | Sensitive projects, restricted access |
| **Internal** | All authenticated members of the GitHub Enterprise | All Enterprise members (read/clone by default) | Only users/teams with Write+ access | Inner-source / company-wide shared code |
| **Public** | Everyone on the internet | Everyone | Only users/teams with Write+ access | Open source projects |

> 💡 **Recommendation:** For most enterprise migrations, **internal** is the preferred default. It mirrors the typical ADO behavior where all organization members can discover and read repositories within the org. Use **private** only for repositories requiring restricted access (e.g., security-sensitive code, HR tools, credentials management).

#### Can You Assign Teams During Migration?

**GEI does not natively assign teams to repositories as part of the `migrate-repo` command.** However, there are two approaches:

##### Approach 1: Use `generate-script --create-teams` (Recommended)

When generating a migration script, the `--create-teams` flag (or `--all`) will include team creation and repo-to-team assignment commands in the generated script:

```bash
gh ado2gh generate-script \
  --ado-org ADO_ORG \
  --github-org GITHUB_ORG \
  --create-teams \
  --output migration-script.ps1
```

The generated script will:
1. Create `{TeamProject}-Maintainers` (maintain role) and `{TeamProject}-Admins` (admin role) teams
2. Assign each migrated repo to the corresponding team based on its source ADO team project

##### Approach 2: Post-Migration Team Assignment (Custom Mapping)

For custom team structures that don't follow the ADO team project → GitHub team pattern:

```bash
# Assign a repo to a team with a specific permission
gh api \
  -X PUT \
  /orgs/GITHUB_ORG/teams/TEAM_SLUG/repos/GITHUB_ORG/REPO_NAME \
  -f permission=push
```

This can be scripted as a post-migration step in your migration pipeline.

#### GitHub Permission Roles

GitHub uses **five permission levels** for repository access. These replace the ADO permission model:

| Role | View/Clone | Issues & PRs | Push Code | Manage Settings | Manage Access | Delete Repo |
|------|-----------|-------------|-----------|----------------|--------------|-------------|
| **Read** | ✅ | Create & comment | ❌ | ❌ | ❌ | ❌ |
| **Triage** | ✅ | + Label, assign, close | ❌ | ❌ | ❌ | ❌ |
| **Write** | ✅ | + Merge PRs | ✅ (non-protected branches) | ❌ | ❌ | ❌ |
| **Maintain** | ✅ | + Merge PRs | ✅ | ✅ (partial) | ❌ | ❌ |
| **Admin** | ✅ | + Merge PRs | ✅ | ✅ (full) | ✅ | ✅ |

#### Mapping ADO Permissions to GitHub Roles

| ADO Permission | Recommended GitHub Role |
|---------------|------------------------|
| Readers | **Read** |
| Contributors | **Write** |
| Build Administrators | **Write** or **Maintain** |
| Project Administrators | **Admin** |

> ⚠️ **ADO repository permissions are NOT migrated by GEI.** All permissions must be configured on GitHub after migration, either manually or via automation scripts.

#### Recommended Permission Strategy

```
Enterprise Account
  └── Organization (mapped from ADO Org)
        ├── Team: "project-alpha-developers"  → Write access to project-alpha repos
        ├── Team: "project-alpha-leads"       → Maintain access to project-alpha repos
        ├── Team: "project-alpha-admins"      → Admin access to project-alpha repos
        ├── Team: "platform-team"             → Write access to shared infra repos
        └── Team: "security-team"             → Read access to all repos (via org-level)
```

**Key best practices:**
1. **Use teams, not individual user grants** — easier to manage at scale
2. **Use internal visibility** for most repos to enable discoverability
3. **Layer teams** — base team for read, elevated teams for write/maintain/admin
4. **Use org-level base permissions** — set a minimum permission (e.g., Read) for all org members, then add teams for elevated access
5. **Use CODEOWNERS** — enforce review requirements by code area, independent of team permissions

> 📖 **Reference:** [Repository roles for an organization](https://docs.github.com/en/organizations/managing-user-access-to-your-organizations-repositories/managing-repository-roles/repository-roles-for-an-organization)

---

## 5. Post-Migration

### 5.1 Post-Migration Automation

The migration program typically provides a post-migration checklist and scripts. To integrate with your own post-migration automation:

| Integration Point | Method |
|-------------------|--------|
| **Migration completion webhook** | GEI does not natively emit webhooks, but you can poll migration status and trigger automation on completion |
| **Migration script hooks** | Edit the generated migration script to call your automation scripts after each successful migration |
| **GitHub Actions** | Set up workflows in GitHub that trigger on repository creation or push events |
| **GitHub Webhooks** | Configure org-level webhooks to detect new repositories and trigger automation |
| **API polling** | Use `gh ado2gh wait-for-migration` in your automation pipeline to detect completion |

#### Recommended Integration Approach

```
Migration Script (generated by GEI)
  │
  ├── migrate-repo (GEI handles this)
  ├── wait-for-migration (confirms success)
  ├── ✅ YOUR POST-MIGRATION SCRIPT
  │     ├── Configure additional branch protections
  │     ├── Set repository topics/metadata
  │     ├── Configure required status checks
  │     ├── Set up CODEOWNERS file
  │     ├── Trigger CI/CD validation build
  │     └── Notify team via Slack/Teams
  │
  └── Next repo...
```

---

### 5.2 Repository State & Remaining Work

After migration, repositories will be in the following state:

| Aspect | State | Action Required? |
|--------|-------|-----------------|
| **Visibility** | Private (default) | Change if needed |
| **Code & history** | ✅ Complete | None |
| **Pull requests** | ✅ Migrated (attributed to mannequins) | Reclaim mannequins |
| **Branch policies** | ✅ Repo-level migrated | Verify; recreate user-scoped/cross-repo policies |
| **Permissions** | ❌ Not migrated | Must configure teams and permissions |
| **CODEOWNERS** | ✅ File migrated (part of Git source) | Enable "Require code owner reviews" in branch protection to enforce it |
| **Webhooks/integrations** | ❌ Not migrated | Reconfigure service hooks and integrations |
| **Git LFS objects** | ❌ Not migrated | Push LFS objects manually |
| **CI/CD pipelines** | ❌ Not migrated (can be rewired using `generate-script --rewire-pipelines`) | Rewire or recreate |
| **Code search index** | ⏳ Pending | Re-indexing takes a few hours automatically |
| **User attribution** | 🔄 Mannequins | Reclaim mannequins to real users |
| **Go module paths** | ❌ Outdated | Update `go.mod` and import paths |

---

### 5.3 Mannequin Reclaim (User Identity Mapping)

**Yes, a correspondence (mapping) table is supported for mannequin reclaim.**

#### What Are Mannequins?

When GEI migrates PRs and comments, it cannot automatically map ADO users to GitHub users. Instead, it creates **mannequin** placeholder accounts. All activity (except Git commits) is attributed to these mannequins.

#### Reclaim Process

| Step | Action |
|------|--------|
| 1 | **Generate mannequin CSV** — Run `gh ado2gh generate-mannequin-csv --github-org DEST --output mannequins.csv` |
| 2 | **Edit mapping CSV** — Add the corresponding GitHub username in the `target-user` column for each mannequin |
| 3 | **Bulk reclaim via CLI** — Run `gh ado2gh reclaim-mannequin --github-org DEST --csv mannequins.csv` |
| 4 | **Verification** — Verify that PR history and comments now show the correct GitHub users |

#### Mapping CSV Format

```csv
mannequin-user,mannequin-id,target-user
mona-ado-user-123,MDQ6VXNlcjE,mona-gh
lisa-ado-user-456,MDQ6VXNlcjI,lisa-gh
```

> ⚠️ **The CSV header must be exactly `mannequin-user,mannequin-id,target-user`** (with hyphens, not underscores). The CLI performs a strict header validation and will reject files with incorrect column names.

#### Reclaim Methods

| Method | Details |
|--------|---------|
| **GitHub CLI (bulk)** | `gh ado2gh reclaim-mannequin --github-org DEST --csv mannequins.csv` — recommended for bulk reclaim |
| **GitHub CLI (individual)** | `gh ado2gh reclaim-mannequin --github-org DEST --mannequin-user USER --target-user TARGET` |
| **GitHub Web UI** | Organization Settings → Import/Export → Reattribute — supports **individual** reclaims only (no CSV upload) |
| **EMU (Enterprise Managed Users)** | For EMU organizations, mannequins can be reclaimed immediately without invitations using `--skip-invitation` (irreversible) |

#### Important Notes

- **Only organization owners** can reclaim mannequins
- **Target users must already be members** of the GitHub organization before reclaim can proceed
- For non-EMU orgs, the target GitHub user must **accept an invitation** to complete the reclaim
- For **EMU orgs**, reclaim can bypass invitations (simplified process)
- Content attributed to mannequins **may not appear in search results** until reclaimed
- Once reclaimed, future migrations with the same mannequin will auto-reclaim

> 📖 **Reference:** [Reclaiming mannequins for GitHub Enterprise Importer](https://docs.github.com/en/migrations/using-github-enterprise-importer/completing-your-migration-with-github-enterprise-importer/reclaiming-mannequins-for-github-enterprise-importer)

---

## Appendix A: GEI CLI Quick Reference

> **Platform note:** The `gh ado2gh` CLI works on Windows, macOS, and Linux. However, the migration scripts generated by `generate-script` are PowerShell scripts (`.ps1`) and require PowerShell 5.0+ on Windows or PowerShell Core 7+ on macOS/Linux.

```bash
# Install the ADO2GH CLI extension
gh extension install github/gh-ado2gh

# Set environment variables
export GH_PAT="your-github-pat"
export ADO_PAT="your-ado-pat"

# Generate inventory report
gh ado2gh inventory-report --ado-org ADO_ORG

# Grant migrator role
gh ado2gh grant-migrator-role --github-org GH_ORG --actor USER --actor-type USER

# Generate migration script
gh ado2gh generate-script --ado-org ADO_ORG --github-org GH_ORG --output script.ps1

# Migrate a single repository
gh ado2gh migrate-repo \
  --ado-org ADO_ORG \
  --ado-team-project PROJECT \
  --ado-repo REPO \
  --github-org GH_ORG \
  --github-repo NEW_REPO_NAME

# Check migration status
gh ado2gh wait-for-migration --migration-id MIGRATION_ID
```

## Appendix B: Platform Size Limits

| Limit | Value |
|-------|-------|
| Maximum Git repository size (during migration) | 40 GiB (public preview — subject to change) |
| Maximum file size during migration | 400 MiB |
| Maximum file size (post-migration, GitHub limit) | 100 MiB |
| Maximum single Git commit size | 2 GiB |
| Maximum Git reference name | 255 bytes |

## Appendix C: Required PAT Scopes

### GitHub PAT (Classic) — Required Scopes

> ⚠️ **Fine-grained PATs are NOT supported** for GEI. You must use a Personal Access Token (Classic).

**For organization owners:**

| Scope | Required For |
|-------|-------------|
| `repo` | Run migration, download migration log |
| `admin:org` | Grant migrator role, run migration, reclaim mannequins |
| `workflow` | Run migration (preserves Actions workflows) |

**For users with the migrator role:**

| Scope | Required For |
|-------|-------------|
| `repo` | Run migration, download migration log |
| `read:org` | Run migration |
| `workflow` | Run migration (preserves Actions workflows) |

### Azure DevOps PAT — Required Scopes

| Scope | Required For |
|-------|-------------|
| Code (Read) | Repository migration |
| Work Item (Read) | PR work item links |
| Identity (Read) | User mapping |

> 💡 For advanced features (e.g., `inventory-report` with full details, `generate-script --rewire-pipelines`), GitHub recommends granting **full access** to the ADO PAT.

---

## Appendix D: Official Documentation Links

| Topic | URL |
|-------|-----|
| About migrations from Azure DevOps | [docs.github.com/en/migrations/ado/understand-migrations-from-azure-devops-to-github](https://docs.github.com/en/migrations/ado/understand-migrations-from-azure-devops-to-github) |
| Migration overview | [docs.github.com/en/migrations/ado/](https://docs.github.com/en/migrations/ado/) |
| Managing access for migration | [docs.github.com/en/migrations/ado/manage-access](https://docs.github.com/en/migrations/ado/manage-access) |
| Migrating repositories | [docs.github.com/en/migrations/ado/migrate-repositories-from-azure-devops-to-github-enterprise-cloud](https://docs.github.com/en/migrations/ado/migrate-repositories-from-azure-devops-to-github-enterprise-cloud) |
| Reclaiming mannequins | [docs.github.com/en/migrations/.../reclaiming-mannequins](https://docs.github.com/en/migrations/using-github-enterprise-importer/completing-your-migration-with-github-enterprise-importer/reclaiming-mannequins-for-github-enterprise-importer) |
| Troubleshooting | [docs.github.com/en/migrations/ado/troubleshoot-migrations-from-azure-devops-to-github-enterprise-cloud](https://docs.github.com/en/migrations/ado/troubleshoot-migrations-from-azure-devops-to-github-enterprise-cloud) |
| Archiving repositories | [docs.github.com/en/repositories/archiving-a-github-repository/archiving-repositories](https://docs.github.com/en/repositories/archiving-a-github-repository/archiving-repositories) |
| Archiving an organization | [docs.github.com/en/organizations/managing-organization-settings/archiving-an-organization](https://docs.github.com/en/organizations/managing-organization-settings/archiving-an-organization) |
| Azure Repos repository settings (Disable repository) | [learn.microsoft.com/en-us/azure/devops/repos/git/repository-settings](https://learn.microsoft.com/en-us/azure/devops/repos/git/repository-settings?view=azure-devops#disable-repository-setting) |
| ADO2GH CLI Extension | [github.com/github/gh-ado2gh](https://github.com/github/gh-ado2gh) — install via `gh extension install github/gh-ado2gh` |

---

## Appendix E: Document Quality Assurance

### Scope of This Research

This document answers all customer questions related to an ADO-to-GitHub migration program using GitHub Enterprise Importer (GEI), covering:

- Migration scope — what GEI migrates and what it does not
- Special cases — Git LFS objects and Go module/package handling
- Customer effort and recommended team composition
- Pre-migration analysis — inventory reports, targeting repos, detecting inactive repositories
- Archive location decision — GitHub archive vs Azure Repos read-only vs disabled, and source repo retirement lifecycle
- Trial (dry-run) migrations and validation in sandbox environments
- Migration timing, duration estimates, and cutover best practices
- Hybrid model — code hosted on GitHub with pipelines remaining in Azure DevOps
- Repository naming conventions and collision avoidance strategies
- Team ownership, correspondence tables, and permission mapping
- Repository visibility (private vs. internal) and GitHub permission roles
- Post-migration state, remaining work, and automation integration points
- Mannequin reclaim — user identity mapping via CSV bulk workflow
- Branch policy ADO → GitHub equivalency mapping
- Complete CLI command reference and PAT scope requirements

### Verification Process

This report underwent **three rounds of independent multi-model review** (8 total review passes) to ensure accuracy before publication:

| Round | Model | Focus | Key Findings |
|-------|-------|-------|-------------|
| **Round 1** | Claude Sonnet 4.6 | Factual accuracy of every claim | Found 10 issues: 2 blocking (wrong CLI flag, wrong CSV header), 4 incorrect, 4 misleading — all corrected |
| **Round 1** | Claude Haiku 4.5 | Completeness against all customer questions | Confirmed all 19 questions answered; flagged 5 gaps in clarity — addressed |
| **Round 1** | GPT 5.3 Codex | CLI source code verification | Found 5 issues including CODEOWNERS correction and repo reference update — all corrected |
| **Round 2** | Claude Sonnet 4.6 | Final accuracy gate (source code cross-check) | Verified 24 technical claims against `gh-ado2gh` source code; found 2 remaining blockers — fixed |
| **Round 2** | Claude Haiku 4.5 | Internal consistency and formatting | Found branch policy contradiction and CODEOWNERS ambiguity — resolved |
| **Round 2** | GPT 5.3 Codex | Deep CLI flag verification (74 tool calls) | Confirmed same 3 issues as Sonnet — convergence across all models |
| **Round 3** | GPT-6.1 Sol | Factual accuracy of §3.4 (archive location) against docs and `gh-gei` source | Found 4 blocking issues (`--lock-ado-repos` runs before, not after, migration; incomplete deny list; README after lock; Git-only legal hold) plus wording fixes; all corrected, including §3.3 `--repo-list` and §4.2 |
| **Round 3** | Gemini 3.8 Flash | Consistency, anchors, and editorial review of §3.4 | Confirmed anchors, links, and tables; flagged archive-org model alignment, direct answer to the disable question, and §4.2 disable caveat; all addressed |

### Source Material Cross-Check

The report was additionally cross-referenced against an independent Copilot Researcher export covering the same topics, which contributed:

- Duration estimates by repository profile (small/medium/large)
- Branch policy ADO → GitHub equivalency mapping table
- Migration concurrency constraints and no-delta-migration caveat
- ADO Basic license inclusion with GHEC (February 2025)
- Organization rulesets migration blocker warning
- Compliance and audit trail considerations

### Items Verified Against Source Code

All CLI commands, flags, and syntax in this document were verified against the [`github/gh-ado2gh`](https://github.com/github/gh-ado2gh) source code (built from the [`github/gh-gei`](https://github.com/github/gh-gei) repository). Key verifications include:

- ✅ `generate-script` flags: `--create-teams`, `--lock-ado-repos`, `--disable-ado-repos`, `--rewire-pipelines`, `--repo-list`
- ✅ Script ordering: `lock-ado-repo` runs before `migrate-repo`; `disable-ado-repo` runs after a successful migration; disabled repos are skipped by GEI
- ✅ `lock-ado-repo` adds Deny permissions for the Project Valid Users group
- ✅ `migrate-repo` flag: `--target-repo-visibility` (accepts `private`, `internal`, `public`)
- ✅ `generate-mannequin-csv` and `reclaim-mannequin --csv` commands
- ✅ Mannequin CSV header: `mannequin-user,mannequin-id,target-user` (strict validation)
- ✅ EMU reclaim flag: `--skip-invitation`
- ✅ `inventory-report` does NOT accept `--ado-team-project` (org-level only)
- ✅ PAT scope requirements split by role (org owner vs. migrator)
- ✅ All platform size limits (40 GiB public preview, 400 MiB, 100 MiB, 2 GiB, 255 bytes)

---

*This document was compiled from official GitHub documentation and migration best practices. For the most current information, always refer to the official documentation links provided above.*

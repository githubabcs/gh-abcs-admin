# GitHub Enterprise Importer: Azure DevOps to GitHub Migration Guide

> **Purpose:** High-level reference guide for migrating repositories from Azure DevOps Cloud to GitHub Enterprise Cloud using GitHub Enterprise Importer.

> **Document status**
>
> - **Last reviewed:** 2026-10-20
> - **Authorship:** Drafted with AI assistance (GitHub Copilot, multi-model review) and reviewed by a human maintainer before publication.
> - **Sources:** Based on public documentation — primarily [docs.github.com](https://docs.github.com), [learn.microsoft.com](https://learn.microsoft.com), and official vendor blogs cited inline.
> - **Verify before acting:** GitHub and Microsoft update product documentation continuously. Re-confirm against the live source pages before relying on this content for production decisions.

---

## Table of Contents

1. [Overview](#overview)
2. [What Gets Migrated](#what-gets-migrated)
3. [What Does NOT Get Migrated](#what-does-not-get-migrated)
4. [Migration Limitations](#migration-limitations)
5. [Access Requirements](#access-requirements)
6. [Migration Phases](#migration-phases)
7. [Migrating Large Repositories (2 GiB to 40 GiB)](#migrating-large-repositories-2-gib-to-40-gib)
8. [Key Concepts](#key-concepts)
9. [Post-Migration Tasks](#post-migration-tasks)
10. [Official Documentation References](#official-documentation-references)

---

## Overview

GitHub Enterprise Importer is the official tool for migrating repositories from Azure DevOps Cloud to GitHub Enterprise Cloud (GitHub.com or GHE.com).

**Important Constraint:** GitHub Enterprise Importer only supports migration from **Azure DevOps Cloud**, not from Azure DevOps Server. If you use Azure DevOps Server, you must first migrate to Azure DevOps Cloud before migrating to GitHub.

Enterprises typically follow a **multi-phase migration approach**:

| Phase | Description |
|-------|-------------|
| **Phase 1** | Migrate repositories from Azure DevOps to GitHub |
| **Phase 2** | Migrate pipelines from Azure Pipelines to GitHub Actions |
| **Phase 3** | Migrate remaining assets (boards, artifacts, test plans) from Azure DevOps |

This guide focuses on **Phase 1: Repository Migration**.

---

## What Gets Migrated

GitHub Enterprise Importer migrates the following data from Azure DevOps:

| Data Type | Migrated |
|-----------|----------|
| Git source code | ✅ Yes |
| Commit history | ✅ Yes |
| Pull requests | ✅ Yes |
| User history for pull requests | ✅ Yes |
| Work item links on pull requests | ✅ Yes |
| Attachments on pull requests | ✅ Yes |
| Branch policies for the repository | ✅ Yes (with exceptions*) |

*User-scoped branch policies and cross-repo branch policies are **not** included.

---

## What Does NOT Get Migrated

The following assets **remain in Azure DevOps** and are NOT migrated:

| Asset Type | Migrated |
|------------|----------|
| Azure Pipelines | ❌ No |
| Work items (Azure Boards) | ❌ No |
| Artifacts | ❌ No |
| Test plans | ❌ No |
| Releases | ❌ No |
| Dashboards | ❌ No |
| Repository permissions | ❌ No |
| Service hooks | ❌ No |
| Git LFS objects | ❌ No (require separate migration) |

**Note:** For Azure Pipelines migration to GitHub Actions, contact your GitHub account manager.

---

## Migration Limitations

### GitHub Platform Limits

| Limit | Value |
|-------|-------|
| Maximum single Git commit size | 2 GiB |
| Maximum Git reference name | 255 bytes |
| Maximum file size (post-migration) | 100 MiB |

### GitHub Enterprise Importer Limits

| Limit | Value |
|-------|-------|
| Maximum Git repository size | 40 GiB (source code only, public preview) |
| Maximum file size during migration | 400 MiB |

For repositories larger than 2 GiB, see [Migrating Large Repositories (2 GiB to 40 GiB)](#migrating-large-repositories-2-gib-to-40-gib).

### Additional Limitations

- **Git LFS objects**: Not migrated automatically; must be pushed as a follow-up task
- **Code search**: Re-indexing can take a few hours after migration
- **Organization rulesets**: Rules (e.g., commit author email requirements) can cause migrations to fail if existing commits don't comply
- **Mannequin content**: Content associated with mannequins may not be searchable until reclaimed

---

## Access Requirements

### Required Roles

| Task | Organization Owner | Migrator Role |
|------|-------------------|---------------|
| Assign migrator role | ✅ Can perform | ❌ Cannot perform |
| Run repository migration | ✅ Can perform | ✅ Can perform |
| Download migration log | ✅ Can perform | ✅ Can perform |
| Reclaim mannequins | ✅ Can perform | ❌ Cannot perform |

### Personal Access Token Scopes

#### GitHub PAT (Classic) - Required Scopes

| Task | Organization Owner Scopes | Migrator Role Scopes |
|------|--------------------------|---------------------|
| Assign migrator role | `admin:org` | N/A |
| Run migration | `repo`, `admin:org`, `workflow` | `repo`, `read:org`, `workflow` |
| Download migration log | `repo`, `admin:org`, `workflow` | `repo`, `read:org`, `workflow` |
| Reclaim mannequins | `admin:org` | N/A |

**Important:** Fine-grained PATs are **not supported** for GitHub Enterprise Importer. You must use a Personal Access Token (Classic).

#### Azure DevOps PAT - Required Scopes

| Scope | Required |
|-------|----------|
| Work Item (Read) | ✅ Yes |
| Code (Read) | ✅ Yes |
| Identity (Read) | ✅ Yes |
| Build (Read) | Only for `--rewire-pipelines` flag |

**Note:** We recommend that you grant full access so you can use the `inventory-report` flag.

### The Migrator Role

The **migrator role** is a dedicated role for running migrations without requiring organization owner privileges.

Key characteristics:
- Can only be granted for an organization on GitHub.com or GHE.com
- Can be assigned to an individual user or a team (team recommended)
- Grants ability to import or export **any repository** in that organization
- Use `gh ado2gh grant-migrator-role` command to assign

---

## Migration Phases

### Phase 1: Planning Your Migration

Before migrating any data, thoroughly plan your migration by answering these key questions.

#### 1. How Soon Do We Need to Complete the Migration?

**Determine your timeline** by taking inventory of what you need to migrate:

| Inventory Item | Impact on Timeline |
|----------------|-------------------|
| Number of repositories | More repos = longer migration |
| Number of pull requests per repository | Largest factor in migration time |
| Number of users who contributed | Affects mannequin reclaim effort |

**Use the `inventory-report` command** to generate a CSV with repository metadata:

```bash
gh ado2gh inventory-report --ado-org ADO_ORG --ado-team-project PROJECT
```

**Timeline considerations:**
- Migration timing is **largely based on the number of pull requests** in a repository
- 1,000 repos with 100 PRs each = relatively quick migration
- 100 repos with 75,000 PRs each = much longer, requires more planning and testing

**Batching strategy:**
- If your organization can tolerate high change: migrate all repositories at once (days)
- If teams cannot migrate simultaneously: batch and stagger migrations by team timeline

#### 2. Do We Understand What Will Be Migrated?

Ensure all stakeholders understand:

| What IS Migrated | What is NOT Migrated |
|------------------|---------------------|
| Git repositories | Pipelines |
| Pull requests | Work items |
| Some branch policies | Artifacts |
| Work item links on PRs | Test plans |
| PR attachments | Releases, dashboards |
| User history for PRs | Repository permissions |
| | Service hooks |

**Action items:**
1. Review the data that's migrated (see [What Gets Migrated](#what-gets-migrated))
2. Make a list of data you'll need to manually migrate or recreate
3. Communicate limitations to stakeholders

#### 3. Who Will Run the Migration?

| Option | When to Use |
|--------|-------------|
| **Organization owner** | Small migrations, owner available |
| **Migrator role** | Delegated migrations, dedicated migration team |

**Migrator role benefits:**
- Removes need for organization owners to run every migration
- Can be assigned to a team (recommended) for better management
- Allows customizing who can run migrations via team membership

**Steps:**
1. Decide if org owner will run migrations or grant migrator role
2. If using migrator role, decide which person or team receives it
3. Grant the migrator role using `gh ado2gh grant-migrator-role`
4. Confirm PATs are configured with all required scopes

#### 4. What Organizational Structure Do We Want in GitHub?

**Structural differences:**

| Azure DevOps | GitHub |
|--------------|--------|
| Organization → Team Project → Repositories | Enterprise → Organization → Repositories |

**Key guidance from GitHub:**

> ⚠️ **The concept of a team project does NOT exist in GitHub.** Do NOT treat GitHub organizations as the equivalent of team projects in ADO.

**Recommended mapping:**

| ADO Structure | GitHub Structure |
|---------------|------------------|
| ADO Organization | GitHub Organization |
| ADO Team Project | Use **teams** to group repos and manage access |
| ADO Repository | GitHub Repository |

**After migration, you should have:**
- One enterprise account
- A small number of organizations (map 1:1 from ADO organizations)
- Teams within organizations to manage access to groups of repositories

**Batching by structure:**
- If you have multiple ADO organizations, consider batching by organization
- Use the GitHub CLI to generate a migration script for an entire ADO organization

#### 5. Planning Checklist

| Task | Status |
|------|--------|
| ☐ Inventory repositories, PRs, and users | |
| ☐ Determine migration timeline | |
| ☐ Identify data requiring manual migration | |
| ☐ Communicate limitations to stakeholders | |
| ☐ Decide who runs migrations (owner vs. migrator role) | |
| ☐ Grant migrator role if applicable | |
| ☐ Configure PATs with required scopes (GitHub + ADO) | |
| ☐ Design target GitHub organizational structure | |
| ☐ Map ADO orgs to GitHub orgs | |
| ☐ Plan team structure for access management | |
| ☐ Define migration batches (if needed) | |
| ☐ Schedule trial migrations | |
| ☐ Identify stakeholders for validation | |

---

### Phase 2: Trial Migrations

Trial migrations help determine:
- Whether migration can complete successfully
- Whether repository can return to working state
- How long migration will take

**Recommendations:**
- Create a test organization (e.g., `company-sandbox`)
- Run trial migrations without time coordination (no downtime required)
- Have users validate results
- Resolve issues before production migration

### Phase 3: Production Migrations

- Halt work during production migrations to prevent data loss
- Configure IP allow lists if applicable
- Run migrations using ADO2GH extension of GitHub CLI

---

## Migrating Large Repositories (2 GiB to 40 GiB)

Repositories of 10 GiB or more can migrate with GitHub Enterprise Importer (GEI). GEI supports up to **40 GiB of Git source (public preview)**. The 2 GiB figure in the GitHub limits applies to a **single commit** and a **single push**, not to the total repository size. The 2 GiB per-commit limit still applies to GEI migrations. Validate every large repository with a trial migration before the production run.

> [!IMPORTANT]
> GEI measures the 40 GiB limit as **total blob size** reported by `git-sizer`. The size shown in Azure DevOps may differ, so measure each repository before planning.

### Limits That Matter for Large Repositories

| Limit | Value | Effect if exceeded |
|-------|-------|--------------------|
| Repository size (GEI, public preview) | 40 GiB total blob size | GEI cannot migrate the repository; shrink history or use the Git-only fallback |
| Single file during migration | 400 MiB | Migration fails; move the file to Git LFS or remove it from history |
| Single file after migration | 100 MiB | Migrates, but later pushes that add or modify a file this size are rejected |
| Single commit | 2 GiB | Migration fails; split the commit or rewrite history |
| Single push | 2 GiB | Applies to manual `git push`; the Git-only fallback must push in increments |
| Git reference name | 255 bytes | Migration fails; rename the ref before migrating |
| Git LFS objects | Not migrated by GEI | Push separately after migration; 5 GB maximum per LFS file on GitHub Enterprise Cloud |
| Recommended repository size | < 1 GB ideal, < 5 GB strongly recommended | Larger repositories work, but GitHub may contact you about repository health |

### GitHub Enterprise Cloud Considerations

GEI migrates from Azure DevOps Cloud only into GitHub Enterprise Cloud, so this strategy is designed for GHEC. The size limits above apply to both GHEC on GitHub.com and GHEC with data residency (GHE.com). Check these GHEC settings before migrating large repositories:

| Area | GitHub.com (GHEC) | GHE.com (data residency) |
|------|-------------------|--------------------------|
| `gh ado2gh` target | Default API URL | Add `--target-api-url https://api.SUBDOMAIN.ghe.com` to every command |
| Git and LFS remotes (Steps 5 and 6 below) | `https://github.com/GITHUB_ORG/REPO.git` | `https://SUBDOMAIN.ghe.com/GITHUB_ORG/REPO.git` |
| IP allow list | Add the GEI IP ranges for GitHub.com | Add the GEI IP ranges published for your GHE.com region |
| LFS maximum file size | 5 GB | 5 GB |

Additional GHEC checks:

- GEI requires a personal access token (classic). It fails if the enterprise enforces the policy that restricts classic PATs from accessing organizations. Allow classic PATs for the migration account during the migration window.
- With Enterprise Managed Users, the PAT must belong to a managed user account with the migrator role. Manual `git push` and `git lfs push` in Steps 5 and 6 below must also authenticate as a managed user.
- Without Enterprise Managed Users, authorize the classic PAT for SAML single sign-on if the organization enforces it.
- Temporarily disable IdP IP restrictions (for example, Entra ID Conditional Access) for the enterprise, and re-enable them after migration.
- Make sure the enterprise Git LFS storage and bandwidth budget covers the LFS data you push in Step 5.

### Step 1: Measure Each Repository

Use a non-bare clone so that Git LFS commands work. Fetch all branches and tags.

```bash
git clone https://dev.azure.com/ORG/PROJECT/_git/REPO repo
cd repo
git fetch origin '+refs/heads/*:refs/remotes/origin/*' --tags

# Total blob size (the 40 GiB check), largest blob, longest path
git-sizer --verbose

# List every blob above 100 MiB (use 419430400 for 400 MiB)
git rev-list --objects --all \
  | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' \
  | awk '$1=="blob" && $3>104857600' | sort -k3 -n -r

# Files Git LFS would convert, and existing LFS object totals
git lfs migrate info --everything --above=100MiB
git lfs migrate info --everything --pointers=follow

# Refs longer than 255 bytes
git for-each-ref --format='%(refname)' | awk 'length($0)>255'
```

Record the following for each repository: total blob size, number of blobs above 100 MiB and above 400 MiB, LFS object count and size, number of pull requests, and any refs that are too long.

> [!NOTE]
> `git-sizer` does not measure the 2 GiB per-commit limit. Its "biggest checkout" value is the size of a full working tree, not the size of the change a commit introduces. Commits larger than 2 GiB are rare. They usually show up as a single commit that added a very large set of binaries. A trial migration confirms whether one exists.

### Step 2: Classify Each Repository

| Tier | Profile | Strategy | PR history |
|------|---------|----------|------------|
| A | Total blob size ≤ 40 GiB, no blob > 400 MiB, no commit > 2 GiB, no ref > 255 bytes | Migrate with GEI as-is. Blobs of 100 to 400 MiB in history migrate; move them to LFS on the branch tips after migration | Preserved |
| B | Total blob size ≤ 40 GiB, but has blobs > 400 MiB or commits > 2 GiB | Rewrite history in place in Azure DevOps (convert binaries to LFS), then migrate with GEI | Preserved, with degraded diffs on rewritten commits |
| C | Total blob size > 40 GiB | Shrink history (LFS conversion, remove generated artifacts, or split the monorepo) until under 40 GiB, then migrate with GEI | Preserved, with degraded diffs on rewritten commits |
| D | Cannot be reduced below 40 GiB, or PR history is not required | Git-only fallback: push in increments below 2 GiB and keep Azure DevOps read-only as the archive | Not migrated |

### Step 3: Remediate History (Tier B and C)

> [!WARNING]
> Rewriting history changes every downstream commit SHA. Existing pull requests, both open and completed, reference the original commits, so migrated PRs can lose diffs and review context. Every developer must re-clone after the rewrite. Run the rewrite inside an announced freeze window.

To keep PR history, rewrite the **original** Azure DevOps repository in place. A new staging repository in Azure DevOps contains no pull requests, so GEI would migrate none. Use a staging repository only to rehearse the rewrite.

```bash
# Preview what would be converted
git lfs migrate info --everything --above=100MiB

# Option A: move every file above 100 MiB to LFS across all history
git lfs migrate import --everything --above=100MiB

# Option B: move specific binary types to LFS across all history
git lfs migrate import --everything --include="*.zip,*.dll,*.iso,*.bin"

# Option C: remove generated or unwanted content entirely (git filter-repo)
git filter-repo --path build-output/ --invert-paths
```

`git lfs migrate import` does not allow `--above` together with `--include` or `--exclude`, so pick one option per run. `git filter-repo` removes the `origin` remote after it runs; re-add it before pushing.

Push the rewritten history and the new LFS objects back to Azure DevOps. Push only branches and tags. Azure DevOps rejects updates to its internal `refs/pull/*` refs.

```bash
git lfs push --all origin
git push --force origin 'refs/heads/*:refs/heads/*' 'refs/tags/*:refs/tags/*'
```

Force-pushing to Azure DevOps requires the **Force push** permission and a temporary bypass of branch policies. After the push, re-measure from a fresh clone. Azure DevOps may keep the old objects reachable for a while, so confirm the size with a trial migration rather than assuming it has dropped.

### Step 4: Run Trial and Production Migrations

- Run a trial migration into a sandbox organization for every repository larger than 5 GiB, and record the duration.
- Add **Repository migrations** to the bypass list of every enterprise and organization ruleset (for example, file size or commit author email rules). The bypass applies only during the import, so rulesets stay enabled and apply to new contributions afterwards.
- Migrate large repositories one at a time or in a small dedicated batch.
- Use a PAT that will not expire during a multi-hour migration.
- As a best practice, engage your GitHub account team before migrating repositories larger than 10 GiB.
- For the production run, lock the Azure DevOps repository first so that no commits are lost during the migration.

```bash
gh ado2gh lock-ado-repo --ado-org ADO_ORG --ado-team-project PROJECT --ado-repo REPO

gh ado2gh migrate-repo --ado-org ADO_ORG --ado-team-project PROJECT --ado-repo REPO \
  --github-org GITHUB_ORG --github-repo REPO --queue-only
# The command output includes the migration ID (RM_...)
gh ado2gh wait-for-migration --migration-id MIGRATION_ID

gh ado2gh download-logs --github-org GITHUB_ORG --github-repo REPO
```

If a large migration fails, review the migration log, fix the reported issue, and retry. If a retry within the 40 GiB public preview limit still fails, contact GitHub Support.

### Step 5: Migrate Git LFS Objects

GEI migrates LFS pointer files but not the LFS objects. Push them after the repository migration completes. This step downloads every LFS object from every ref, so provision enough disk space.

```bash
git clone https://dev.azure.com/ORG/PROJECT/_git/REPO repo
cd repo
git lfs fetch --all origin
git remote add github https://github.com/GITHUB_ORG/REPO.git
git lfs push --all github

# Verify: clone from GitHub and check that LFS files resolve to real content
git clone https://github.com/GITHUB_ORG/REPO.git verify && cd verify
git lfs fsck --pointers
```

If you rewrote history in Step 3 and did not push the LFS objects to Azure DevOps, push them from the clone that performed the rewrite. Confirm GitHub LFS storage and bandwidth budgets before pushing large LFS sets.

### Step 6: Git-Only Fallback (Tier D)

When GEI cannot be used, push history in increments below 2 GiB. Pull requests, PR comments, and branch policies are **not** migrated with this approach. Blobs larger than 100 MiB must be removed or converted to LFS first, because a regular push rejects them.

```bash
git remote add github https://github.com/GITHUB_ORG/REPO.git

# Push main in chunks along its first-parent history
git log --first-parent --oneline --reverse refs/heads/main | awk 'NR % 1000 == 0' |
  while read sha msg; do git push github +$sha:refs/heads/main; done

# Push remaining branches and tags. Do not use --mirror: it would push refs/pull/*
git push github 'refs/heads/*:refs/heads/*' 'refs/tags/*:refs/tags/*'
git lfs push --all github
```

If a push returns `pack exceeds maximum allowed size`, reduce the step size. Long-lived branches with large unique history need their own incremental push before the final branch and tag push. A single commit larger than 2 GiB cannot be pushed at any step size and must be split first.

### Step 7: Keep the Repository Healthy After Migration

- Clone with `git clone --filter=blob:none` (partial clone) and use sparse checkout for day-to-day work.
- Keep `actions/checkout` defaults (`fetch-depth: 1`, `lfs: false`) unless a workflow needs full history or LFS content.
- Add push rulesets that block files above 100 MiB and restrict binary extensions so the repository does not grow back.
- Convert any remaining 100 to 400 MiB files on branch tips to LFS with `git lfs migrate import --no-rewrite`.

---

## Key Concepts

### Mannequins

**Definition:** Placeholder identities used to attribute migrated content (issues, PRs, comments) when the original user doesn't have a GitHub account in the destination organization.

**Key points:**
- All user activity (except Git commits) is attributed to mannequins
- Mannequins can be reclaimed (reattributed) to actual GitHub users
- Only organization owners can reclaim mannequins
- Content associated with mannequins may not be searchable until reclaimed

### Repository Visibility

All repositories are migrated as **private** by default.

Options to change visibility:
- Use `--target-repo-visibility` CLI option during migration
- Use `targetRepoVisibility` GraphQL property
- Change visibility in browser after migration
- Use `gh repo edit` CLI command

### Team Creation (ADO2GH CLI)

When using the ADO2GH CLI, two teams are automatically created per ADO team project:

| Team Name | Permission Level |
|-----------|-----------------|
| `TEAM-PROJECT-Maintainers` | Maintainer |
| `TEAM-PROJECT-Admins` | Admin |

---

## Post-Migration Tasks

After each migration completes, perform these follow-up tasks:

| Task | Description |
|------|-------------|
| **Check migration status** | Verify success/failure; review error messages |
| **Review migration log** | Check for warnings about data that wasn't migrated |
| **Set repository visibility** | Change from private if needed |
| **Configure permissions** | Add users to teams; configure access |
| **Reclaim mannequins** | Reattribute history to actual GitHub users |
| **Configure IP allow lists** | Remove temporary GEI IP ranges; re-enable IdP restrictions |
| **Migrate Git LFS objects** | Push LFS objects separately if applicable |

---

## Official Documentation References

### Primary Documentation

| Topic | URL |
|-------|-----|
| About migrations from Azure DevOps | https://docs.github.com/en/migrations/using-github-enterprise-importer/migrating-from-azure-devops-to-github-enterprise-cloud/about-migrations-from-azure-devops-to-github-enterprise-cloud |
| Overview of a migration | https://docs.github.com/en/migrations/using-github-enterprise-importer/migrating-from-azure-devops-to-github-enterprise-cloud/overview-of-a-migration-from-azure-devops-to-github-enterprise-cloud |
| Managing access for migration | https://docs.github.com/en/migrations/using-github-enterprise-importer/migrating-from-azure-devops-to-github-enterprise-cloud/managing-access-for-a-migration-from-azure-devops |
| Migrating repositories | https://docs.github.com/en/migrations/using-github-enterprise-importer/migrating-from-azure-devops-to-github-enterprise-cloud/migrating-repositories-from-azure-devops-to-github-enterprise-cloud |

### Supporting Documentation

| Topic | URL |
|-------|-----|
| About GitHub Enterprise Importer | https://docs.github.com/en/migrations/using-github-enterprise-importer/understanding-github-enterprise-importer/about-github-enterprise-importer |
| Reclaiming mannequins | https://docs.github.com/en/migrations/using-github-enterprise-importer/completing-your-migration-with-github-enterprise-importer/reclaiming-mannequins-for-github-enterprise-importer |
| Migration logs | https://docs.github.com/en/migrations/using-github-enterprise-importer/completing-your-migration-with-github-enterprise-importer/accessing-your-migration-logs-for-github-enterprise-importer |
| Troubleshooting | https://docs.github.com/en/migrations/using-github-enterprise-importer/completing-your-migration-with-github-enterprise-importer/troubleshooting-your-migration-with-github-enterprise-importer |

### Tools

| Tool | Repository/Download |
|------|---------------------|
| ADO2GH CLI Extension | Installed via `gh extension install github/gh-ado2gh` |
| git-sizer | https://github.com/github/git-sizer |
| Git LFS (`git lfs migrate`) | https://github.com/git-lfs/git-lfs |
| git filter-repo | https://github.com/newren/git-filter-repo |

### Large Repository References

| Topic | URL |
|-------|-----|
| About large files on GitHub | https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github |
| About Git Large File Storage | https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-git-large-file-storage |
| Troubleshooting the 2 GiB push limit | https://docs.github.com/en/get-started/using-git/troubleshooting-the-2-gb-push-limit |

---

## Quick Reference: CLI Commands

```bash
# Install ADO2GH extension
gh extension install github/gh-ado2gh

# Set environment variables
export GH_PAT="your-github-pat"
export ADO_PAT="your-ado-pat"

# Grant migrator role
gh ado2gh grant-migrator-role --github-org ORGANIZATION --actor ACTOR --actor-type USER|TEAM

# Generate inventory report
gh ado2gh inventory-report --ado-org ADO_ORG --ado-team-project PROJECT

# Generate migration script
gh ado2gh generate-script --ado-org ADO_ORG --github-org GITHUB_ORG --output SCRIPT.ps1

# Run migration
gh ado2gh migrate-repo --ado-org ADO_ORG --ado-team-project PROJECT --ado-repo REPO --github-org GITHUB_ORG --github-repo REPO

# Check migration status
gh ado2gh wait-for-migration --migration-id MIGRATION_ID
```

---

> **Disclaimer:** This document summarizes official GitHub documentation. Always refer to the official documentation links above for the most current and complete information.

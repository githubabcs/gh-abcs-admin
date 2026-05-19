# GitHub Enterprise Importer: Azure DevOps to GitHub Migration Guide

> **Purpose:** High-level reference guide for migrating repositories from Azure DevOps Cloud to GitHub Enterprise Cloud using GitHub Enterprise Importer.

> **Document status**
>
> - **Last reviewed:** 2026-05-19
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
7. [Key Concepts](#key-concepts)
8. [Post-Migration Tasks](#post-migration-tasks)
9. [Official Documentation References](#official-documentation-references)

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

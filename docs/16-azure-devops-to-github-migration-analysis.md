# Azure DevOps to GitHub Migration: Pain Points Analysis and Solutions

> **Document status**
>
> - **Last reviewed:** 2026-05-19
> - **Authorship:** Drafted with AI assistance (GitHub Copilot, multi-model review) and reviewed by a human maintainer before publication.
> - **Sources:** Based on public documentation — primarily [docs.github.com](https://docs.github.com), [learn.microsoft.com](https://learn.microsoft.com), and official vendor blogs cited inline.
> - **Verify before acting:** GitHub and Microsoft update product documentation continuously. Re-confirm against the live source pages before relying on this content for production decisions.

## Executive Summary

This document analyzes common pain points experienced with Azure DevOps Services and provides corresponding solutions available in GitHub Enterprise Cloud. The analysis covers security access control, team management, external collaborator handling, and non-human identity integrations.

---

## Table of Contents

1. [Pain Point #1: Open Security Access](#pain-point-1-open-security-access)
2. [Pain Point #2: Overly Permissive Project Administrator Group](#pain-point-2-overly-permissive-project-administrator-group)
3. [Pain Point #3: External Collaborator Management](#pain-point-3-external-collaborator-management)
4. [Pain Point #4: Non-Human Identity Integrations](#pain-point-4-non-human-identity-integrations)
5. [Pain Point #5: Azure DevOps Pipeline Migration](#pain-point-5-azure-devops-pipeline-migration)
6. [Pain Point #6: Work Item and Project Tracking](#pain-point-6-work-item-and-project-tracking)
7. [Pain Point #7: Azure Artifacts and Package Management](#pain-point-7-azure-artifacts-and-package-management)
8. [Pain Point #8: ADO-Specific Permissions Model Differences](#pain-point-8-ado-specific-permissions-model-differences)
9. [Pain Point #9: Compliance and Audit Trail Continuity](#pain-point-9-compliance-and-audit-trail-continuity)
10. [Additional ADO to GitHub Migration Recommendations](#additional-ado-to-github-migration-recommendations)
11. [Workshop Topics: GitHub Solutions](#workshop-topics-github-solutions)
12. [Summary: Feature Comparison](#summary-feature-comparison)

---

## Pain Point #1: Open Security Access

### Azure DevOps Problem

| Issue | Impact |
|-------|--------|
| Security access is open for everyone in your organization | Uncontrolled access to sensitive code |
| Contributors have read/write access to all repositories | No principle of least privilege |
| No branch policies are enforced | Unprotected code branches, risk of direct commits to production |

### GitHub Solution

#### 1. Base Repository Permissions: "No Permission" Default

GitHub Enterprise Cloud allows setting **base repository permissions to "None"** at the enterprise level:

- **What it does**: Members have NO default access to repositories
- **Access must be explicitly granted** via teams or direct collaboration
- **Enforced at enterprise level**: Cannot be overridden by organizations

```
Enterprise Policy → Base Repository Permissions → "No permission"
```

#### 2. Repository Visibility Controls

| Visibility | Who Can Access | Use Case |
|------------|---------------|----------|
| **Private** | Only explicitly granted users/teams | Proprietary code, sensitive projects |
| **Internal** | All enterprise members | Innersource, shared libraries |
| **Public** | Everyone | Open source only (can be disabled) |

**Recommendation**: Disable public repository creation at enterprise level to prevent accidental exposure.

#### 3. Repository Rulesets (Branch Protection Evolution)

GitHub provides **Repository Rulesets** that can be enforced at enterprise or organization level:

| Protection | Capability |
|------------|------------|
| **Required pull requests** | No direct commits to protected branches |
| **Required approvals** | Minimum number of reviewers (configurable) |
| **Required status checks** | CI/CD must pass before merge |
| **Required code scanning** | Security checks must pass |
| **Dismiss stale reviews** | Force re-review after new commits |
| **Restrict who can push** | Only specific teams/users can push |

**Key Advantage**: Rulesets can be **enforced at enterprise level** and applied across all organizations and repositories, preventing local overrides.

#### 4. CODEOWNERS Enforcement

- Define code ownership per file/directory pattern
- Require approval from code owners before merge
- Integrates with branch protection rules

---

## Pain Point #2: Overly Permissive Project Administrator Group

### Azure DevOps Problem

| Issue | Impact |
|-------|--------|
| Project Administrator group used to allow team creation | Excessive privileges granted |
| Group is too permissive | Users can perform unintended administrative actions |
| Members can assign teams to security groups | Security bypass: users can self-grant elevated permissions |

### GitHub Solution

#### 1. Granular Role Hierarchy

GitHub provides a clear, non-overlapping role hierarchy:

| Role | Repository Permissions | Cannot Do |
|------|----------------------|-----------|
| **Read** | Clone, view issues/PRs | Push code, manage settings |
| **Triage** | Manage issues/PRs | Push code, manage settings |
| **Write** | Push to non-protected branches | Admin settings, delete repo |
| **Maintain** | Manage repo settings (limited) | Transfer, delete, change visibility |
| **Admin** | Full repository control | N/A |

#### 2. Organization Roles (Separate from Repository Access)

| Role | What They Can Do | What They Cannot Do |
|------|-----------------|---------------------|
| **Member** | Access repos based on team membership | Create teams, invite users, change org settings |
| **Moderator** | Manage comments, block users | Admin functions |
| **Billing Manager** | Manage billing | Code access, admin functions |
| **Security Manager** | View/manage security alerts | Repository admin, team management |
| **Owner** | Full organization control | N/A |

**Key Difference from Azure DevOps**: Team creation is restricted to **Organization Owners only** by default. Regular members cannot create teams or modify team-to-repository assignments.

#### 3. Custom Organization Roles (Enterprise Feature)

Create custom roles with specific permissions:

```yaml
Custom Role: "Team Lead"
Permissions:
  - Manage team membership (own team only)
  - Create repositories
  - Cannot: Delete repositories, change visibility, invite outside collaborators
```

#### 4. Team Management Controls

| Control | GitHub Capability |
|---------|------------------|
| Who can create teams | Organization Owners only |
| Who can add members to teams | Team Maintainers or Org Owners |
| Team visibility | Visible or Secret (hidden from non-members) |
| Nested teams | Permission inheritance from parent teams |

**Security Benefit**: Unlike Azure DevOps, team creation and security group assignment are completely separated. A user cannot self-assign elevated permissions through team manipulation.

---

## Pain Point #3: External Collaborator Management

### Azure DevOps Problem

| Issue | Impact |
|-------|--------|
| No native external collaborator concept | Manual tracking required |
| External collaborators managed as permanent employees | Loss of visibility into who is external |
| Manual management or custom automation required | Operational overhead, potential security gaps |

### GitHub Solution

#### 1. Native Outside Collaborator Support

GitHub has a **first-class concept of "Outside Collaborators"**:

| Attribute | Description |
|-----------|-------------|
| **Definition** | Users who have access to repositories but are not organization members |
| **Visibility** | Clearly identified in the organization's People tab |
| **Permissions** | Can only access repositories they are explicitly invited to |
| **Billing** | Count toward seat licenses only if they have repo access |
| **Auditability** | All outside collaborator actions are logged separately |

#### 2. Enterprise-Level Outside Collaborator Policy

| Policy | Recommendation |
|--------|---------------|
| **Who can invite** | Restrict to Enterprise/Organization Owners only |
| **Repository access** | Per-repository invitation (no blanket access) |
| **Review process** | Require approval workflow for invitations |

```
Enterprise Policy → Outside Collaborators → "Restrict to Organization Owners"
```

#### 3. Enterprise Managed Users (EMU) Consideration

If your organization uses **Enterprise Managed Users (EMU)**:

| Scenario | Handling |
|----------|----------|
| All users from IdP | Managed users (employees, contractors provisioned via IdP) |
| True external collaborators | Invite as outside collaborators (separate accounts) |
| Contractors in IdP | Treated as managed users (recommended approach) |

**Recommended Approach**: If external collaborators are managed as employees in your IdP, EMU would provision them automatically via SCIM—no manual management needed.

#### 4. Audit and Reporting

- **Audit log** tracks all outside collaborator invitations, access grants, and removals
- **Organization insights** show outside collaborator activity
- **API access** for automated compliance reporting

---

## Pain Point #4: Non-Human Identity Integrations

### Azure DevOps Problem

| Issue | Impact |
|-------|--------|
| Teams constantly request integrations for non-human identities | High operational burden |
| Access managed manually | Inconsistent security posture |
| WebJobs can overwrite permissions | Security controls can be bypassed |
| Third-party apps request elevated permissions | Risk of excessive access |
| No ownership of third-party app secrets | Limited control and auditability |

### GitHub Solution

#### 1. GitHub Apps (Recommended for Integrations)

GitHub Apps are the preferred method for non-human access:

| Feature | Benefit |
|---------|---------|
| **Granular permissions** | Request only specific permissions needed |
| **Scoped access** | Can be limited to specific repositories |
| **Organization approval** | Require org owner approval before installation |
| **Audit logging** | All API calls are logged with app identity |
| **Rate limiting** | Separate rate limits per app |
| **Short-lived tokens** | Installation tokens expire in 1 hour |

#### 2. Enterprise-Level App Policies

| Policy | Capability |
|--------|------------|
| **Pre-approved apps** | Create allowlist of approved GitHub Apps |
| **Block third-party apps** | Prevent unapproved app installations |
| **Require approval** | Organization owners must approve app installations |
| **OAuth app restrictions** | Control OAuth app access to organization data |

#### 3. Fine-Grained Personal Access Tokens (PATs)

For scenarios requiring PATs:

| Control | GitHub Capability |
|---------|------------------|
| **Granular scopes** | Select specific permissions (unlike classic PATs) |
| **Repository scoping** | Limit to specific repositories |
| **Expiration enforcement** | Enterprise policy for maximum lifetime (e.g., 90 days) |
| **Approval workflow** | Require organization owner approval |
| **Revocation** | Centralized revocation by organization owners |

**Enterprise Policy Recommendation**:
```
Fine-Grained PATs → Require approval
Classic PATs → Restrict or block
Maximum lifetime → 90 days
```

#### 4. GitHub Actions for Automation (Replaces WebJobs)

| Feature | Benefit over WebJobs |
|---------|---------------------|
| **GITHUB_TOKEN** | Automatically provisioned, scoped to workflow run |
| **Minimal permissions** | Default to read-only (configurable) |
| **No persistent secrets** | Token expires after workflow completion |
| **Workflow approval** | Require approval for workflows from forks |
| **Audit logging** | Complete audit trail of all Actions runs |

**Enterprise Policy**:
```
Default workflow permissions → Read-only
Allow actions to create PRs → Disabled
Repository-level runners → Disabled
```

#### 5. Deploy Keys and SSH Certificates

For CI/CD and deployment scenarios:

| Method | Use Case | Control |
|--------|----------|---------|
| **Deploy keys** | Read/write access to single repository | Enterprise can disable |
| **SSH Certificate Authorities** | Certificate-based auth with expiration | Enterprise-managed CA |

---

---

## Pain Point #5: Azure DevOps Pipeline Migration

### Azure DevOps Problem

| Issue | Impact |
|-------|--------|
| YAML pipelines use ADO-specific syntax | Pipelines cannot be directly reused |
| Service connections managed in ADO | Credentials and integrations must be recreated |
| Variable groups and library assets | Secrets and configurations need migration |
| Self-hosted agents tied to ADO | Agent infrastructure requires reconfiguration |
| Pipeline approvals and gates | Approval workflows must be rebuilt |

### GitHub Solution

#### 1. GitHub Actions as Pipeline Replacement

| ADO Concept | GitHub Equivalent |
|-------------|------------------|
| YAML Pipelines | GitHub Actions workflows |
| Service Connections | GitHub Secrets + OIDC federation |
| Variable Groups | Repository/Organization secrets and variables |
| Agent Pools | Runner groups (self-hosted or GitHub-hosted) |
| Environments + Approvals | GitHub Environments with protection rules |
| Release Gates | Required reviewers + deployment protection rules |

#### 2. Migration Strategy for Pipelines

| Approach | When to Use |
|----------|-------------|
| **Rewrite from scratch** | Complex pipelines, opportunity to modernize |
| **GitHub Actions Importer** | Automated conversion of ADO pipelines to GitHub Actions workflows |
| **Hybrid (temporary)** | Gradual migration, ADO triggers GitHub Actions |

**Key Actions for Pipeline Migration**:
- Inventory all pipelines and classify by complexity
- Map service connections to GitHub OIDC or secrets
- Convert variable groups to GitHub secrets/variables
- Redesign approval workflows using GitHub Environments
- Plan runner infrastructure (GitHub-hosted vs. self-hosted)

---

## Pain Point #6: Work Item and Project Tracking

### Azure DevOps Problem

| Issue | Impact |
|-------|--------|
| Azure Boards tightly integrated with repos | Breaking the link loses traceability |
| Work item history and relationships | Historical context may be lost |
| Custom work item types and fields | Must be mapped to GitHub Issues/Projects |
| Queries and dashboards | Reporting must be rebuilt |

### GitHub Solution

#### 1. GitHub Issues and Projects

| ADO Boards Feature | GitHub Equivalent |
|--------------------|------------------|
| Work Items | GitHub Issues |
| Epics/Features | Issues with labels or GitHub Projects |
| Sprints | GitHub Projects iterations |
| Boards | GitHub Projects board views |
| Custom Fields | GitHub Projects custom fields |
| Queries | GitHub search + saved searches |

#### 2. Migration Recommendations

| Approach | Trade-off |
|----------|-----------|
| **Migrate work items via third-party tooling** | Tools such as `nkdAgility/azure-devops-migration-tools` migrate work items; GEI only migrates work-item *links embedded in pull requests*, not the work items themselves. Plan a separate migration track for Boards/work items. |
| **Fresh start in GitHub** | Clean slate, no legacy debt |
| **Keep ADO Boards temporarily** | Maintains history, allows gradual transition |

**Governance Consideration**: Decide whether work item history is required for compliance before choosing migration strategy.

---

## Pain Point #7: Azure Artifacts and Package Management

### Azure DevOps Problem

| Issue | Impact |
|-------|--------|
| Azure Artifacts feeds (NuGet, npm, Maven) | Packages must be migrated or re-published |
| Upstream sources configured | Proxy configurations need recreation |
| Feed permissions | Access control must be remapped |
| Package versioning history | Historical versions may need preservation |

### GitHub Solution

#### 1. GitHub Packages

| Azure Artifacts Feature | GitHub Packages Equivalent |
|------------------------|---------------------------|
| NuGet feeds | GitHub Packages NuGet registry |
| npm feeds | GitHub Packages npm registry |
| Maven feeds | GitHub Packages Maven registry |
| Container registry | GitHub Container Registry (ghcr.io) |
| Universal packages | Not directly supported (use releases or LFS) |

#### 2. Migration Strategy

| Approach | When to Use |
|----------|-------------|
| **Republish packages** | Active packages, clean versioning needed |
| **Mirror feeds** | Need to maintain both temporarily |
| **Archive old versions** | Historical packages rarely accessed |

**Security Enhancement**: GitHub Packages integrates with Dependabot for automatic vulnerability scanning—an improvement over Azure Artifacts. Note: GitHub Packages does not provide a Python (PyPI) registry. Teams publishing Python packages on Azure Artifacts will need an external alternative such as Azure Artifacts (retained), Cloudsmith, JFrog Artifactory, or AWS CodeArtifact.

---

## Pain Point #8: ADO-Specific Permissions Model Differences

### Azure DevOps Problem

| Issue | Impact |
|-------|--------|
| Project-level permissions | Different granularity than GitHub |
| Area/Iteration permissions | No direct equivalent in GitHub |
| Build/Release permissions | Must map to Actions permissions |
| Security namespaces complexity | Simplification opportunity |

### GitHub Solution

#### Permission Mapping Guide

| ADO Permission Level | GitHub Equivalent |
|---------------------|-------------------|
| Organization (ADO) | Enterprise or Organization (GitHub) |
| Project | Organization or Repository (depending on structure) |
| Repository | Repository |
| Area Path | Labels + CODEOWNERS |
| Iteration | GitHub Projects |
| Build Pipelines | Actions workflows (workflow-level permissions) |
| Release Pipelines | Environments with protection rules |

**Governance Improvement**: GitHub's simpler permission model reduces administrative overhead and makes auditing easier.

---

## Pain Point #9: Compliance and Audit Trail Continuity

### Azure DevOps Problem

| Issue | Impact |
|-------|--------|
| Audit logs in ADO | Historical audit data stays in ADO |
| Compliance reports based on ADO | Reports must be rebuilt |
| Change tracking across migration | Gap in audit trail during migration |

### GitHub Solution

#### 1. Audit Log Strategy

| Consideration | Recommendation |
|---------------|---------------|
| **Pre-migration export** | Export ADO audit logs before migration |
| **Migration window documentation** | Document all changes during migration |
| **Post-migration baseline** | Establish new audit baseline in GitHub |
| **SIEM integration** | Stream GitHub audit logs to same SIEM as ADO |

#### 2. Compliance Continuity

| Action | Purpose |
|--------|---------|
| Archive ADO audit logs | Retain for compliance period |
| Document permission mappings | Prove equivalent controls |
| Conduct post-migration audit | Verify security posture |
| Update compliance documentation | Reflect new platform controls |

---

## Additional ADO to GitHub Migration Recommendations

### Pre-Migration Governance Checklist

| Category | Action | Priority |
|----------|--------|----------|
| **Identity** | Map ADO users to GitHub/IdP identities | Critical |
| **Teams** | Document ADO team→GitHub team mapping | Critical |
| **Permissions** | Create permission equivalency matrix | Critical |
| **Policies** | Define GitHub enterprise policies before migration | Critical |
| **Secrets** | Inventory all service connections and secrets | Critical |
| **Pipelines** | Classify pipelines by migration complexity | High |
| **Packages** | Inventory active packages and retention needs | High |
| **Work Items** | Decide migration vs. fresh start strategy | Medium |

### Migration Wave Strategy

| Wave | Content | Risk Level |
|------|---------|------------|
| **Wave 0 (Pilot)** | 3-5 low-risk repos, no production dependencies | Low |
| **Wave 1** | Non-critical repos, development/sandbox | Low |
| **Wave 2** | Internal tools, lower-criticality applications | Medium |
| **Wave 3** | Production applications (with rollback plan) | High |
| **Wave 4** | Regulated/compliance-critical repos | High |

### Post-Migration Validation Checklist

| Validation | Description |
|------------|-------------|
| ☐ Git history complete | All commits, branches, tags present |
| ☐ Security scanning active | GHAS enabled and scanning |
| ☐ Branch protection applied | Rulesets enforced |
| ☐ Team access verified | Correct permissions assigned |
| ☐ CI/CD functional | Workflows executing successfully |
| ☐ Secrets rotated | New secrets in GitHub, old secrets revoked |
| ☐ Documentation updated | URLs and references updated |
| ☐ Developers notified | Communication sent with new access info |

### Dual-Operation Period Considerations

During migration, you may operate both ADO and GitHub simultaneously:

| Consideration | Recommendation |
|---------------|---------------|
| **Sync direction** | One-way only (ADO→GitHub), never bidirectional |
| **Cut-over timing** | Plan hard cut-over dates per repository |
| **Access revocation** | Revoke ADO write access after GitHub go-live |
| **Documentation** | Clearly mark which platform is source of truth |
| **Training** | Ensure teams are trained before their repos migrate |

---

## Workshop Topics: GitHub Solutions

### 1. Repository Naming Conventions

**Recommendations**:

| Component | Format | Example |
|-----------|--------|---------|
| **Business unit** | Prefix | `fin-`, `hr-`, `tech-` |
| **Application name** | Core identifier | `payroll-service` |
| **Component type** | Suffix | `-api`, `-ui`, `-infra` |
| **Environment** (if needed) | Suffix | `-config` (not `-prod`, `-dev`) |

**Pattern**: `{business-unit}-{application}-{component}`

**Examples**:
- `fin-payroll-api`
- `tech-platform-terraform`
- `hr-employee-portal-ui`

**Enforcement**:
- Use repository templates with pre-configured naming
- Implement custom GitHub App to validate naming on creation
- Document naming standards in `.github` repository

### 2. Team Structure

**Recommended Hierarchy**:

```
Enterprise
└── Organization (by business unit or domain)
    └── Parent Team (by department/area)
        └── Child Team (by squad/project)
```

**Example Structure**:

```
Your Enterprise
├── company-technology (Organization)
│   ├── Platform Team (Parent)
│   │   ├── Infrastructure Squad
│   │   ├── DevOps Squad
│   │   └── SRE Squad
│   └── Product Teams (Parent)
│       ├── Mobile Squad
│       └── Web Squad
├── company-finance (Organization)
│   └── Finance Systems Team
└── company-security (Organization)
    ├── AppSec Team (Secret)
    └── Incident Response (Secret)
```

**IdP Synchronization**:
- Sync teams from Entra ID/Okta groups
- Automatic membership management
- Permission inheritance through nested teams

### 3. Security at GitHub Level

**Layered Security Model**:

| Layer | Controls |
|-------|----------|
| **Enterprise** | Base permissions (None), PAT policies, App restrictions, SAML/SCIM |
| **Organization** | Team structure, outside collaborators, OAuth app policies |
| **Repository** | Rulesets, CODEOWNERS, secret scanning, code scanning |
| **Branch** | Protected branches, required reviews, status checks |

**Security by Default Checklist**:

- [ ] Base repository permissions: None
- [ ] Public repository creation: Disabled
- [ ] Outside collaborators: Restricted to Org Owners
- [ ] Fine-grained PATs: Required with approval
- [ ] Classic PATs: Blocked or restricted
- [ ] GitHub Apps: Pre-approval required
- [ ] Secret scanning: Enabled with push protection
- [ ] Code scanning: Enabled for all repositories
- [ ] Branch protection: Enforced via enterprise rulesets
- [ ] Audit log streaming: Configured to SIEM

---

## Summary: Feature Comparison

| Azure DevOps Pain Point | GitHub Solution | Key Benefit |
|------------------------|-----------------|-------------|
| Open security access to all repos | Base permissions: None + explicit team grants | Least privilege by default |
| No branch policies enforced | Enterprise-level repository rulesets | Centrally enforced, cannot be overridden |
| Project Admin too permissive | Granular role hierarchy + custom roles | Separation of duties |
| Team creation bypasses security | Team creation restricted to Org Owners | No self-escalation possible |
| No external collaborator concept | Native outside collaborator support | Clear visibility and control |
| Manual external collaborator management | SCIM provisioning via IdP | Automated lifecycle management |
| Manual non-human identity management | GitHub Apps with approval workflow | Governed, auditable integrations |
| WebJobs overwrite permissions | GITHUB_TOKEN with minimal permissions | Scoped, short-lived tokens |
| Third-party app secret management | GitHub App installation tokens (1hr expiry) | No persistent secrets to manage |
| ADO YAML pipelines not portable | GitHub Actions with OIDC federation | Modern CI/CD with improved security |
| Service connections hard to manage | OIDC workload identity federation | No long-lived secrets for cloud auth |
| Azure Artifacts feed management | GitHub Packages + Dependabot | Integrated vulnerability scanning |
| Complex ADO permission namespaces | Simplified GitHub permission model | Easier auditing and administration |
| ADO audit logs siloed | Unified audit log streaming to SIEM | Centralized compliance monitoring |

---

## Next Steps

1. **Pilot Migration**: Select 3-5 low-risk repositories for pilot migration
2. **Pipeline Assessment**: Inventory ADO pipelines and classify by migration complexity
3. **Permission Mapping**: Create detailed ADO→GitHub permission equivalency matrix
4. **Secrets Inventory**: Document all service connections and plan credential rotation
5. **Team Structure Design**: Map ADO teams to GitHub team hierarchy
6. **Integration Inventory**: Catalog ADO integrations and map to GitHub Apps
7. **Training Plan**: Schedule GitHub training before each migration wave
8. **Communication Plan**: Prepare developer notifications for each migration wave

---

## References

### GitHub Documentation
- [GitHub Enterprise Importer](https://docs.github.com/en/enterprise-cloud@latest/migrations/using-github-enterprise-importer)
- [Migrating from Azure DevOps with GEI](https://docs.github.com/en/enterprise-cloud@latest/migrations/using-github-enterprise-importer/migrating-from-azure-devops-to-github-enterprise-cloud)
- [Enterprise Managed Users](https://docs.github.com/en/enterprise-cloud@latest/admin/identity-and-access-management/using-enterprise-managed-users-for-iam/about-enterprise-managed-users)
- [Repository Rulesets](https://docs.github.com/en/enterprise-cloud@latest/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)
- [GitHub Apps](https://docs.github.com/en/enterprise-cloud@latest/apps/creating-github-apps/about-creating-github-apps/about-creating-github-apps)
- [Fine-Grained PATs](https://docs.github.com/en/enterprise-cloud@latest/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)
- [GitHub Actions](https://docs.github.com/en/enterprise-cloud@latest/actions)
- [GitHub Packages](https://docs.github.com/en/enterprise-cloud@latest/packages)
- [OIDC for GitHub Actions](https://docs.github.com/en/enterprise-cloud@latest/actions/security-for-github-actions/security-hardening-your-deployments/about-security-hardening-with-openid-connect)

### Migration Tools
- [GitHub Enterprise Importer CLI](https://github.com/github/gh-gei)
- [Azure DevOps to GitHub Actions Migrator](https://github.com/github/gh-actions-importer)

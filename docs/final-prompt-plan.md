# Final Prompt Plan: GitHub Enterprise Administration & Governance (L400)

> **Level:** L400 Advanced Workshop  
> **Scope:** GitHub Enterprise Cloud (GHEC) Administration & Governance  
> **Output:** Comprehensive markdown documentation with Mermaid diagrams

---

## Objective

Create expert-level (L400) documentation for GitHub Enterprise Cloud administration and governance, covering enterprise hierarchy, organization strategies, IAM, policy inheritance, teams, and best practices aligned with the GitHub Well-Architected Framework.

---

## Documentation Structure

All files to be created in the `docs/` folder:

```
docs/
├── final-prompt-plan.md          # This plan (for reference)
├── 01-enterprise-hierarchy.md    # Enterprise structure & hierarchy
├── 02-organization-strategies.md # Org patterns (single/red-green/sandbox/archive)
├── 03-identity-access-management.md # IAM, SAML SSO, SCIM overview
├── 04-enterprise-managed-users.md   # EMU deep dive, advantages, best practices
├── 05-teams-permissions.md       # Team structures & permission models
├── 06-policy-inheritance.md      # Policy enforcement & inheritance flows
├── 07-repository-governance.md   # Repo settings, rulesets, security
├── 08-security-compliance.md     # Security features & compliance
├── 09-best-practices-waf.md      # GitHub WAF principles & recommendations
└── 10-reference-architecture.md  # Mermaid diagrams & architecture patterns
```

---

## Detailed File Specifications

### 1. `01-enterprise-hierarchy.md`
**Purpose:** Explain the GHEC enterprise hierarchy and structural components

**Content:**
- Enterprise account overview and capabilities
- Hierarchy levels: Enterprise → Organizations → Repositories
- Enterprise roles (Enterprise Owner, Billing Manager, Member)
- Enterprise settings and dashboard navigation
- Multi-organization management patterns
- Enterprise audit log and compliance features

**Mermaid Diagrams:**
- Enterprise hierarchy tree diagram
- Enterprise admin responsibilities flow

**Sources:**
- https://docs.github.com/en/enterprise-cloud@latest/admin
- https://docs.github.com/en/enterprise-cloud@latest/enterprise-onboarding
- https://resources.github.com/learn/pathways/administration-governance/essentials/administration-governance-github-enterprise-cloud/

---

### 2. `02-organization-strategies.md`
**Purpose:** Deep dive into organization design patterns and strategies

**Content:**
- Single organization pattern
  - When to use, pros/cons, scaling considerations
- Multi-organization patterns:
  - **Red/Green (Blue/Green):** Production/development separation
  - **Sandbox:** Innovation and experimentation environments
  - **Archive:** Decommissioned/historical code management
  - **Business Unit separation:** Department/team isolation
  - **Compliance separation:** Regulatory boundary management
- Organization naming conventions
- Migration strategies between patterns
- Decision matrix for choosing organization strategy

**Mermaid Diagrams:**
- Single org vs multi-org comparison
- Red-Green-Sandbox-Archive architecture pattern
- Organization lifecycle flow

**Sources:**
- https://github.blog/enterprise-software/devops/best-practices-for-organizations-and-teams-using-github-enterprise-cloud/
- https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-organization-settings
- https://wellarchitected.github.com/library/overview/

---

### 3. `03-identity-access-management.md`
**Purpose:** IAM foundations, authentication methods, and enterprise type selection

**Content:**
- Choosing an enterprise type:
  - Enterprise with personal accounts
  - Enterprise with managed users (EMU)
  - Decision criteria and comparison matrix
- Authentication methods overview
- SAML Single Sign-On (SSO) configuration
  - IdP setup (Microsoft Entra ID, Okta, PingFederate, etc.)
  - SAML attribute mapping
  - SSO enforcement and recovery
- SCIM provisioning fundamentals
  - Automated user lifecycle management
  - Group synchronization
  - Deprovisioning workflows
- Personal Access Tokens (PAT) policies
- SSH key and GPG key management
- Two-factor authentication (2FA) enforcement
- Cross-reference to [Enterprise Managed Users deep dive](04-enterprise-managed-users.md)

**Mermaid Diagrams:**
- Enterprise type decision flowchart
- IAM authentication flow
- SCIM provisioning lifecycle

**Sources:**
- https://docs.github.com/en/enterprise-cloud@latest/admin/concepts/identity-and-access-management/enterprise-managed-users
- https://docs.github.com/en/enterprise-cloud@latest/enterprise-onboarding/getting-started-with-your-enterprise/choose-an-enterprise-type
- https://docs.github.com/en/enterprise-cloud@latest/admin/identity-and-access-management/using-enterprise-managed-users-and-saml-for-iam/configuring-scim-provisioning-for-enterprise-managed-users

---

### 4. `04-enterprise-managed-users.md`
**Purpose:** Comprehensive deep dive into Enterprise Managed Users (EMU) - advantages, configuration, and best practices

**Content:**
- **EMU Overview and Value Proposition**
  - What are Enterprise Managed Users?
  - EMU architecture and how it differs from personal accounts
  - Complete identity lifecycle management from IdP
  - Account naming conventions (_shortcode suffix)

- **Key Advantages of EMU**
  - **Centralized Identity Control:** Users provisioned/deprovisioned exclusively via IdP
  - **Enhanced Security Posture:** No personal accounts mixing with enterprise data
  - **Simplified Offboarding:** Automatic access revocation when removed from IdP
  - **Compliance Benefits:** Full audit trail, no shadow IT accounts
  - **Namespace Isolation:** Clear separation between work and personal GitHub
  - **Policy Enforcement:** Guaranteed enforcement of enterprise policies
  - **IP Allow Lists:** Restrict access to corporate networks
  - **Reduced Attack Surface:** No PAT/SSH key sprawl from personal accounts

- **EMU vs Personal Accounts Comparison**
  - Feature comparison table
  - Use case scenarios for each
  - Migration considerations
  - Hybrid scenarios (when applicable)

- **EMU Limitations and Considerations**
  - Cannot contribute to public repositories outside the enterprise
  - Cannot fork repositories to personal namespaces
  - Cannot create public gists
  - Limited GitHub Marketplace app access
  - No GitHub Sponsors participation
  - Username format restrictions (_shortcode)
  - Cannot be invited to organizations outside the enterprise

- **Supported Identity Providers**
  - Microsoft Entra ID (Azure AD) - full support
  - Okta - full support
  - PingFederate - full support
  - Partner IdP integrations
  - OIDC vs SAML considerations

- **EMU Configuration Best Practices**
  - IdP group mapping strategies
  - Team synchronization setup
  - Role-based access control patterns
  - Naming conventions and organization
  - Handling contractors and external collaborators
  - Guest access patterns

- **EMU Migration Strategies**
  - From personal accounts enterprise to EMU
  - Repository migration approaches
  - User communication and change management
  - Parallel operation during transition
  - Rollback considerations

- **EMU Operational Excellence**
  - Monitoring and alerting
  - Troubleshooting common issues
  - IdP sync failures and recovery
  - Audit log analysis for EMU events

**Mermaid Diagrams:**
- EMU architecture overview (IdP → SCIM → GitHub Enterprise)
- EMU vs Personal accounts feature comparison
- EMU user lifecycle flow (provision → active → deprovision)
- EMU decision tree (should you use EMU?)
- IdP group to GitHub team synchronization flow

**Sources:**
- https://docs.github.com/en/enterprise-cloud@latest/admin/concepts/identity-and-access-management/enterprise-managed-users
- https://docs.github.com/en/enterprise-cloud@latest/enterprise-onboarding/getting-started-with-your-enterprise/choose-an-enterprise-type
- https://docs.github.com/en/enterprise-cloud@latest/admin/identity-and-access-management/using-enterprise-managed-users-for-iam/about-enterprise-managed-users
- https://docs.github.com/en/enterprise-cloud@latest/admin/identity-and-access-management/using-enterprise-managed-users-and-saml-for-iam/configuring-scim-provisioning-for-enterprise-managed-users
- https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/understanding-iam-for-enterprises/abilities-and-restrictions-of-managed-user-accounts

---

### 5. `05-teams-permissions.md`
**Purpose:** Team structures, nested teams, and permission models

**Content:**
- Team types and visibility (visible, secret)
- Nested teams and hierarchy
  - Parent/child team inheritance
  - Permission cascading
- Team synchronization with IdP groups
- Permission levels:
  - Repository: Read, Triage, Write, Maintain, Admin
  - Organization: Member, Moderator, Billing Manager, Owner
  - Enterprise: Member, Billing Manager, Owner
- Custom repository roles
- Base permissions configuration
- CODEOWNERS and automatic review assignment
- Team maintainers vs organization owners

**Mermaid Diagrams:**
- Team hierarchy and inheritance
- Permission levels matrix
- Team sync with IdP flow

**Sources:**
- https://docs.github.com/en/enterprise-cloud@latest/organizations/organizing-members-into-teams
- https://docs.github.com/en/organizations/managing-peoples-access-to-your-organization-with-roles/roles-in-an-organization

---

### 6. `06-policy-inheritance.md`
**Purpose:** Policy enforcement and inheritance across the enterprise hierarchy

**Content:**
- Policy enforcement levels:
  - Enterprise-level policies (enforced, allowed, disabled)
  - Organization-level policies
  - Repository-level settings
- Inheritance and override rules
- Key policy areas:
  - Repository creation and visibility
  - Repository forking policies
  - GitHub Actions permissions
  - GitHub Copilot policies
  - GitHub Pages policies
  - Project visibility
  - Member privileges
- Policy conflicts and resolution
- Audit and compliance monitoring of policy changes

**Mermaid Diagrams:**
- Policy inheritance flow (Enterprise → Org → Repo)
- Policy enforcement decision tree
- Actions policy inheritance example

**Sources:**
- https://docs.github.com/en/enterprise-cloud@latest/admin/enforcing-policies
- https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-organization-settings

---

### 7. `07-repository-governance.md`
**Purpose:** Repository settings, rulesets, and governance at scale

**Content:**
- Repository visibility (public, private, internal)
- Repository templates and standardization
- Branch protection rules vs Repository rulesets
  - Rulesets advantages (org-wide, bypass actors, import/export)
  - Ruleset targeting (branches, tags)
  - Required status checks
  - Required reviews and CODEOWNERS
  - Signed commits requirement
- Tag protection rules
- Push rulesets and file path restrictions
- Merge strategies and settings
- Repository archival and transfer policies
- Innersource patterns with internal repositories

**Mermaid Diagrams:**
- Branch protection vs Rulesets comparison
- Repository lifecycle (create → active → archive)
- Merge queue flow

**Sources:**
- https://docs.github.com/en/enterprise-cloud@latest/repositories/managing-your-repositorys-settings-and-features
- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/defining-the-mergeability-of-pull-requests/managing-a-branch-protection-rule

---

### 8. `08-security-compliance.md`
**Purpose:** Security features, code security, and compliance capabilities

**Content:**
- GitHub Advanced Security (GHAS) overview
- Code scanning with CodeQL
  - Default setup vs advanced configuration
  - Custom queries and severity levels
- Secret scanning
  - Supported patterns
  - Push protection
  - Custom patterns
- Dependency management
  - Dependabot alerts and updates
  - Dependency review
  - Dependency graph
- Security policies (SECURITY.md)
- Private vulnerability reporting
- Security advisories
- Audit log and SIEM integration
  - Audit log streaming
  - API access for compliance
- Compliance certifications (SOC2, FedRAMP, etc.)

**Mermaid Diagrams:**
- Security scanning pipeline flow
- Secret scanning with push protection
- Compliance audit flow

**Sources:**
- https://docs.github.com/en/actions/security-guides
- https://docs.github.com/en/enterprise-cloud@latest/admin

---

### 9. `09-best-practices-waf.md`
**Purpose:** GitHub Well-Architected Framework principles and recommendations

**Content:**
- GitHub WAF pillars overview:
  - Reliability
  - Security
  - Operational Excellence
  - Performance Efficiency
  - Cost Optimization
- Enterprise setup checklist
- Organization design recommendations
- Repository naming and structure conventions
- Branching strategy recommendations
- CI/CD governance best practices
- Change management processes
- Disaster recovery and backup strategies
- Scaling patterns for large enterprises
- Common anti-patterns to avoid

**Mermaid Diagrams:**
- WAF pillars relationship
- Enterprise maturity model
- Recommended CI/CD governance flow

**Sources:**
- https://wellarchitected.github.com/library/overview/
- https://github.blog/enterprise-software/devops/best-practices-for-organizations-and-teams-using-github-enterprise-cloud/
- https://assets.ctfassets.net/wfutmusr1t3h/ooXuGRtFrKHrFZ8cIdbUC/4333e8014b2e950d9381bdb102415e3a/GitHub-Enterprise-Cloud_ebook.pdf

---

### 10. `10-reference-architecture.md`
**Purpose:** Consolidated architecture diagrams and reference patterns

**Content:**
- Complete enterprise architecture diagram
- Organization topology patterns
- IAM integration architecture
- Security scanning architecture
- CI/CD pipeline governance architecture
- Hybrid/multi-cloud integration patterns
- Migration architecture (from other platforms)
- Quick reference cards for:
  - Permission levels
  - Policy inheritance
  - Team structures
  - Security features

**Mermaid Diagrams:**
- Complete GHEC reference architecture
- Enterprise topology with all components
- Integration architecture (IdP, SIEM, CI/CD)

**Sources:**
- All above sources consolidated

---

## Implementation Instructions

### For the Agentic Implementation:

1. **Fetch all source URLs** listed in the initial-prompt.md and extract relevant content for each section

2. **Create files sequentially** (01 through 09) ensuring each file:
   - Has proper H1 title and introduction
   - Uses H2/H3 for logical sections
   - Includes relevant Mermaid diagrams (```mermaid blocks)
   - Has a References section at the end with source URLs
   - Cross-links to related documentation files where appropriate

3. **Mermaid diagram requirements:**
   - Use `graph TD` or `graph LR` for hierarchies and flows
   - Use `sequenceDiagram` for authentication/process flows
   - Use `flowchart` for decision trees
   - Include descriptive node labels

4. **Quality criteria:**
   - L400 depth: Expert-level content with technical details
   - Actionable: Include specific configuration steps where applicable
   - Complete: Cover all aspects mentioned in each file specification
   - Current: Use latest GHEC features (rulesets, push protection, etc.)

5. **Cross-linking rules:**
   - Link between docs/ files using relative paths: `[Teams and Permissions](04-teams-permissions.md)`
   - Reference existing labs only where they provide hands-on practice for concepts
   - Don't duplicate lab content in documentation

6. **Do NOT stop until:**
   - All 10 documentation files are created
   - Each file has at least 2 Mermaid diagrams
   - All References sections are populated
   - README.md is updated with links to new documentation

---

## README.md Update Required

**IMPORTANT:** Add the new section at the **BEGINNING** of README.md, before existing content. The existing hands-on labs content should come AFTER this new documentation section.

```markdown
# GitHub Administration & Governance Workshop (L400)

> **Advanced Workshop** | Expert-level training for GitHub Enterprise Cloud administration, governance, and best practices. This workshop covers enterprise hierarchy, organization strategies, identity management (including Enterprise Managed Users), policy enforcement, security compliance, and the GitHub Well-Architected Framework.

## Workshop Documentation

### Enterprise Administration
- [Enterprise Hierarchy](docs/01-enterprise-hierarchy.md) - GHEC structure, roles, and multi-org management
- [Organization Strategies](docs/02-organization-strategies.md) - Single/multi-org patterns, red-green-sandbox-archive

### Identity & Access Management
- [Identity & Access Management](docs/03-identity-access-management.md) - SAML SSO, SCIM, enterprise type selection
- [Enterprise Managed Users (EMU)](docs/04-enterprise-managed-users.md) - EMU deep dive, advantages, best practices ⭐

### Teams & Permissions
- [Teams and Permissions](docs/05-teams-permissions.md) - Team structures, nested teams, permission models
- [Policy Inheritance](docs/06-policy-inheritance.md) - Enterprise → Org → Repo policy enforcement

### Repository Governance
- [Repository Governance](docs/07-repository-governance.md) - Rulesets, branch protection, templates
- [Security & Compliance](docs/08-security-compliance.md) - GHAS, code scanning, audit logs

### Best Practices & Architecture
- [Best Practices & WAF](docs/09-best-practices-waf.md) - GitHub Well-Architected Framework principles
- [Reference Architecture](docs/10-reference-architecture.md) - Architecture diagrams and patterns

---

## Hands-on Labs

<!-- EXISTING README CONTENT GOES HERE -->
```

The existing README.md content (starting from "# gh-abcs-admin") should be restructured to fit under the "Hands-on Labs" section or renamed appropriately to complement the new L400 documentation.

---

## Execution Checklist

- [ ] Create `docs/01-enterprise-hierarchy.md`
- [ ] Create `docs/02-organization-strategies.md`
- [ ] Create `docs/03-identity-access-management.md`
- [ ] Create `docs/04-enterprise-managed-users.md`
- [ ] Create `docs/05-teams-permissions.md`
- [ ] Create `docs/06-policy-inheritance.md`
- [ ] Create `docs/07-repository-governance.md`
- [ ] Create `docs/08-security-compliance.md`
- [ ] Create `docs/09-best-practices-waf.md`
- [ ] Create `docs/10-reference-architecture.md`
- [ ] Update `README.md` with documentation links
- [ ] Verify all cross-links work
- [ ] Ensure all Mermaid diagrams render correctly

---

## References

Primary sources for this documentation:

### Enterprise & Administration
- https://resources.github.com/learn/pathways/administration-governance/essentials/administration-governance-github-enterprise-cloud/
- https://docs.github.com/en/enterprise-cloud@latest/enterprise-onboarding
- https://docs.github.com/en/enterprise-cloud@latest/admin
- https://docs.github.com/en/enterprise-cloud@latest/enterprise-onboarding/getting-started-with-your-enterprise/choose-an-enterprise-type

### Enterprise Managed Users (EMU)
- https://docs.github.com/en/enterprise-cloud@latest/admin/concepts/identity-and-access-management/enterprise-managed-users
- https://docs.github.com/en/enterprise-cloud@latest/admin/identity-and-access-management/using-enterprise-managed-users-for-iam/about-enterprise-managed-users
- https://docs.github.com/en/enterprise-cloud@latest/admin/identity-and-access-management/using-enterprise-managed-users-and-saml-for-iam/configuring-scim-provisioning-for-enterprise-managed-users
- https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/understanding-iam-for-enterprises/abilities-and-restrictions-of-managed-user-accounts

### Organizations & Teams
- https://docs.github.com/en/enterprise-cloud@latest/organizations
- https://docs.github.com/en/enterprise-cloud@latest/organizations/organizing-members-into-teams
- https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-organization-settings

### Repositories & Policies
- https://docs.github.com/en/enterprise-cloud@latest/repositories
- https://docs.github.com/en/enterprise-cloud@latest/repositories/managing-your-repositorys-settings-and-features
- https://docs.github.com/en/enterprise-cloud@latest/admin/enforcing-policies

### Best Practices & Architecture
- https://docs.github.com/en/enterprise-cloud@latest/admin/concepts/enterprise-best-practices/organize-work
- https://github.blog/enterprise-software/devops/best-practices-for-organizations-and-teams-using-github-enterprise-cloud/
- https://wellarchitected.github.com/library/overview/
- https://assets.ctfassets.net/wfutmusr1t3h/ooXuGRtFrKHrFZ8cIdbUC/4333e8014b2e950d9381bdb102415e3a/GitHub-Enterprise-Cloud_ebook.pdf

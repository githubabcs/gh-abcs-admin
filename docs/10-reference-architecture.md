# Reference Architecture

> **Consolidated architecture diagrams, reference patterns, and quick reference guides for GitHub Enterprise Cloud administration and governance.**

---

## Table of Contents

- [Complete Enterprise Architecture](#complete-enterprise-architecture)
- [Organization Topology Patterns](#organization-topology-patterns)
- [IAM Integration Architecture](#iam-integration-architecture)
- [Security Scanning Architecture](#security-scanning-architecture)
- [CI/CD Pipeline Governance Architecture](#cicd-pipeline-governance-architecture)
- [Hybrid and Multi-Cloud Integration](#hybrid-and-multi-cloud-integration)
- [Migration Architecture](#migration-architecture)
- [Quick Reference Cards](#quick-reference-cards)

---

## Complete Enterprise Architecture

The complete GitHub Enterprise Cloud architecture shows all major components and their relationships.

```mermaid
graph TB
    subgraph "Identity Provider"
        IdP[Identity Provider<br/>Entra ID / Okta]
        IdPGroups[IdP Groups]
    end
    
    subgraph "GitHub Enterprise Cloud"
        Enterprise[Enterprise Account]
        
        subgraph "Organizations"
            OrgProd[Production Org]
            OrgDev[Development Org]
            OrgSandbox[Sandbox Org]
        end
        
        subgraph "IAM Layer"
            SAML[SAML SSO]
            SCIM[SCIM Provisioning]
            EMU[Enterprise Managed Users]
        end
        
        subgraph "Security Layer"
            GHAS[GitHub Advanced Security]
            CodeQL[Code Scanning]
            SecretScan[Secret Scanning]
            Dependabot[Dependabot]
        end
        
        subgraph "Governance Layer"
            Policies[Enterprise Policies]
            Rulesets[Repository Rulesets]
            Audit[Audit Logs]
        end
    end
    
    subgraph "External Integrations"
        SIEM[SIEM System]
        Backup[Backup Solution]
        CICD[CI/CD Platform]
    end
    
    IdP -->|SAML Auth| SAML
    IdP -->|SCIM Sync| SCIM
    SCIM -->|Provision| EMU
    IdPGroups -->|Team Sync| OrgProd
    IdPGroups -->|Team Sync| OrgDev
    
    Enterprise --> Policies
    Policies --> OrgProd
    Policies --> OrgDev
    Policies --> OrgSandbox
    
    OrgProd --> GHAS
    OrgDev --> GHAS
    GHAS --> CodeQL
    GHAS --> SecretScan
    GHAS --> Dependabot
    
    Policies --> Rulesets
    Rulesets --> OrgProd
    Rulesets --> OrgDev
    
    Audit -->|Stream| SIEM
    OrgProd -->|Backup| Backup
    OrgProd -->|Workflows| CICD
    
    style Enterprise fill:#0366d6,color:#fff
    style GHAS fill:#28a745,color:#fff
    style Policies fill:#6f42c1,color:#fff
```

### Architecture Components

1. **Identity Provider Layer**: Centralized authentication and user provisioning
2. **IAM Layer**: SAML SSO, SCIM provisioning, and Enterprise Managed Users
3. **Organization Layer**: Multi-org topology for environment separation
4. **Security Layer**: GitHub Advanced Security features
5. **Governance Layer**: Enterprise policies, rulesets, and audit logging
6. **Integration Layer**: External systems (SIEM, backup, CI/CD)

---

## Organization Topology Patterns

### Pattern 1: Single Organization

```mermaid
graph TB
    Enterprise[Enterprise Account]
    
    subgraph "Single Organization"
        Org[acme-corp]
        
        subgraph "Teams by Function"
            Platform[Platform Team]
            Frontend[Frontend Team]
            Backend[Backend Team]
            Security[Security Team]
        end
        
        subgraph "Repositories"
            ProdRepos[Production Repos]
            DevRepos[Development Repos]
            InfraRepos[Infrastructure Repos]
        end
    end
    
    Enterprise --> Org
    Org --> Platform
    Org --> Frontend
    Org --> Backend
    Org --> Security
    
    Platform --> InfraRepos
    Frontend --> ProdRepos
    Backend --> ProdRepos
    Security --> ProdRepos
    
    style Enterprise fill:#0366d6,color:#fff
    style Org fill:#28a745,color:#fff
```

**Best For:**
- Small to medium enterprises (< 500 developers)
- Single business unit
- Unified governance model
- Simple compliance requirements

### Pattern 2: Multi-Organization (Red-Green-Sandbox-Archive)

```mermaid
graph TB
    Enterprise[Enterprise Account]
    
    subgraph "Production Environment"
        Red[acme-prod-red]
        Green[acme-prod-green]
    end
    
    subgraph "Non-Production"
        Dev[acme-dev]
        Sandbox[acme-sandbox]
    end
    
    subgraph "Historical"
        Archive[acme-archive]
    end
    
    Enterprise --> Red
    Enterprise --> Green
    Enterprise --> Dev
    Enterprise --> Sandbox
    Enterprise --> Archive
    
    Red -.->|Blue-Green Deploy| Green
    Dev -->|Promote| Red
    Sandbox -.->|Experiment| Dev
    Red -.->|Retire| Archive
    
    style Enterprise fill:#0366d6,color:#fff
    style Red fill:#dc3545,color:#fff
    style Green fill:#28a745,color:#fff
    style Dev fill:#ffc107,color:#000
    style Sandbox fill:#17a2b8,color:#fff
    style Archive fill:#6c757d,color:#fff
```

**Best For:**
- Large enterprises (500+ developers)
- Blue-green deployment patterns
- Multiple environments with strict separation
- Complex compliance requirements
- Innovation and experimentation needs

### Pattern 3: Business Unit Separation

```mermaid
graph TB
    Enterprise[Enterprise Account]
    
    subgraph "Business Units"
        BU1[acme-retail]
        BU2[acme-wholesale]
        BU3[acme-logistics]
    end
    
    subgraph "Shared Services"
        Platform[acme-platform]
        Security[acme-security]
    end
    
    Enterprise --> BU1
    Enterprise --> BU2
    Enterprise --> BU3
    Enterprise --> Platform
    Enterprise --> Security
    
    Platform -.->|Shared Libraries| BU1
    Platform -.->|Shared Libraries| BU2
    Platform -.->|Shared Libraries| BU3
    
    Security -.->|Security Scanning| BU1
    Security -.->|Security Scanning| BU2
    Security -.->|Security Scanning| BU3
    
    style Enterprise fill:#0366d6,color:#fff
    style BU1 fill:#28a745,color:#fff
    style BU2 fill:#28a745,color:#fff
    style BU3 fill:#28a745,color:#fff
    style Platform fill:#6f42c1,color:#fff
    style Security fill:#dc3545,color:#fff
```

**Best For:**
- Multi-division enterprises
- Independent P&L units
- Different compliance requirements per unit
- Decentralized governance

---

## IAM Integration Architecture

### Enterprise Managed Users (EMU) with Microsoft Entra ID

```mermaid
sequenceDiagram
    participant User
    participant EntraID as Microsoft Entra ID
    participant SCIM as SCIM Endpoint
    participant GitHub as GitHub Enterprise
    participant Repo as Repository
    
    Note over EntraID,GitHub: Initial Provisioning
    EntraID->>SCIM: Create User (SCIM 2.0)
    SCIM->>GitHub: Provision username_shortcode
    GitHub-->>SCIM: User Created
    SCIM-->>EntraID: Confirmation
    
    Note over EntraID,GitHub: Group Synchronization
    EntraID->>SCIM: Sync Group Membership
    SCIM->>GitHub: Update Team Membership
    GitHub-->>SCIM: Team Updated
    
    Note over User,Repo: Authentication Flow
    User->>EntraID: Login Request
    EntraID->>User: MFA Challenge
    User->>EntraID: MFA Token
    EntraID->>GitHub: SAML Assertion
    GitHub->>User: Session Token
    User->>Repo: Access Repository
    Repo->>GitHub: Verify Permissions
    GitHub-->>Repo: Access Granted
    Repo-->>User: Repository Content
    
    Note over EntraID,GitHub: Deprovisioning
    EntraID->>SCIM: Delete User
    SCIM->>GitHub: Suspend Account
    GitHub-->>SCIM: Account Suspended
```

### Personal Accounts with SAML SSO

```mermaid
graph LR
    subgraph "Identity Provider"
        IdP[Okta / Entra ID]
    end
    
    subgraph "GitHub Enterprise"
        Enterprise[Enterprise Account]
        Org1[Organization 1]
        Org2[Organization 2]
    end
    
    subgraph "Users"
        PersonalAcct[Personal GitHub Account]
    end
    
    IdP -->|SAML SSO| Enterprise
    Enterprise --> Org1
    Enterprise --> Org2
    PersonalAcct -->|SSO Required| Org1
    PersonalAcct -->|SSO Required| Org2
    IdP -.->|Authenticate| PersonalAcct
    
    style IdP fill:#0366d6,color:#fff
    style Enterprise fill:#28a745,color:#fff
    style PersonalAcct fill:#ffc107,color:#000
```

**Key Differences:**

| Feature | EMU | Personal Accounts with SSO |
|---------|-----|---------------------------|
| Identity Source | IdP only | GitHub + IdP |
| Username Format | user_shortcode | user (personal) |
| Account Creation | IdP provisioning | Self-service |
| Deprovisioning | Automatic via SCIM | Manual removal |
| External Collaboration | Limited | Full access |
| Public Repos | Enterprise only | Personal + Enterprise |

---

## Security Scanning Architecture

### GitHub Advanced Security Pipeline

```mermaid
graph TB
    subgraph "Developer Workflow"
        Dev[Developer]
        LocalCode[Local Code]
        Commit[Git Commit]
    end
    
    subgraph "GitHub Repository"
        PR[Pull Request]
        MainBranch[Main Branch]
    end
    
    subgraph "Security Scanning"
        SecretScan[Secret Scanning<br/>Push Protection]
        CodeQL[CodeQL Analysis]
        DependencyReview[Dependency Review]
        Dependabot[Dependabot Alerts]
    end
    
    subgraph "Security Dashboard"
        Alerts[Security Alerts]
        Dashboard[Security Overview]
        Reports[Compliance Reports]
    end
    
    Dev --> LocalCode
    LocalCode --> Commit
    Commit -->|Push| SecretScan
    SecretScan -->|Block if Secret Found| Commit
    SecretScan -->|Pass| PR
    
    PR --> CodeQL
    PR --> DependencyReview
    
    CodeQL -->|Vulnerabilities| Alerts
    DependencyReview -->|CVEs| Alerts
    Dependabot -->|Updates| PR
    
    MainBranch --> Dependabot
    MainBranch --> CodeQL
    
    Alerts --> Dashboard
    Dashboard --> Reports
    
    style SecretScan fill:#dc3545,color:#fff
    style CodeQL fill:#28a745,color:#fff
    style DependencyReview fill:#ffc107,color:#000
    style Alerts fill:#dc3545,color:#fff
```

### Secret Scanning with Push Protection

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant Git as Git Client
    participant GitHub as GitHub
    participant SecretScan as Secret Scanner
    participant Security as Security Team
    
    Dev->>Git: git push
    Git->>GitHub: Push commits
    GitHub->>SecretScan: Scan commits
    
    alt Secret Detected
        SecretScan-->>GitHub: Secret Found
        GitHub-->>Git: Push Blocked
        Git-->>Dev: Error: Secret detected
        Dev->>GitHub: Request bypass (with justification)
        GitHub->>Security: Bypass request notification
        Security->>GitHub: Approve/Deny
        
        alt Approved
            GitHub-->>Dev: Bypass granted
            Dev->>Git: git push (with bypass token)
            Git->>GitHub: Push with bypass
            GitHub->>SecretScan: Log bypass event
        else Denied
            Security-->>Dev: Bypass denied
            Dev->>Dev: Remove secret and retry
        end
    else No Secret
        SecretScan-->>GitHub: Clean
        GitHub-->>Git: Push accepted
        Git-->>Dev: Success
    end
```

---

## CI/CD Pipeline Governance Architecture

### GitHub Actions with Policy Enforcement

```mermaid
graph TB
    subgraph "Enterprise Policies"
        EnterprisePolicy[Enterprise Policy<br/>Allowed Actions List]
    end
    
    subgraph "Organization Configuration"
        OrgPolicy[Organization Settings<br/>Actions Permissions]
        RunnerGroup[Self-Hosted Runner Groups]
        Secrets[Organization Secrets]
    end
    
    subgraph "Repository"
        Workflow[Workflow YAML]
        RepoSecrets[Repository Secrets]
        Environments[Environments]
    end
    
    subgraph "Execution"
        Runner[GitHub Runner]
        Job1[Build Job]
        Job2[Test Job]
        Job3[Deploy Job]
    end
    
    subgraph "Security Controls"
        OIDC[OIDC Token]
        Audit[Audit Logs]
        ReviewGate[Required Reviewers]
    end
    
    EnterprisePolicy --> OrgPolicy
    OrgPolicy --> Workflow
    
    Workflow --> Job1
    Workflow --> Job2
    Workflow --> Job3
    
    Job1 --> Runner
    Job2 --> Runner
    Job3 --> Runner
    
    RunnerGroup --> Runner
    Secrets --> Job1
    RepoSecrets --> Job2
    Environments --> Job3
    
    Job3 --> OIDC
    Job3 --> ReviewGate
    
    Runner --> Audit
    
    style EnterprisePolicy fill:#6f42c1,color:#fff
    style OrgPolicy fill:#0366d6,color:#fff
    style ReviewGate fill:#dc3545,color:#fff
    style OIDC fill:#28a745,color:#fff
```

### Deployment Pipeline with Environments

```mermaid
graph LR
    subgraph "Source"
        Code[Code Repository]
    end
    
    subgraph "Build & Test"
        Build[Build]
        Test[Unit Tests]
        Scan[Security Scan]
    end
    
    subgraph "Environments"
        Dev[Development<br/>Auto Deploy]
        Staging[Staging<br/>Required Reviewers]
        Prod[Production<br/>Required Reviewers<br/>Wait Timer]
    end
    
    Code --> Build
    Build --> Test
    Test --> Scan
    
    Scan --> Dev
    Dev --> Staging
    Staging --> Prod
    
    style Dev fill:#17a2b8,color:#fff
    style Staging fill:#ffc107,color:#000
    style Prod fill:#dc3545,color:#fff
```

---

## Hybrid and Multi-Cloud Integration

### GitHub Enterprise with On-Premises Systems

```mermaid
graph TB
    subgraph "GitHub Enterprise Cloud"
        GHEC[GitHub Enterprise Cloud]
        Repos[Repositories]
        Actions[GitHub Actions]
    end
    
    subgraph "Corporate Network"
        subgraph "Identity"
            OnPremIdP[On-Premises IdP]
            ADConnect[AD Connect]
        end
        
        subgraph "CI/CD"
            SelfHosted[Self-Hosted Runners]
            Artifacts[Artifact Storage]
        end
        
        subgraph "Security"
            Firewall[Firewall]
            VPN[VPN Gateway]
            SIEM[SIEM System]
        end
    end
    
    subgraph "Cloud Providers"
        Azure[Azure]
        AWS[AWS]
        GCP[Google Cloud]
    end
    
    OnPremIdP -->|SAML| GHEC
    ADConnect -->|Sync| OnPremIdP
    
    GHEC -->|Webhook| SelfHosted
    SelfHosted -->|Store| Artifacts
    
    Actions -->|OIDC| Azure
    Actions -->|OIDC| AWS
    Actions -->|OIDC| GCP
    
    GHEC -->|Audit Stream| SIEM
    Firewall -->|IP Allow List| GHEC
    VPN -.->|Secure Access| SelfHosted
    
    style GHEC fill:#0366d6,color:#fff
    style OnPremIdP fill:#6f42c1,color:#fff
    style SelfHosted fill:#28a745,color:#fff
```

---

## Migration Architecture

### Migration from Other Platforms to GitHub Enterprise Cloud

```mermaid
graph TB
    subgraph "Source Platform"
        SourceVCS[Source VCS<br/>GitLab/Bitbucket/Azure DevOps]
        SourceRepos[Repositories]
        SourceIssues[Issues/Work Items]
        SourceCI[CI/CD Pipelines]
    end
    
    subgraph "Migration Tools"
        GEI[GitHub Enterprise Importer]
        Scripts[Custom Scripts]
        API[REST/GraphQL API]
    end
    
    subgraph "GitHub Enterprise Cloud"
        subgraph "Target Structure"
            Orgs[Organizations]
            Repos[Repositories]
            Teams[Teams]
        end
        
        subgraph "Migrated Content"
            Code[Source Code]
            History[Git History]
            Issues[Issues]
            Workflows[GitHub Actions]
        end
    end
    
    subgraph "Post-Migration"
        Validation[Validation]
        Training[User Training]
        Cutover[Production Cutover]
    end
    
    SourceRepos -->|Git Clone/Push| GEI
    SourceIssues -->|Export/Import| API
    SourceCI -->|Translate| Scripts
    
    GEI --> Orgs
    GEI --> Repos
    API --> Issues
    Scripts --> Workflows
    
    Repos --> Code
    Repos --> History
    Orgs --> Teams
    
    Code --> Validation
    History --> Validation
    Issues --> Validation
    Workflows --> Validation
    
    Validation --> Training
    Training --> Cutover
    
    style GEI fill:#0366d6,color:#fff
    style Validation fill:#28a745,color:#fff
    style Cutover fill:#dc3545,color:#fff
```

### Migration Phases

```mermaid
gantt
    title GitHub Enterprise Migration Timeline
    dateFormat YYYY-MM-DD
    section Planning
    Assessment & Planning           :p1, 2024-01-01, 30d
    Pilot Organization Setup        :p2, after p1, 14d
    section Migration
    Pilot Migration (10 repos)      :m1, after p2, 14d
    Wave 1 (100 repos)              :m2, after m1, 21d
    Wave 2 (500 repos)              :m3, after m2, 21d
    Wave 3 (Remaining)              :m4, after m3, 30d
    section Validation
    Parallel Running                :v1, after m2, 60d
    User Training                   :v2, after m2, 45d
    section Cutover
    Production Cutover              :c1, after v1, 7d
    Decommission Old Platform       :c2, after c1, 30d
```

---

## Quick Reference Cards

### Permission Levels Quick Reference

#### Repository Permissions

| Level | Read | Write | Admin |
|-------|------|-------|-------|
| **Read** | ✅ View code<br>✅ Open issues<br>✅ Comment | ❌ | ❌ |
| **Triage** | ✅ Read access<br>✅ Manage issues<br>✅ Manage PRs | ❌ | ❌ |
| **Write** | ✅ Triage access<br>✅ Push commits<br>✅ Merge PRs | ✅ Push to branch<br>✅ Create releases | ❌ |
| **Maintain** | ✅ Write access<br>✅ Manage issues<br>✅ Manage releases | ✅ Push to protected<br>✅ Manage webhooks | ❌ Delete repo |
| **Admin** | ✅ Maintain access<br>✅ Full control | ✅ All write access | ✅ Delete repo<br>✅ Manage settings<br>✅ Manage access |

#### Organization Roles

| Role | Scope | Key Permissions |
|------|-------|-----------------|
| **Owner** | Organization | • Full admin access<br>• Manage all repos<br>• Manage members<br>• Configure SSO<br>• Access billing |
| **Billing Manager** | Billing only | • View billing info<br>• Update payment methods<br>• View usage reports |
| **Member** | Limited | • Create repos (if allowed)<br>• Create teams<br>• View members |
| **Moderator** | Content | • Block/unblock users<br>• Limit interactions<br>• Manage comments |

#### Enterprise Roles

| Role | Permissions |
|------|-------------|
| **Enterprise Owner** | • Full enterprise control<br>• Manage organizations<br>• Configure policies<br>• Access audit logs<br>• Manage billing |
| **Billing Manager** | • View/update billing<br>• View usage reports<br>• No organization access |
| **Member** | • Access via organization<br>• No enterprise settings |

### Policy Inheritance Matrix

```mermaid
graph TD
    Enterprise[Enterprise Level<br/>ENFORCED/ALLOWED/DISABLED]
    Org[Organization Level<br/>Can restrict if ALLOWED]
    Repo[Repository Level<br/>Can restrict if Org allows]
    
    Enterprise -->|ENFORCED| Org
    Enterprise -->|ALLOWED| Org
    Enterprise -->|DISABLED| Org
    
    Org -->|Org Policy| Repo
    
    style Enterprise fill:#6f42c1,color:#fff
    style Org fill:#0366d6,color:#fff
    style Repo fill:#28a745,color:#fff
```

| Policy | Enterprise | Organization | Repository |
|--------|-----------|--------------|------------|
| **Actions Permissions** | Allowed list | Can restrict further | Cannot override |
| **Repository Visibility** | Enforced/Allowed | Can restrict | Cannot override |
| **Forking** | Allowed/Disabled | Can disable | Cannot override |
| **GitHub Pages** | Enabled/Disabled | Can disable | Cannot override |
| **Branch Protection** | N/A | N/A | Full control |
| **Rulesets** | Via org policy | Applied to repos | Can add more rules |

### Security Features Matrix

| Feature | Free | Team | Enterprise with GHAS |
|---------|------|------|----------------------|
| **Dependabot Alerts** | Public repos | All repos | All repos |
| **Dependabot Security Updates** | Public repos | All repos | All repos |
| **Dependabot Version Updates** | ✅ | ✅ | ✅ |
| **Dependency Review** | Public repos | ❌ | ✅ |
| **Code Scanning (CodeQL)** | Public repos | ❌ | ✅ |
| **Secret Scanning** | Public repos | ❌ | ✅ |
| **Secret Push Protection** | Public repos | ❌ | ✅ |
| **Custom Secret Patterns** | ❌ | ❌ | ✅ |
| **Security Overview** | ❌ | ❌ | ✅ |

### Rulesets vs Branch Protection

| Feature | Branch Protection | Rulesets |
|---------|------------------|----------|
| **Scope** | Single branch pattern | Multiple branches/tags |
| **Organization-Wide** | ❌ | ✅ |
| **Bypass Actors** | Limited | ✅ Full control |
| **Status Checks** | ✅ | ✅ |
| **File Path Restrictions** | ❌ | ✅ |
| **Metadata Restrictions** | ❌ | ✅ (commit message, author) |
| **Import/Export** | ❌ | ✅ |
| **Evaluation Modes** | N/A | Active/Evaluate |

### Common CLI Commands

```bash
# GitHub CLI (gh) - Essential Commands

# Authentication
gh auth login
gh auth status

# Repository Management
gh repo create org/repo --public
gh repo clone org/repo
gh repo view org/repo

# Organization Management
gh api orgs/my-org
gh api orgs/my-org/members

# Team Management
gh api orgs/my-org/teams/my-team/members
gh api -X PUT orgs/my-org/teams/my-team/repos/my-org/my-repo

# Security Alerts
gh api repos/my-org/my-repo/code-scanning/alerts
gh api repos/my-org/my-repo/secret-scanning/alerts
gh api repos/my-org/my-repo/dependabot/alerts

# Audit Log (Enterprise)
gh api enterprises/my-enterprise/audit-log

# Actions
gh workflow list
gh workflow run workflow.yml
gh run list
gh run view 1234567890

# Rulesets
gh api repos/my-org/my-repo/rulesets
gh api -X POST repos/my-org/my-repo/rulesets --input ruleset.json

# Organization Policies
gh api -X PUT orgs/my-org/actions/permissions --field allowed_actions=selected
```

### Terraform Resource Quick Reference

```hcl
# Essential GitHub Terraform Resources

# Organization
resource "github_organization_settings" "main" {
  billing_email = "billing@example.com"
}

# Team
resource "github_team" "engineering" {
  name        = "engineering"
  description = "Engineering team"
  privacy     = "closed"
}

# Repository
resource "github_repository" "main" {
  name        = "my-repo"
  visibility  = "private"
  auto_init   = true
}

# Team Repository Access
resource "github_team_repository" "main" {
  team_id    = github_team.engineering.id
  repository = github_repository.main.name
  permission = "push"
}

# Branch Protection
resource "github_branch_protection" "main" {
  repository_id = github_repository.main.node_id
  pattern       = "main"
  
  required_pull_request_reviews {
    required_approving_review_count = 2
  }
}

# Repository Ruleset
resource "github_repository_ruleset" "main" {
  name        = "main-protection"
  repository  = github_repository.main.name
  target      = "branch"
  enforcement = "active"
  
  rules {
    required_linear_history = true
    required_signatures     = true
  }
}

# Actions Secrets
resource "github_actions_organization_secret" "main" {
  secret_name     = "API_TOKEN"
  visibility      = "selected"
  plaintext_value = var.api_token
}
```

---

## Architecture Decision Records

### ADR-001: Choose EMU vs Personal Accounts

**Status:** Template

**Context:** Organizations must decide between Enterprise Managed Users (EMU) and personal accounts with SAML SSO.

**Decision Factors:**

| Factor | EMU | Personal Accounts |
|--------|-----|-------------------|
| Identity Control | ✅ Full control | ⚠️ Partial |
| External Collaboration | ⚠️ Limited | ✅ Full |
| Open Source Contributions | ❌ | ✅ |
| Compliance Requirements | ✅ Strong | ⚠️ Moderate |
| User Experience | ⚠️ Separate accounts | ✅ Single account |
| Implementation Complexity | ⚠️ Complex | ✅ Simple |

**Recommendation:**
- **Choose EMU if:** Strict compliance, regulated industry, need full lifecycle control
- **Choose Personal Accounts if:** Open source contributions, external collaboration, developer experience priority

### ADR-002: Single vs Multi-Organization

**Status:** Template

**Decision Factors:**

| Factor | Single Org | Multi Org |
|--------|-----------|-----------|
| Simplicity | ✅ Simple | ⚠️ Complex |
| Environment Separation | ⚠️ Weak | ✅ Strong |
| Policy Management | ✅ Centralized | ⚠️ Distributed |
| Compliance Isolation | ⚠️ Limited | ✅ Strong |
| Cost | ✅ Lower | ⚠️ Higher |
| Scalability | ⚠️ Limited | ✅ High |

**Recommendation:**
- **Single Org:** < 500 developers, simple governance, unified business unit
- **Multi Org:** > 500 developers, multiple environments, complex compliance, business unit separation

---

## Integration Patterns

### Pattern: SIEM Integration with Audit Log Streaming

```mermaid
sequenceDiagram
    participant GitHub as GitHub Enterprise
    participant Stream as Audit Log Stream
    participant SIEM as SIEM Platform
    participant SOC as Security Operations
    
    GitHub->>Stream: Audit Event (HTTPS/JSON)
    Stream->>SIEM: Forward Event
    
    alt Critical Event
        SIEM->>SIEM: Correlate with other events
        SIEM->>SOC: Generate Alert
        SOC->>GitHub: Investigate (via API)
        GitHub-->>SOC: Additional context
        SOC->>SOC: Take remediation action
    else Normal Event
        SIEM->>SIEM: Store for compliance
    end
```

### Pattern: Automated Compliance Reporting

```mermaid
graph LR
    subgraph "Data Collection"
        API[GitHub API]
        Audit[Audit Logs]
    end
    
    subgraph "Processing"
        ETL[ETL Pipeline]
        Analytics[Analytics Engine]
    end
    
    subgraph "Reporting"
        Dashboard[Compliance Dashboard]
        Reports[Automated Reports]
        Alerts[Alert System]
    end
    
    API --> ETL
    Audit --> ETL
    ETL --> Analytics
    Analytics --> Dashboard
    Analytics --> Reports
    Analytics --> Alerts
    
    style API fill:#0366d6,color:#fff
    style Analytics fill:#28a745,color:#fff
    style Reports fill:#ffc107,color:#000
```

---

## Summary

This reference architecture document provides consolidated views of:

1. **Complete Enterprise Architecture** - All components and relationships
2. **Organization Topologies** - Single, multi-org, and business unit patterns
3. **IAM Integration** - EMU and personal account flows
4. **Security Architecture** - GHAS features and scanning pipelines
5. **CI/CD Governance** - Actions policies and deployment patterns
6. **Hybrid Integration** - On-premises and multi-cloud connections
7. **Migration Patterns** - Moving to GitHub Enterprise Cloud
8. **Quick References** - Permissions, policies, CLI commands, and Terraform

### Related Documentation

- [Enterprise Hierarchy](01-enterprise-hierarchy.md) - Enterprise structure and roles
- [Organization Strategies](02-organization-strategies.md) - Org design patterns
- [Identity & Access Management](03-identity-access-management.md) - IAM configuration
- [Enterprise Managed Users](04-enterprise-managed-users.md) - EMU deep dive
- [Teams & Permissions](05-teams-permissions.md) - Team structures
- [Policy Inheritance](06-policy-inheritance.md) - Policy enforcement
- [Repository Governance](07-repository-governance.md) - Repo settings and rulesets
- [Security & Compliance](08-security-compliance.md) - GHAS and compliance
- [Best Practices & WAF](09-best-practices-waf.md) - Well-Architected Framework

---

## References

### Architecture Documentation
- [GitHub Enterprise Cloud Architecture](https://docs.github.com/en/enterprise-cloud@latest/admin)
- [GitHub Well-Architected Framework](https://wellarchitected.github.com/)
- [GitHub Enterprise Onboarding](https://docs.github.com/en/enterprise-cloud@latest/enterprise-onboarding)

### Integration Guides
- [SAML Configuration](https://docs.github.com/en/enterprise-cloud@latest/admin/identity-and-access-management/using-saml-for-enterprise-iam)
- [SCIM Provisioning](https://docs.github.com/en/enterprise-cloud@latest/admin/identity-and-access-management/provisioning-user-accounts-for-enterprise-managed-users)
- [Audit Log Streaming](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/streaming-the-audit-log-for-your-enterprise)

### API References
- [GitHub REST API](https://docs.github.com/en/rest)
- [GitHub GraphQL API](https://docs.github.com/en/graphql)
- [GitHub CLI](https://cli.github.com/)

### Terraform Provider
- [GitHub Terraform Provider](https://registry.terraform.io/providers/integrations/github/latest/docs)

### Best Practices
- [Best Practices for Organizations](https://github.blog/enterprise-software/devops/best-practices-for-organizations-and-teams-using-github-enterprise-cloud/)
- [GitHub Enterprise Cloud eBook](https://assets.ctfassets.net/wfutmusr1t3h/ooXuGRtFrKHrFZ8cIdbUC/4333e8014b2e950d9381bdb102415e3a/GitHub-Enterprise-Cloud_ebook.pdf)

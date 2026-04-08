# Azure DevOps REST API Authentication Without PATs in CI/CD Pipelines

## Deep Research — April 2026

---

## Executive Summary

Microsoft is actively steering customers away from Personal Access Tokens (PATs) toward Microsoft Entra–based authentication. As of April 2025, no new Azure DevOps OAuth app registrations are accepted, and the legacy OAuth platform is scheduled for full retirement in 2026. For CI/CD pipelines calling Azure DevOps REST APIs, there are now **five viable alternatives to PATs**, each with distinct trade-offs in security, cost, and complexity.

For the specific **Advanced Security API gating** scenario, the recommended path forward is a **Service Principal with an Azure DevOps Service Connection using Workload Identity Federation** — or the new native **Status Checks** feature (Sprint 271+) which eliminates the need for API calls entirely.

---

## Table of Contents

1. [Authentication Options Overview](#1-authentication-options-overview)
2. [Option 1: System.AccessToken (Pipeline Job Token)](#2-option-1-systemaccesstoken-pipeline-job-token)
3. [Option 2: Service Principal with Entra Token](#3-option-2-service-principal-with-entra-token)
4. [Option 3: Managed Identity with Entra Token](#4-option-3-managed-identity-with-entra-token)
5. [Option 4: Azure DevOps Service Connection (Workload Identity Federation)](#5-option-4-azure-devops-service-connection-workload-identity-federation)
6. [Option 5: Azure CLI Ad-Hoc Entra Tokens](#6-option-5-azure-cli-ad-hoc-entra-tokens)
7. [Advanced Security API — Special Considerations](#7-advanced-security-api--special-considerations)
8. [Licensing Impact](#8-licensing-impact)
9. [Deprecation Timeline](#9-deprecation-timeline)
10. [Recommendation Matrix](#10-recommendation-matrix)
11. [Implementation Examples](#11-implementation-examples)
12. [Scaling to 200 Projects with a Custom Pipeline Task](#12-scaling-to-200-projects-with-a-custom-pipeline-task)
13. [References](#13-references)

---

## 1. Authentication Options Overview

| Method | Token Lifetime | Secret Management | Cross-Org | License Cost | Best For |
|--------|---------------|-------------------|-----------|-------------|----------|
| **System.AccessToken** | Pipeline job duration | None (automatic) | ❌ No | Free (built-in) | Simple in-org API calls |
| **Service Principal** | 1 hour (Entra) | Certificate or client secret | ✅ Yes | Basic license per org | Automation, cross-org, Advanced Security |
| **Managed Identity** | 1–24 hours (auto-rotated, cached) | None (Azure-managed) | ⚠️ Same tenant only | Basic license per org | Azure-hosted agents/apps |
| **ADO Service Connection (WIF)** | 1 hour (federated) | None (zero-secret) | ✅ Yes | Basic license per org | Modern pipeline REST API calls |
| **Azure CLI Entra Token** | 1 hour | Depends on login method | ✅ Yes | Per identity type | Ad-hoc / scripted calls |
| ~~PAT~~ | Up to 1 year | Manual rotation | ✅ Yes | Free | **⚠️ Discouraged** |

---

## 2. Option 1: System.AccessToken (Pipeline Job Token)

### How It Works
Every Azure Pipelines job automatically gets an OAuth token via `$(System.AccessToken)`. This token authenticates as the **Build Service identity** (`Project Collection Build Service` or `{Project} Build Service`).

### Pros
- **Zero setup** — available by default in every pipeline
- **Short-lived** — expires when the job ends
- **No secrets to manage** — injected by the pipeline runtime
- **Free** — no additional license cost

### Cons
- **Broad permissions** — all pipelines in the project share the same Build Service identity permissions
- **No cross-org support** — only works within the current organization
- **Build identity restrictions** — some APIs (including Advanced Security as of Sprint 269) are restricting access for build identities for security reasons
- **No fine-grained scoping** — can't limit per-pipeline

### ⚠️ Advanced Security Impact
As of **Sprint 269**, build service identities can no longer call Advanced Security APIs. A temporary rollback is in effect **until April 15, 2026**, after which `System.AccessToken` **will not work** for Advanced Security REST API calls.

### Usage
```yaml
steps:
- powershell: |
    $headers = @{
      Authorization = "Bearer $(System.AccessToken)"
      "Content-Type" = "application/json"
    }
    $result = Invoke-RestMethod -Uri "$(System.CollectionUri)$(System.TeamProject)/_apis/projects?api-version=7.2" `
                                -Headers $headers
    $result | ConvertTo-Json
  displayName: 'Call ADO REST API with System.AccessToken'
  env:
    SYSTEM_ACCESSTOKEN: $(System.AccessToken)
```

---

## 3. Option 2: Service Principal with Entra Token

### How It Works
Register an application in Microsoft Entra ID, create a service principal, add it to your Azure DevOps organization as a user, then acquire tokens via the **client credentials flow** (`grant_type=client_credentials`).

### Pros
- **Short-lived tokens** (1 hour)
- **Fine-grained permissions** — assign specific ADO permissions to the SP
- **Cross-org support** — works across organizations in the same Entra tenant
- **Conditional Access** support
- **Comprehensive audit trail**
- **Recommended by Microsoft** for Advanced Security API automation

### Cons
- **Requires a Basic license** per organization (≈$6/user/month)
- **Multi-org billing discount does NOT apply** to service principals
- **Secret/certificate management** — client secrets need rotation; certificates are preferred
- **Setup complexity** — Entra app registration + ADO user provisioning + permission assignment

### Token Acquisition
```
POST https://login.microsoftonline.com/{tenant-id}/oauth2/v2.0/token
Content-Type: application/x-www-form-urlencoded

client_id={client-id}
&scope=https://app.vssps.visualstudio.com/.default
&client_secret={client-secret}
&grant_type=client_credentials
```

### Usage in Pipeline (PowerShell)
```yaml
steps:
- powershell: |
    $body = @{
      client_id     = "$(SP_CLIENT_ID)"
      scope         = "https://app.vssps.visualstudio.com/.default"
      client_secret = "$(SP_CLIENT_SECRET)"
      grant_type    = "client_credentials"
    }
    $tokenResponse = Invoke-RestMethod -Uri "https://login.microsoftonline.com/$(TENANT_ID)/oauth2/v2.0/token" `
                                       -Method POST -Body $body
    $headers = @{
      Authorization  = "Bearer $($tokenResponse.access_token)"
      "Content-Type" = "application/json"
    }
    # Call Advanced Security API
    $alerts = Invoke-RestMethod -Uri "https://advsec.dev.azure.com/$(ORG)/$(PROJECT)/_apis/alert/repositories/$(REPO_ID)/alerts?api-version=7.2-preview.1" `
                                -Headers $headers
    Write-Host "Found $($alerts.count) alerts"
  displayName: 'Call ADO API with Service Principal'
```

---

## 4. Option 3: Managed Identity with Entra Token

### How It Works
For Azure-hosted workloads (self-hosted agents on Azure VMs, Azure Functions, etc.), use a **system-assigned** or **user-assigned managed identity**. Azure handles all credential rotation automatically.

### Pros
- **Zero secret management** — Azure rotates credentials automatically
- **Simplest code** — `ManagedIdentityCredential` just works
- **Same security benefits** as service principals (1-hour tokens, up to ~24 hours cached for managed identities, conditional access)
- **Ideal for self-hosted agents on Azure VMs**

### Cons
- **Azure-hosted only** — doesn't work from on-premises or non-Azure environments
- **Same-tenant only** — cannot directly access ADO orgs connected to a different Entra tenant (workaround exists via cross-tenant certificate)
- **Requires Basic license** per org
- **Not available on Microsoft-hosted agents** (you don't control the VM identity)

### Token Acquisition (C#)
```csharp
var credential = new ManagedIdentityCredential();
var token = await credential.GetTokenAsync(
    new TokenRequestContext(new[] { "https://app.vssps.visualstudio.com/.default" }));
string accessToken = token.Token;
```

### Token Acquisition (Azure CLI from agent)
```bash
az login --identity
TOKEN=$(az account get-access-token --resource 499b84ac-1321-427f-aa17-267ca6975798 --query accessToken -o tsv)
curl -H "Authorization: Bearer $TOKEN" \
     "https://dev.azure.com/{org}/_apis/projects?api-version=7.2"
```

---

## 5. Option 4: Azure DevOps Service Connection (Workload Identity Federation)

### 🌟 Recommended for Most Pipeline Scenarios

### How It Works
A new **"Azure DevOps" service connection type** uses Entra workload identity federation — a **zero-secret** method. The pipeline exchanges a short-lived Azure DevOps–issued token for an Entra token via federated credentials, without any stored secrets.

### Pros
- **Zero secrets** — no client secrets, no certificates, no PATs
- **Per-pipeline permissions** — unlike `System.AccessToken`, scoped to individual pipelines
- **Cross-org support** — access resources in different ADO organizations
- **Full audit trail**
- **Works with `AzureCLI@3` task** — native pipeline integration
- **Supports REST API calls, repo checkout, artifact feeds, extension publishing**

### Cons
- **Requires Basic license** for the service principal in each target org
- **Rolling out progressively** — may not be available in all orgs yet
- **Requires Entra app registration** (or managed identity) setup

### Setup Steps
1. Create a Service Principal or Managed Identity in Entra ID
2. Add it to the Azure DevOps organization as a user (**Organization Settings → Users**)
3. Assign permissions (e.g., **Advanced Security: Read alerts**)
4. Create an "Azure DevOps" service connection (**Project Settings → Service Connections → New → Azure DevOps**)
5. Configure federated credentials automatically

### Usage — REST API Calls from Pipeline
```yaml
steps:
- task: AzureCLI@3
  displayName: 'Call ADO REST API via Service Connection'
  inputs:
    connectionType: 'azureDevOps'
    azureDevOpsServiceConnection: 'my-azdo-connection'
    scriptType: 'pscore'
    scriptLocation: 'inlineScript'
    inlineScript: |
      # Get Entra access token for Azure DevOps
      $token = az account get-access-token `
                 --resource "499b84ac-1321-427f-aa17-267ca6975798" `
                 --query "accessToken" --output tsv

      $headers = @{
        Authorization  = "Bearer $token"
        "Content-Type" = "application/json"
      }

      # Example: query Advanced Security alerts
      $alerts = Invoke-RestMethod `
        -Uri "https://advsec.dev.azure.com/{org}/{project}/_apis/alert/repositories/{repoId}/alerts?api-version=7.2-preview.1" `
        -Headers $headers

      Write-Host "Total alerts: $($alerts.count)"
      if ($alerts.value | Where-Object { $_.severity -in @('high','critical') -and $_.state -eq 'active' }) {
        Write-Error "High/Critical security alerts found — failing gate"
        exit 1
      }
```

---

## 6. Option 5: Azure CLI Ad-Hoc Entra Tokens

### How It Works
Use `az account get-access-token` with the Azure DevOps resource ID to get a short-lived Entra token. Can authenticate as a user, service principal, or managed identity.

### Best For
- Quick scripting / one-off API calls
- Testing and development
- Migration from PAT-based scripts (drop-in replacement)

### Usage
```bash
# Login as service principal
az login --service-principal -u {client-id} -p {client-secret} --tenant {tenant-id}

# Get token
TOKEN=$(az account get-access-token \
  --resource 499b84ac-1321-427f-aa17-267ca6975798 \
  --query accessToken -o tsv)

# Use in REST call
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://dev.azure.com/{org}/_apis/projects?api-version=7.2"
```

---

## 7. Advanced Security API — Special Considerations

### The Problem
Your customer uses the **Advanced Security REST APIs** in pipelines to create a quality gate (checking for high/critical alerts before allowing deployments).

### Timeline of Changes

| Date | Event |
|------|-------|
| **Sprint 269** (early 2026) | Build identity access restricted for Advanced Security APIs |
| **March 2026** | Temporary rollback — build identities can access Advanced Security: Read alerts again |
| **April 15, 2026** ⚠️ | **Restriction re-enforced** — build identities permanently blocked from Advanced Security APIs |
| **Sprint 271** (March 2026) | **Status Checks** ship — native PR gating on security posture without API calls |

### Path Forward — Three Options

#### Option A: Service Principal with "Read Alerts" Permission (Recommended Now)
- Register a Service Principal in Entra ID
- Add it to ADO with a **Basic license**
- Grant **"Advanced Security: Read alerts"** permission on target repositories
- Use it from the pipeline via Service Connection or direct token acquisition
- **Key insight from Microsoft**: *"If the service principal isn't committing code, it won't consume an Advanced Security committer license"* — you only pay the Basic license (~$6/month), NOT the GHAzDO per-committer fee

#### Option B: Status Checks (Available Sprint 271+)
- **Native branch policy** — no API calls needed
- Two check types:
  - `AdvancedSecurity/NewHighAndCritical` — fails only for NEW alerts introduced by the PR
  - `AdvancedSecurity/AllHighAndCritical` — fails if ANY high/critical alert exists
- Configure as a branch policy (Settings → Branch Policies → Status Checks)
- **Fail-open** if Advanced Security is not enabled on the repo
- **Limitation**: Only blocks PRs — does not cover post-merge deployment gates or custom logic
- **Note**: Advanced Security product license is still required on the repos; "free" refers to no additional SP/Basic license cost

#### Option C: Hybrid Approach
- Use **Status Checks** for PR-time gating (simpler, no additional SP licensing cost)
- Use a **Service Principal** for deployment-gate scenarios or custom alert processing logic that goes beyond simple pass/fail

---

## 8. Licensing Impact

### Service Principal Licensing Requirements

| Access Level | Cost | Capabilities |
|-------------|------|--------------|
| **Stakeholder** | Free | ❌ Cannot access repos (private projects), ❌ Limited REST API access (no Repos, Pipelines, Artifacts APIs) |
| **Basic** ✅ | ~$6/user/month | ✅ Full API access, ✅ Repo access, ✅ Advanced Security read |
| **Basic + Test Plans** | ~$52/user/month | Same + Test Plans (unnecessary for automation) |

### Key Licensing Facts

1. **Service Principals require at least Basic** to access repos and most REST APIs. Stakeholder is NOT sufficient.
2. **Multi-organization billing does NOT apply** to service principals. You pay per org.
3. **Group-based licensing rules don't auto-apply** to SPs. You must assign the access level directly.
4. **Advanced Security committer license** is NOT consumed if the SP only reads alerts (doesn't commit code).
5. **One SP can serve multiple pipelines** — you don't need one per pipeline.

### Cost Optimization
- Use **one Service Principal** across all pipelines in an organization
- If cross-org, you pay Basic in each org (~$6/month each)
- For PR gating only, consider **Status Checks** (Sprint 271+) — **zero SP licensing cost** (Advanced Security product license still required on the repos)

---

## 9. Deprecation Timeline

| Date | Change | Impact |
|------|--------|--------|
| **2024** | Azure DevOps encourages Entra tokens over PATs | Guidance only |
| **April 2025** | No new Azure DevOps OAuth app registrations | New apps must use Entra OAuth |
| **2025** | "Generate Git Credentials" button removed from Repos/Wiki UI | Minor — PAT creation still possible manually |
| **April 15, 2026** ⚠️ | Build identities blocked from Advanced Security APIs | Must migrate to SP/MI |
| **2026** | Azure DevOps OAuth platform fully retired | All apps must use Entra OAuth |
| **Future** | PAT creation policies (allow-list only) | Org admins can restrict who creates PATs |

---

## 10. Recommendation Matrix

### For the Advanced Security Gating Scenario

| Approach | Effort | Cost | Security | Recommendation |
|----------|--------|------|----------|----------------|
| **Status Checks (Sprint 271+)** | 🟢 Low | 🟢 Free (no SP cost) | 🟢 High | ✅ Best for PR gating |
| **ADO Service Connection + SP** | 🟡 Medium | 🟡 ~$6/mo | 🟢 High | ✅ Best for deployment gates & custom logic |
| **Direct SP token in script** | 🟡 Medium | 🟡 ~$6/mo | 🟡 Medium (secret mgmt) | ⚠️ OK but prefer Service Connection |
| **Managed Identity** | 🟡 Medium | 🟡 ~$6/mo | 🟢 High | ✅ Best if using Azure-hosted self-hosted agents |
| **System.AccessToken** | 🟢 Low | 🟢 Free | 🔴 Blocked | ❌ Won't work after April 15, 2026 |
| **PAT** | 🟢 Low | 🟢 Free | 🔴 Low | ❌ Discouraged by Microsoft |

### General ADO REST API Calls from Pipelines

| Scenario | Recommended Method |
|----------|--------------------|
| Simple in-org API calls (non-security) | `System.AccessToken` (still works for most APIs) |
| Advanced Security API automation | Service Principal via ADO Service Connection |
| Cross-organization access | ADO Service Connection with Workload Identity Federation |
| Azure-hosted self-hosted agents | Managed Identity |
| Deployment gates with custom logic | Service Principal + Entra token |
| PR-time security gating | Status Checks (Sprint 271+) |

---

## 11. Implementation Examples

### Example 1: Full Setup — Service Principal for Advanced Security Gate

```yaml
# azure-pipelines.yml
trigger:
  - main

pool:
  vmImage: 'ubuntu-latest'

steps:
- task: AzureCLI@3
  displayName: 'Advanced Security Gate'
  inputs:
    connectionType: 'azureDevOps'
    azureDevOpsServiceConnection: 'advsec-gate-connection'
    scriptType: 'pscore'
    scriptLocation: 'inlineScript'
    inlineScript: |
      $token = az account get-access-token `
        --resource "499b84ac-1321-427f-aa17-267ca6975798" `
        --query "accessToken" --output tsv

      $headers = @{
        Authorization  = "Bearer $token"
        "Content-Type" = "application/json"
      }

      $org = "$(System.CollectionUri)" -replace 'https://dev.azure.com/', '' -replace '/$', ''
      $project = "$(System.TeamProject)"

      # Get repository ID
      $repos = Invoke-RestMethod `
        -Uri "https://dev.azure.com/$org/$project/_apis/git/repositories?api-version=7.2" `
        -Headers $headers
      $repoId = ($repos.value | Where-Object { $_.name -eq "$(Build.Repository.Name)" }).id

      # Query Advanced Security alerts
      $alerts = Invoke-RestMethod `
        -Uri "https://advsec.dev.azure.com/$org/$project/_apis/alert/repositories/$repoId/alerts?criteria.states=active&criteria.severities=critical,high&api-version=7.2-preview.1" `
        -Headers $headers

      $activeHighCritical = $alerts.value | Where-Object {
        $_.severity -in @('critical', 'high') -and $_.state -eq 'active'
      }

      if ($activeHighCritical.Count -gt 0) {
        Write-Host "##vso[task.logissue type=error]Found $($activeHighCritical.Count) active high/critical alerts"
        foreach ($alert in $activeHighCritical) {
          Write-Host "  - [$($alert.severity)] $($alert.title)"
        }
        exit 1
      }
      Write-Host "✅ No active high/critical security alerts"
```

### Example 2: Status Check Branch Policy (No Code Required)

```
Configuration Steps:
1. Enable Advanced Security on the repository
2. Go to Project Settings → Repos → {Repository} → Branch Policies → {branch}
3. Under "Status Checks", add:
   - AdvancedSecurity/NewHighAndCritical  (recommended for most teams)
   - or AdvancedSecurity/AllHighAndCritical (stricter)
4. Set the policy to "Required"

No pipeline code, no service principal, no SP license cost.
Note: Advanced Security product license is still required on the repositories.
```

---

## 12. Scaling to 200 Projects with a Custom Pipeline Task

### The Scenario

The customer has:
- **200 projects** in a single Azure DevOps organization
- A **custom pipeline task** (VSIX extension) that calls Advanced Security APIs to create a security gate
- The task currently relies on `System.AccessToken` (or a PAT) — both are dead ends for Advanced Security APIs after April 15, 2026

### The Core Problem

The custom task needs a **new way to get an Entra token** to call Advanced Security APIs. The challenge is doing this across 200 projects with minimal per-project configuration.

---

### Option A: Update Custom Task to Accept an ADO Service Connection Input

**How it works**: Modify the custom task's `task.json` to accept a service connection of type `Azure DevOps`. The task uses the Azure Pipelines Task SDK to retrieve the Entra token from the service connection at runtime.

**Task code change** (task.json):
```json
{
  "inputs": [
    {
      "name": "azureDevOpsServiceConnection",
      "type": "connectedService:azuredevops",
      "label": "Azure DevOps Service Connection",
      "required": true,
      "helpMarkDown": "Select an Azure DevOps service connection for Advanced Security API authentication."
    }
  ]
}
```

**Task runtime** (TypeScript / Node):
```typescript
import * as tl from 'azure-pipelines-task-lib/task';

const endpointId = tl.getInput('azureDevOpsServiceConnection', true)!;
const token = tl.getEndpointAuthorizationParameter(endpointId, 'AccessToken', false)!;

// Use token for Advanced Security API call
const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
```

**Rollout across 200 projects**:
1. Register **1 Service Principal** in Entra → add to the ADO org with **Basic** license + **Advanced Security: Read alerts** permission
2. Use the Azure DevOps REST API to **script the creation of the service connection** in all 200 projects:
   ```powershell
   # Script to create ADO Service Connection in all projects
   $org = "https://dev.azure.com/{org}"
   $projects = (Invoke-RestMethod -Uri "$org/_apis/projects?api-version=7.2" -Headers $headers).value

   foreach ($project in $projects) {
     # Create Azure DevOps service connection via REST API
     $body = @{
       name = "advsec-gate-connection"
       type = "azuredevops"
       # ... service connection configuration
     } | ConvertTo-Json -Depth 5
     Invoke-RestMethod -Uri "$org/$($project.name)/_apis/serviceendpoint/endpoints?api-version=7.2" `
                       -Method POST -Headers $headers -Body $body -ContentType "application/json"
   }
   ```
3. Update pipeline YAML/definitions to pass the service connection name to the task

| Pros | Cons |
|------|------|
| ✅ Zero secrets in pipelines — WIF handles everything | ❌ Task code must be updated and republished |
| ✅ Per-pipeline scoping — fine-grained access control | ❌ Service connection needed in each project (scriptable) |
| ✅ Audit trail per pipeline | ❌ Pipeline definitions need updating to pass the SC input |
| ✅ 1 SP, 1 Basic license (~$6/mo total) | |

---

### Option B: Pre-Step Pattern — AzureCLI@3 Acquires Token, Custom Task Reads It

**How it works**: Add an `AzureCLI@3` step *before* the custom task that authenticates via the ADO service connection and stores the Entra token in a pipeline variable. The custom task reads the token from the variable — **no changes to the task code's auth mechanism**, only to where it reads the token from.

```yaml
steps:
# Step 1: Acquire Entra token via service connection
- task: AzureCLI@3
  name: GetAdvSecToken
  displayName: 'Acquire Entra Token for Advanced Security'
  inputs:
    connectionType: 'azureDevOps'
    azureDevOpsServiceConnection: 'advsec-gate-connection'
    scriptType: 'pscore'
    scriptLocation: 'inlineScript'
    inlineScript: |
      $token = az account get-access-token `
        --resource "499b84ac-1321-427f-aa17-267ca6975798" `
        --query "accessToken" --output tsv
      Write-Host "##vso[task.setvariable variable=ADVSEC_TOKEN;issecret=true;isoutput=true]$token"

# Step 2: Custom task uses the token from the variable
- task: YourCustomAdvSecGate@1
  inputs:
    accessToken: $(GetAdvSecToken.ADVSEC_TOKEN)
```

**Minimal task change**: The task just needs to accept a `accessToken` input instead of (or in addition to) using `System.AccessToken`. If it already accepts a token input (e.g., for PAT), this might be a **config-only change**.

| Pros | Cons |
|------|------|
| ✅ Minimal or zero task code changes | ❌ Two steps instead of one in every pipeline |
| ✅ Uses proven AzureCLI@3 auth mechanism | ❌ Token passed via variable (secret, but still a variable) |
| ✅ Same service connection setup as Option A | ❌ Pipeline YAML must still be updated |
| ✅ 1 SP, 1 Basic license (~$6/mo total) | |

---

### Option C: SP Credentials via Azure Key Vault — Task Acquires Token Directly

**How it works**: Store the Service Principal's `client_id`, `tenant_id`, and `client_secret` (or certificate) in a shared Azure Key Vault. Each project creates a variable group linked to that Key Vault. The custom task reads the credentials and acquires an Entra token directly.

```yaml
variables:
- group: 'AdvSec-ServicePrincipal-KV'   # Linked to shared Key Vault

steps:
- task: YourCustomAdvSecGate@1
  inputs:
    clientId: $(sp-client-id)
    clientSecret: $(sp-client-secret)
    tenantId: $(sp-tenant-id)
```

**Task acquires token internally**:
```typescript
// Inside the custom task
const body = new URLSearchParams({
  client_id: tl.getInput('clientId', true)!,
  scope: 'https://app.vssps.visualstudio.com/.default',
  client_secret: tl.getInput('clientSecret', true)!,
  grant_type: 'client_credentials'
});

const tokenResponse = await fetch(
  `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
  { method: 'POST', body }
);
const { access_token } = await tokenResponse.json();
```

**Rollout across 200 projects**:
1. Create **1 Azure Key Vault** with SP credentials
2. Create **1 ARM service connection** (for Key Vault access) — can potentially be shared or scripted
3. Script the creation of a **Key Vault-linked variable group** in each of the 200 projects via REST API
4. Update pipeline YAML to reference the variable group

| Pros | Cons |
|------|------|
| ✅ Central secret management via Key Vault | ❌ Client secret exists (needs rotation) — use **certificate** to mitigate |
| ✅ Variable groups scriptable via REST API | ❌ Variable groups are project-scoped — must create in each project |
| ✅ Task gets full control over token lifecycle | ❌ Task code needs updating to do token acquisition |
| ✅ 1 SP, 1 Basic license (~$6/mo total) | ❌ Additional ARM service connection needed for Key Vault |

---

### Option D: Status Checks — Eliminate the Custom Task Entirely

**How it works**: Replace the custom pipeline task with the native **Advanced Security Status Checks** (Sprint 271+) configured as **branch policies**. No code, no task, no service principal, no SP license cost. (Advanced Security product license is still required on the repos.)

**Rollout across 200 projects**:
- Script the status check policy via the ADO REST API for all repositories:
```powershell
# For each repo in each project, set the branch policy
$policyBody = @{
  isEnabled = $true
  isBlocking = $true
  type = @{ id = "status-check-policy-type-id" }
  settings = @{
    statusName = "AdvancedSecurity/NewHighAndCritical"
    statusGenre = "AdvancedSecurity"
    authorId = ""  # leave empty for system
    defaultDisplayName = "Advanced Security: No new high/critical alerts"
    scope = @(@{
      repositoryId = $repoId
      refName = "refs/heads/main"
      matchKind = "Exact"
    })
  }
} | ConvertTo-Json -Depth 10
```

| Pros | Cons |
|------|------|
| ✅ **Zero SP license cost** — no SP needed (AdvSec product license still required) | ❌ PR gating only — no deployment gate support |
| ✅ Zero code, zero task maintenance | ❌ Only pass/fail on high/critical — no custom logic |
| ✅ Native integration with branch policies | ❌ Can't customize thresholds or alert categories |
| ✅ Scriptable across all 200 projects | ❌ Doesn't cover post-merge pipeline scenarios |

---

### Recommendation for 200-Project Scale

| If the customer needs... | Best approach | Rollout effort |
|--------------------------|---------------|----------------|
| **PR gating only** (block merges with high/critical alerts) | **Option D: Status Checks (Sprint 271+)** | 🟢 Low — script branch policies via REST API, no task changes |
| **Deployment gates + custom logic** with minimal task changes | **Option B: Pre-step pattern** | 🟡 Medium — script SCs, update pipeline YAML, minimal task change |
| **Clean long-term solution** with full task modernization | **Option A: SC input on custom task** | 🟡 Medium — update task + republish + script SCs + update YAML |
| **No task changes at all** but need deployment gates | **Option C: Key Vault credentials** | 🟡 Medium — script KV variable groups, update YAML only if task already accepts token input |

### Cost Summary (All Options)

| Item | Option A | Option B | Option C | Option D |
|------|----------|----------|----------|----------|
| Service Principal | 1 | 1 | 1 | 0 |
| Basic License | ~$6/mo | ~$6/mo | ~$6/mo | $0 |
| AdvSec Committer License | $0 (read-only) | $0 (read-only) | $0 (read-only) | $0 |
| Service Connection provisioning | 200 (scriptable) | 200 (scriptable) | 200 + ARM SC | 0 |
| Task code changes | Yes | Minimal | Yes | None (retire task) |
| Pipeline YAML changes | Yes | Yes | Yes | No (branch policy) |

### Automation Script for Mass Provisioning

For Options A, B, or C, use the Azure DevOps REST API to provision service connections across all 200 projects in one script run. A reference script outline:

```powershell
# Authenticate as org admin
$orgUrl = "https://dev.azure.com/{org}"
$adminToken = az account get-access-token --resource 499b84ac-1321-427f-aa17-267ca6975798 --query accessToken -o tsv
$headers = @{ Authorization = "Bearer $adminToken"; "Content-Type" = "application/json" }

# Get all projects
$projects = (Invoke-RestMethod -Uri "$orgUrl/_apis/projects?`$top=500&api-version=7.2" -Headers $headers).value
Write-Host "Found $($projects.Count) projects"

foreach ($project in $projects) {
    Write-Host "Provisioning service connection in: $($project.name)"

    # Check if SC already exists
    $existing = (Invoke-RestMethod -Uri "$orgUrl/$($project.name)/_apis/serviceendpoint/endpoints?endpointNames=advsec-gate-connection&api-version=7.2" -Headers $headers).value
    if ($existing.Count -gt 0) {
        Write-Host "  → Already exists, skipping"
        continue
    }

    # Create the Azure DevOps service connection
    # (Exact payload depends on connection type and SP details)
    $scBody = @{
        name = "advsec-gate-connection"
        type = "azuredevops"
        url  = $orgUrl
        authorization = @{
            scheme     = "WorkloadIdentityFederation"
            parameters = @{
                servicePrincipalId = "{sp-client-id}"
                tenantId           = "{tenant-id}"
            }
        }
        serviceEndpointProjectReferences = @(@{
            projectReference = @{ id = $project.id; name = $project.name }
            name             = "advsec-gate-connection"
        })
    } | ConvertTo-Json -Depth 5

    Invoke-RestMethod -Uri "$orgUrl/_apis/serviceendpoint/endpoints?api-version=7.2" `
                      -Method POST -Headers $headers -Body $scBody -ContentType "application/json"
    Write-Host "  → Created"
}
```

---

## 13. References

| Resource | URL |
|----------|-----|
| Reducing PAT Usage Across Azure DevOps | https://devblogs.microsoft.com/devops/reducing-pat-usage-across-azure-devops/ |
| Temporary Rollback: Build Identities & Advanced Security | https://devblogs.microsoft.com/devops/temporary-rollback-build-identities-can-access-advanced-security-read-alerts-again/ |
| Service Principals & Managed Identities in ADO | https://learn.microsoft.com/en-us/azure/devops/integrate/get-started/authentication/service-principal-managed-identity |
| Authenticate with Entra ID | https://learn.microsoft.com/en-us/azure/devops/integrate/get-started/authentication/entra |
| Azure DevOps Service Connection (Workload Identity) | https://learn.microsoft.com/en-us/azure/devops/pipelines/library/add-devops-entra-service-connection |
| PAT-less Authentication from Pipeline Tasks (Roadmap) | https://learn.microsoft.com/en-us/azure/devops/release-notes/roadmap/2025/new-service-connection |
| Pipeline Job Access Tokens | https://learn.microsoft.com/en-us/azure/devops/pipelines/process/access-tokens |
| Entra Tokens via Azure CLI | https://learn.microsoft.com/en-us/azure/devops/cli/entra-tokens |
| No New Azure DevOps OAuth Apps (April 2025) | https://devblogs.microsoft.com/devops/no-new-azure-devops-oauth-apps/ |
| Configure Advanced Security Status Checks | https://learn.microsoft.com/en-us/azure/devops/repos/security/configure-github-advanced-security-features |

---

*Document generated April 8, 2026. Information is based on publicly available Microsoft documentation and blog posts. Reviewed for accuracy by three independent AI models (GPT-5.3-Codex, Claude Haiku 4.5, Claude Sonnet 4.5). Verify current sprint feature availability with your Microsoft account team.*

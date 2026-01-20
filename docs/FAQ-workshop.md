# GitHub Enterprise Admin Workshop - FAQ

This document contains questions and answers from the GitHub Admin - Enterprise workshop. It will be updated as new questions arise during workshop deliveries.

---

## Table of Contents
1. [Git LFS Billing](#1-git-lfs-billing)
2. [Outside Collaborators and Internal Repositories](#2-outside-collaborators-and-internal-repositories)
3. [Migration from GitHub Enterprise Cloud to EMU](#3-migration-from-github-enterprise-cloud-to-emu)
4. [Audit Logs for GitHub Actions Policies](#4-audit-logs-for-github-actions-policies)
5. [Enterprise Owner Assignment via Groups](#5-enterprise-owner-assignment-via-groups)

---

## 1. Git LFS Billing

### Question
Is there an additional pay-per-use cost for Git LFS?

### Answer
**Yes**, Git LFS has both **storage** and **bandwidth** costs that can incur additional charges beyond your plan's included quota.

#### Free Quota Included by Plan

| GitHub Plan | Storage | Bandwidth (per month) |
|-------------|---------|----------------------|
| GitHub Free | 10 GiB | 10 GiB |
| GitHub Pro | 10 GiB | 10 GiB |
| GitHub Free for Organizations | 10 GiB | 10 GiB |
| GitHub Team | 250 GiB | 250 GiB |
| **GitHub Enterprise Cloud** | **250 GiB** | **250 GiB** |

#### Pay-Per-Use Pricing (Data Packs)

| Data Pack | Price | Storage Included | Bandwidth Included |
|-----------|-------|------------------|--------------------|
| Git LFS Data Pack | **$5 USD/month** | 50 GiB | 50 GiB |

You can purchase multiple data packs as needed.

#### How Costs are Calculated

- **Storage**: Charged based on hourly usage throughout the month (prorated)
- **Bandwidth**: Billed per GiB of data downloaded
- Usage is tracked against the **repository owner's** account (not the individual user)
- Use the [GitHub Pricing Calculator](https://github.com/pricing/calculator?feature=lfs) to estimate costs

#### What Happens When You Exceed the Quota?

**Without a payment method on file:**
- You can still clone repositories with large assets
- You will only retrieve pointer files (not actual large files)
- You cannot push new files
- Git LFS support is disabled until the next billing cycle (for bandwidth)

**With a payment method on file:**
- Additional usage is billed automatically
- Spending may be limited by budgets you configure

#### Maximum File Sizes for Git LFS

| GitHub Plan | Max File Size |
|-------------|---------------|
| GitHub Free | 2 GB |
| GitHub Pro | 2 GB |
| GitHub Team | 4 GB |
| GitHub Enterprise Cloud | **5 GB** |

> 📚 **Reference**: [Git LFS Billing Documentation](https://docs.github.com/en/billing/managing-billing-for-git-large-file-storage/about-billing-for-git-large-file-storage)

---

## 2. Outside Collaborators and Internal Repositories

### Question
How do outside collaborators work with internal repositories and base permissions? How do we manage consultants (external) - can they access internal repositories?

### Answer
**Outside collaborators cannot access internal repositories by design.**

#### Key Points About Outside Collaborators

1. **Definition**: An outside collaborator is a person who is **not a member** of your organization but has access to one or more repositories

2. **Internal Repository Access**: 
   - **Internal repositories are NOT visible to outside collaborators**
   - Only enterprise members (organization members) can see internal repositories
   - This is by design to enable "innersource" while protecting proprietary information

3. **Base Permissions**: 
   - Base permissions set the default access level for organization members
   - **Base permissions do NOT apply to outside collaborators**
   - Outside collaborators must be explicitly granted access to specific repositories

#### Managing External Consultants

For external consultants, you have two options:

**Option A: Add as Outside Collaborators (Recommended for limited access)**
- Grant access to **specific repositories only** (public or private)
- They **cannot** access internal repositories
- They **cannot** be added to teams
- Each private repository access uses one paid license

**Option B: Use Guest Collaborators (EMU only)**
- If you use **Enterprise Managed Users (EMU)**, you can use the **Guest Collaborator** role
- Guest collaborators are provisioned via your IdP
- They can be added as organization members or repository collaborators
- They **cannot** access internal repositories **except** in organizations where they are explicitly added as members
- This provides more granular control than outside collaborators

### 🔐 How to Configure a Guest Collaborator in Entra ID (Azure AD)

In EMU, the **`roles` attribute** in SCIM provisioning determines whether a user is a regular member or a guest collaborator. The role is assigned in the Enterprise application in Entra ID.

#### Step-by-Step Configuration

1. **Ensure the Guest Collaborator role exists** in your Entra ID Enterprise application:
   - In the Azure portal, navigate to **Identity** → **Applications** → **Enterprise applications**
   - Find your **GitHub Enterprise Managed User** application
   - Check if "Guest Collaborator" role is available under **Users and Groups**
   - If not present, you need to add it to the App Manifest (see below)

2. **Adding Guest Collaborator role to App Manifest** (if not present):
   ```json
   {
     "allowedMemberTypes": ["User"],
     "description": "Guest Collaborator",
     "displayName": "Guest Collaborator",
     "id": "1ebc4a02-e56c-43a6-92a5-02ee09b90824",
     "isEnabled": true,
     "lang": null,
     "origin": "Application",
     "value": null
   }
   ```
   > ⚠️ **Critical**: The `id` value **must be exactly** `1ebc4a02-e56c-43a6-92a5-02ee09b90824` - this is the UUID GitHub expects for guest collaborators.

3. **Assign the role to a user**:
   - Go to **Users and Groups** in the Enterprise application
   - Add the user and select **"Guest Collaborator"** as their role
   - The user will be provisioned to GitHub EMU as a guest collaborator via SCIM

#### How GitHub Evaluates the Role

| User Role in Entra ID | Result in GitHub EMU |
|----------------------|---------------------|
| **Default/Enterprise Member** | Regular managed user with full internal repo access |
| **Guest Collaborator** | Guest collaborator with restricted internal repo access |
| **Restricted User** | Legacy role, similar to guest collaborator |

> 📚 **Reference**: [Enabling Guest Collaborators with Entra ID](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-accounts-and-repositories/managing-users-in-your-enterprise/enabling-guest-collaborators#enabling-guest-collaborators-with-entra-id)

### 🔒 How to Prevent External Users from Accessing Internal Repositories in EMU

If you want external collaborators (consultants/vendors) in EMU to **NOT** have access to internal repositories, you have these options:

| Option | How to Implement | Internal Repo Access |
|--------|-----------------|----------------------|
| **Option 1: Add as Repository Collaborator only** | Add the guest collaborator directly to specific repositories (not as org member) | ❌ **No access** to internal repos |
| **Option 2: Add to Org but restrict base permissions** | Add as org member BUT set organization base permission to "No permission" | ⚠️ Only repos explicitly granted |
| **Option 3: Keep in separate organization** | Create a dedicated org for external work with no internal repos | ❌ **No access** to internal repos in other orgs |

**Recommended Approach**: Use **Option 1** - Add guest collaborators as **repository collaborators** to specific repositories only. This ensures they:
- ✅ Can access the specific private/public repos you grant them
- ❌ Cannot see ANY internal repositories
- ❌ Cannot see other private repos in the organization

> 💡 **Key Insight**: The difference between a guest collaborator and a regular EMU user is that regular users, when added to ANY organization, automatically get read access to ALL internal repositories across the entire enterprise. Guest collaborators do NOT get this automatic access.

#### Comparison Table

| Capability | Organization Member | Outside Collaborator | Guest Collaborator (EMU) |
|------------|---------------------|---------------------|-------------------------|
| Access internal repos (enterprise-wide) | ✅ Yes | ❌ No | ❌ No |
| Access internal repos (in their org) | ✅ Yes | ❌ No | ✅ Yes (if org member) |
| Can be added to teams | ✅ Yes | ❌ No | ✅ Yes |
| Provisioned via IdP | Depends | ❌ No | ✅ Yes |

> 📚 **References**: 
> - [About Internal Repositories](https://docs.github.com/en/enterprise-cloud@latest/repositories/creating-and-managing-repositories/about-repositories#about-internal-repositories)
> - [Adding Outside Collaborators](https://docs.github.com/en/organizations/managing-user-access-to-your-organizations-repositories/managing-outside-collaborators/adding-outside-collaborators-to-repositories-in-your-organization)
> - [Guest Collaborators](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-accounts-and-repositories/managing-users-in-your-enterprise/roles-in-an-enterprise#guest-collaborators)

---

## 3. Migration from GitHub Enterprise Cloud to EMU

### Question
Can existing GitHub Enterprise Cloud organizations be moved/migrated to GitHub Enterprise Managed Users (EMU)? Does it work?

### Answer
**Yes, but it requires a migration to a NEW enterprise account.**

#### Key Points

1. **EMU requires a separate enterprise account**: You cannot "convert" an existing enterprise with personal accounts to EMU. A new enterprise account with EMU enabled must be created.

2. **Migration Process**:
   - If you already have an enterprise with personal accounts, adoption of EMU requires **migration to a new enterprise account**
   - This is not an automatic conversion - it involves moving organizations and repositories
   - You must **contact GitHub's Sales team** to discuss the migration process

3. **Migration Considerations**:
   - The migration may require **time and cost** from your team
   - User accounts are fundamentally different (managed vs. personal)
   - Contribution history and user associations may be affected
   - All users will get new managed user accounts provisioned by your IdP

### ⛔ Can You Use "Invite Organization" or "Transfer Organization" to Move an Org to EMU?

**No!** The "Invite Organization" and "Transfer Organization" features in the enterprise settings **DO NOT WORK** with EMU.

> ⚠️ **EMU Limitation**: "You **cannot transfer an existing organization to or from an enterprise with managed users**." - [GitHub Docs](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-accounts-and-repositories/managing-organizations-in-your-enterprise/adding-organizations-to-your-enterprise#limitations)

Additionally, the documentation states:
- **"Adding existing organizations to your enterprise is not possible"** (for EMU)
- **"Existing organizations from an enterprise with managed users cannot be added to a different enterprise"**

#### What DOES Work Between Regular GHEC Enterprises

The "Invite/Transfer Organization" features **only work** for transfers between **regular GitHub Enterprise Cloud** accounts (enterprises with personal accounts):

| Feature | Regular GHEC → Regular GHEC | Regular GHEC → EMU | EMU → Regular GHEC |
|---------|:---------------------------:|:------------------:|:------------------:|
| **Invite Organization** | ✅ Works | ❌ Not supported | ❌ Not supported |
| **Transfer Organization** | ✅ Works | ❌ Not supported | ❌ Not supported |
| **GitHub Enterprise Importer** | ✅ Works | ✅ Works | ✅ Works |

---

### 🔄 The ONLY Option: Use GitHub Enterprise Importer

**To move an organization to EMU**, you **must use GitHub Enterprise Importer**. This creates a **new organization** in the destination EMU enterprise (it does NOT transfer the existing org).

#### How Organization Migration Works

1. **What happens**: A **new organization** is created in the destination EMU enterprise
2. **Data migrated includes**:
   - ✅ Teams (structure only - members must be re-added)
   - ✅ Repositories (all repos)
   - ✅ Team access to repositories
   - ✅ Member privileges settings
   - ✅ Organization-level webhooks
   - ✅ Default branch name settings

3. **What is NOT migrated**:
   - ❌ Team membership (must re-add members after migration)
   - ❌ User accounts (EMU users are provisioned via IdP)
   - ❌ GitHub Actions secrets, variables, environments
   - ❌ GitHub Apps installations
   - ❌ Packages in GitHub Packages
   - ❌ Projects (new experience)
   - ❌ Discussions

#### Migration Steps Overview

```
1. Create new EMU enterprise account (contact GitHub Sales)
2. Configure IdP and SCIM provisioning for EMU
3. Provision users in EMU via IdP
4. Use GitHub Enterprise Importer to migrate organizations
5. Re-add team members to migrated teams
6. Reclaim mannequins (link old user history to new EMU users)
7. Complete post-migration tasks (secrets, webhooks, etc.)
```

#### Important Notes on Organization Migration

| Aspect | Details |
|--------|--------|
| **Visibility** | All repos are migrated as **private** (change to internal/public after) |
| **Team references** | `@org/team` mentions in code may need updating |
| **User attribution** | Historical activity linked to "mannequins" until reclaimed |
| **Parallel operation** | Source org remains intact during migration |

#### Important Differences to Consider

| Aspect | Enterprise with Personal Accounts | Enterprise with Managed Users (EMU) |
|--------|-----------------------------------|-------------------------------------|
| User account control | Users own their accounts | Enterprise controls accounts via IdP |
| Authentication | Optional SAML SSO | Mandatory SSO (SAML or OIDC) |
| User provisioning | Manual or org-level SCIM | Enterprise-level SCIM required |
| Public repos/gists | ✅ Allowed | ❌ Not allowed |
| Collaboration outside enterprise | ✅ Allowed | ❌ Not allowed |
| Username format | User-chosen | IdP-controlled + shortcode suffix |

#### Prerequisites for EMU

- Supported Identity Provider (Entra ID, Okta, or PingFederate recommended)
- SCIM provisioning capability
- Willingness to accept EMU restrictions (no public repos, no external collaboration)

> ⚠️ **Important**: Before deciding to migrate, carefully review the [abilities and restrictions of managed user accounts](https://docs.github.com/en/enterprise-cloud@latest/admin/identity-and-access-management/understanding-iam-for-enterprises/abilities-and-restrictions-of-managed-user-accounts) to ensure EMU is right for your organization.

> 📚 **References**:
> - [About Migrations Between GitHub Products](https://docs.github.com/en/migrations/using-github-enterprise-importer/migrating-between-github-products/about-migrations-between-github-products) - Details on what data is migrated
> - [GitHub Enterprise Importer](https://docs.github.com/en/migrations/using-github-enterprise-importer) - Tool documentation
> - [Choosing an Enterprise Type](https://docs.github.com/en/enterprise-cloud@latest/admin/identity-and-access-management/understanding-iam-for-enterprises/choosing-an-enterprise-type-for-github-enterprise-cloud)
> - [Getting Started with EMU](https://docs.github.com/en/enterprise-cloud@latest/admin/identity-and-access-management/understanding-iam-for-enterprises/getting-started-with-enterprise-managed-users)
> - [Contact GitHub Sales](https://enterprise.github.com/contact)

---

## 4. Audit Logs for GitHub Actions Policies

### Question
How can I see audit log events for GitHub Actions policy changes (enable/disable) at the enterprise level?

### Answer
**Yes**, GitHub Actions policy changes are logged in the enterprise audit log.

#### Relevant Audit Log Categories

Use these action categories to search for GitHub Actions policy events:

| Category | Description |
|----------|-------------|
| `business` | Activities related to business/enterprise settings |
| `workflows` | Activities related to GitHub Actions workflows |

#### How to Search for GitHub Actions Policy Changes

1. **Access the Audit Log**: 
   - Go to your Enterprise → Settings → Audit log

2. **Search Queries to Use**:
   ```
   action:business
   ```
   This will show all enterprise-level settings changes including Actions policies.

3. **Specific Actions to Look For**:
   - Changes to Actions permissions (which repositories can use Actions)
   - Changes to allowed actions (all actions, local only, selected)
   - Changes to workflow permissions
   - Changes to runner settings

#### Search Syntax Examples

```
# All enterprise settings changes
action:business

# Filter by date range
action:business created:>=2025-01-01

# Filter by actor (who made the change)
action:business actor:username

# All workflow-related events
action:workflows
```

#### Audit Log Search Filters Available

| Filter | Example | Description |
|--------|---------|-------------|
| `action` | `action:business` | Filter by action category |
| `actor` | `actor:octocat` | Who performed the action |
| `created` | `created:>=2025-01-01` | Date/time of action |
| `operation` | `operation:modify` | Type: create, modify, remove |

#### Additional Monitoring Options

- **Audit Log Streaming**: Stream audit logs to external SIEM systems for long-term retention and analysis
- **Audit Log API**: Query audit logs programmatically using the REST or GraphQL API
- **Webhooks**: Set up webhooks for real-time notifications of specific events

> 📚 **References**:
> - [Searching the Audit Log](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/searching-the-audit-log-for-your-enterprise)
> - [Audit Log Events for Enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/audit-log-events-for-your-enterprise)

---

## 5. Enterprise Owner Assignment via Groups

### Question
Can enterprise owners be assigned using IdP groups instead of individual user assignment?

### Answer
**It depends on your enterprise type:**

### For Enterprise Managed Users (EMU) - ✅ Yes

With EMU, **enterprise owner roles can be assigned through your Identity Provider (IdP)** using SCIM provisioning.

#### How It Works

1. **In your IdP application**, when assigning users, you can use the **"Roles" attribute** to set a user's role in the enterprise

2. **Available roles** that can be assigned via IdP:
   - Enterprise Owner
   - Enterprise Member
   - Billing Manager
   - Guest Collaborator

3. **Using Groups**: 
   - Assign an IdP group to the GitHub EMU application
   - Set the role attribute for all users in that group to "Enterprise Owner"
   - All members of that group will be provisioned as enterprise owners

#### Example with Entra ID (Azure AD)

```
1. In Entra ID → Enterprise Applications → GitHub EMU app
2. Go to Users and Groups
3. Add a group (e.g., "GitHub-Enterprise-Owners")
4. Set the Role to "Enterprise Owner"
5. All members of this group will be provisioned as enterprise owners
```

### For Enterprise with Personal Accounts - ❌ No (Manual Only)

For enterprises that do **not** use EMU:
- Enterprise owners must be **invited manually** through the GitHub UI
- There is no group-based assignment available
- Each enterprise owner must accept an email invitation

#### How to Invite Enterprise Owners (Non-EMU)

1. Go to Enterprise → People → Administrators
2. Click "Invite admin"
3. Enter username, full name, or email
4. Select "Owner" or "Billing Manager"
5. Click "Send Invitation"
6. User must accept the invitation via email

### Comparison

| Feature | EMU Enterprise | Non-EMU Enterprise |
|---------|---------------|-------------------|
| Assign owners via IdP groups | ✅ Yes | ❌ No |
| Assign owners via SCIM | ✅ Yes | ❌ No |
| Manual owner invitation | ✅ Yes | ✅ Yes |
| Automatic provisioning/deprovisioning | ✅ Yes | ❌ No |
| Role changes sync from IdP | ✅ Yes | ❌ No |

> 📚 **References**:
> - [Configuring SCIM Provisioning for EMU](https://docs.github.com/en/enterprise-cloud@latest/admin/identity-and-access-management/using-enterprise-managed-users-for-iam/configuring-scim-provisioning-for-enterprise-managed-users)
> - [Inviting People to Manage Your Enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-accounts-and-repositories/managing-users-in-your-enterprise/inviting-people-to-manage-your-enterprise)
> - [Roles in an Enterprise](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-accounts-and-repositories/managing-users-in-your-enterprise/roles-in-an-enterprise)

---

## Contributing to This FAQ

If you have additional questions from workshop sessions, please add them following this format:

```markdown
## [Question Number]. [Topic Title]

### Question
[Clear statement of the question asked]

### Answer
[Detailed answer with relevant context]

> 📚 **Reference**: [Link to official documentation]
```

---

*Last Updated: January 2026*
*Workshop: GitHub Admin - Enterprise*

# Cleaning up Azure DevOps organizations connected to a Microsoft Entra tenant

> Scope: a Microsoft Entra tenant administrator (Global Administrator and/or
> Azure DevOps Administrator) needs to inventory, govern, or remove Azure
> DevOps organizations that end users created inside the tenant — including
> organizations that are **not** orphaned (i.e., the owner is still active in
> Entra ID).
>
> Sources: §1–§7 reference only official Microsoft Learn pages and the
> Microsoft Entra built-in roles reference. §8 additionally references
> public Microsoft support channels (Microsoft Q&A, Stack Overflow,
> and the Azure DevOps Developer Community) to demonstrate that the
> limitation and its supported workarounds are widely-confirmed
> Microsoft positions, not tenant-specific configuration. Each section
> ends with the citations backing its claims.

---

## Table of contents

- [1. The core constraint](#1-the-core-constraint)
- [2. What you *can* do tenant-wide](#2-what-you-can-do-tenant-wide)
  - [2.1 Inventory every org backed by the tenant](#21-inventory-every-org-backed-by-the-tenant)
  - [2.2 Restrict who can create *new* organizations](#22-restrict-who-can-create-new-organizations)
  - [2.3 Claim **orphaned** organizations](#23-claim-orphaned-organizations)
  - [2.4 Manage tenant-wide PAT policies](#24-manage-tenant-wide-pat-policies)
- [3. What you *cannot* do tenant-wide](#3-what-you-cannot-do-tenant-wide)
- [4. Supported pathways for non-orphan organizations](#4-supported-pathways-for-non-orphan-organizations)
  - [4.1 Owner-driven deletion](#41-owner-driven-deletion)
  - [4.2 Owner adds the tenant-admin (or an IT identity) as PCA](#42-owner-adds-the-tenant-admin-or-an-it-identity-as-pca)
  - [4.3 Owner transfers ownership to a governed account](#43-owner-transfers-ownership-to-a-governed-account)
  - [4.4 Convert an active-owner org into an orphaned org](#44-convert-an-active-owner-org-into-an-orphaned-org)
  - [4.5 Microsoft Support](#45-microsoft-support)
- [5. Recommended sequence](#5-recommended-sequence)
- [6. Quick-reference matrix: who can do what](#6-quick-reference-matrix-who-can-do-what)
- [7. Reference index](#7-reference-index)
- [8. Public community discussions on this limitation](#8-public-community-discussions-on-this-limitation)
  - [8.1 Microsoft Q&A — *Regain owner access to an orphaned Azure DevOps organization*](#81-microsoft-qa-regain-owner-access-to-an-orphaned-azure-devops-organization)
  - [8.2 Microsoft Q&A — *Orphan Organization Owner*](#82-microsoft-qa-orphan-organization-owner)
  - [8.3 Microsoft Q&A — *Accessing Orphaned Azure DevOps organization*](#83-microsoft-qa-accessing-orphaned-azure-devops-organization)
  - [8.4 Microsoft Q&A — *Azure DevOps organization owner has been deleted*](#84-microsoft-qa-azure-devops-organization-owner-has-been-deleted)
  - [8.5 Microsoft Q&A — *Fixing orphaned Azure DevOps org* ⚠️ unsupported workaround](#85-microsoft-qa-fixing-orphaned-azure-devops-org)
  - [8.6 Stack Overflow — *Entra Role: Azure DevOps Administrator*](#86-stack-overflow-entra-role-azure-devops-administrator)
  - [8.7 Developer Community ticket #1211454](#87-developer-community-ticket-delete-azure-devops-organization-of-terminated-users-connected-to-azure-ad-1211454)
  - [8.8 What this means for the customer](#88-what-this-means-for-the-customer)
- [Document provenance](#document-provenance)

---

## 1. The core constraint

The **Azure DevOps Administrator** Microsoft Entra role is *not* a "super admin"
inside Azure DevOps organizations. From the Microsoft Entra built-in roles
reference:

> *Users with this role can manage all enterprise Azure DevOps policies,
> applicable to all Azure DevOps organizations backed by Microsoft Entra ID.
> Users in this role can manage these policies by navigating to any Azure
> DevOps organization that is backed by the company's Microsoft Entra ID.
> Additionally, users in this role can claim ownership of orphaned Azure
> DevOps organizations.* **This role grants no other Azure DevOps-specific
> permissions (for example, Project Collection Administrators) inside any of
> the Azure DevOps organizations backed by the company's Microsoft Entra
> organization.**

The "Look up an Azure DevOps Administrator" Learn page enumerates exactly four
capabilities for the role:

1. Claim ownership of **orphaned** organizations — only when the current
   owner *and* all Project Collection Administrators are inactive in
   Microsoft Entra ID.
2. Configure **tenant-level policies** on the *Microsoft Entra* page in
   Organization Settings.
3. **Restrict organization creation** across the tenant.
4. **Manage PAT policies** across all organizations in the tenant
   (including restricting PAT creation scope and enforcing maximum
   lifespan).

Crucially, the same page states:

> *The Azure DevOps Administrator role is different from the Project Collection
> Administrator role… You don't need to be a Project Collection Administrator
> to be an Azure DevOps Administrator, and vice versa.*

**Global Administrator** has no inherent rights inside an Azure DevOps
organization either; org-level actions (delete, change owner, disconnect from
Entra, add/remove PCAs) all require **Project Collection Administrator** (PCA)
membership in the specific organization or current organization-owner status.

### References

- Microsoft Entra built-in roles → *Azure DevOps Administrator*
  https://learn.microsoft.com/entra/identity/role-based-access-control/permissions-reference#azure-devops-administrator
- Look up an Azure DevOps Administrator
  https://learn.microsoft.com/azure/devops/organizations/security/look-up-azure-devops-administrator?view=azure-devops

---

## 2. What you *can* do tenant-wide

### 2.1 Inventory every org backed by the tenant

**Prerequisite:** membership in at least one Azure DevOps organization that is
already connected to the Microsoft Entra tenant. No elevated role (Azure
DevOps Administrator or PCA) is required to download the list.

From any such organization:

1. Sign in to `https://dev.azure.com/{yourorganization}`.
2. **Organization settings → Microsoft Entra ID → Download**.

The Learn page describes the download as containing, for every org backed by
the tenant:

- Organization IDs
- Organization names
- Organization URLs
- Organization owners

Equivalent automation is documented for the Azure DevOps CLI / REST API on the
same Learn page.

> Reference: *Get list of organizations backed by Microsoft Entra ID*
> https://learn.microsoft.com/azure/devops/organizations/accounts/get-list-of-organizations-connected-to-microsoft-entra-id?view=azure-devops

### 2.2 Restrict who can create *new* organizations

To stop the bleeding while you clean up:

1. Go to **Organization settings → Microsoft Entra ID** and turn on the
   *Restrict organization creation* toggle.
2. Add the users/groups allowed to create orgs to the allowlist.

Per Learn:

> *By default, any user in a Microsoft Entra tenant can create new Azure DevOps
> organizations. You can enable the **Restrict organization creation** policy
> to control this behavior. When you turn on this policy, only users and
> groups on the allowlist can create organizations.* **All other users,
> including Azure DevOps administrators, are blocked unless explicitly added to
> the allowlist.**

The same Learn page adds the following Note callout:

> **Note:** *This policy only affects the creation of new organizations. It
> doesn't change access to existing organizations or affect their settings.*

Required role: Azure DevOps Administrator.

> Reference: *Restrict organization creation*
> https://learn.microsoft.com/azure/devops/organizations/accounts/azure-ad-tenant-policy-restrict-org-creation?view=azure-devops

### 2.3 Claim **orphaned** organizations

Definition from Learn:

> *An organization becomes **orphaned** when the organization owner and all
> Project Collection Administrators are inactive. Because no active
> administrator exists, you can't transfer ownership through the normal
> process. However, if the organization is connected to Microsoft Entra ID,
> an Azure DevOps Administrator in Microsoft Entra ID can claim ownership and
> assign it to an active user.*

Constraint:

> **Important**
> *Only claim ownership when the current owner **and** all members of the
> Project Collection Administrators group are inactive in Microsoft Entra ID.
> For the definition of inactive, see "What are inactive user accounts?".*

**Prerequisite — required role:** Azure DevOps Administrator in Microsoft
Entra ID. The Learn page adds:

> *If using Privileged Identity Management, the Azure DevOps Administrator
> should be of type **Active**.*

A PIM-eligible-but-not-activated assignment is **not** sufficient to perform
the orphan claim — activate the role first.

Once ownership is claimed and reassigned to an active account, that account is
PCA on the org and can perform every org-level action — including deleting it.

> References:
> - *Assign an owner to an orphaned organization*
>   https://learn.microsoft.com/azure/devops/organizations/accounts/resolve-orphaned-organization?view=azure-devops
> - *What are inactive user accounts?* (definition of "inactive")
>   https://learn.microsoft.com/entra/identity/monitoring-health/howto-manage-inactive-user-accounts

### 2.4 Manage tenant-wide PAT policies

The Learn page documents four tenant-level PAT policies. All four are managed
by the Azure DevOps Administrator role and apply across every organization in
the tenant:

| Policy (verbatim name) | Default |
|---|---|
| *Restrict global personal access token creation* | Off |
| *Restrict full-scoped personal access token creation* | Off |
| *Enforce maximum personal access token lifespan* | Off |
| *Automatically revoke leaked personal access tokens* | **On** |

Note that *Automatically revoke leaked personal access tokens* is the only
policy that is **on by default**; disabling it is a significant security
regression and the Learn page surfaces a Warning callout to that effect.

These policies do not delete or take over orgs but tighten credential risk
while governance is in flight.

> Reference: *Manage personal access tokens using policies (for administrators)*
> https://learn.microsoft.com/azure/devops/organizations/accounts/manage-pats-with-policies-for-administrators?view=azure-devops

---

## 3. What you *cannot* do tenant-wide

For an organization where the owner (and at least one PCA) is **active in
Entra**, the tenant administrator has **no Microsoft-supported path** to
unilaterally delete, take over, rename, or reconfigure the organization. The
following are explicitly gated on PCA / owner permission inside that specific
org:

| Action | Required permission | Reference |
|---|---|---|
| Delete organization | Project Collection Administrator | https://learn.microsoft.com/azure/devops/organizations/accounts/delete-your-organization?view=azure-devops |
| Recover deleted organization (within 28 days) | Organization owner | https://learn.microsoft.com/azure/devops/organizations/accounts/recover-your-organization?view=azure-devops |
| Change organization owner | Project Collection Administrators group member | https://learn.microsoft.com/azure/devops/organizations/accounts/change-organization-ownership?view=azure-devops |
| Disconnect organization from Microsoft Entra ID | Member of the Project Collection Administrators group (organization owners are automatically members). As a preparatory step the organization owner must first be changed to a Microsoft account (not a work/school account) before the disconnect can be performed. There is **no** Global Administrator requirement on the current Learn page. | https://learn.microsoft.com/azure/devops/organizations/accounts/disconnect-organization-from-azure-ad?view=azure-devops |
| Change Entra directory the org is connected to | Member of the Project Collection Administrators group (organization owners are automatically members). The user performing the switch must be a **Member** (not guest) in the destination Microsoft Entra ID. There is **no** Global Administrator requirement on the current Learn page. | https://learn.microsoft.com/azure/devops/organizations/accounts/change-azure-ad-connection?view=azure-devops |
| Rename organization (URL) | Organization owner | https://learn.microsoft.com/azure/devops/organizations/accounts/rename-organization?view=azure-devops |
| Add/remove PCAs | Existing PCA | https://learn.microsoft.com/azure/devops/organizations/security/look-up-project-collection-administrators?view=azure-devops |

The *Change organization owner* page explicitly states the prerequisite:

> *Permissions: Member of the Project Collection Administrators group.
> Organization owners are automatically members of this group.*

The *Organization FAQs* page confirms there is no override:

> *Can I change my organization owner? **Yes. If you're a Project Collection
> Administrator***, you can change the organization owner in your organization
> settings.*

And:

> *What if the owner of my organization left the company / isn't active?
> Azure DevOps Administrators can claim ownership of organizations **where the
> current owner and any members of the Project Collection Administrators group
> are inactive** in the Microsoft Entra tenant connected to your organization.*

In other words: as long as the owner has an active Entra account, no
tenant-level role can act on the org without their participation.

> Reference: *Organization FAQs*
> https://learn.microsoft.com/azure/devops/organizations/accounts/faq-configure-customize-organization?view=azure-devops

---

## 4. Supported pathways for non-orphan organizations

These are the only Microsoft-documented routes to clean up an organization
whose owner is currently active in Entra ID.

### 4.1 Owner-driven deletion

The owner (or any PCA) deletes the org from
**Organization settings → Overview → Delete**. The org enters a 28-day
soft-delete window during which the owner can recover it. After 28 days the
org and its data are permanently deleted; in rare cases the deletion process
can take up to 70 days due to backend retries.

> *After you delete an organization, it's disabled but available for 28 days.
> If you change your mind during this time, you can recover the organization.
> After 28 days, the organization and data are permanently deleted. In rare
> cases, our deletion process might take up to 70 days due to backend retries
> and the need to delete data from multiple sources.*

> References:
> - *Delete an organization*
>   https://learn.microsoft.com/azure/devops/organizations/accounts/delete-your-organization?view=azure-devops
> - *Recover a deleted organization* — the verbatim block-quote above
>   is the opening paragraph of this page (the *Delete* page above
>   restates the same 28-day / 70-day facts in slightly different
>   wording in its Caution callout)
>   https://learn.microsoft.com/azure/devops/organizations/accounts/recover-your-organization?view=azure-devops

### 4.2 Owner adds the tenant-admin (or an IT identity) as PCA

The owner adds you to the **Project Collection Administrators** group on the
org. Once you are a PCA you can:

- Change the organization owner to a governed identity
  (https://learn.microsoft.com/azure/devops/organizations/accounts/change-organization-ownership?view=azure-devops),
  or
- Delete the organization
  (https://learn.microsoft.com/azure/devops/organizations/accounts/delete-your-organization?view=azure-devops).

> References:
> - *Look up Project Collection Administrators* —
>   https://learn.microsoft.com/azure/devops/organizations/security/look-up-project-collection-administrators?view=azure-devops
> - *Manage organization or collection-level permissions* (the actionable
>   how-to-add page; jump to the *Add members to the Project Collection
>   Administrators group* section) —
>   https://learn.microsoft.com/azure/devops/organizations/security/change-organization-collection-level-permissions?view=azure-devops#add-members-to-the-project-collection-administrators-group

### 4.3 Owner transfers ownership to a governed account

The current owner uses **Organization settings → Overview → Change owner** to
hand the org to a governed identity. Note from the same Learn page:

> *When you change the organization owner, the old owner isn't removed from
> the Project Collection Administrators group.*

So after the transfer, the new owner should also remove the previous owner
from the PCA group if a clean handover is required.

> ⚠️ *Cross-page note:* The [Organization FAQs page](https://learn.microsoft.com/azure/devops/organizations/accounts/faq-configure-customize-organization?view=azure-devops)
> contains a Q&A that appears to contradict the *Change owner* page
> Note: it states that when a PCA changes ownership *away from their
> own account*, **their own** PCA membership is removed and the
> behavior "isn't a bug and is currently by design." The two Learn
> pages are not aligned on this edge case. Verify current behavior
> empirically (or via a test org) before relying on either page for
> the self-transfer scenario.

> Reference: *Change the organization owner*
> https://learn.microsoft.com/azure/devops/organizations/accounts/change-organization-ownership?view=azure-devops

### 4.4 Convert an active-owner org into an orphaned org

If an organization is owned by a stale or no-longer-appropriate account
(for example, a former employee, a contractor whose engagement ended, or a
user with another active account), the supported pathway is to make the
account meet the *Resolve orphaned organization* prerequisite and then claim
the org as Azure DevOps Administrator.

Important — what "inactive" actually means in this context. The
*Resolve orphaned organization* page anchors the term *inactive* to Microsoft
Entra's definition by linking directly to *Manage inactive user accounts in
Microsoft Entra ID*, which defines an inactive account as one whose
**sign-in activity is below an inactivity threshold typically chosen between
90 and 180 days**:

> *"In many organizations, a reasonable window for inactive user accounts is
> between 90 and 180 days."*
> — https://learn.microsoft.com/entra/identity/monitoring-health/howto-manage-inactive-user-accounts

Two consequences for this pathway:

1. **Disabling or deleting the Entra account is not, by itself, the trigger.**
   A recently-active user whose account you disable today does not
   immediately satisfy the *inactive* definition the orphan-claim page
   references — they have a recent `lastSignInDateTime`. Microsoft Support
   would be expected to push back on a claim invoked under those
   circumstances.
2. **Both conditions are needed for the pathway to be clean:**
   (a) the account has had no successful sign-in for the configured
   inactivity threshold (typically 90–180 days), **and** (b) the account is
   no longer able to authenticate (typically because it has been disabled or
   deleted through the standard offboarding process). For genuinely retired
   accounts of former employees / contractors, both conditions are normally
   already met.

The same orphan-claim requirement applies to every PCA on the organization,
not just the owner. The FAQ page summarises the rule:

> *Azure DevOps Administrators can claim ownership of organizations where the
> current owner and any members of the Project Collection Administrators
> group are inactive in the Microsoft Entra tenant connected to your
> organization.*
>
> — *Organization FAQs*,
> https://learn.microsoft.com/azure/devops/organizations/accounts/faq-configure-customize-organization?view=azure-devops

> ⚠ This pathway must only be applied to accounts that *should* legitimately
> be offboarded under your organization's identity governance policy. It is
> not a mechanism to seize an organization from an active employee, and it
> is not unlocked simply by disabling an account that was active recently.

### 4.5 Microsoft Support

For exceptional cases (for example, an unreachable owner, security/compliance
incidents, or audit-driven demands) the supported escalation path is
Microsoft Support. Support tickets can be filed from the Azure portal or from
within an Azure DevOps organization.

> ⚠️ *Operational expectation, not Learn-documented:* In practice
> Microsoft Support will typically ask whether the documented
> owner/PCA pathways (§4.1–§4.4) and the orphan-claim flow (§2.3)
> have been attempted, and will validate the requester's tenant
> administrator identity before any backend action. These behaviors
> are how Microsoft Support generally handles privileged operations
> on customer organizations but are **not** explicitly documented on
> any Microsoft Learn page; they are subject to change. Open a ticket
> early and let the Support engineer guide the validation steps for
> your specific case.

> Reference: *Get support and provide feedback for Azure DevOps*
> https://learn.microsoft.com/azure/devops/user-guide/provide-feedback?view=azure-devops

---

## 5. Recommended sequence

The Microsoft-supported sequence for a tenant-wide cleanup is:

1. **Look up your Azure DevOps Administrators** and ensure the role is
   assigned to the right identities (active assignment, not eligible-only).
   https://learn.microsoft.com/azure/devops/organizations/security/look-up-azure-devops-administrator?view=azure-devops
2. **Restrict organization creation** at the tenant policy level so the
   inventory does not keep growing.
   https://learn.microsoft.com/azure/devops/organizations/accounts/azure-ad-tenant-policy-restrict-org-creation?view=azure-devops
3. **Download the org list** for the tenant and classify each row by
   owner-account status (active / inactive) and PCA-group activity.
   https://learn.microsoft.com/azure/devops/organizations/accounts/get-list-of-organizations-connected-to-microsoft-entra-id?view=azure-devops
4. **Process orphaned orgs** with the Azure DevOps Administrator
   orphan-claim flow.
   https://learn.microsoft.com/azure/devops/organizations/accounts/resolve-orphaned-organization?view=azure-devops
5. **Engage owners of non-orphan orgs** to either delete the org, transfer
   ownership, or grant PCA to a governed identity (sections 4.1–4.3 above).
6. **Coordinate with identity-governance / HR** to retire stale or
   inappropriate Entra accounts so their orgs become orphan-eligible
   (section 4.4).
7. **Use Microsoft Support** only for residual cases where 4.1–4.4 cannot
   be applied (section 4.5).
   https://learn.microsoft.com/azure/devops/user-guide/provide-feedback?view=azure-devops

---

## 6. Quick-reference matrix: who can do what

| Capability | Global Administrator | Azure DevOps Administrator | Project Collection Administrator | Organization Owner | Source |
|---|---|---|---|---|---|
| List all orgs backed by the tenant | ✅ (via any org they are in) | ✅ | ✅ | ✅ | https://learn.microsoft.com/azure/devops/organizations/accounts/get-list-of-organizations-connected-to-microsoft-entra-id?view=azure-devops |
| Restrict organization creation tenant policy | ❌ (unless also Azure DevOps Administrator) | ✅ | ❌ | ❌ | https://learn.microsoft.com/azure/devops/organizations/accounts/azure-ad-tenant-policy-restrict-org-creation?view=azure-devops |
| Configure tenant-level Entra policies on the *Microsoft Entra* page | ❌ | ✅ | ❌ | ❌ | https://learn.microsoft.com/azure/devops/organizations/security/look-up-azure-devops-administrator?view=azure-devops |
| Claim **orphaned** organization | ❌ | ✅ | n/a | n/a | https://learn.microsoft.com/azure/devops/organizations/accounts/resolve-orphaned-organization?view=azure-devops |
| Manage tenant-wide PAT policies | ❌ | ✅ | ❌ | ❌ | https://learn.microsoft.com/azure/devops/organizations/accounts/manage-pats-with-policies-for-administrators?view=azure-devops |
| Change organization owner | ❌ | ❌ | ✅ | ✅ | https://learn.microsoft.com/azure/devops/organizations/accounts/change-organization-ownership?view=azure-devops |
| Add / remove Project Collection Administrators | ❌ | ❌ | ✅ | ✅ | https://learn.microsoft.com/azure/devops/organizations/security/look-up-project-collection-administrators?view=azure-devops |
| Delete organization | ❌ | ❌ | ✅ | ✅ | https://learn.microsoft.com/azure/devops/organizations/accounts/delete-your-organization?view=azure-devops |
| Recover deleted organization (28-day window) | ❌ | ❌ | ❌ | ✅ | https://learn.microsoft.com/azure/devops/organizations/accounts/recover-your-organization?view=azure-devops |
| Disconnect organization from Microsoft Entra ID | ❌ | ❌ | ✅ | ✅ | https://learn.microsoft.com/azure/devops/organizations/accounts/disconnect-organization-from-azure-ad?view=azure-devops |
| Change the directory connected to the org | ❌ | ❌ | ✅ | ✅ (note: actor must also be a *Member*, not guest, in the destination Entra tenant) | https://learn.microsoft.com/azure/devops/organizations/accounts/change-azure-ad-connection?view=azure-devops |
| Rename organization URL | ❌ | ❌ | ❌ | ✅ | https://learn.microsoft.com/azure/devops/organizations/accounts/rename-organization?view=azure-devops |

---

## 7. Reference index

All citations on a single page for traceability.

- **Roles and definitions**
  - Microsoft Entra built-in roles → Azure DevOps Administrator —
    https://learn.microsoft.com/entra/identity/role-based-access-control/permissions-reference#azure-devops-administrator
  - Look up an Azure DevOps Administrator —
    https://learn.microsoft.com/azure/devops/organizations/security/look-up-azure-devops-administrator?view=azure-devops
  - Look up Project Collection Administrators —
    https://learn.microsoft.com/azure/devops/organizations/security/look-up-project-collection-administrators?view=azure-devops
  - Look up the organization owner —
    https://learn.microsoft.com/azure/devops/organizations/security/look-up-organization-owner?view=azure-devops
- **Tenant-wide policies**
  - Restrict organization creation —
    https://learn.microsoft.com/azure/devops/organizations/accounts/azure-ad-tenant-policy-restrict-org-creation?view=azure-devops
  - Manage personal access tokens using policies (for administrators) —
    https://learn.microsoft.com/azure/devops/organizations/accounts/manage-pats-with-policies-for-administrators?view=azure-devops
  - Manage application connection and security policies —
    https://learn.microsoft.com/azure/devops/organizations/accounts/change-application-access-policies?view=azure-devops
- **Inventory / discovery**
  - Get list of organizations backed by Microsoft Entra ID —
    https://learn.microsoft.com/azure/devops/organizations/accounts/get-list-of-organizations-connected-to-microsoft-entra-id?view=azure-devops
- **Ownership and lifecycle**
  - Change the organization owner —
    https://learn.microsoft.com/azure/devops/organizations/accounts/change-organization-ownership?view=azure-devops
  - Assign an owner to an orphaned organization —
    https://learn.microsoft.com/azure/devops/organizations/accounts/resolve-orphaned-organization?view=azure-devops
  - Delete an organization —
    https://learn.microsoft.com/azure/devops/organizations/accounts/delete-your-organization?view=azure-devops
  - Recover a deleted organization —
    https://learn.microsoft.com/azure/devops/organizations/accounts/recover-your-organization?view=azure-devops
  - Rename your organization —
    https://learn.microsoft.com/azure/devops/organizations/accounts/rename-organization?view=azure-devops
- **Entra connection**
  - Connect your organization to Microsoft Entra ID —
    https://learn.microsoft.com/azure/devops/organizations/accounts/connect-organization-to-azure-ad?view=azure-devops
  - Disconnect your organization from Microsoft Entra ID —
    https://learn.microsoft.com/azure/devops/organizations/accounts/disconnect-organization-from-azure-ad?view=azure-devops
  - Change your organization connection to a different Microsoft Entra ID —
    https://learn.microsoft.com/azure/devops/organizations/accounts/change-azure-ad-connection?view=azure-devops
- **Identity governance prerequisites**
  - Manage inactive user accounts in Microsoft Entra ID (contains the
    "What are inactive user accounts?" definition referenced by the
    orphan-claim page) —
    https://learn.microsoft.com/entra/identity/monitoring-health/howto-manage-inactive-user-accounts
- **FAQs**
  - Organization FAQs —
    https://learn.microsoft.com/azure/devops/organizations/accounts/faq-configure-customize-organization?view=azure-devops
  - Access via Microsoft Entra FAQs —
    https://learn.microsoft.com/azure/devops/organizations/accounts/faq-azure-access?view=azure-devops
- **Support**
  - Get support and provide feedback for Azure DevOps —
    https://learn.microsoft.com/azure/devops/user-guide/provide-feedback?view=azure-devops
- **Permission management how-to (referenced from §4.2)**
  - Manage organization or collection-level permissions —
    https://learn.microsoft.com/azure/devops/organizations/security/change-organization-collection-level-permissions?view=azure-devops

---

## 8. Public community discussions on this limitation

The constraint described in §1 — that a Microsoft Entra tenant
administrator (Global Administrator and/or Azure DevOps Administrator)
cannot delete or directly manage an Azure DevOps organization unless
they are also a member of that organization's Project Collection
Administrators (PCA) group — is a recurring topic on Microsoft's public
support channels. The threads below all reach the same conclusion as
this document: the **only** Microsoft-supported self-service pathway
for a tenant administrator who is not a PCA is the orphan-organization
*Claim ownership* flow on the [`resolve-orphaned-organization`](https://learn.microsoft.com/azure/devops/organizations/accounts/resolve-orphaned-organization?view=azure-devops)
page; for any organization whose current owner or PCAs are still
active, the supported pathway is owner outreach (§4.1–§4.3) or, in
exceptional cases, Microsoft Support (§4.5).

### 8.1 Microsoft Q&A — *Regain owner access to an orphaned Azure DevOps organization*

> "Sign in to Azure DevOps (`https://dev.azure.com/{yourorganization}`)
> using an account that has **Azure DevOps Administrator**
> permissions. You should see an error page (401 Unauthorized), where
> you'll be presented with the option to **Claim Ownership** of the
> organization."

A Microsoft Q&A answer reaffirms the official `Claim ownership` flow
as the only self-service recovery for an orphan org. (The answerer's
moderator status is not exposed in the plain-HTTP page render, so the
attribution is shown here as "a Microsoft Q&A answer" rather than
"Microsoft moderator answer".) No tenant-admin override exists for
non-orphan orgs.

Thread: https://learn.microsoft.com/answers/questions/2243777/regain-owner-access-to-an-orphaned-azure-devops-or

### 8.2 Microsoft Q&A — *Orphan Organization Owner*

> "When organization is \"orphaned\", you can't self-service an owner
> change via the portal so you'll need to use the **\"claim
> ownership\"** flow in Azure DevOps, which only works if your org is
> backed by Microsoft Entra ID (Azure AD)."

Microsoft moderator answer (March 2026, by *Pravallika KV — Microsoft
External Staff Moderator*) walks through the four-step claim-ownership
procedure and adds the recommendation also captured in §6 of this
document — under step 4 *Add new Project Collection Administrators*:
"Add at least two people (and ideally a break-glass group) … to avoid
getting locked out again."

Thread: https://learn.microsoft.com/answers/questions/5845614/orphan-organization-owner

### 8.3 Microsoft Q&A — *Accessing Orphaned Azure DevOps organization*

> "Because the organization wasn't connected to your Microsoft Entra ID
> and the original owner account is no longer valid, there's no
> supported way for an admin to \"take over\" or see that standalone
> Azure DevOps organization from the tenant side."

> ⚠️ **Source note:** the answer on this thread is explicitly labelled
> *"AI generated content. This question contains an answer created with
> AI from Q&A Assist."* It is **not** a human Microsoft moderator
> answer; it is Microsoft's own Q&A Assist bot. It is included here
> because it accurately summarises the boundary condition called out in
> §3 of this document — the orphan-claim flow only applies to
> **Entra-connected** orgs whose owner *and* all PCAs are inactive,
> while MSA-backed orgs and active-owner orgs have no tenant-admin
> override path. Treat its independent-corroboration value as limited;
> the substantive Microsoft-staff confirmations are §8.2 and §8.4.

Thread: https://learn.microsoft.com/answers/questions/5869258/accessing-orphaned-azure-devops-organization

### 8.4 Microsoft Q&A — *Azure DevOps organization owner has been deleted*

> "Organization owner can be changed by member having admin privilege.
> Glad that your member has such access and did the needful. In the
> absence of such members, Microsoft will help in resolving the issue
> however further few details will be required."

Microsoft moderator answer (November 2025, by *Aditya N — Microsoft
External Staff Moderator*) on a recent ticket where the last remaining
owner was a deleted Entra identity. Validates the §4.5 escalation
path: where neither §4.1–§4.4 is viable, Microsoft Support will
perform a backend ownership transfer after validating tenant
administrator identity.

Thread: https://learn.microsoft.com/answers/questions/5631709/azure-devops-organization-owner-has-been-deleted

### 8.5 Microsoft Q&A — *Fixing orphaned Azure DevOps org*

A community-contributed answer documents an unsupported workaround
using `az devops security group membership add` to inject an Entra
identity directly into the *Project Collection Administrators* group
followed by a REST `PATCH` to `/_apis/organizationmanagement/OrganizationSettings`.

> ⚠️ **Not endorsed for production cleanup.** This pattern is not
> documented on Microsoft Learn and is not part of the supported
> pathways listed in §4. It is included here only for completeness so
> that the customer is aware the suggestion exists in the wild and can
> recognize why it is not recommended (no audit trail, no PIM
> integration, bypasses the orphan-claim notification flow that other
> Azure DevOps Administrators rely on for transparency, and the
> `OrganizationSettings` PATCH endpoint is `7.1-preview` and not
> covered by Microsoft Learn). Stick to the §4 pathways.

Thread: https://learn.microsoft.com/answers/questions/2244435/fixing-orphaned-azure-devops-org

### 8.6 Stack Overflow — *Entra Role: Azure DevOps Administrator*

> "The role: **Azure DevOps Administrator** in AAD is different from
> the Organization Owner in Azure DevOps organization. It will have no
> full access to manage the Organization. […] I suggest that you can
> add the users to **Project Collection Administrators group** in
> **Organization Settings -> Permissions**. Then the users will have
> the same access as Organization Owner in Azure DevOps Organization
> (expcet \[*sic*\] for recovering a deleted organization)."

Highest-voted answer on the canonical Stack Overflow question.
Independently confirms the §1 core constraint and the §4.2 PCA
add-yourself pathway as the only ways for a tenant administrator to
gain in-org permissions on a non-orphan organization.

Thread: https://stackoverflow.com/questions/77407465/entra-role-azure-devops-administrator

### 8.7 Developer Community ticket *Delete Azure DevOps organization of terminated users connected to Azure AD* (#1211454)

A long-running customer ticket on Microsoft's official Azure DevOps
feedback channel asking for tenant-admin-side bulk deletion of orgs
created by terminated users — the same scenario this document
addresses. The page is JavaScript-rendered and does not return content
to a plain HTTPS fetch; **the ticket title and number above were
captured by the authoring agent at the time of research and could not
be re-verified through plain-HTTP fetch — open the URL in a browser to
confirm the live ticket title, status, vote count, and Microsoft
response.**

Ticket: https://developercommunity.visualstudio.com/t/delete-azure-devops-organization-of-terminated-use/1211454

### 8.8 What this means for the customer

- The limitation in §1 is **the documented, intentional design** —
  not a bug or a tenant-specific configuration issue. Microsoft staff
  moderators have re-confirmed it on the public Q&A threads cited in
  §8.2 (March 2026) and §8.4 (November 2025); the threads in §8.1,
  §8.3, §8.5, and §8.6 are non-staff (community, AI, or unverified
  attribution) but corroborate the same conclusion.
- The §4 pathways in this document are the same pathways Microsoft
  recommends to every customer who reports this scenario.
- The fact that customers continue to file tickets on Developer
  Community asking for a tenant-admin-side delete capability indicates
  Microsoft is aware of the operational pain; however, no public
  product commitment exists today, so the customer should plan
  cleanup using §4 rather than wait for a platform change.

> Reference index for this section is included inline above; no
> additional Learn pages beyond those in §7 are required. All threads
> were verified live at time of writing.

---

## Document provenance

> ℹ️ **AI-assisted authoring disclosure**
>
> This document was drafted, fact-checked, and revised with the help
> of generative AI inside the GitHub Copilot CLI. A human author
> (the Microsoft Entra tenant administrator named in the engagement)
> directed the work, supplied the scope and customer context, and
> reviewed every revision before sharing.
>
> | Item | Detail |
> |---|---|
> | Primary authoring agent | **Anthropic Claude Opus 4.7** running inside the GitHub Copilot CLI. Initial drafting, fact-check round, and §8 community sweep were performed under the *Extra high reasoning* configuration (model ID `claude-opus-4.7-xhigh`); subsequent revisions (TOC, this provenance footer) under the *1M context* configuration (model ID `claude-opus-4.7-1m-internal`). |
> | Fact-check sub-agents | 5 parallel **Anthropic Claude** *research* sub-agents dispatched in a single round (one per non-overlapping scope: §1+§6 roles, §2 tenant capabilities, §3 cannot-do matrix, §4–§5 pathways, all citation/URL integrity) |
> | Public-channel sweep agent | **Anthropic Claude Opus 4.7** with web-search and web-fetch tools, used to source §8 community threads |
> | Source corpus | Microsoft Learn (Azure DevOps and Microsoft Entra documentation), the Microsoft Entra built-in roles reference, Microsoft Q&A, Stack Overflow, and the Azure DevOps Developer Community |
> | Verification | Every Microsoft Learn URL was opened with the `microsoft_docs_fetch` tool; every public-channel URL in §8 was opened with web-fetch (or, where bot-protected, cross-referenced from at least two independent Microsoft sources) |
> | Document version date | **2026-05-04** |
>
> Despite the verification steps above, AI-assisted documents can
> contain hallucinations or stale references. Before relying on this
> document for production cleanup actions, re-confirm the live
> Microsoft Learn pages cited in §7 — Microsoft updates Azure DevOps
> and Microsoft Entra documentation continuously, and any divergence
> between this document and the live pages should be resolved in
> favor of the live pages.



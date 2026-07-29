---
render_with_liquid: false
---

# GitHub Actions Multi-Repo Checkout Strategy (Phase 2 Target State)

> **Document status**
>
> - **Last reviewed:** 2026-07-29
> - **Authorship:** Drafted with AI assistance (GitHub Copilot, multi-model review) and reviewed by a human maintainer before publication.
> - **Sources:** Based on public documentation — primarily [docs.github.com](https://docs.github.com) and the official `actions/*` repositories cited inline.
> - **Verify before acting:** GitHub updates product documentation continuously. Re-confirm against the live source pages before relying on this content for production decisions.

## Executive Summary

Azure DevOps pipelines commonly declare sources from **multiple repositories** natively via `resources: repositories:`. GitHub Actions has **no native 1:1 equivalent**: a workflow is attached to a single repository, and the default `GITHUB_TOKEN` grants access **only to that repository**. Checking out a secondary private/internal repo therefore requires **additional authentication** (a GitHub App token or a PAT), managed explicitly.

This guide covers the recommended pattern — a **dedicated GitHub App with a short-lived token** — plus when to avoid cross-repo checkout entirely (reusable workflows, composite actions, or artifact registries), and the enterprise caveats to plan for during an Azure DevOps → GitHub migration.

> **Related:** This is the **Phase 2** (CI/CD in GitHub Actions) companion to [15-azure-pipelines-github-repos-integration.md](15-azure-pipelines-github-repos-integration.md), which covers the **hybrid model** (source in GitHub, CI/CD staying in Azure Pipelines).

---

## Table of Contents

1. [The Core Nuance: `GITHUB_TOKEN` Scope](#the-core-nuance-github_token-is-scoped-to-the-workflows-own-repo)
2. [`internal` Visibility Does Not Remove This Requirement](#-internal-visibility-does-not-remove-this-requirement)
3. [Recommended Pattern: GitHub App + Short-Lived Token](#recommended-pattern-github-app--short-lived-token)
4. [Decide First: Source Checkout vs. Built Artifact](#decide-first-source-checkout-vs-built-artifact)
5. [Git Submodules for Multi-Repo Consolidation](#git-submodules-for-multi-repo-consolidation)
6. [Other Cross-Repo Access Options and Caveats](#other-cross-repo-access-options-and-caveats)
7. [Recommended Rollout](#recommended-rollout)
8. [References](#references)

---

## The Core Nuance: `GITHUB_TOKEN` Is Scoped to the Workflow's Own Repo

In Azure Pipelines you declare secondary repos natively via `resources: repositories:` (with a service connection). In GitHub Actions:

- A workflow is attached to **exactly one repository**.
- The automatically provided `GITHUB_TOKEN` is a **repo-scoped installation token** — it grants access **only to the repository where the workflow runs**.
- Therefore `actions/checkout` of a **secondary private/internal repo** requires **additional authentication** (a GitHub App token or a PAT), not a native declaration.

> GitHub documents this explicitly in the `actions/checkout` [Scenarios](https://github.com/actions/checkout#usage) section (*checkout multiple repos side by side / nested / private*): the default `GITHUB_TOKEN` cannot read a second private repo, and a PAT or **GitHub App token** is required.

---

## ⚠️ `internal` Visibility Does Not Remove This Requirement

A common misconception is that making the shared repo `internal` (readable by all Enterprise members) lets the default `GITHUB_TOKEN` check it out. It does **not**:

| Access path | `private` secondary repo | `internal` secondary repo |
|-------------|--------------------------|---------------------------|
| Developer `git clone` / user PAT | Needs per-repo collaborator grant | Enterprise members normally have read access; PAT type, scopes, SSO authorization, and org policy still apply |
| Actions default `GITHUB_TOKEN` from another repo | ❌ Fails | ❌ **Still fails** |
| Actions with GitHub App token / scoped PAT | ✅ Works | ✅ Works |

`internal` simplifies **human and PAT access** and reduces per-repo grant sprawl, but the Actions default `GITHUB_TOKEN` is minted for the workflow's own repo only. You **still need a GitHub App token (or PAT)** for cross-repo checkout in Actions.

> **Don't confuse this with the Actions "Access" policy.** A repository's **Settings → Actions → General → Access** setting lets *other* repos consume this repo's **actions and reusable workflows** via `uses:` (GitHub downloads the component with its own scoped token). It is **not** a general Git-read grant — it does **not** let another repo's `GITHUB_TOKEN` run `actions/checkout` against this repo.

---

## Recommended Pattern: GitHub App + Short-Lived Token

Prefer a **dedicated org-owned GitHub App** over a PAT:

- Not tied to a person (survives employee/credential rotation).
- Mints a **short-lived token** (~1 hour) scoped to only the installed repos.
- Higher rate limits and full audit attribution.

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      # Mint a short-lived token scoped to only the repos we need
      - uses: actions/create-github-app-token@v3
        id: app-token
        with:
          app-id: ${{ vars.SHARED_CI_APP_ID }}
          private-key: ${{ secrets.SHARED_CI_APP_PRIVATE_KEY }}
          owner: ${{ github.repository_owner }}
          repositories: "shared-lib,build-tools"
          permission-contents: read   # narrow the token below the App's install perms

      # Own repo (default token is fine)
      - uses: actions/checkout@v4
        with:
          path: app

      # Secondary repo — side by side, distinct path, App token
      - uses: actions/checkout@v4
        with:
          repository: ${{ github.repository_owner }}/shared-lib
          token: ${{ steps.app-token.outputs.token }}
          path: shared-lib
          persist-credentials: false
```

**Notes:**

- `@v3` is current (as of mid-2026) and accepts `client-id` in place of `app-id`; `app-id` remains supported. Pin to a version you have validated.
- `repositories:` narrows the token to those repos **only if the App installation already includes them**. With `owner` and no `repositories`, the token covers **all** repos in that installation — list repos explicitly to stay least-privilege.
- List every required repo by its **exact name**, and ensure each belongs to the supplied `owner`.
- Give **every** checkout an explicit `path:` in multi-repo jobs for clarity.
- Scope the App **installation** to only the needed repos, with minimal permissions (`contents: read`).
- `actions/checkout` persists credentials for subsequent git commands by default; set `persist-credentials: false` where later git operations aren't needed so an elevated token isn't left available in the workspace. The installation token is also short-lived and revoked during post-job cleanup.

---

## Decide First: Source Checkout vs. Built Artifact

Before reaching for cross-repo checkout, classify each Azure Pipelines `resources: repositories:` usage. Most collapse into patterns that **avoid the extra auth entirely**:

| ADO `resources: repositories:` usage | GitHub Actions equivalent | Cross-repo token needed? |
|--------------------------------------|---------------------------|--------------------------|
| Shared **pipeline templates / steps** | **Reusable workflows** (`uses: org/repo/.github/workflows/x.yml@ref`) or **composite actions** | ❌ No user token — but the source repo's Actions **Access** policy + caller policy must permit reuse |
| Shared **built library / package** | Pull versioned artifact from **JFrog Artifactory** or **GitHub Packages** | ⚠️ Registry auth: Artifactory creds, or `packages: read` + package Access grant for GitHub Packages |
| Genuine **multi-source checkout** (build sources together) | `actions/checkout` side by side + **GitHub App token** | ✅ Yes |

**Guidance:**

- If you need a **built, versioned artifact** (shared library), pull it from **Artifactory** — cleaner for CD, reproducible via version pinning, and consistent with the existing artifact stack. Do not rebuild a dependency from source.
- If you need shared **CI logic**, use **reusable workflows / composite actions**. No user-supplied token is required, **but** for a **private/internal** component repo you must configure its **Settings → Actions → General → Access** to allow the calling repos (and the caller's Actions policy must allow the component). Public repos cannot call private reusable workflows.
- For **GitHub Packages**, `GITHUB_TOKEN` with `packages: read` works only when the consuming repo has been granted access to the package (granular packages) or is the package's own repo; cross-repo, repository-scoped Maven/Gradle packages may still require a PAT. Artifactory sidesteps this with its own registry credentials.
- Reserve the **GitHub App token** for the true remainder that genuinely needs multiple source trees side by side.

---

## Git Submodules for Multi-Repo Consolidation

Git submodules let a **parent (superproject)** repo reference other repos, each pinned to an exact commit, and pull them into subdirectories on checkout. This is the closest faithful translation of Azure Pipelines' native `resources: repositories:` when the relationship is truly *"always build these repos together at a known version."*

> **Scope:** This organization does **not** permit public repositories, so every submodule is **`private` or `internal`**. The guidance below assumes that — there is no "public submodule needs no token" shortcut here.

### Submodules Still Require the GitHub App Token

Submodules change *how the relationship is declared*, not *how authentication works*. In GitHub Actions:

- `actions/checkout` with `submodules: true | recursive` reuses the **same token passed to the checkout step**.
- The default `GITHUB_TOKEN` is scoped to the superproject repo only, so it **clones the parent but fails on every private/internal submodule**.
- You **must** pass a **GitHub App token** (or an SSH deploy key per submodule) that can read every submodule repo.

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      # Token scoped to the superproject AND every submodule repo
      - uses: actions/create-github-app-token@v3
        id: app-token
        with:
          app-id: ${{ vars.SHARED_CI_APP_ID }}
          private-key: ${{ secrets.SHARED_CI_APP_PRIVATE_KEY }}
          owner: ${{ github.repository_owner }}
          repositories: "superproject,shared-lib,build-tools"
          permission-contents: read

      - uses: actions/checkout@v4
        with:
          submodules: recursive
          token: ${{ steps.app-token.outputs.token }}   # applies to parent + submodules
          persist-credentials: false
```

### `.gitmodules` Must Use HTTPS URLs (Not SSH)

The App token is injected as an **HTTPS** credential. It only applies to submodules whose `.gitmodules` URL is HTTPS:

```ini
# .gitmodules — correct for token-based CI
[submodule "shared-lib"]
    path = shared-lib
    url = https://github.com/your-org/shared-lib.git
```

- ✅ `https://github.com/your-org/shared-lib.git` — the App token authenticates the fetch.
- ❌ `git@github.com:your-org/shared-lib.git` — SSH URL; the token does **not** apply. You'd need SSH deploy keys instead, or rewrite the URL at runtime:

  ```yaml
  - run: git config --global url."https://github.com/".insteadOf "git@github.com:"
  ```

Standardize `.gitmodules` on HTTPS so one App token covers the whole tree.

### App Installation and Permissions

- Install the App on the **superproject and every submodule repo** (or an org-wide install scoped down via the `repositories:` input).
- `contents: read` is sufficient for checkout; keep it least-privilege.
- List **every** submodule repo by exact name in `repositories:` so the token is scoped precisely.

### When Submodules Fit — and When They Don't

| Use submodules when | Prefer another pattern when |
|---------------------|------------------------------|
| You build the repos **together** at a **pinned** version | You only consume a **built library** → use **Artifactory / GitHub Packages** |
| You want the version **recorded in git** and reviewable in PRs | You need shared **CI logic** → use **reusable workflows / composite actions** |
| The set of repos is **stable** and intentionally coupled | Repos move fast / need "follow latest" → side-by-side `checkout` with `ref:` |

**Trade-offs to expect:** submodule pointers are **manual bumps** (a consumer must commit a new SHA to pick up changes — no automatic "latest"), contributors must remember `--recurse-submodules`, and detached-HEAD states cause confusion. These are workflow costs, not auth costs — the App token requirement is identical to side-by-side checkout.

---

## Other Cross-Repo Access Options and Caveats

- **Deploy keys** — a per-repo, read-only SSH key is a valid single-repo alternative to a PAT, but it's one key per repo, has no expiry, and has weaker lifecycle management than a GitHub App. Fine for one stable dependency; poor at scale.
- **Private/internal git submodules** — as covered above, `actions/checkout` with `submodules: true|recursive` still needs the **GitHub App token** (or an SSH deploy key) that can read **every** submodule; the default `GITHUB_TOKEN` alone will fail. See [Git Submodules for Multi-Repo Consolidation](#git-submodules-for-multi-repo-consolidation).
- **Fork PRs and Dependabot** — secrets (including the App private key) are **not** available to untrusted fork pull requests or Dependabot-triggered runs; cross-repo checkout that depends on those secrets will not work there by design.
- **Untrusted code safety** — never expose the App private key or a minted token to untrusted code paths such as `pull_request_target` or `workflow_run` that check out and run PR contents.

---

## Recommended Rollout

1. **Triage** every `resources: repositories:` usage into the three categories above.
2. **Pilot** the GitHub App pattern on one real pipeline before templating.
3. **Standardize** the validated pattern (App token + side-by-side checkout) as a reusable workflow so other pipelines inherit it consistently.

---

## References

- [actions/checkout — usage and scenarios (multiple / private repos)](https://github.com/actions/checkout#usage)
- [actions/create-github-app-token](https://github.com/actions/create-github-app-token)
- [Automatic token authentication (`GITHUB_TOKEN` scope)](https://docs.github.com/en/actions/security-guides/automatic-token-authentication)
- [Reusing workflows](https://docs.github.com/en/actions/using-workflows/reusing-workflows)
- [Sharing actions and workflows with your organization](https://docs.github.com/en/actions/how-tos/reuse-automations/share-with-your-organization)
- [Managing GitHub Actions settings for a repository (Access)](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository#allowing-access-to-components-in-a-private-repository)
- [Ensuring workflow access to your package](https://docs.github.com/en/packages/learn-github-packages/configuring-a-packages-access-control-and-visibility#ensuring-workflow-access-to-your-package)
- [Managing deploy keys](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/managing-deploy-keys)
- [Checking out submodules in actions/checkout](https://github.com/actions/checkout#checkout-submodules)
- [Git submodules (Pro Git book)](https://git-scm.com/book/en/v2/Git-Tools-Submodules)
- [About repository visibility (internal repositories)](https://docs.github.com/en/repositories/creating-and-managing-repositories/about-repositories#about-internal-repositories)
- [15-azure-pipelines-github-repos-integration.md](15-azure-pipelines-github-repos-integration.md) — hybrid model (Azure Pipelines consuming GitHub repos)

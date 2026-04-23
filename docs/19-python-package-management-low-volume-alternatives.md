# Low-volume private Python packages on GitHub — alternatives to JFrog and SaaS

*Research compiled 2026-04-21. Backing reports in `./files/research-low-volume-python-hosting.md` (Claude Sonnet 4.6) and `./files/research-private-actions-poetry.md` (GPT-5.3-Codex).*

**Scenario:** 5–20 private Python packages, ~10 pushes/month, ~100 installs/month. GitHub-hosted org, Poetry + pip. You want to avoid JFrog/Cloudsmith/Gemfury costs at this scale.

---

## TL;DR — answer to both your questions

### Q1 — "Can we use ACR or similar instead of JFrog?"

**Yes, several viable alternatives exist for low volume**, ranked best-to-worst for your situation:

| Rank | Option | Monthly cost | pip-native? | OIDC? | Verdict |
|---|---|---|---|---|---|
| 🥇 **1** | **Azure Artifacts free tier (2 GiB/org)** | **$0** | ✅ | ❌ (PAT only) | **Cheapest legitimate registry. If you tolerate a PAT, this is the simplest "just works" path.** |
| 🥈 **2** | **Azure Blob Storage as a static PEP 503 index** | **<$0.10** | ✅ | ✅ (push) / SAS (pull) | **Cheapest pip-native option. Real simple index, no glue code. Best if you're Azure-shop and OK with SAS token rotation.** |
| 🥉 **3** | **Self-hosted pypiserver or devpi** on Azure Container Apps / App Service free tier | **$0–$15** | ✅ | ❌ (basic auth) | **Only if you want full PyPI semantics + OSS + self-host, and you're OK operating a tiny service.** |
| 4 | **AWS S3 static index (`s3-pypi` / `dumb-pypi`)** | <$0.10 | ✅ | ✅ (push) | AWS equivalent of #2; auth on read is weaker (pip doesn't speak SigV4) |
| 5 | **ACR + ORAS** (OCI artifacts) | ~$5 (Basic) | ❌ | ✅ | **Only pick this if you already own ACR.** `pip` can't install OCI artifacts directly — you need a glue step every install. Not recommended as a primary pattern. |
| 6 | **GHCR + ORAS** | ~$0 | ❌ | ✅ | Same limitation as ACR. The "GitHub-native" appeal is real but pip can't consume it. |
| 7 | **Poetry git-deps + private composite Action** | **$0** | ❌ (not a registry) | ✅ | **Great for 1–5 tiny libs. Breaks down past that.** Details in Q2. |

### Q2 — "Can we use a private GitHub Action with Poetry to install private Python packages?"

**Yes — and for your volume (few packages), this is actually a serious contender.** A private **composite Action** in a private repo can be called by every other repo in the org. It bundles `setup-python + install-poetry + configure-git-auth + poetry-install` into one reusable step. Combined with `git+https://` deps in `pyproject.toml`, this gives you a registry-free workflow that costs $0.

**But it is not a replacement for a package registry.** It's an orchestration/boilerplate-reduction pattern. No dependency resolution across private libs that depend on each other, no proxying of public PyPI, no retention policy, install latency grows with N.

**Upgrade signal:** when you exceed ~5 private packages, or private packages start depending on each other, move to a real index (Azure Artifacts free tier, Azure Blob static index, or Cloudsmith).

---

## Option 1 — Azure Artifacts free tier *(my top pick for your profile)*

**Why this wins:**
- 2 GiB free per Azure DevOps organization — easily covers 5–20 small Python packages for years.
- Real PyPI-compatible feed. pip, Poetry, and twine work without glue.
- Upstream proxying of public PyPI is built in (so consumers get one index URL).
- Microsoft-maintained; no ops burden.

**Trade-offs you must accept:**
- You're creating an Azure DevOps org even if you don't use ADO otherwise. (Free; 5 min setup.)
- Auth is PAT-based for pip/Poetry workflows. GitHub OIDC → Azure managed identity → Azure DevOps personal access token is doable but requires a Microsoft token-exchange step.

**Poetry config:**
```toml
[[tool.poetry.source]]
name = "internal"
url = "https://pkgs.dev.azure.com/<ORG>/<PROJECT>/_packaging/<FEED>/pypi/simple/"
priority = "explicit"   # force internal packages to come from here
```

**Publish (GitHub Actions):**
```yaml
- run: poetry config http-basic.internal "" "${{ secrets.ADO_PAT }}"
- run: poetry publish --repository internal --build
```

**Verdict:** If you don't have a strong reason not to touch Azure DevOps, **start here**. It's the lowest-effort legitimate registry available at your scale.

---

## Option 2 — Azure Blob Storage as a static PEP 503 index

**Why this works:**
- You generate a tiny HTML index (PEP 503 "simple" format) from your wheel filenames and upload it + the wheels to a private blob container.
- `pip` and Poetry consume it **natively** via `--index-url` + a SAS token.
- Cost at your volume: **well under $0.10/month.**
- Push side uses GitHub OIDC → Azure managed identity (no stored secrets).

**The index-regeneration workflow:**
```yaml
name: publish-wheel-to-blob
on:
  push:
    tags: ["v*"]

permissions:
  id-token: write
  contents: read

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-python@v6
        with: { python-version: "3.12" }
      - run: pip install poetry dumb-pypi
      - run: poetry build --format wheel
      - uses: azure/login@v2
        with:
          client-id:        ${{ secrets.AZ_CLIENT_ID }}
          tenant-id:        ${{ secrets.AZ_TENANT_ID }}
          subscription-id:  ${{ secrets.AZ_SUBSCRIPTION_ID }}
      # Upload wheels
      - run: az storage blob upload-batch
          --account-name myorgpypi --destination 'wheels'
          --source dist --overwrite --auth-mode login
      # Regenerate the simple index from the container contents
      - run: |
          dumb-pypi --package-list <(az storage blob list \
              --account-name myorgpypi --container-name wheels \
              --auth-mode login --query '[].name' -o tsv) \
            --packages-url https://myorgpypi.blob.core.windows.net/wheels \
            --output-dir ./index
          az storage blob upload-batch \
            --account-name myorgpypi --destination 'simple' \
            --source ./index --overwrite --auth-mode login
```

**Consumer `pyproject.toml`:**
```toml
[[tool.poetry.source]]
name = "internal"
url = "https://myorgpypi.blob.core.windows.net/simple/?<SAS_TOKEN>"
priority = "explicit"
```

**Trade-offs:**
- SAS token rotation is your responsibility. Roll it via a GitHub secret update every 90 days.
- No retention/cleanup policy unless you script it.
- No audit log of who pulled what (Azure Monitor on blob access can provide this).

**Verdict:** Cheapest pip-native option. Excellent if you're Azure-shop and want near-zero cost with real PEP 503 semantics.

---

## Option 3 — Private composite GitHub Action + Poetry git-deps

This directly answers your second question.

### Architecture
- Your private libraries are individual private GitHub repos with a normal `pyproject.toml`.
- Consumer repos declare them as git-deps in `pyproject.toml`, pinning by commit SHA.
- A single **private composite Action** in e.g. `your-org/.github-actions/poetry-install-private` encapsulates setup + auth so every consumer repo just calls one step.

### `action.yml` (private composite action)
```yaml
name: "Poetry install (private git deps)"
description: "setup-python + poetry + git auth + poetry install, for repos with private GitHub git deps"

inputs:
  python-version: { default: "3.12", required: false }
  poetry-version: { default: "1.8.4", required: false }
  github-token:   { required: true, description: "Token with Contents:Read on dep repos" }
  working-directory: { default: ".", required: false }

runs:
  using: "composite"
  steps:
    - uses: actions/setup-python@v6
      with: { python-version: ${{ inputs.python-version }} }

    - shell: bash
      run: |
        python -m pip install --upgrade pip
        python -m pip install "poetry==${{ inputs.poetry-version }}"

    # Rewrite git+https URLs to use the installation token transparently
    - shell: bash
      run: |
        git config --global \
          url."https://x-access-token:${{ inputs.github-token }}@github.com/".insteadOf \
          "https://github.com/"

    - shell: bash
      working-directory: ${{ inputs.working-directory }}
      run: poetry install --no-interaction --no-ansi
```

### Consumer `pyproject.toml`
```toml
[tool.poetry.dependencies]
python = ">=3.11,<4.0"
acme-lib  = { git = "https://github.com/your-org/acme-lib.git",  rev = "3b6c5f9a..." }
acme-core = { git = "https://github.com/your-org/acme-core.git", rev = "a1b2c3d4..." }
```

**Always pin to full commit SHAs in production.** Tags are mutable on GitHub.

### Caller workflow in a consumer repo
```yaml
name: ci
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      # Mint a GitHub App token with Contents:Read on the dep repos
      - uses: actions/create-github-app-token@v3
        id: app-token
        with:
          client-id:       ${{ vars.APP_CLIENT_ID }}
          private-key:     ${{ secrets.APP_PRIVATE_KEY }}
          owner:           your-org
          repositories:    "acme-lib,acme-core"
      - uses: your-org/.github-actions/poetry-install-private@v1
        with:
          github-token: ${{ steps.app-token.outputs.token }}
      - run: poetry run pytest
```

### Private-action access setup (one-time)
- In the action's source repo: **Settings → Actions → General → Access → "Accessible from repositories owned by your-org"**.
- Pin to a tag (`@v1`), not a branch, so consumers don't drift.

### When to use this pattern
✅ Use it if: ≤5 private packages, no inter-library dependencies, infrequent releases, you want zero infrastructure.
❌ Upgrade away from it when:
- Private packages start depending on each other (lockfile grows linearly per git dep).
- Install latency in CI exceeds ~30 seconds from git clones.
- You need to proxy/cache public PyPI.
- You need retention policies, RBAC on package scope, or audit logs.
- Dependency-confusion-style attacks become a realistic threat.

**Verdict:** **Legitimate pattern for your low-volume case.** It's what many early-stage teams use before they have pain. Just know when to graduate.

---

## Why ACR/GHCR via ORAS is *not* a good primary choice

Both Azure Container Registry and GitHub Container Registry are OCI-compliant (v1.1) and can store wheels as OCI artifacts using ORAS. This sounds appealing ("reuse the container registry I already have!"), but:

- **`pip` cannot install OCI artifacts.** There is no PEP for OCI-as-package-source. Every install needs an explicit `oras pull → pip install ./dist/*.whl` shell step.
- **No dependency resolution.** If package A depends on package B (both internal, both in ACR), `pip` has no way to walk that graph via OCI — you'd have to pre-pull every transitive dep.
- **No proxying of public PyPI.** So you still need a separate path for all your public deps.
- **Monthly cost for ACR Basic ~$5/mo** gets you nothing you couldn't get from Azure Blob (Option 2) for pennies, with a working simple index that pip actually understands.

ACR/GHCR + ORAS works for **container images and Helm charts**, where OCI is the natural format. For Python wheels it's a force-fit. Only consider it if you already have a strong OCI/supply-chain workflow that demands artifacts live alongside container images.

---

## Decision flow for your profile

```
You have ≤5 private Python packages, no inter-library deps, and you want zero infra cost?
 └── Use Option 3 (private composite Action + Poetry git-deps). $0.

You want the simplest "just works" registry, and you can tolerate creating an Azure DevOps org + a PAT?
 └── Use Option 1 (Azure Artifacts free tier). $0, pip-native, fully managed.

You want the cheapest pip-native option in Azure, with OIDC on publish, and you accept SAS rotation?
 └── Use Option 2 (Azure Blob static PEP 503 index). <$0.10/mo.

You want OSS + self-host + full PyPI semantics?
 └── Use Option 6 (pypiserver or devpi on Azure Container Apps free tier). $0–$15/mo.

Your package count or inter-dependency complexity grew past ~5 packages?
 └── Graduate to Cloudsmith or Azure Artifacts paid tier, or JFrog if you truly need enterprise features.
```

---

## My recommendation for your stated scenario

Given "few private Python packages, low volume, migrating from Nexus OSS, already on GitHub":

1. **Start with Option 3** (private composite Action + Poetry git-deps) *today*. It's $0, it takes ~1 hour to set up, and it's exactly the pattern you asked about. Use a GitHub App token (not a PAT) for CI auth.
2. **Once you hit ~5 packages or packages start depending on each other, add Option 1** (Azure Artifacts free tier) as a proper internal index. Azure Artifacts can coexist with the composite Action pattern during the transition.
3. **Skip ACR/GHCR+ORAS entirely** for Python unless you have a separate reason to standardize on OCI.
4. **Skip JFrog/Cloudsmith/Gemfury** unless you outgrow Azure Artifacts' 2 GiB free quota and/or need SSO/SCIM/geo-replication that only the big SaaS vendors provide.

This gets you off Nexus OSS, onto GitHub, with genuine zero-cost infra for Python package distribution, and a clean upgrade path when you actually need one.

---

## Source reports

- `files/research-low-volume-python-hosting.md` (Claude Sonnet 4.6) — 8 options in depth (ACR, GHCR, Azure Blob, S3, Azure Artifacts free, pypiserver/devpi, composite action, git-deps)
- `files/research-private-actions-poetry.md` (GPT-5.3-Codex) — composite action patterns, reusable workflows, wheel-via-Release distribution, full YAML snippets

### Key primary references

- Azure Artifacts free tier: <https://learn.microsoft.com/azure/devops/artifacts/start-using-azure-artifacts>
- Azure Artifacts Python setup: <https://learn.microsoft.com/azure/devops/artifacts/python/project-setup-python>
- Azure Blob Storage pricing: <https://azure.microsoft.com/pricing/details/storage/blobs/>
- ACR OCI artifact support: <https://learn.microsoft.com/azure/container-registry/container-registry-oci-artifacts>
- ORAS CLI: <https://oras.land/>
- GitHub composite actions: <https://docs.github.com/en/actions/tutorials/create-actions/create-a-composite-action>
- Share private actions across repos: <https://docs.github.com/en/actions/how-tos/reuse-automations/share-across-private-repositories>
- `create-github-app-token` action: <https://github.com/actions/create-github-app-token>
- Poetry git dependencies: <https://python-poetry.org/docs/dependency-specification/#git-dependencies>
- `dumb-pypi`: <https://github.com/chriskuehl/dumb-pypi>
- `s3-pypi`: <https://github.com/novemberfiveco/s3pypi>
- pypiserver: <https://github.com/pypiserver/pypiserver>
- devpi: <https://devpi.net/>
- PEP 503 (simple index): <https://peps.python.org/pep-0503/>

---

## Validation and accuracy

*Validated 2026-04-23 against primary sources.*

All factual claims were cross-checked against live documentation and source repositories:

| Claim | Source | Status |
|---|---|---|
| Azure Artifacts free tier: 2 GiB per org | [MS Learn — Azure Artifacts](https://learn.microsoft.com/azure/devops/artifacts/start-using-azure-artifacts) | ✅ Verified |
| Azure Artifacts feed URL format | [MS Learn — Python project setup](https://learn.microsoft.com/azure/devops/artifacts/python/project-setup-python) | ✅ Verified |
| Poetry `priority = "explicit"` source constraint syntax | [Poetry Repositories docs](https://python-poetry.org/docs/repositories/) | ✅ Verified |
| Composite action `using: "composite"` syntax | [GitHub composite actions tutorial](https://docs.github.com/en/actions/tutorials/create-actions/create-a-composite-action) | ✅ Verified |
| Private action sharing via Settings → Actions → Access | [GitHub sharing private actions](https://docs.github.com/en/actions/how-tos/reuse-automations/share-across-private-repositories) | ✅ Verified |
| `actions/create-github-app-token` inputs and version | [GitHub repo](https://github.com/actions/create-github-app-token) — v3.1.1 current | ✅ Verified |
| `git config url.insteadOf` token auth pattern | GitHub and Git documentation | ✅ Verified |
| ACR/GHCR cannot serve pip-native installs | OCI spec / pip documentation — no PEP for OCI-as-package-source | ✅ Verified |

**Corrections applied during validation:**

1. `actions/create-github-app-token@v1` updated to `@v3` (current release).
2. Deprecated `app-id` input replaced with `client-id`; secret reference changed to `vars.APP_CLIENT_ID` per GitHub's recommendation.
3. Shell line-continuation backslashes (`\`) added to multi-line `az` CLI commands inside YAML literal blocks.

*Pricing figures are directional estimates and should be confirmed with vendors before commitment.*

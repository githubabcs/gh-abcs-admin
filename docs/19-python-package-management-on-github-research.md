# Python package management on GitHub — deep research & recommendation

*Research compiled 2026-04-21. Consolidates three parallel model-diverse investigations (Claude Opus 4.7, GPT‑5.4, GPT‑5.3‑Codex) plus an independent rubber-duck cross-review. Full source reports are attached under `./files/` in the session workspace.*

---

## TL;DR — for a team moving from Nexus OSS to GitHub, using pip + Poetry

1. **GitHub Packages does not support Python, and will not.** The PyPI beta that shipped in 2019 at `pypi.pkg.github.com` was deprecated and the roadmap item (`github/roadmap#94`) was **closed as "not planned" on 7 June 2023** with the canonical line *"no longer planned due to a change in our strategic priorities."* Current supported registries: Container (GHCR), npm, Maven/Gradle, NuGet, RubyGems — nothing for Python.
2. **Public vs private is a different question.** For **public OSS**, GitHub's recommendation is **publish to PyPI from GitHub Actions via OIDC "Trusted Publishers"** with PEP 740 attestations. For **private/internal packages** (your case), you need an external registry — GitHub offers no equivalent of `ghcr.io` for Python.
3. **There is no great GitHub-native workaround.** Git‑deps, GitHub Releases, Pages‑hosted PEP 503 indexes, and ORAS‑wrapped wheels on GHCR all work in small cases but **are not a platform**: no proxying of public PyPI, no RBAC/SSO for package scope, no retention policies, no dependency‑confusion protection, no audit.
4. **Realistic shortlist to replace Nexus OSS** (ranked for a GitHub‑centric, Poetry‑based org):
   | # | Pick | When to pick it |
   |---|---|---|
   | 1 | **Cloudsmith (SaaS)** | Cleanest GitHub Actions + OIDC story, lowest ops, you don't need self‑host |
   | 2 | **JFrog Artifactory (SaaS or self-host)** | You want the enterprise superset of Nexus, polyglot, SSO/SCIM, air‑gap option |
   | 3 | **Stay on Sonatype — Nexus Repository Pro / Cloud** | Minimize retraining; keep proxy/hosted/group mental model |
   | 4 | **Cloud‑native registry** (AWS CodeArtifact, Azure Artifacts, Google Artifact Registry) | Your org's IAM backbone is already that cloud; federate via GitHub OIDC |
   | 5 | **devpi‑server (self-host OSS)** | Python‑only, OSS, you're OK running a service |
5. **What most companies actually do** (based on public evidence): Artifactory or a cloud‑native registry (CodeArtifact / Azure Artifacts / GAR), with Cloudsmith and devpi as the common "lighter" picks. Large engineering orgs (Instacart, Lyft, Netflix) publish extensively about Python tooling but rarely name the private registry backend — this is vendor‑agnostic plumbing for them.
6. **If you want to be GitHub‑native**: the best "feels like GitHub Packages" experience you can assemble today is **Cloudsmith + GitHub OIDC + Poetry source constraints + Dependabot private‑registry config**. It's not free but it's the lowest‑friction path for your profile.

---

## 1. Why doesn't GitHub Packages support Python natively?

### 1.1 The short answer

GitHub shipped a PyPI beta in May 2019 and then killed it. The official message in `github/roadmap#94` is a boilerplate **"change in strategic priorities."** Nothing more. No engineering post‑mortem, no RFC, no replacement on the roadmap.

### 1.2 The commonly cited (but unofficial) reasons

Drawn from community discussions, primarily `community/discussions/8542`:

- **Strategic deprioritization.** The cancellation (mid‑2023) coincides with GitHub's resource reallocation to Copilot, Actions scaling, and Advanced Security.
- **Overlap with GHCR / OCI.** GitHub has bet on OCI as the universal artifact envelope (containers, Helm, wasm, generic blobs). Building another bespoke PyPI Warehouse-style service is hard to justify internally. *[community speculation — not confirmed by GitHub]*
- **Ecosystem redundancy.** PyPI is free and reliable for public; Artifactory, Nexus, Cloudsmith, Azure Artifacts, CodeArtifact, GAR, GitLab all cover private. The business case for GitHub to build another PyPI clone is thin.
- **Python packaging surface area.** PEP 503 (HTML simple index) is actually *simpler* than npm's registry API, **so "it's too hard" is a weak excuse.** But a *serious* PyPI registry in 2026 also has to implement PEP 691 (JSON simple API), PEP 658 / PEP 714 (core-metadata exposure), and PEP 740 (in‑toto/Sigstore attestations) to be competitive — that's real scope.
- **Namespace mismatch.** PEP 503 mandates case‑insensitive, `-`/`_`/`.`‑collapsed normalization and a flat global name space. GitHub Packages is owner‑scoped/repo‑scoped. Mapping that cleanly was already a rough edge in the 2019 beta.

### 1.3 What GitHub recommends *instead*

From the live docs (April 2026):

| Use case | Official recommendation |
|---|---|
| Publish public Python packages | **PyPI** via `pypa/gh-action-pypi-publish` + **OIDC Trusted Publishers** + PEP 740 attestations |
| Build & test Python in CI | GitHub Actions (`actions/setup-python`) |
| Private/internal packages | **Third-party registries** — Dependabot docs explicitly call out Azure Artifacts, JFrog, Nexus, Cloudsmith, GitLab as supported for private config |
| Intra-workflow artifact handoff | `actions/upload-artifact` (explicitly *not* a package registry; artifacts expire) |

**Source:** `github/roadmap#94`, `community/discussions/8542`, `docs.github.com/en/packages/working-with-a-github-packages-registry`, `docs.github.com/en/code-security/how-tos/secure-your-supply-chain/manage-your-dependency-security/guidance-for-the-configuration-of-private-registries-for-dependabot`.

---

## 2. What companies actually use for private Python packages

### 2.1 Comparison (focused on the 5 realistic options for your brief)

| Option | License | Host model | Auth / GitHub OIDC | Poetry fit | PyPI proxy/cache | Air-gap / EU / self-host | Cost shape (April 2026) |
|---|---|---|---|---|---|---|---|
| **Cloudsmith** | Commercial SaaS | SaaS only | Native GitHub OIDC via `cloudsmith-io/cloudsmith-cli-action@v2`; SSO/SCIM | Excellent — documented Poetry path | Yes (upstreams) | EU region exists *[not fully verified]*; **no self-host** | Free Core; Pro ~$149/mo; Ultra/Enterprise quote |
| **JFrog Artifactory** | Commercial | SaaS + self-host + air-gap | GitHub OIDC via `jfrog/setup-jfrog-cli`; SAML/SCIM | Strong (virtual/local/remote PyPI repos) | Yes (remote+virtual) | **Yes — strongest air-gap/private-cloud** | SaaS Pro ~$150/mo **includes only 25 GB consumption** (overage ~$1.25/GB) — real bill often 2–3× list in active CI/CD; Enterprise X ~$950/mo includes 125 GB; self-host Enterprise X ~$51k/yr |
| **Sonatype Nexus Repository Pro / Cloud** | Commercial (CE still free) | SaaS + self-host + air-gap | OIDC for user SSO documented; **no documented GitHub Actions workload-identity publishing flow** *[unverified]* | Strong (hosted+proxy+group) | Yes | Yes | CE free (what you have); Pro Cloud from ~$135/mo + consumption; self-host Pro quote-only |
| **AWS CodeArtifact** | Commercial managed | AWS SaaS | Excellent — federate via `aws-actions/configure-aws-credentials` then fetch CodeArtifact token | Works via basic-auth with fetched token; not a first-party Poetry doc path | Yes (external connection to `public:pypi`) | EU AWS regions; no self-host | Usage-based: ~$0.05/GB-mo + ~$0.05/10k requests; small free tier |
| **Azure Artifacts** | Commercial managed | Azure DevOps SaaS | Documented GitHub Actions path via managed identity / federated credentials + `azure/login` | Good; `artifacts-keyring` + Poetry plugin | Yes (upstream sources) | Azure regions; no simple self-host | 2 GiB free/org, then $2/GB |
| **Google Artifact Registry** | Commercial managed | GCP SaaS | Excellent — GitHub OIDC via `google-github-actions/auth` (Workload Identity Federation) | Good via `oauth2accesstoken` basic-auth | Yes (virtual repos) | GCP regions; no self-host | 0.5 GB free, then $0.10/GB-mo + egress |
| **devpi-server** | OSS (MIT) | Self-host only | No native OIDC; wrap via reverse proxy | Strong (indexes, inheritance, mirror) | Yes (on-demand PyPI mirror) | Anywhere you deploy it | Free software + your infra cost |
| **pypiserver** | OSS | Self-host only | Basic auth | Works (generic simple API) | No real proxy | Anywhere | Free |
| **Gemfury / Packagecloud** | Commercial SaaS | SaaS | Mostly token/basic; **no first-party OIDC docs found** *[unverified]* | Works | Limited | Limited | Gemfury from $9–$25/mo; Packagecloud $89–$699/mo |
| **GitLab Package Registry** | Commercial | GitLab SaaS + self-managed | No direct GitHub-OIDC → GitLab registry flow; use PAT/deploy token | Strong | Yes (forwarding — disable for security) | Yes | GitLab plan cost |
| **GitHub Releases + shims / git-deps** | — | DIY | GitHub token/PAT/SSH | Mediocre | **No** | Depends on repo visibility | Storage + Actions cost |

> **Pricing caveat:** vendor list prices move; treat the table as *shape* and confirm with the vendor before commit.

### 2.2 What big companies publicly say

Honest finding: **most large tech companies don't publicly name their private Python registry vendor.** Engineering blogs talk about reproducibility, lockfiles, monorepos, and upgrade playbooks, not registry SKUs.

| Company | What's publicly documented | Inferred backend |
|---|---|---|
| Instacart | Internal tool "Lore", pinned requirements, reproducible envs | *not named* |
| Lyft | 1,500+ repos, Python upgrade playbook | *not named* |
| Netflix | Heavy internal Python use, "Python at Netflix" post | *not named* |
| Spotify / Stripe / Datadog | Not publicly confirmed | *unverified* |

**Vendor-side signals** (case studies / marketing — directional only): Artifactory and Cloudsmith both publish logos that imply broad enterprise Python usage; AWS CodeArtifact launch attracted large AWS-native shops; Azure Artifacts dominates at Microsoft-heavy orgs.

**Community signal (Reddit/HN, 2023–2026)** consistently says:
- Artifactory/Nexus → "enterprise default, heavy/expensive"
- CodeArtifact/GAR/Azure Artifacts → "best if you're already on that cloud"
- Cloudsmith → "easiest modern SaaS, GitHub‑friendly"
- devpi → "favorite self‑hosted Python‑only answer"
- pypiserver → "only for very small internal needs"

---

## 3. The GitHub‑native "no dedicated registry" patterns — and why they are not a platform

These patterns come up a lot. They work for **tiny** cases. They are **not** a replacement for Nexus in a real org.

### 3.1 Pattern A — Direct Git dependency (pip / Poetry / uv)

**Poetry `pyproject.toml`:**
```toml
[tool.poetry.dependencies]
python = ">=3.11,<4.0"
acme-lib  = { git = "https://github.com/your-org/acme-lib.git", tag = "v1.2.3" }
acme-core = { git = "git@github.com:your-org/acme-core.git",    rev = "3b6c5f9" }
# Monorepo subdirectory:
acme-cli  = { git = "https://github.com/your-org/mono.git", subdirectory = "packages/acme-cli", tag = "v2.0.0" }
```

**Auth options, ranked:**
1. **GitHub App installation token** — short‑lived (~1 h), scoped — best for CI at scale.
2. **Fine‑grained PAT** — repo- and permission‑scoped.
3. **Deploy key** (SSH, single‑repo) — fine for one‑off repos.
4. Classic PAT — avoid.

**Pin to full commit SHAs in production**, not branches. Tags are mutable on GitHub.

### 3.2 Pattern B — GitHub Release asset install

```bash
pip install "acme-lib @ https://github.com/OWNER/REPO/releases/download/v1.2.3/acme_lib-1.2.3-py3-none-any.whl"
```

**⚠ Caveat (missed in many tutorials):** this is easy for **public** release assets. For **private** release assets, pip/Poetry have no native flow for the GitHub API redirect + token dance. You end up scripting an auth'd download step in CI. This is a large footgun at scale.

### 3.3 Pattern C — Static PEP 503 index on GitHub Pages

Tools: `simpleindex`, `simple503`, `furechan/pypi-index`. Generate an HTML index from GitHub Release assets, publish to GitHub Pages.

**⚠ Critical caveat:** GitHub Pages on `github.com` is **public**. Hosting a simple index there **leaks your private package names, versions, and hashes**. For private packages, GitHub Pages is not viable without GitHub Enterprise Server's private Pages. Do not recommend this for Pattern C in a private context.

### 3.4 Pattern D — ORAS‑wrapped wheels on GHCR

Push wheels as OCI artifacts: `oras push ghcr.io/org/pkg:1.2.3 dist/*.whl`. Real, used by some teams, but **pip cannot consume it directly** — you need a custom pull+install wrapper. Not a production-grade solution.

### 3.5 Build → Release reusable workflow (canonical pattern)

```yaml
# .github/workflows/release-wheel.yml
name: release-wheel
on:
  workflow_call:
    inputs:
      tag: { required: true, type: string }

jobs:
  build-and-upload:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-python@v6
        with: { python-version: '3.12', cache: 'pip' }
      - run: |
          python -m pip install --upgrade build
          python -m build --wheel
      - env: { GH_TOKEN: ${{ github.token }} }
        run: |
          gh release view "${{ inputs.tag }}" \
            || gh release create "${{ inputs.tag }}" --title "${{ inputs.tag }}" --notes "Automated release"
          gh release upload "${{ inputs.tag }}" dist/*.whl --clobber
```

### 3.6 When is the GitHub-only approach actually enough?

| Keep it GitHub-only if… | Adopt a registry if… |
|---|---|
| < ~10 internal packages | Many internal packages, many consumers |
| Small team, high pinning discipline | Multi‑team, policy/governance needs |
| You can live without proxying public PyPI | You need fast/reliable PyPI cache |
| You don't care about dependency-confusion protection | You need source constraints enforced centrally |
| Reproducibility via Git SHA + hash pin is OK | You need index-hosted attestations (PEP 740) |
| Low CI volume | Install latency matters; git clones per dep are too slow |

**Your situation (migrating from Nexus OSS with private internal libs):** GitHub‑only does **not** cover you. You need a real registry.

---

## 4. Security and supply-chain considerations

- **Dependency confusion** is the single biggest risk when mixing a private registry with public PyPI. pip's `--extra-index-url` is explicitly *unsafe* for private packages. Defenses:
  - **Poetry:** set per‑package source constraints (`[[tool.poetry.source]]` with `priority = "explicit"`) so internal packages can only resolve from the internal index.
  - **uv:** default `first-index` strategy is explicitly designed to mitigate this.
  - **GAR:** Google recommends *virtual repositories* combining public + private behind a single index.
- **PEP 740 / Sigstore attestations** are now live on PyPI. A "real" registry you pick in 2026 should either support ingesting/verifying PEP 740 attestations or have a credible roadmap for it. Cloudsmith and Artifactory are the most active here; CodeArtifact/Azure/GAR are catching up. Nexus OSS / pypiserver / devpi have no native PEP 740 pipeline.
- **Token posture for CI:**
  - Prefer **OIDC/federated identity** over stored PATs. (Cloudsmith, JFrog, AWS, GCP, Azure all support it. Nexus does not for workload publishing.)
  - If you must use a PAT, use a **fine‑grained PAT** with least privilege.
- **SBOM / dependency graph**: GitHub's dependency graph and Dependabot will ingest `poetry.lock` / `pyproject.toml` regardless of where the package content lives. Configure `dependabot.yml` with `registries:` to authenticate against the chosen private registry so Dependabot can see private versions.

---

## 5. Migration path: Nexus OSS → new registry

1. **Inventory** all hosted repos (private), proxy repos (cached public), and group repos. Map which clients use which URLs.
2. **Back up Nexus properly** — Sonatype docs are explicit that both blob stores *and* database must be snapshotted together for a consistent restore.
3. **Stand up the new registry in parallel** with both a **hosted internal** repo and an **upstream proxy** to public PyPI (so consumers see one URL).
4. **Dual-publish** for 1–2 release cycles. Every new version lands in both old Nexus and the new registry.
5. **Export private artifacts** — the portable path across vendors is to list the simple index, download `.whl`/`.tar.gz` files, and `twine upload` them into the new registry. Cloudsmith and Artifactory have assisted import tooling. Nexus metadata and permissions are **not** portable; you'll redo RBAC mapping.
6. **Cut over clients** by updating `pyproject.toml` / `poetry.toml` / `pip.conf` to the new index. Use Poetry `priority = "explicit"` for internal packages to prevent dependency confusion during the transition.
7. **Warm the cache** on the new registry before the cutover so first installs don't time out.
8. **Keep Nexus read-only** for a rollback window (1–3 months), then decommission.

---

## 6. Recommendation — best solution for your profile

**Profile:** moving from self-hosted Nexus OSS to GitHub, pip + Poetry, private internal libraries, org-scale reuse.

### Primary recommendation — **Cloudsmith (SaaS)**

Why:
- **Cleanest GitHub‑native story of any dedicated registry.** First-party `cloudsmith-cli-action@v2` with native **GitHub OIDC** — no long-lived secrets.
- **Documented Nexus migration tooling.**
- Poetry + Twine work out of the box. Proxying of public PyPI is built in.
- SSO/SCIM, retention, geo-replication, audit.
- Pricing is in the Nexus‑Pro ballpark without the ops burden.

**Trade-offs accepted:**
- No self-host / air-gap option. If your org has an air-gap or data-residency hard requirement, **go JFrog Artifactory self-hosted** instead.
- Vendor lock-in at the UX layer (not at the protocol layer — the Simple API is portable).

**Rejected for this brief:**
- **GitHub‑only workarounds** — fine for ≤10 packages, not for an ex‑Nexus footprint. Pages‑hosted indexes leak private metadata.
- **Stay on Nexus Pro** — works, but you lose the GitHub OIDC modernization that's the whole point of moving.
- **Cloud‑native registries** — excellent *if* you're already AWS/Azure/GCP all‑in; otherwise you're importing a cloud just for packages.
- **Gemfury / Packagecloud** — no verified first-party OIDC story; weaker enterprise posture.
- **devpi / pypiserver** — only if "OSS, self-host, Python-only, we run it" is a hard requirement.

### Concrete next steps

1. Trial Cloudsmith Pro with 1–2 internal packages.
2. Configure GitHub OIDC → Cloudsmith service account.
3. Add the following to every consumer `pyproject.toml`:
   ```toml
   [[tool.poetry.source]]
   name = "cloudsmith-internal"
   url = "https://dl.cloudsmith.io/basic/ORG/REPO/python/simple/"
   priority = "explicit"      # internal packages MUST come from here
   ```
4. For *every internal package*, declare it explicitly bound to that source to prevent dependency confusion.
5. Configure `.github/dependabot.yml` with the Cloudsmith registry so Dependabot can see private versions.
6. Run Nexus and Cloudsmith in parallel for one release cycle, then cut over.

---

## Sources and underlying reports

Three parallel deep‑research reports backed this document:

- `files/research-gh-packages-python-status.md` — *Claude Opus 4.7* — why GitHub Packages doesn't support Python + official status.
- `files/research-python-registry-alternatives.md` — *GPT-5.4* — vendor comparison matrix + migration path from Nexus OSS.
- `files/research-poetry-github-patterns.md` — *GPT-5.3-Codex* — Poetry/pip/uv best-practice patterns + reusable workflow YAML.

Plus an independent rubber-duck cross-review that flagged:
- **Public vs private must be separated** (PyPI has no private orgs; GitHub Pages is public).
- **Private Release‑asset installs are footguns**, not a normal path.
- **Pricing tables go stale fast** — treat as shape, not precision.
- **Dependabot + private-registry auth, SBOM, air-gap, self-hosted runners** are under-discussed decision factors.

### Key primary references

- `github/roadmap#94` — PyPI support closed "not planned" (2023-06-07): <https://github.com/github/roadmap/issues/94>
- Community discussion: <https://github.com/orgs/community/discussions/8542>
- GitHub Packages supported list: <https://docs.github.com/en/packages/working-with-a-github-packages-registry>
- Dependabot private-registry config: <https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/manage-your-dependency-security/guidance-for-the-configuration-of-private-registries-for-dependabot>
- OIDC to PyPI: <https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-pypi>
- PyPI Trusted Publishers: <https://docs.pypi.org/trusted-publishers/>
- PEP 503 / 691 / 658 / 714 / 740: <https://peps.python.org/>
- Cloudsmith OIDC: <https://docs.cloudsmith.com/authentication/setup-cloudsmith-to-authenticate-with-oidc-in-github-actions>
- JFrog + GitHub OIDC: <https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-jfrog>
- Sonatype Nexus Python docs: <https://help.sonatype.com/en/pypi-repositories.html>
- AWS CodeArtifact Python: <https://docs.aws.amazon.com/codeartifact/latest/ug/using-python.html>
- GCP Artifact Registry Python: <https://cloud.google.com/artifact-registry/docs/python/authentication>
- Azure Artifacts GitHub Actions: <https://learn.microsoft.com/azure/devops/artifacts/quickstarts/github-actions>
- Poetry repositories: <https://python-poetry.org/docs/repositories/>
- uv indexes: <https://docs.astral.sh/uv/concepts/indexes/>

*Items marked `[unverified]` in the underlying reports reflect claims that could not be corroborated against a first-party source during this research pass — typically pricing tier details or absence‑of‑feature claims. Confirm these before purchasing.*

---

## Validation and accuracy

*Validated 2026-04-23 against primary sources.*

All core factual claims were cross-checked against live documentation and source repositories:

| Claim | Source | Status |
|---|---|---|
| `github/roadmap#94` closed as "not planned" on 7 June 2023 | [github/roadmap#94](https://github.com/github/roadmap/issues/94) | ✅ Verified |
| Closure rationale quote | [github/roadmap#94](https://github.com/github/roadmap/issues/94) — ankneis comment | ✅ Verified |
| GitHub Packages supported registries (Container, npm, Maven/Gradle, NuGet, RubyGems) | [GitHub Packages registry docs](https://docs.github.com/en/packages/working-with-a-github-packages-registry) | ✅ Verified |
| `community/discussions/8542` discussion | [community/discussions/8542](https://github.com/orgs/community/discussions/8542) — 79+ comments, 595 👍 | ✅ Verified |
| Azure Artifacts: 2 GiB free per org | [MS Learn — Azure Artifacts](https://learn.microsoft.com/azure/devops/artifacts/start-using-azure-artifacts) | ✅ Verified |
| Poetry `[[tool.poetry.source]]` with `priority = "explicit"` | [Poetry Repositories docs](https://python-poetry.org/docs/repositories/) | ✅ Verified |
| `cloudsmith-io/cloudsmith-cli-action@v2` with native GitHub OIDC | [Cloudsmith OIDC docs](https://docs.cloudsmith.com/authentication/setup-cloudsmith-to-authenticate-with-oidc-in-github-actions) and [GitHub repo](https://github.com/cloudsmith-io/cloudsmith-cli-action) | ✅ Verified |
| PEP 503, 691, 658, 714, 740 references | [PEPs index](https://peps.python.org/) | ✅ Verified |
| `pypi.pkg.github.com` as original beta URL | [github/roadmap#94](https://github.com/github/roadmap/issues/94) issue description | ✅ Verified |

No factual corrections were required for this document.

*Pricing figures are directional estimates and should be confirmed with vendors before commitment.*

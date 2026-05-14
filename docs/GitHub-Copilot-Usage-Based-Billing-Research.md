# GitHub Copilot — Usage-Based Billing Model & Impact on Existing Business / Enterprise Customers

> **Research date:** 2026-05-05
> **Last reviewed / re-validated:** 2026-05-14 against [docs.github.com](https://docs.github.com) and the [GitHub Changelog](https://github.blog/changelog/label/copilot/).
> **Audience:** Decision-makers and admins of organizations already on GitHub Copilot Business or Copilot Enterprise.
> **Scope:** High-level overview of the **request-based ("premium request")** billing model still in effect through May 31, 2026, **and** the new **GitHub AI Credits** usage-based model that replaces it on **June 1, 2026**.

> [!IMPORTANT]
> ## ⚠️ Critical update — billing model changes June 1, 2026
>
> Since this document was first written, GitHub announced a **complete replacement** of the premium-request billing model. Starting **June 1, 2026**, Copilot Business and Copilot Enterprise move from per-seat + premium-request allowances to a **token-based metered model** denominated in **GitHub AI Credits** (1 credit = $0.01 USD). See [section 8](#8-new-model-effective-june-1-2026--github-ai-credits) for full details.
>
> Sections 1–7 of this document describe the **request-based model** that remains in effect **through May 31, 2026**. Existing customers should read both halves to plan the transition. Source: [Usage-based billing for organizations and enterprises](https://docs.github.com/en/copilot/concepts/billing/usage-based-billing-for-organizations-and-enterprises).

---

## 1. Executive summary

GitHub Copilot is no longer a flat per-seat product. As of mid-2025, GitHub introduced a **two-layer billing model**:

1. **Per-seat license** — unchanged in concept ($19/user/month Business; $39/user/month Enterprise). Gives every user unlimited use of "included" models (currently GPT-5 mini, GPT-4.1, GPT-4o — note GPT-4.1 is on a published deprecation path as of May 7, 2026), plus a monthly allowance of **premium requests**.
2. **Premium-request usage** — a metered allowance (300/user/month for Business, 1,000/user/month for Enterprise). When a user picks an "advanced" model (e.g. Claude Sonnet 4.5/4.6, Claude Opus 4.5–4.7, GPT-5.4/5.5, Gemini 2.5 Pro / 3.1 Pro / 3 Flash) or uses certain agentic features (Copilot cloud agent, Spark, Code Review with premium models, etc.), the request is multiplied by a model-specific factor and counted against the allowance. **Overage is billed at $0.04 per premium request** if the org admin has the "Premium request paid usage" policy enabled.

For an org that is already paying for Business or Enterprise seats, the practical impact is:

- **No price increase on existing seats** — the per-seat fee did not change.
- **New variable line items** can appear on the invoice if heavy users routinely pick premium models or use the Copilot coding agent.
- **Two new admin levers** must be configured: (a) the *Premium request paid usage* policy and (b) **budgets** (bundled or per-SKU). Budgets are the only hard cap that prevents runaway overage spend.
- **From November 1, 2025**, premium requests are split into **three SKUs** — Copilot premium requests, Spark premium requests, and Copilot cloud agent premium requests — for cleaner cost attribution.
- **GitHub Enterprise Cloud with data residency or FedRAMP** adds an **additional +10% multiplier** on premium requests routed through that compliant infrastructure (it does not create a separate flat charge).
- **From June 1, 2026**, this entire request-based model is **replaced by GitHub AI Credits** (token-metered, pooled at the billing entity). See [section 8](#8-new-model-effective-june-1-2026--github-ai-credits).

---

## 2. The new billing model in detail

### 2.1 Two layers

| Layer | What it covers | How it is billed |
|---|---|---|
| **Seat license** | Access to Copilot at all (completions, chat with included models, policies) | Flat per assigned user, monthly |
| **Premium requests** | Premium models + agentic features (chat, CLI, code review, extensions, Spaces, cloud agent, Spark) | Monthly allowance per seat; overage metered at $0.04/request |

### 2.2 Plan allowances and seat pricing

| Plan | Seat price | Premium requests / user / month |
|---|---|---|
| Copilot Free | $0 | 50 |
| Copilot Pro | $10 | 300 |
| Copilot Pro+ | $39 | 1,500 |
| **Copilot Business** | **$19** | **300** |
| **Copilot Enterprise** | **$39** | **1,000** |

Sources: [About billing for GitHub Copilot](https://docs.github.com/en/billing/managing-billing-for-your-products/about-billing-for-github-copilot), [Plans for GitHub Copilot](https://docs.github.com/en/copilot/about-github-copilot/subscription-plans-for-github-copilot), [GitHub Copilot Enterprise GA announcement (Feb 27, 2024)](https://github.blog/news-insights/product-news/github-copilot-enterprise-is-now-generally-available/).

### 2.3 Key dates

- **June 18, 2025** — premium-request billing went live for paid Copilot plans on GitHub.com. Counters reset to zero.
- **August 1, 2025** — same change took effect on GHE.com (data-resident Enterprise Cloud).
- **November 1, 2025** — premium requests split into three dedicated SKUs (Copilot premium requests, Spark premium requests, Copilot cloud agent premium requests) for granular budgeting and reporting.
- **April 20, 2026** — new sign-ups for Copilot Pro, Copilot Pro+, and Copilot Student temporarily paused.
- **April 22, 2026** — new self-serve sign-ups for Copilot Business **for organizations on GitHub Free and GitHub Team** plans temporarily paused (Enterprise Cloud customers unaffected).
- **June 1, 2026** — request-based billing is **replaced** by GitHub AI Credits (token-based) for Copilot Business and Copilot Enterprise. **Copilot code review also begins consuming GitHub Actions minutes on this date.**

Source: [Requests in GitHub Copilot](https://docs.github.com/en/copilot/concepts/billing/copilot-requests), [GitHub Copilot premium requests (billing)](https://docs.github.com/en/billing/concepts/product-billing/github-copilot-premium-requests), [Pausing new self-serve signups for GitHub Copilot Business](https://github.blog/changelog/2026-04-22-pausing-new-self-serve-signups-for-github-copilot-business), [Changes to GitHub Copilot plans for individuals](https://github.blog/changelog/2026-04-20-changes-to-github-copilot-plans-for-individuals), [Copilot code review will start consuming GitHub Actions minutes on June 1, 2026](https://github.blog/changelog/2026-04-27-github-copilot-code-review-will-start-consuming-github-actions-minutes-on-june-1-2026).

### 2.4 What counts as a premium request?

- **Included models** (GPT-5 mini, GPT-4.1, GPT-4o) on a paid plan → **0 premium requests** (rate-limited but free).
- Any other model → **1 × multiplier** premium requests per prompt. Multipliers vary by model; advanced reasoning models can be 5×, 7.5× (GPT-5.5), 15× (Claude Opus 4.7) or more. Some lightweight models are <1× (Claude Haiku 4.5 is 0.33×, Grok Code Fast 1 is 0.25×, GPT-5.4 nano is 0.25×).
- **Copilot cloud agent** (incl. custom agents): 1 premium request per *session* (a session starts when you assign Copilot to an issue or prompt it to undertake a task), multiplied by the model rate. Each real-time steering comment in an active session also costs 1 × multiplier. Also consumes GitHub Actions minutes.
- **Spark**: each prompt costs a **fixed 4 premium requests** (not multiplier-based).
- **Auto model selection** in VS Code chat, Copilot CLI, or Copilot cloud agent on a paid plan: **10% multiplier discount** (e.g. Sonnet 4.6 billed at 0.9× instead of 1×).
- **Data residency / FedRAMP enforcement on GitHub Enterprise Cloud**: **+10% multiplier** on every premium request.
- **Tool calls** an agent makes autonomously inside a single prompt do **not** each count — only the user prompt counts.

Source: [Requests in GitHub Copilot — Model multipliers](https://docs.github.com/en/copilot/concepts/billing/copilot-requests#model-multipliers), [GitHub Copilot with data residency — pricing changes](https://docs.github.com/en/enterprise-cloud@latest/admin/data-residency/github-copilot-with-data-residency#pricing-changes).

### 2.5 Overage pricing

If a user exceeds their monthly allowance and the admin has enabled overages, additional premium requests are billed at **$0.04 USD each** (after applying the model multiplier). Unused requests **do not** roll over; counters reset on the 1st of each month at 00:00:00 UTC.

Source: [Requests in GitHub Copilot](https://docs.github.com/en/copilot/concepts/billing/copilot-requests).

---

## 3. Impact on an organization already on Copilot Business or Enterprise

### 3.1 Financial impact

- **Existing seat cost is unchanged.** Business stays $19/seat/mo, Enterprise stays $39/seat/mo.
- **Net-new variable cost** appears only if users (a) opt into premium models, (b) use the Copilot coding agent / Spark, or (c) work in a data-resident or FedRAMP region (where the +10% multiplier applies).
- Worst-case unbounded spend is prevented **only** by setting a **budget with "Stop usage when budget limit is reached"** — the policy alone allows unlimited overage.
- Enterprise seats get **3.3× more allowance** than Business (1,000 vs 300), which is often the deciding factor for upgrading heavy-AI teams rather than paying overage at $0.04/request.

### 3.2 Worked examples (illustrative only)

| Scenario (per user / month) | Premium requests consumed | Overage cost @ $0.04 |
|---|---|---|
| Business seat, 250 Sonnet 4.6 prompts (1× multiplier) | 250 | $0 (within 300) |
| Business seat, 500 Sonnet 4.6 prompts | 500 | (500 − 300) × $0.04 = **$8.00** |
| Business seat, 100 prompts on a 5× reasoning model | 500 | **$8.00** |
| Business seat, 40 Claude Opus 4.7 prompts (15×) | 600 | (600 − 300) × $0.04 = **$12.00** |
| Enterprise seat, 1,200 Sonnet 4.6 prompts | 1,200 | (1,200 − 1,000) × $0.04 = **$8.00** |
| Enterprise seat, 200 cloud-agent sessions + 900 chat prompts (1×) | 1,100 | **$4.00** + Actions minutes |
| Enterprise seat, 250 Spark prompts (fixed 4×) | 1,000 | $0 (exactly at allowance) |

> Multipliers and model availability change frequently. Always verify against the current [model-multiplier table](https://docs.github.com/en/copilot/concepts/billing/copilot-requests#model-multipliers) before forecasting.

### 3.3 Operational / admin impact

Existing admins now have **new things to manage**:

1. **Premium request paid usage policy** (per AI product: Copilot, Spark, Copilot cloud agent). On by default — disable to hard-cap users at the included allowance.
2. **Budgets** — bundled across all premium SKUs or per-SKU. Required as a real spend cap.
3. **Multi-license users** — if a user has seats from more than one enterprise/standalone org, they must pick a "Usage billed to" entity, otherwise premium requests are blocked.
4. **Usage monitoring** — new usage reports show per-user premium-request consumption, useful for identifying power users who might justify a Copilot Enterprise upgrade.
5. **Cost attribution** — cost centers and the new per-SKU split (from Nov 1, 2025) allow chargeback to teams.

Source: [Manage premium requests for your enterprise](https://docs.github.com/en/copilot/how-tos/premium-requests/manage-for-enterprise).

### 3.4 What does *not* change

- Inline code completions with included models remain **unmetered** on paid plans (subject to standard rate limits).
- Chat with the included models (GPT-5 mini, GPT-4.1, GPT-4o) remains **unmetered** on paid plans.
- Seat assignment, SSO, audit log, content-exclusion, and other governance features are unchanged.
- If a user has both a Business and an Enterprise seat in the same enterprise, only the Enterprise seat is billed (no double billing).

---

## 4. Recommendations for existing Business / Enterprise customers

1. **Decide your overage posture before users notice.** Either (a) leave overages on with a budget cap, or (b) disable the *Premium request paid usage* policy to hard-cap at the included allowance.
2. **Set a bundled premium-request budget** at enterprise level as a fail-safe, even if cost-center budgets exist.
3. **Educate users on multipliers and the included models.** A user who defaults to GPT-5 mini or uses Auto model selection consumes 0–0.9× per prompt versus 5–15× for some reasoning models (GPT-5.5 = 7.5×, Claude Opus 4.7 = 15×).
4. **Pull a usage report monthly** for the first few cycles. Identify the top-decile consumers — they are the candidates for upgrade to Copilot Enterprise (1,000 req/mo) or for coaching on model choice.
5. **Treat the Copilot cloud agent as a separate cost center** — it draws from both premium requests (1/session) and GitHub Actions minutes, and has its own SKU since Nov 1, 2025.
6. **If you operate under data residency or FedRAMP**, add the **+10% multiplier** to every forecast.
7. **Plan the AI Credits transition now.** Download the new April 2026 usage reports from your billing dashboard (released May 12, 2026) to model your projected June 1, 2026 AI-credit consumption. See [section 8](#8-new-model-effective-june-1-2026--github-ai-credits).
8. **Note the Copilot code review change** — starting June 1, 2026, code review consumes GitHub Actions minutes in addition to AI credits. Forecast Actions capacity accordingly.

---

## 5. Primary references (all official GitHub documentation)

- [About billing for GitHub Copilot](https://docs.github.com/en/billing/managing-billing-for-your-products/about-billing-for-github-copilot)
- [GitHub Copilot premium requests (billing concept)](https://docs.github.com/en/billing/concepts/product-billing/github-copilot-premium-requests)
- [Requests in GitHub Copilot (model multipliers, allowances, dates)](https://docs.github.com/en/copilot/concepts/billing/copilot-requests)
- [Subscription plans for GitHub Copilot](https://docs.github.com/en/copilot/about-github-copilot/subscription-plans-for-github-copilot)
- [Managing premium requests for your enterprise](https://docs.github.com/en/copilot/how-tos/premium-requests/manage-for-enterprise)
- [GitHub Copilot with data residency — pricing changes](https://docs.github.com/en/enterprise-cloud@latest/admin/data-residency/github-copilot-with-data-residency#pricing-changes)
- [GitHub Copilot Enterprise GA announcement, Feb 27 2024](https://github.blog/news-insights/product-news/github-copilot-enterprise-is-now-generally-available/)
- [Setting up budgets to control spending](https://docs.github.com/en/billing/managing-your-billing/using-budgets-control-spending)
- **NEW — [Usage-based billing for organizations and enterprises (effective June 1, 2026)](https://docs.github.com/en/copilot/concepts/billing/usage-based-billing-for-organizations-and-enterprises)**
- **NEW — [Usage-based billing for individuals (effective June 1, 2026)](https://docs.github.com/en/copilot/concepts/billing/usage-based-billing-for-individuals)**
- **NEW — [Models and pricing for GitHub Copilot (per-token rates)](https://docs.github.com/en/copilot/reference/copilot-billing/models-and-pricing)**
- **NEW — [Preparing your organization for usage-based billing](https://docs.github.com/en/copilot/how-tos/manage-and-track-spending/prepare-for-usage-based-billing)**
- [Copilot code review will consume GitHub Actions minutes from June 1, 2026 (changelog)](https://github.blog/changelog/2026-04-27-github-copilot-code-review-will-start-consuming-github-actions-minutes-on-june-1-2026)

---

## 6. Provenance & validation

> **Generated:** 2026-05-05 by **GitHub Copilot CLI** powered by **Claude Opus 4.7 (1M context)** (model id `claude-opus-4.7-1m-internal`).
>
> **Re-validated:** 2026-05-14 against live GitHub documentation and the [GitHub Copilot Changelog](https://github.blog/changelog/label/copilot/). Findings from the re-validation are recorded in [section 7](#7-multi-agent-validation-log) (entries marked **2026-05-14 RE-VALIDATION**).
>
> **Validation:** This document was independently fact-checked in parallel by **5 sub-agents running on different LLMs** (see section 7 for results). Every numeric claim, date, URL, and policy statement was cross-checked against the live GitHub documentation linked above.
>
> **Caveat:** GitHub updates premium-request multipliers, included models, and SKU structure frequently. The model lineup in particular has churned heavily between the original research date and the re-validation date (Sonnet 4 deprecated 2026-05-07; GPT-4.1 deprecation announced 2026-05-07; GPT-5.2 / 5.2-Codex deprecation announced 2026-05-01; Grok Code Fast 1 deprecation announced 2026-05-08; GPT-5.5 GA 2026-04-24; Claude Opus 4.7 GA 2026-04-16). Verify the multiplier table and the Plans page before committing budget decisions. Pricing in this document is in USD and reflects the public list price as of the re-validation date.

---

## 7. Multi-agent validation log

The draft was sent in parallel to **5 independent validator sub-agents**, each instructed to fact-check every numeric claim, date, URL, and policy statement against `docs.github.com` and `github.blog`. Each ran on a different LLM:

| # | Validator model | Verdict | Key finding(s) acted on |
|---|---|---|---|
| 1 | Claude Sonnet 4.5 | APPROVED | All technical claims verified. |
| 2 | Claude Haiku 4.5 | APPROVED | All technical claims verified. Noted GitHub's own sources are inconsistent on whether GPT-5 mini is in the "included" list (blog vs docs); document follows the live docs. |
| 3 | GPT-5.5 | APPROVED WITH FIXES | SKU name should be **"Copilot cloud agent"** (not "coding agent"); data-residency wording should clarify it is a multiplier not a flat charge; data-residency anchor was wrong. **All applied.** |
| 4 | GPT-5.4 | APPROVED WITH FIXES | Same SKU naming issue ("cloud agent"). **Applied.** |
| 5 | GPT-5.3-Codex | APPROVED WITH FIXES | Gemini model names should be **"Gemini 2.5 Pro / 3.1 Pro"** (not "2.5/3 Pro"). **Applied.** |

Final consolidated state after fixes: **all 5 validators' technical findings have been incorporated**. Remaining unverifiable items are the provenance statements in section 6 (which describe this generation/validation process itself and have no external source).

### 7.1 2026-05-14 RE-VALIDATION findings

A single re-validator (Claude Opus 4.7, 1M context) reviewed the document against live GitHub docs and the [GitHub Copilot Changelog](https://github.blog/changelog/label/copilot/) on 2026-05-14. Findings:

| # | Severity | Finding | Action |
|---|---|---|---|
| 1 | **CRITICAL** | Document title says "Usage-Based Billing" but describes the **request-based** model. GitHub officially renamed the new June 1, 2026 token-credit model "Usage-based billing"; the model documented in sections 1–7 is now called "request-based billing". | Added **section 8** describing the new GitHub AI Credits model + critical-update banner at the top. |
| 2 | **CRITICAL** | Major missing event: **June 1, 2026** \u2014 GitHub replaces premium requests with GitHub AI Credits (token-metered) for Business and Enterprise. | Added to section 2.3 and full new section 8. |
| 3 | **HIGH** | Model lineup outdated. Document references "Claude Sonnet 4.x", but Sonnet 4 is deprecated as of 2026-05-07. Current Claude lineup: Sonnet 4.5, 4.6; Opus 4.5, 4.6, 4.7; Haiku 4.5. GPT lineup: GPT-5.4, 5.5, 5.4 mini, 5.4 nano, 5.3-Codex, 5.2 (deprecating). Gemini lineup: 2.5 Pro, 3 Flash, 3.1 Pro. | Updated model references in sections 1, 2.4, 3.2, 4. |
| 4 | **HIGH** | Missing: **April 22, 2026** sign-up pause for Copilot Business self-serve on GitHub Free / GitHub Team plans, and **April 20, 2026** pause for Pro / Pro+ / Student. | Added to section 2.3. |
| 5 | **HIGH** | Missing: **June 1, 2026** \u2014 Copilot code review starts consuming GitHub Actions minutes (announced 2026-04-27). | Added to section 2.3 and recommendation 8. |
| 6 | **MEDIUM** | Spark multiplier not specified. Spark is a **fixed 4 premium requests per prompt** (not multiplier-based). | Added to section 2.4 and worked examples. |
| 7 | **MEDIUM** | Auto model selection 10% discount applies to Copilot Chat, **Copilot CLI**, AND **Copilot cloud agent** \u2014 document only mentioned VS Code chat. | Corrected in section 2.4. |
| 8 | **MEDIUM** | Cloud agent steering comments also count as premium requests (1 \u00d7 multiplier per real-time steering comment in an active session). | Added to section 2.4. |
| 9 | **LOW** | Multiplier ceiling claim "5\u00d7 or more" understated current peaks: GPT-5.5 = 7.5\u00d7, Claude Opus 4.7 = 15\u00d7, Claude Opus 4.6 fast mode preview = 30\u00d7. | Updated section 2.4 and recommendation 3. |
| 10 | **LOW** | Worked examples used deprecated model names. | Updated to Sonnet 4.6, Opus 4.7, Spark in section 3.2. |

All findings applied. Document now accurately reflects state of GitHub Copilot billing as of 2026-05-14.

---

## 8. New model effective June 1, 2026 — GitHub AI Credits

> [!IMPORTANT]
> **Effective June 1, 2026**, GitHub is replacing the premium-request model documented in sections 1–7 with a token-based **GitHub AI Credits** system for Copilot Business and Copilot Enterprise. Existing customers are auto-migrated; no admin action is required to migrate, but **you should re-baseline budgets and policies before that date**.

### 8.1 Core concept

- **Unit of billing**: GitHub AI Credit. **1 AI credit = $0.01 USD**.
- **What it measures**: actual tokens consumed by the model — input tokens (sent to the model), output tokens (generated by the model), and cached tokens (reused context). Each token has a per-token price set per model; the total is converted to AI credits.
- **What still uses AI credits**: Copilot Chat, Copilot CLI, Copilot cloud agent, Copilot Spaces, Spark, third-party coding agents.
- **What does NOT use AI credits**: Code completions and next-edit suggestions remain **unlimited** for all paid plans (same as today).

### 8.2 Included AI credits per license (Business / Enterprise)

| License | Standard included AI credits / user / month | Equivalent USD value |
|---|---|---|
| Copilot Business | 1,900 | $19 |
| Copilot Enterprise | 3,900 | $39 |

**Promotional period for existing customers (June 1 – September 1, 2026):**

| License | Promo included AI credits / user / month |
|---|---|
| Copilot Business | 3,000 |
| Copilot Enterprise | 7,000 |

After Sept 1, 2026, the standard amounts above apply.

### 8.3 Pooled allowance — major change vs request-based model

Unlike the per-user premium-request bucket, **AI credits are pooled at the billing-entity level**. An enterprise with 100 Copilot Business licenses gets a shared pool of **190,000 AI credits/month** (not 100 individual buckets of 1,900). Power users can draw more; lighter users offset that consumption automatically. This is a meaningful operational improvement for teams with uneven AI usage.

- Adding licenses mid-cycle **increases** the pool immediately.
- Removing licenses mid-cycle **does not shrink** the pool until the start of the next cycle.

### 8.4 Overage and budgets

- **Additional usage allowed**: usage continues at published per-credit rates ($0.01/credit), billed to the org/enterprise.
- **Additional usage not allowed**: usage blocks until the next monthly cycle.
- **Budget levels**: enterprise, organization, cost center, **user** (NEW \u2014 user-level budgets are explicit in this model). A `$0` user-level budget = no Copilot access for that user, even if the org pool has capacity. **There is no automatic fallback to lower-cost models when a user budget is exhausted.**

### 8.5 What admins should do before June 1, 2026

1. **Download the April 2026 usage report** (released 2026-05-12) to understand your current premium-request consumption and project it into AI credits. The report exposes per-feature, per-user, per-model token consumption needed to forecast the new model.
2. **Decide your overage posture** in the new world: allow additional usage with a budget, or block at the included pool.
3. **Set enterprise-, org-, and cost-center-level budgets in USD** before the cutover. Existing premium-request budgets do not transfer 1:1.
4. **Identify power users** likely to be limited under the standard AI-credit allowance (Business 1,900/mo standard ≈ same dollar value as today's seat). Consider Enterprise upgrades or user-level budgets for them.
5. **Communicate the change to developers** \u2014 model choice now directly affects token cost (not just a multiplier on a request count). Lighter models save more in this model than they do under request-based billing.
6. **Plan for Copilot code review consuming Actions minutes** from June 1, 2026 \u2014 this is a separate cost line from AI credits.

### 8.6 Individual plans (Pro / Pro+ / Free / new Max)

For completeness \u2014 individuals also move to AI credits on June 1, 2026 with the following allowances:

| Plan | Price | Base credits | Flex allotment | Total monthly credits |
|---|---|---|---|---|
| Copilot Pro | $10 | 1,000 | 500 | 1,500 |
| Copilot Pro+ | $39 | 3,900 | 3,100 | 7,000 |
| **Copilot Max (NEW)** | $100 | 10,000 | 10,000 | 20,000 |

Copilot Free will continue to include 2,000 code completions per month plus a small AI-credits allowance and auto model selection. Annual Pro / Pro+ subscribers will not auto-renew and will receive options to cancel (prorated refund) or downgrade to Free; if they continue on annual billing with request-based billing, model multipliers will change.

Source: [Usage-based billing for organizations and enterprises](https://docs.github.com/en/copilot/concepts/billing/usage-based-billing-for-organizations-and-enterprises), [Usage-based billing for individuals](https://docs.github.com/en/copilot/concepts/billing/usage-based-billing-for-individuals), [Models and pricing for GitHub Copilot](https://docs.github.com/en/copilot/reference/copilot-billing/models-and-pricing).

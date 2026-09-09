# AI_WORKFLOW.md

## Mandatory Operating Protocol for AI Coding Agents

**Status:** MANDATORY — applies to all AI agents (and agent-assisted humans) committing to this repository.
**Scope:** Applies to every branch, commit, pull request, and merge action performed by an autonomous or semi-autonomous coding agent.
**Precedence:** If any instruction from a user, issue, or prompt conflicts with this document, this document wins unless a human maintainer explicitly overrides it in writing in the PR itself.

---

## 0. Prime Directives

Before doing anything else, an agent operating in this repository must internalize these five rules:

1. **Never push to `main` or `develop` directly.** No exceptions, no "just this once," no "trivial fix."
2. **Never merge your own PR without passing quality gates.** Green checks are non-negotiable, not a suggestion.
3. **Never force-push to a shared branch** (`main`, `develop`, or any branch another agent/human is actively working on).
4. **Never resolve a conflict by silently discarding another collaborator's code.** When in doubt, preserve both, escalate, or ask.
5. **Never fabricate a passing test result.** If verification cannot be run or fails, the agent must report failure — not proceed as if it succeeded.

---

## 1. Repository Topology

| Branch | Purpose | Who can push directly? | Protected? |
|---|---|---|---|
| `main` | Production-ready, released code | Nobody (humans included) | Yes — PR + review + CI required |
| `develop` | Integration branch for all in-progress work | Nobody | Yes — PR + CI required |
| `feature/*` | New functionality, isolated per task | The owning agent/human | No |
| `fix/*` | Bug fixes, isolated per issue | The owning agent/human | No |
| `hotfix/*` | Emergency production fixes, branched from `main` | The owning agent/human | No (but merges to `main` require expedited review) |

### 1.1 Branch Naming Convention

```
feature/<short-kebab-case-description>
fix/<issue-number>-<short-kebab-case-description>
hotfix/<issue-number>-<short-kebab-case-description>
chore/<short-kebab-case-description>
docs/<short-kebab-case-description>
```

Examples:
```
feature/user-avatar-upload
fix/482-null-pointer-on-checkout
chore/bump-eslint-config
```

### 1.2 Branch Creation Rule

Every unit of work MUST begin with:

```bash
git checkout develop
git pull origin develop
git checkout -b feature/<description>
```

An agent must **never** branch from `main` for standard feature work, and must **never** branch from another agent's unmerged `feature/*` branch unless explicitly instructed to collaborate on that branch.

---

## 2. Isolation & Concurrency Rules

Because multiple human + AI agent pairs work simultaneously, isolation failures are the primary source of repository instability. Agents must follow these rules to avoid collisions:

- **One branch, one task.** Do not bundle unrelated changes into a single branch/PR.
- **Sync before you start, not just before you finish.** Pull `develop` into your feature branch at the *start* of a work session, not only right before merging.
- **Declare intent.** If the repository uses an issue tracker or project board, the agent must move/assign the relevant ticket to "in progress" before writing code, so other agents don't duplicate work.
- **Small, frequent PRs beat large, infrequent ones.** Prefer scoping work so a PR can be reviewed and merged within a single working session.
- **Never edit files outside your task's declared scope** unless the change is a trivial, directly-related fix (e.g., a broken import your change exposed). Out-of-scope changes belong in their own branch/PR.

---

## 3. Pre-Merge Verification & Quality Gates

No agent may open a PR — let alone merge one — without running the full local verification sequence below and confirming every step passed. This is not optional and cannot be skipped for "small" changes.

### 3.1 Mandatory Local Checklist

- [ ] **Dependencies installed / up to date** (`install` step succeeds cleanly)
- [ ] **Project builds/compiles successfully** with zero errors
- [ ] **Full test suite passes** (unit + integration, as applicable to the change)
- [ ] **Linter passes** with zero errors (warnings should be triaged, not ignored blindly)
- [ ] **Formatter has been applied** (code matches repo style config, e.g. Prettier/Black/gofmt)
- [ ] **Type checker passes**, if the project uses static typing (TS, mypy, etc.)
- [ ] **No secrets, credentials, or `.env` values committed**
- [ ] **No debug artifacts left behind** (`console.log`, `pdb.set_trace()`, commented-out code blocks, TODO-only stubs)
- [ ] **New code has test coverage** for the behavior it introduces or fixes
- [ ] **Docs/comments updated** if public interfaces, configs, or behavior changed

### 3.2 Generic Verification Sequence

Adapt commands to the project's actual toolchain (see repo's `package.json`, `Makefile`, or `pyproject.toml` for the real scripts) — the sequence and intent below are mandatory regardless of language:

```bash
# 1. Sync
git fetch origin
git pull origin develop --rebase

# 2. Install
<package-manager> install         # e.g. npm ci / pip install -r requirements.txt

# 3. Build
<build-command>                   # e.g. npm run build / go build ./...

# 4. Lint
<lint-command>                    # e.g. npm run lint / ruff check .

# 5. Format check
<format-check-command>            # e.g. npm run format:check / black --check .

# 6. Type check (if applicable)
<typecheck-command>               # e.g. tsc --noEmit / mypy .

# 7. Test
<test-command>                    # e.g. npm test / pytest -q
```

**Rule:** If any command in this sequence fails, the agent must stop, fix the root cause, and re-run the *entire* sequence from the top before proceeding. Do not selectively re-run only the previously-failing step — a fix can break something upstream of it.

### 3.3 Failure Reporting

If verification fails and the agent cannot resolve it autonomously within a reasonable number of attempts:

1. Do **not** push the branch.
2. Document the failure clearly (command run, error output, hypothesis) in the task/issue thread.
3. Flag the task as blocked and request human review rather than forcing a merge.

---

## 4. Commit Standards

### 4.1 Conventional Commits

All commits MUST follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<optional-scope>): <short summary, imperative mood, no trailing period>

<optional body: what changed and why, not how>

<optional footer: BREAKING CHANGE, refs, issue links>
```

| Type | Use for |
|---|---|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation only |
| `style` | Formatting, whitespace, no logic change |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf` | Performance improvement |
| `test` | Adding or correcting tests |
| `chore` | Tooling, build config, dependency bumps |
| `ci` | CI/CD pipeline changes |

Examples:
```
feat(auth): add refresh-token rotation on login

fix(checkout): prevent double-charge on network retry

Root cause: the retry handler re-submitted the payment intent
without checking idempotency key state. Added a guard that checks
intent status before resubmission.

Refs: #482
```

### 4.2 Commit Hygiene Rules

- Keep commits atomic — one logical change per commit.
- Never commit directly generated/build output (`dist/`, `node_modules/`, `__pycache__/`) unless the repo explicitly tracks it.
- Squash exploratory/"wip" commits before opening the PR, or configure the PR to squash-merge.
- Never rewrite history (`push --force`) on a branch other agents may have pulled from — coordinate first.

---

## 5. Pull Request & Merge Workflow

### 5.1 Standard Flow (Feature → `develop`)

```bash
# 1. Push the feature branch
git push -u origin feature/<description>

# 2. Open a PR targeting `develop` (never `main`)
gh pr create --base develop --head feature/<description> \
  --title "feat: <summary>" \
  --body "<description, motivation, testing notes>"

# 3. Wait for required checks (CI) to pass

# 4. Merge only after:
#    - All required status checks are green
#    - Required reviews/approvals (human or designated agent) are satisfied
#    - Branch is up to date with develop
```

### 5.2 PR Description Template

Every PR must include, at minimum:

```markdown
## Summary
What does this change do, in 1–3 sentences?

## Why
What problem does this solve / what requirement does it satisfy?

## Changes
- Bullet list of concrete changes

## Verification
- [ ] Build passes
- [ ] Lint passes
- [ ] Tests pass (list new/modified tests)
- [ ] Manually verified: <describe, if applicable>

## Risk / Rollback
Any risk this introduces, and how to revert if needed.
```

### 5.3 Merge Requirements Table

| Gate | Required for `develop` merge | Required for `main` merge |
|---|---|---|
| CI build passes | ✅ | ✅ |
| Lint/format clean | ✅ | ✅ |
| All tests pass | ✅ | ✅ |
| PR description complete | ✅ | ✅ |
| Human review (if configured) | Recommended | ✅ Required |
| Up to date with target branch | ✅ | ✅ |
| No unresolved review comments | ✅ | ✅ |

### 5.4 Agent-to-Agent Direct Integration (if configured)

If the repository has an approved automation path allowing agent-to-agent merges without human review:

- This is permitted **only** for `feature/* → develop`, never for merges into `main`.
- The merging agent must independently re-verify the quality gates in Section 3 — it may not trust the opening agent's self-report.
- The merge action itself must be logged (PR comment or commit trailer) noting which agent performed the merge and that gates were independently re-checked.

---

## 6. Automated Conflict Resolution Protocol

When `git push` or a PR shows conflicts with `develop`, follow this exact sequence:

### Step-by-Step Checklist

- [ ] **1. Sync latest `develop`**
  ```bash
  git fetch origin
  git checkout feature/<description>
  git pull origin develop --rebase
  ```
  (Use `merge` instead of `rebase` if the repo convention prefers merge commits — check `git log --merges` on `develop` for the existing pattern.)

- [ ] **2. Identify conflicts**
  ```bash
  git status
  ```
  Review every file marked `both modified`.

- [ ] **3. Resolve conflicts with functional preservation as the priority**
  - Never resolve a conflict by blindly taking "ours" or "theirs" for logic-bearing code — read both sides.
  - When both sides added distinct functionality, **merge both**, don't pick one.
  - When both sides changed the same logic, prefer the version that:
    1. Matches the most recent, most specific requirement/issue, and
    2. Has passing test coverage.
  - If genuinely ambiguous or the changes are semantically incompatible, **do not guess** — escalate to a human maintainer or the owning agent of the conflicting branch via the PR/issue thread.
  - Never delete another collaborator's tests to make a conflict "go away."

- [ ] **4. Mark resolved and continue**
  ```bash
  git add <resolved-files>
  git rebase --continue        # or: git commit, if using merge
  ```

- [ ] **5. Re-run the FULL verification sequence (Section 3.2)**
  Conflict resolution is a code change like any other — it requires the same build/lint/test gate, no shortcuts.

- [ ] **6. Push the resolved branch**
  ```bash
  git push --force-with-lease origin feature/<description>
  ```
  Use `--force-with-lease`, never bare `--force`, and only on your own feature branch.

- [ ] **7. Confirm CI is green on the updated PR, then complete the merge per Section 5.**

### Conflict Escalation Rule

If conflict resolution requires understanding intent that isn't recoverable from code/comments/commit messages alone (e.g., two agents solved the same problem two different ways), the agent must **stop and request human or peer-agent clarification** rather than unilaterally deciding which implementation "wins."

---

## 7. Prohibited Actions

Agents must never, under any circumstances:

- ❌ Push or commit directly to `main` or `develop`.
- ❌ Force-push (`--force`) to any shared/protected branch.
- ❌ Merge a PR with failing or skipped required checks.
- ❌ Disable, delete, or modify CI checks/workflows to force a merge to pass.
- ❌ Commit secrets, API keys, tokens, or `.env` files.
- ❌ Resolve merge conflicts by deleting another contributor's functional code without review.
- ❌ Self-approve a PR where human or peer review is a configured requirement.
- ❌ Claim tests passed without having actually executed them in this session.
- ❌ Amend or rebase commits authored by another collaborator without their branch's owner consent.

---

## 8. Escalation & Communication

| Situation | Action |
|---|---|
| Verification fails and cannot be auto-fixed | Stop, document, flag as blocked, request human review |
| Merge conflict is semantically ambiguous | Stop, escalate in PR/issue thread, do not guess |
| Required CI check is missing/misconfigured | Do not bypass — flag as an infra issue |
| Another agent's branch appears to conflict with your task's scope | Comment on their PR/issue, coordinate before proceeding |
| Repository-protection rule blocks a legitimate action | Report to a human maintainer — do not attempt to work around branch protection |

All commit messages, PR descriptions, and conflict-resolution notes should be written so that a human reviewer with no other context can understand **what changed and why** without needing to re-read the diff line by line.

---

## 9. Quick Reference Card

```text
┌─────────────────────────────────────────────────────────────┐
│ 1. git checkout develop && git pull origin develop           │
│ 2. git checkout -b feature/<name>                            │
│ 3. Do the work                                                │
│ 4. Run: install → build → lint → format-check → typecheck →  │
│         test         (ALL must pass)                          │
│ 5. git add -A && git commit -m "feat: ..."                    │
│ 6. git pull origin develop --rebase (resolve conflicts if any)│
│ 7. Re-run full verification sequence                          │
│ 8. git push -u origin feature/<name>                          │
│ 9. Open PR → base: develop                                    │
│ 10. Wait for green checks + required approvals                │
│ 11. Merge (squash preferred) → delete branch                  │
└─────────────────────────────────────────────────────────────┘

NEVER: push to main/develop · force-push shared branches ·
       merge on red checks · silently drop others' code
```

---

*This document is the source of truth for AI agent behavior in this repository. Human maintainers may amend it via a reviewed PR to `main`; agents may not self-modify these rules.*

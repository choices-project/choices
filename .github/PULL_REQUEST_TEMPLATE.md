## PR Title Format
**IMPORTANT:** PR title must follow this exact format:
```
type(scope): summary [agent-N]
```

**Examples:**
- `fix(deps): resolve infinite npm install loop [agent-0]`
- `test(framework): validate framework with corrected policy [agent-0]`
- `feat(auth): add biometric authentication [agent-1]`
- `docs(ci): update workflow configuration [agent-0]`

**Valid types:** `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`
**Agent numbers:** Use `[agent-0]` for owner, `[agent-1]` for AI agents

## Date (UTC)
**Date:** YYYY-MM-DD

## What
<!-- one sentence user-facing goal -->

## Why
<!-- link issue; problem this solves -->

## Scope
- [ ] Code paths limited to: <list>
- [ ] Max LOC under policy
- [ ] No deploy settings or new deps (unless approved)

## Acceptance Criteria
- [ ] API/contract matches spec
- [ ] Tests added (unit or handler) and pass locally
- [ ] No client-only libs in server code
- [ ] Lint/typecheck/build passing

## Risk Assessment
- Rollback plan:
- Data impact:
- Affected hot files:

## Notes

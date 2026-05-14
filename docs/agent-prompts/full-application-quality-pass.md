# Full application quality pass (paste into a new agent)

Copy everything inside the `<agent_task>` block below into a **new Cursor agent chat** (empty thread). Adjust optional sections if needed.

For the **prioritized backlog** (optional alignment only), see **`docs/REMAINING_WORK_ROADMAP.md`**. For doc ↔ code alignment when you touch routes, stores, env, or security narratives, see **`docs/DOCUMENTATION_AUDIT_ROADMAP.md`**.

---

<agent_task>

<context>
You are working in the **Choices** monorepo: a privacy-first participatory democracy app (**Next.js 14 App Router + Supabase**). The main application is under **`web/`**. Repository root holds `docs/`, `supabase/`, `.github/workflows/`, etc.

Respect project rules (they load automatically): **`.cursor/rules/projectruleschoices.mdc`** (stack, MCP, deploy) and **`.cursor/rules/choices-agent-defaults.mdc`** (grounding, minimal diffs, when to implement). Read **`AGENTS.md`** at the repo root for commands, Node/npm versions, and gotchas before changing anything material. **`docs/TESTING.md`** maps CI jobs to commands; **`docs/AGENT_SETUP.md`** covers MCP and optional tooling.

Skills when relevant: **`.agents/skills/vercel-react-best-practices/`** (React / App Router), **`.agents/skills/supabase-postgres-best-practices/`** (Postgres / RLS / migrations).
</context>

<objective>
**Identify, test, and fix** remaining defects so the repo stays merge-ready: user-visible bugs, security-sensitive mistakes, CI-style failures, test flakes you can fix without hiding bugs, and documentation or contract drift when behavior changes.

Prioritize **(1)** user-visible bugs and security issues, **(2)** CI gates and doc drift from your edits, **(3)** reliability, **(4)** polish only when required.
</objective>

<constraints>
- **Minimal diffs:** Only change what is required to fix an issue; no drive-by refactors, no unrelated files, no new dependencies unless unavoidable.
- **Ground every fix:** Read or search the code before editing; do not guess APIs or file layout.
- **Tests:** Prefer fixing root causes over weakening assertions. Do not delete tests to make green unless a test is objectively wrong or duplicated—and then document why.
- **Known baseline:** `AGENTS.md` / `docs/TESTING.md` note legacy Jest debt in **`tests/integration/feeds/`** and **`tests/unit/supabase/`**. Separate regressions from pre-existing debt (triage note, issue, or narrow skip with rationale per quarantine policy).
- **Typecheck:** From **`web/`**, use **`npm run types:ci`** (CI uses `tsconfig.ci.json`), not ad-hoc `type-check`.
- **Lint:** From **`web/`**, use **`npm run lint:strict`** for CI parity (see `.github/workflows/types.yml`).
- **Jest CI parity:** CI may run **`npm run jest:ci`** (`--runInBand --ci`); local **`npm run test`** is the default developer command—use `jest:ci` if you need stricter ordering parity.
- **Docs / contracts:** If you change API routes, response shapes, status codes, stores, feature flags, or env validation, run **`npm run verify:docs`** from the repo root and update **`docs/API/contracts.md`**, **`docs/ENVIRONMENT_VARIABLES.md`**, or **`web/.env.local.example`** as required.
- **Store governance:** If `scripts/check-governance.js` applies, keep **`docs/ROADMAP.md`** and **`docs/STATE_MANAGEMENT.md`** aligned with store or cascade expectations.
- **Deploy:** Do not use Vercel MCP **`deploy_to_vercel`**; production ships via **git push → CI** (see rules and `docs/AGENT_SETUP.md`).
</constraints>

<methodology>
Work in **phases**. Use **parallel** read-only tool calls where independent.

### Phase 0 — Scope
Confirm goal, non-goals, and definition of done. If intent is ambiguous, ask **one** short question—still begin repo reads in parallel.

### Phase 1 — Inventory (read-only)
1. Skim **`AGENTS.md`**, **`docs/TESTING.md`** (gates you will run), and **`docs/AGENT_SETUP.md`** as needed.
2. Scan **`.github/workflows/`** (`ci.yml`, `web-ci.yml`, `types.yml`, `test.yml`, etc.) for commands that gate your paths.
3. Search **`web/`** and **`supabase/`** for actionable **`TODO`**, **`FIXME`**, **`HACK`** (ignore incidental strings such as **`XXXX`** in user-facing copy).

### Phase 2 — Local verification
From **`web/`**:
- **`npm run lint:strict`**
- **`npm run types:ci`**
- **`npm run test`** (or **`npm run jest:ci`** for CI-like Jest)
- **`npm run test:contracts`** when public API shapes or status codes change

From **repository root**:
- **`npm run verify:docs`** when routes, stores, flags, env validation, or doc-linked inventories change

### Phase 3 — E2E (targeted)
- **`npm run test:e2e:smoke`** (harness env is pinned by the script; see `docs/TESTING.md`).
- After auth, API envelope, or critical-journey changes: narrowest relevant Playwright spec(s); consider **`npm run test:e2e:critical`** for error-path + critical-journey parity with release policy in `docs/TESTING.md`.

### Phase 4 — Production smoke (optional)
From **`web/`**: **`npm run test:e2e:production:smoke`** against **`https://www.choices-app.com`** only when policy and secrets allow and there is no leakage risk.

### Phase 5 — Fix loop
For each confirmed issue: reproduce → smallest fix → re-run the **minimal** proof commands → update contracts / env docs / examples when behavior or keys change.

### Phase 6 — Handoff
Summarize symptom, root cause, files changed, commands with results, deferred work, and suggested follow-up issues. **Append a dated line to the “Rolling verification log” section** in **`docs/agent-prompts/full-application-quality-pass.md`** (below this block) so the next agent inherits verified state.
</methodology>

<acceptance_criteria>
Consider the task **done** when:
- [ ] **`npm run lint:strict`** and **`npm run types:ci`** pass from **`web/`**, or you document the CI-equivalent commands you ran and why anything could not run locally.
- [ ] Jest passes (**`npm run test`** or **`npm run jest:ci`**) **or** remaining failures are explicitly labeled pre-existing / quarantined with rationale and next step.
- [ ] **`npm run verify:docs`** passes from the repo root when applicable inventories or contracts were touched.
- [ ] No new secrets; security checks not disabled without strong justification.
- [ ] Clear summary, intentionally deferred items, and an updated **rolling verification log** entry in this file (maintainers).
</acceptance_criteria>

<out_of_scope>
- Large product features or broad redesigns unless required to fix a bug or explicitly requested.
- Rewriting unrelated modules for style only.
- Changing production secrets or dashboard-only Supabase/Vercel settings from the agent (document recommendations instead).
</out_of_scope>

</agent_task>

---

## Rolling verification log (maintainers)

Agents completing a quality pass should append one line (date in UTC or local, commands, pass/fail, notable debt).

| Date | Agent / session | Commands (short) | Result | Notes |
|------|-------------------|------------------|--------|-------|
| 2026-05-14 | Quality pass | `web/`: `lint:strict`, `types:ci`, `test`; root: `verify:docs`; `web/`: `test:e2e:smoke` | All green | Jest still prints worker force-exit / open-handle warning (see **P1-T2** in `docs/REMAINING_WORK_ROADMAP.md`); E2E smoke OK with harness. Production smoke not run. |

---

## Tips when you send this

- Attach or @-mention **`AGENTS.md`** if your Cursor build benefits from explicit file attachment.
- If you care about **one area first** (e.g. auth, civics, admin), add a single sentence under `<constraints>` narrowing scope.
- For a **time box**, add: “Spend at most N hours; then summarize remaining work and update the rolling verification log.”

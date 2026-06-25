# AI agents & Cursor setup (Choices)

_Last updated: June 24, 2026_

This guide is for **human developers** and **coding agents** (Cursor, Claude Code, Codex, etc.) working on the Choices repo. It complements [`AGENTS.md`](../AGENTS.md) (commands and env) and [`DOCUMENTATION_AUDIT_ROADMAP.md`](DOCUMENTATION_AUDIT_ROADMAP.md) (doc ↔ code parity).

---

## 1. Vercel-related tooling (MCP, plugin, AI Gateway)

| Integration | What it is | Use it for |
|-------------|------------|------------|
| **Vercel MCP** (`https://mcp.vercel.com`) | MCP server wired in [`.cursor/mcp.json`](../.cursor/mcp.json) | Project linkage, deployments, build/runtime logs, and **Vercel product docs** inside Cursor. Fits **repository work** and production debugging. |
| **Vercel plugin for AI agents** ([docs](https://vercel.com/docs/agent-resources/vercel-plugin)) | Official **Cursor / Claude Code / Codex** plugin: skills, slash commands, hooks, and Vercel-focused context | On-demand help for **Next.js**, **env vars**, **deployments / CI**, **Vercel CLI**, **Upstash**, etc. Installed per machine; see below. |
| **Vercel AI Gateway** (`https://ai-gateway.vercel.sh`) | Unified LLM API front door | **Terminal / CLI coding agents** (Claude Code, OpenAI Codex, OpenCode, etc.): one key, many models, spend and traces in the Vercel dashboard. See [Vercel: Coding agents](https://vercel.com/docs/agent-resources/coding-agents). |

**MCP** and the **Vercel plugin** both help with the Vercel platform; they complement each other (MCP for live project data in-editor, plugin for packaged skills and slash commands). **AI Gateway** is separate: model traffic only.

**Optional (per developer or team policy):** configure your terminal agent to use AI Gateway per Vercel’s docs above. Do **not** commit API keys; use environment variables or your OS secret store.

### 1.1 Install the Vercel plugin (Cursor, project scope)

From the **repository root** (after Node 18+ is available):

```bash
npm run plugins:vercel
```

That runs `npx plugins add vercel/vercel-plugin -y -s project -t cursor` as documented in the [Vercel plugin installation guide](https://vercel.com/docs/agent-resources/vercel-plugin#getting-started). Restart Cursor (or reload agent tools) so the plugin loads.

Examples of what you get (see upstream docs for the full list):

- Slash-style commands such as `/vercel-plugin:deploy`, `/vercel-plugin:env`, `/vercel-plugin:status`, `/vercel-plugin:bootstrap`, `/vercel-plugin:marketplace`
- Skills such as `nextjs`, `env-vars`, `deployments-cicd`, `vercel-cli`, `vercel-storage` (Upstash Redis, etc.)

**Deploy policy for this repo (unchanged):** production goes out via **git push to `main` → CI/CD → Vercel**. Do not use MCP **`deploy_to_vercel`** (keep it disabled). Treat plugin **deploy** commands the same way unless a maintainer explicitly asks for a one-off preview deploy.

**Telemetry (optional):** to disable plugin telemetry in shells that launch your agent, use `VERCEL_PLUGIN_TELEMETRY=off` as described in the [Vercel plugin telemetry section](https://vercel.com/docs/agent-resources/vercel-plugin#telemetry). **Debug:** `VERCEL_PLUGIN_LOG_LEVEL=debug` or `npx vercel-plugin doctor` per upstream docs.

### 1.2 Vercel dashboard: align Build & Deployment with the repo

The linked Git repository’s **root** [`vercel.json`](../vercel.json) is the canonical build contract: **Root Directory** `web`, **Build Command** `./scripts/vercel-build.sh`, **Install Command** `npm install`. App crons are declared in [`web/vercel.json`](../web/vercel.json).

If Vercel shows a warning that **Production** used different settings than **Project Settings**, open **Settings → Build and Deployment**, enable **overrides** for **Build** and **Install**, set the values above to match `vercel.json`, then **redeploy** Production. Details: [`docs/TROUBLESHOOTING.md`](TROUBLESHOOTING.md) → **Vercel: Production deployment differs from Project Settings (build command)**.

---

## 2. MCP servers configured for this repo

Configuration lives in **[`.cursor/mcp.json`](../.cursor/mcp.json)**.

### 2.0 Hosted MCP — verified wiring (Supabase + Vercel)

When **Tools & MCP** shows both servers **Connected**, agents should use them **before** guessing schema, migrations, or deploy state.

| Config key | Cursor server id (tool calls) | Endpoint | Project scope |
|------------|-------------------------------|----------|-----------------|
| **supabase** | **`project-0-Choices-supabase`** | `https://mcp.supabase.com/mcp?project_ref=muqwrehywjrbaeerjgfb` | Supabase project **`muqwrehywjrbaeerjgfb`** (production DB) |
| **vercel** | **`project-0-Choices-vercel`** | `https://mcp.vercel.com` | Vercel project **`choices-platform`** (`prj_zq2t5u8FsRokHsYPeMqSXomI6DXI`, team `team_gZAmts6oIjD0yvys2FAYLSgx`) |

**Smoke tests** (run after OAuth or when debugging agent access):

| Server | Tool | Expected |
|--------|------|----------|
| Supabase | `list_tables` (`schemas: ["public"]`) | Tables such as `polls`, `user_profiles`, `votes` with RLS enabled |
| Supabase | `list_migrations` | Includes `20260622120000` (profile privilege guard) among applied migrations |
| Supabase | `get_advisors` (`type: "security"`) | Review permissive RLS / SECURITY DEFINER warnings after DDL changes — see [`.agents/AUTH_SECURITY_HANDOFF.md`](../.agents/AUTH_SECURITY_HANDOFF.md) and [`scratch/AUTH_OVERHAUL_PLAN.md`](../scratch/AUTH_OVERHAUL_PLAN.md) |
| Vercel | `list_teams` | Team containing this repo’s Vercel project |
| Vercel | `get_project` | **`choices-platform`**, domains include **`www.choices-app.com`**, latest production deployment **READY** |

Vercel **`projectId` / `teamId`**: read **`.vercel/project.json`** at repo root when present (local link; not committed under `web/.gitignore` patterns), or discover via **`list_teams`** → **`list_projects`**.

**All MCP servers in this repo:**

| Server | Role |
|--------|------|
| **supabase** | Hosted MCP (project ref in config). Schema, SQL, migrations, advisors, logs—prefer over guessing. See **§2.1**. |
| **vercel** | Hosted MCP. Deployments, build/runtime logs, Vercel docs. See **§2.2**. **Disable** `deploy_to_vercel` in Cursor; production deploys are **git push → CI**. |
| **govinfo** | Local Python server under `.cursor/govinfo-mcp/`; requires `GOVINFO_API_KEY`. |
| **legismcp** | Congress.gov-style tooling; uses `CONGRESS_GOV_API_KEY` (see env docs). |
| **playwright** | Browser automation MCP; run from `.cursor/mcp-servers/`. |
| **us-gov-open-data** | US open-data MCP bundle; same Congress key env as LegisMCP where applicable. |

**Local install** for script-based MCPs: [`.cursor/mcp-servers/README.md`](../.cursor/mcp-servers/README.md) (`npm install` in that directory).

**Script-based MCPs** use **`bash`** plus paths relative to the **repository root** (for example **`.cursor/run-govinfo-mcp.sh`**). **`govinfo`** still needs a Python venv under **`.cursor/govinfo-mcp/`** on each machine; the launcher fails with a clear message if **`.venv/bin/python3`** is missing.

### 2.1 Supabase MCP — make it work for every agent chat

Repo config (already correct):

```json
"supabase": {
  "url": "https://mcp.supabase.com/mcp?project_ref=muqwrehywjrbaeerjgfb"
}
```

**One-time setup (each machine / after token expiry):**

1. **Cursor → Settings → Tools & MCP** (or **Cursor Settings → MCP**).
2. Find **`supabase`** — status should be **Connected** with tools listed (`list_tables`, `execute_sql`, `apply_migration`, `list_migrations`, …).
3. If it says **Needs authentication** or tools are missing: click **Connect** / **Log in** → browser OAuth → pick the org that owns **`muqwrehywjrbaeerjgfb`**.
4. **Restart Cursor** (or reload the window) after auth — hosted MCP often does not expose tools until restart.
5. Smoke test in a **new chat**: *“Use Supabase MCP: list tables in public schema.”* Approve the tool call when prompted.

**Why agents sometimes fail (and what it looks like):**

| Symptom | Cause | Fix |
|---------|--------|-----|
| `mcp_auth` / auth timeout | OAuth not completed or expired | Re-auth in Settings → MCP → supabase; restart Cursor |
| `MCP OAuth refresh error` → `needsAuth` | Stale refresh token (common after ~days) | Click **Connect** on supabase; complete browser OAuth; restart Cursor |
| `MCP OAuth credentials cleared` then `net::ERR_FAILED` | Cursor wiped bad tokens but did not start a fresh OAuth flow | See **Recovery: Error / ERR_FAILED** below |
| `MCP server does not exist: supabase` | Server disconnected in this session | Re-auth + restart; only connected servers are available to the agent |
| Agent uses `psql` / `DATABASE_URL` instead | MCP unavailable; agent falls back (correct behavior) | Fix MCP auth; keep `web/.env.local` `DATABASE_URL` as fallback only |
| Tool call blocked | Cursor “approve each tool call” / Smart Mode | Approve the call, or adjust MCP approval settings |

**Recovery: Error / `net::ERR_FAILED` (from MCP Output logs)**

If **Tools & MCP → supabase** shows **Error** and logs look like:

```text
MCP OAuth refresh error
MCP OAuth credentials cleared (local housekeeping)
Transient error connecting to streamableHttp server: net::ERR_FAILED
createClient completed ... statusType=error
```

That means OAuth broke, Cursor cleared the stored session, and reconnect is failing before a new login prompt appears. Work through in order:

1. **Confirm the endpoint is reachable** (should return HTTP 401, not a hang):
   ```bash
   curl -sS -o /dev/null -w "HTTP %{http_code}\n" \
     "https://mcp.supabase.com/mcp?project_ref=muqwrehywjrbaeerjgfb"
   ```
   If this fails, fix VPN/firewall/proxy first (Cursor uses its own network stack; terminal working does not guarantee Cursor works).

2. **Force a clean reconnect:** toggle **supabase OFF** → **Quit Cursor completely** (Cmd+Q, not just close window) → reopen → toggle **ON** → click **Connect** / **Log in** if shown → finish browser OAuth → **restart Cursor again**.

3. **If still Error with no login prompt:** remove duplicate Supabase integrations (hosted MCP in `.cursor/mcp.json` **and** the Supabase plugin can fight each other). Keep **one**: project-scoped URL in `mcp.json` is enough. Disable/remove the plugin, quit Cursor, reopen, re-auth hosted MCP only.

4. **Update Cursor** to the latest build — MCP PKCE refresh and token-exchange bugs are active areas; older builds loop on refresh failure.

5. **Last resort — PAT header auth** (local dev only; never commit the token): create a [Supabase access token](https://supabase.com/dashboard/account/tokens), then use env-based headers per [manual authentication](https://supabase.com/docs/guides/getting-started/mcp#manual-authentication). Example pattern (token lives in shell env, not in git):
   ```json
   "supabase": {
     "url": "https://mcp.supabase.com/mcp?project_ref=muqwrehywjrbaeerjgfb",
     "headers": {
       "Authorization": "Bearer ${SUPABASE_ACCESS_TOKEN}"
     }
   }
   ```
   Export `SUPABASE_ACCESS_TOKEN` before launching Cursor, or use your OS keychain / `.env.local` workflow without committing the value.

**Agent implementation note:** In tool calls, Cursor may expose the server as **`project-0-Choices-supabase`** (project-scoped name), not `supabase`. Both refer to the same config in `.cursor/mcp.json`.

**Preferred tools for DB work:**

| Task | MCP tool |
|------|-----------|
| Explore schema | `list_tables`, `execute_sql` (SELECT) |
| Apply DDL | `apply_migration` (name + SQL body) |
| Check history | `list_migrations` |
| Regenerate types | `generate_typescript_types` → then `cd web && npm run types:generate` if needed |

**Security (Supabase recommendation):** Project is already scoped via `project_ref`. Do **not** add `read_only=true` if agents must run **`apply_migration`**. For ad-hoc read-only exploration, a separate read-only MCP entry is optional.

**Fallback when MCP is down** (agents should still ship work):

```bash
# From repo root — requires web/.env.local with DATABASE_URL
set -a && source web/.env.local && set +a
psql "$DATABASE_URL" -f supabase/migrations/YYYYMMDDHHMMSS_name.sql
```

Do **not** commit `DATABASE_URL` or personal access tokens. For CI-only headless MCP, see [Supabase MCP manual auth](https://supabase.com/docs/guides/getting-started/mcp#manual-authentication) (PAT in `Authorization` header — team policy only).

### 2.2 Vercel MCP — deployments, logs, and docs

Repo config:

```json
"vercel": {
  "url": "https://mcp.vercel.com"
}
```

**One-time setup (each machine / after token expiry):**

1. **Cursor → Settings → Tools & MCP** → **`vercel`** should show **Connected** (same OAuth flow as Supabase).
2. If **Needs authentication**: **Connect** / **Log in** → authorize Vercel → **restart Cursor**.
3. Smoke test: *“Use Vercel MCP: get project choices-platform.”* (uses `teamId` / `projectId` from `.vercel/project.json` or `list_teams`).

**Agent implementation note:** Tool calls use server id **`project-0-Choices-vercel`**, not `vercel`.

**Preferred tools (this repo):**

| Task | MCP tool |
|------|-----------|
| Resolve team / project | `list_teams`, `list_projects`, `get_project` |
| Recent deploys | `list_deployments` |
| Failed build | `get_deployment_build_logs` |
| Runtime errors / logs | `get_runtime_errors`, `get_runtime_logs` |
| Vercel product docs | `search_vercel_documentation` |

**Deploy policy (unchanged):** Production ships via **git push to `main` → CI/CD → Vercel**. Do **not** use **`deploy_to_vercel`** (disable in **Settings → Tools & MCP → vercel**). Use MCP for **read** context (status, logs, docs), not agent-triggered production deploys.

**Why agents sometimes fail:**

| Symptom | Fix |
|---------|-----|
| `Needs authentication` on vercel | Connect in Tools & MCP; restart Cursor |
| Missing `teamId` / `projectId` | Read `.vercel/project.json` or `list_teams` → `list_projects` |
| Same OAuth refresh / `ERR_FAILED` loop as Supabase | Toggle off → quit Cursor (Cmd+Q) → reopen → re-auth (see **§2.1** recovery steps) |

---

## 3. Project rules & skills (quality bar)

| Location | Purpose |
|----------|---------|
| **[`.agents/AUTH_SECURITY_HANDOFF.md`](../.agents/AUTH_SECURITY_HANDOFF.md)** | **Canonical auth/security rules** for agents: `getUser`, trust tier server-only, profile strip, admin CSRF, MCP workflow, verification commands. |
| **[`scratch/AUTH_OVERHAUL_PLAN.md`](../scratch/AUTH_OVERHAUL_PLAN.md)** | Implementation backlog + MCP audit items (§16). |
| **[`.cursor/rules/projectruleschoices.mdc`](../.cursor/rules/projectruleschoices.mdc)** | Always-on: stack (Next/Supabase), **skills** to use, MCP preferences, **no `deploy_to_vercel`**, Vercel plugin. YAML `alwaysApply: true`. |
| **[`.cursor/rules/choices-agent-defaults.mdc`](../.cursor/rules/choices-agent-defaults.mdc)** | Always-on: **prompting / behavior** defaults (ground in repo, parallel reads, when to implement vs explain, concise prose, UI fit). Aligns with [Anthropic prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices). |
| **[`.agents/skills/vercel-react-best-practices/`](../.agents/skills/vercel-react-best-practices/)** | Vercel’s React/Next performance rules for agents (`AGENTS.md` + `SKILL.md`). Use for **App Router, RSC, client/server splits, data fetching**. |
| **[Vercel plugin](https://vercel.com/docs/agent-resources/vercel-plugin)** (install via `npm run plugins:vercel`) | Official Vercel skills and slash commands in Cursor; use with **Vercel MCP** for deployments/logs and **this repo’s** deploy policy. |
| **[`.agents/skills/supabase-postgres-best-practices/`](../.agents/skills/supabase-postgres-best-practices/)** | Supabase/Postgres rules: RLS, indexes, queries, migrations. |

**Cursor user skills** may also live under `~/.cursor/skills/` (global). This repo’s **canonical** copy for Choices is **`.agents/skills/`**; keep rules pointing there so clones behave the same.

When adding a new skill or rule: update **`.cursor/rules`** and, if it affects onboarding, add one line here.

**Reusable prompts:** For a fresh chat that should **identify, test, and fix** remaining app issues end-to-end, paste the `<agent_task>` block from [`agent-prompts/full-application-quality-pass.md`](agent-prompts/full-application-quality-pass.md).

---

## 4. Operational habits for agents

1. **Config & secrets:** Copy [`web/.env.local.example`](../web/.env.local.example) to **`web/.env.local`** for local dev. Validated app env is [`web/lib/config/env.ts`](../web/lib/config/env.ts); narrative list in [`ENVIRONMENT_VARIABLES.md`](ENVIRONMENT_VARIABLES.md). Extend Zod when a variable should be typed and validated.
2. **Doc drift:** After API routes, stores, schema, or security-sensitive paths change, run **`npm run verify:docs`** from the repo root (see [`docs/README.md`](README.md)).
3. **Database:** Prefer **Supabase MCP** (`list_tables`, `execute_sql`, `apply_migration`, `list_migrations`) for schema and migrations. After migrations, regenerate **`web/types/supabase.ts`** (`cd web && npm run types:generate` per [`GETTING_STARTED.md`](GETTING_STARTED.md)). Fallback: `DATABASE_URL` + `psql` — see **§2.1**.
4. **Deploy / production debugging:** Prefer **Vercel MCP** (`get_project`, `list_deployments`, `get_deployment_build_logs`, `get_runtime_logs`) for deploy state and logs — see **§2.2**. Do not deploy via MCP.
5. **Civic / legislative keys:** Align with [`ENVIRONMENT_VARIABLES.md`](ENVIRONMENT_VARIABLES.md) (`CONGRESS_GOV_API_KEY`, GovInfo keys, etc.).
6. **Product vs OSS issues:** In-app feedback goes to **`/api/feedback`**; GitHub Issues are for contributor-trackable work. See [`FEEDBACK_AND_ISSUES.md`](FEEDBACK_AND_ISSUES.md) so agent-suggested reports match the right channel.

---

## 5. Historical note

An older, longer write-up lives under [`docs/archive/2026-03-consolidation/AGENT_SETUP.md`](archive/2026-03-consolidation/AGENT_SETUP.md). **This file (`docs/AGENT_SETUP.md`) is the canonical entry**; the archive copy is for history only.

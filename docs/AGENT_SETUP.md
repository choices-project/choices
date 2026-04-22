# AI agents & Cursor setup (Choices)

_Last updated: April 22, 2026_

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

---

## 2. MCP servers configured for this repo

Configuration lives in **[`.cursor/mcp.json`](../.cursor/mcp.json)**.

| Server | Role |
|--------|------|
| **supabase** | Hosted MCP URL (project ref in config). Schema exploration, SQL reasoning—prefer over guessing migrations. |
| **vercel** | Hosted MCP. Deployments, logs, docs. **Disable** the `deploy_to_vercel` tool in Cursor (**Settings → MCP → Vercel**); production deploys are **git push → CI**, not agent-triggered deploys. |
| **govinfo** | Local Python server under `.cursor/govinfo-mcp/`; requires `GOVINFO_API_KEY`. |
| **legismcp** | Congress.gov-style tooling; uses `CONGRESS_GOV_API_KEY` (see env docs). |
| **playwright** | Browser automation MCP; run from `.cursor/mcp-servers/`. |
| **us-gov-open-data** | US open-data MCP bundle; same Congress key env as LegisMCP where applicable. |

**Local install** for script-based MCPs: [`.cursor/mcp-servers/README.md`](../.cursor/mcp-servers/README.md) (`npm install` in that directory).

**Script-based MCPs** use **`bash`** plus paths relative to the **repository root** (for example **`.cursor/run-govinfo-mcp.sh`**). **`govinfo`** still needs a Python venv under **`.cursor/govinfo-mcp/`** on each machine; the launcher fails with a clear message if **`.venv/bin/python3`** is missing.

---

## 3. Project rules & skills (quality bar)

| Location | Purpose |
|----------|---------|
| **[`.cursor/rules/projectruleschoices.mdc`](../.cursor/rules/projectruleschoices.mdc)** | Always-on Cursor rules: which **skills** to apply, MCP preferences, **no `deploy_to_vercel`**, and **Vercel plugin** usage. |
| **[`.agents/skills/vercel-react-best-practices/`](../.agents/skills/vercel-react-best-practices/)** | Vercel’s React/Next performance rules for agents (`AGENTS.md` + `SKILL.md`). Use for **App Router, RSC, client/server splits, data fetching**. |
| **[Vercel plugin](https://vercel.com/docs/agent-resources/vercel-plugin)** (install via `npm run plugins:vercel`) | Official Vercel skills and slash commands in Cursor; use with **Vercel MCP** for deployments/logs and **this repo’s** deploy policy. |
| **[`.agents/skills/supabase-postgres-best-practices/`](../.agents/skills/supabase-postgres-best-practices/)** | Supabase/Postgres rules: RLS, indexes, queries, migrations. |

**Cursor user skills** may also live under `~/.cursor/skills/` (global). This repo’s **canonical** copy for Choices is **`.agents/skills/`**; keep rules pointing there so clones behave the same.

When adding a new skill or rule: update **`.cursor/rules`** and, if it affects onboarding, add one line here.

---

## 4. Operational habits for agents

1. **Config & secrets:** Copy [`web/.env.local.example`](../web/.env.local.example) to **`web/.env.local`** for local dev. Validated app env is [`web/lib/config/env.ts`](../web/lib/config/env.ts); narrative list in [`ENVIRONMENT_VARIABLES.md`](ENVIRONMENT_VARIABLES.md). Extend Zod when a variable should be typed and validated.
2. **Doc drift:** After API routes, stores, schema, or security-sensitive paths change, run **`npm run verify:docs`** from the repo root (see [`docs/README.md`](README.md)).
3. **Database:** After migrations, regenerate **`web/types/supabase.ts`** (`cd web && npm run types:generate` per [`GETTING_STARTED.md`](GETTING_STARTED.md)).
4. **Civic / legislative keys:** Align with [`ENVIRONMENT_VARIABLES.md`](ENVIRONMENT_VARIABLES.md) (`CONGRESS_GOV_API_KEY`, GovInfo keys, etc.).
5. **Product vs OSS issues:** In-app feedback goes to **`/api/feedback`**; GitHub Issues are for contributor-trackable work. See [`FEEDBACK_AND_ISSUES.md`](FEEDBACK_AND_ISSUES.md) so agent-suggested reports match the right channel.

---

## 5. Historical note

An older, longer write-up lives under [`docs/archive/2026-03-consolidation/AGENT_SETUP.md`](archive/2026-03-consolidation/AGENT_SETUP.md). **This file (`docs/AGENT_SETUP.md`) is the canonical entry**; the archive copy is for history only.

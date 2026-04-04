# Agent Setup: Skills & MCP

**Purpose:** Single place for setting up Agent Skills and Supabase MCP in Cursor so AI agents use React/Postgres best practices and can query the database directly.

**See also:** [INDEX_OPTIMIZATION_GUIDE](./archive/2026-02-docs-consolidation/INDEX_OPTIMIZATION_GUIDE.md) (indexes), [RLS_VERIFICATION_GUIDE](../RLS_VERIFICATION_GUIDE.md) (RLS).

---

## 1. Agent Skills (add-skill)

Skills live in `.agents/skills/`. Install with [add-skill](https://add-skill.org). Use `--agent cursor -y` for non-interactive install.

### React Best Practices (Vercel)

```bash
npx add-skill vercel-labs/agent-skills --skill vercel-react-best-practices --agent cursor -y
```

- **Location:** `.agents/skills/vercel-react-best-practices/`
- **Use when:** Editing React/Next.js UI, hooks, API routes. Avoid waterfalls, optimize bundles, data fetching, re-renders.

### Postgres Best Practices (Supabase)

```bash
npx add-skill supabase/agent-skills --skill supabase-postgres-best-practices --agent cursor -y
```

- **Location:** `.agents/skills/supabase-postgres-best-practices/`
- **Use when:** Editing SQL, migrations, RLS, or Supabase access. Query performance, security, schema, indexes.

**List available skills:** `npx add-skill <owner/repo> --list`

---

## 2. MCP servers

### Supabase MCP

[MCP](https://supabase.com/docs/guides/getting-started/mcp) lets Cursor run queries and inspect your Supabase project via natural language.

**Config:** Add to `~/.cursor/mcp.json` (or project `.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?project_ref=YOUR_PROJECT_REF"
    }
  }
}
```

Restart Cursor, then sign in to Supabase when prompted. Use for schema discovery, ad-hoc SQL, migrations, Security/Performance Advisors.

### Vercel MCP

[Vercel MCP](https://vercel.com/docs/mcp/vercel-mcp) provides deployment and project context during the **application audit** (Next.js/Vercel best practices).

**Config:** Add alongside Supabase:

```json
{
  "mcpServers": {
    "supabase": { "url": "https://mcp.supabase.com/mcp?project_ref=..." },
    "vercel": { "url": "https://mcp.vercel.com" }
  }
}
```

Use for: Vercel docs search, list projects/deployments, deployment logs, rollbacks. Authenticate with Vercel when prompted.

**Disable `deploy_to_vercel`:** Deployments are triggered by pushes to `main` (CI/CD). In **Cursor Settings → Tools & MCP → Vercel**, turn **off** the `deploy_to_vercel` tool so agents cannot deploy via MCP.

### GovInfo MCP

GovInfo MCP (project: `.cursor/govinfo-mcp/`) provides access to U.S. government documents (bills, statutes, regulations) via GovInfo API. Runs locally; requires `GOVINFO_API_KEY`.

### LegisMCP (P1)

[LegisMCP](https://legismcp.com/) — Open-source legislative MCP with 134 tools across 24 government sources (Congress.gov, FEC, FDA, SEC, EPA, etc.). Complements GovInfo for bills, voting records, campaign finance, lobbying.

**Setup:** Run `cd .cursor/mcp-servers && npm install` (pre-installed to avoid npx cache issues). Requires `CONGRESS_API_KEY` (free from Congress.gov).

### Playwright MCP (P1)

[@playwright/mcp](https://www.npmjs.com/package/@playwright/mcp) — Official Microsoft MCP for browser automation via accessibility snapshots. Use for E2E test generation, debugging flaky specs, exploring the app.

**Setup:** Pre-installed in `.cursor/mcp-servers`. Install browsers: `cd web && npx playwright install chromium`.

### US Government Open Data MCP (P2)

[US Gov Open Data MCP](https://lzinga.github.io/us-gov-open-data-mcp/) — 322 tools across 41 federal APIs (Treasury, FRED, Congress, FEC, CDC, FDA, SEC, EPA, etc.). Cross-referenced queries; TypeScript SDK available.

**Setup:** Pre-installed in `.cursor/mcp-servers`. Optional `CONGRESS_API_KEY` for Congress/FEC modules.

---

## 3. Cursor rules

Project rules in [`.cursor/rules/projectruleschoices.mdc`](../.cursor/rules/projectruleschoices.mdc) tell agents to:

- Use **React Best Practices** for UI/hooks/API routes
- Use **Postgres Best Practices** for SQL/migrations/RLS
- Use **Supabase MCP** for schema discovery and ad-hoc queries
- Use **Vercel MCP** (when available) for deployment context, docs, and project/deployment info during application audit

Ensure that file exists and is populated.

---

## 4. Verification

| Check | Prompt to use |
|-------|----------------|
| React Best Practices | *“Suggest changes to avoid async waterfalls in `web/app/api/dashboard/route.ts`.”* |
| Postgres Best Practices | *“Review RLS policies for `votes`”* or *“Suggest indexes for poll lookups.”* |
| Supabase MCP | *“List tables in my Supabase database using MCP”* or *“Run a read-only query on `polls` via MCP.”* |
| Cursor rules | In Composer, confirm project rules mention skills and MCP. |

---

## Quick reference

| Item | Value |
|------|--------|
| Skills dir | `.agents/skills/` |
| React skill | `vercel-react-best-practices` |
| Postgres skill | `supabase-postgres-best-practices` |
| MCP config | `~/.cursor/mcp.json` or `.cursor/mcp.json` |
| Supabase MCP | `https://mcp.supabase.com/mcp?project_ref=...` |
| Vercel MCP | `https://mcp.vercel.com` |
| GovInfo MCP | Local command; `.cursor/govinfo-mcp/` |
| LegisMCP | `npx -y legismcp`; CONGRESS_API_KEY |
| Playwright MCP | `npx @playwright/mcp@latest` |
| US Gov Open Data MCP | `npx -y us-gov-open-data-mcp` |
| Rules | `.cursor/rules/projectruleschoices.mdc` |

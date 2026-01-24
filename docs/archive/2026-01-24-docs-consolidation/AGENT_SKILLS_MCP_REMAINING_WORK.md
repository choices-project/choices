# Agent Skills & MCP — Remaining Work

**Purpose:** Track unfinished items from the [Agent Skills and MCP Integration](/Users/alaughingkitsune/.cursor/plans/agent_skills_and_mcp_setup_a99b2472.plan.md) plan so nothing is lost.

**Last updated:** 2026-01-24

---

## Done

- [x] **React Best Practices** — Installed via `npx add-skill vercel-labs/agent-skills --skill vercel-react-best-practices --agent cursor -y`. Lives in `.agents/skills/vercel-react-best-practices/`.
- [x] **Postgres Best Practices** — Installed via `npx add-skill supabase/agent-skills --skill supabase-postgres-best-practices --agent cursor -y`. Lives in `.agents/skills/supabase-postgres-best-practices/`.
- [x] **Supabase MCP** — Configured in `~/.cursor/mcp.json` (manual); connected and enabled in Cursor (Tools & MCP).
- [x] **Cursor rules** — [`.cursor/rules/projectruleschoices.mdc`](../.cursor/rules/projectruleschoices.mdc) populated with React / Postgres / MCP guidance.
- [x] **Documentation** — [AGENT_SETUP](AGENT_SETUP.md) created (skills, MCP, verification). SUPABASE_AGENT_GUIDE removed; agents use Postgres/React skills and project guides instead.

---

## Remaining Work

### 1. ~~Configure Supabase MCP (manual)~~ — Done

**Why manual:** `~/.cursor/mcp.json` is outside the workspace; Cursor’s tools cannot write there.

**Steps:**

1. Create or edit **`~/.cursor/mcp.json`** (global Cursor config).
2. Add or merge the Supabase MCP entry:

   ```json
   {
     "mcpServers": {
       "supabase": {
         "url": "https://mcp.supabase.com/mcp"
       }
     }
   }
   ```

   If you already have other servers, add the `"supabase"` key under `mcpServers` only.

3. Restart Cursor.
4. When prompted, sign in to Supabase and select the Choices project (e.g. `muqwrehywjrbaeerjgfb`).

**Optional:** Add project-level `.cursor/mcp.json` in the repo with the same config. Some Cursor versions don’t reliably use project-level MCP; global is the safe option.

**Ref:** [Supabase MCP docs](https://supabase.com/docs/guides/getting-started/mcp)

---

### 2. ~~Populate Cursor rules~~ — Done

**File:** [`.cursor/rules/projectruleschoices.mdc`](../.cursor/rules/projectruleschoices.mdc).

**Add rules that:**

- **React/Next.js:** When editing UI, hooks, or API routes, use the **React Best Practices** skill (`.agents/skills/vercel-react-best-practices`). Avoid async waterfalls, minimize client bundle, optimize data fetching and re-renders. Reference [performance playbook](guides/performance-utilities-playbook.md) where relevant.
- **Postgres/Supabase:** When editing SQL, migrations, RLS, or Supabase access, use the **Postgres Best Practices** skill (`.agents/skills/supabase-postgres-best-practices`). See [INDEX_OPTIMIZATION_GUIDE](INDEX_OPTIMIZATION_GUIDE.md) and [RLS_VERIFICATION_GUIDE](../RLS_VERIFICATION_GUIDE.md).
- **Database inspection:** When querying or inspecting the DB, use **Supabase MCP** tools. Prefer MCP for schema discovery, ad-hoc queries, and migration reasoning over hand-written SQL without context.

Keep the rule file short; link to the docs above for detail.

---

### 3. ~~Update documentation~~ — Done

**3a.** ~~SUPABASE_AGENT_GUIDE~~ — Removed. Agents use Postgres/React skills and project guides instead.

**3b. Agent setup doc**

Create or update an “Agent setup” doc (e.g. `docs/AGENT_SETUP.md` or a section in an existing onboarding doc) that covers, in one place:

- **React Best Practices:**  
  `npx add-skill vercel-labs/agent-skills --skill vercel-react-best-practices --agent cursor -y`
- **Postgres Best Practices:**  
  `npx add-skill supabase/agent-skills --skill supabase-postgres-best-practices --agent cursor -y`
- **Supabase MCP:** config snippet and setup steps (same as step 1).
- **Verification:** sample prompts below.

---

### 4. Verification checklist

Run these checks and tick off as you go:

| Item | How to verify |
|------|----------------|
| React Best Practices skill | Ask Cursor: “Suggest changes to avoid async waterfalls in `web/app/api/dashboard/route.ts`.” Confirm it uses React best practices. |
| Postgres Best Practices skill | Ask Cursor: “Review RLS policies for `votes`” or “Suggest indexes for poll lookups.” Confirm it uses Postgres rules. |
| Supabase MCP | Ask Cursor: “List tables in my Supabase database using MCP” or “Run a read-only query on `polls` via MCP.” |
| Cursor rules | In Composer, confirm project rules mention the skills and MCP. |

---

## Quick reference

- **Skills location:** `.agents/skills/` (add-skill uses this, not `.cursor/skills/`).
- **Skill names:** `vercel-react-best-practices`, `supabase-postgres-best-practices`.
- **MCP config:** `~/.cursor/mcp.json` (global). Project-level `.cursor/mcp.json` optional.
- **Plan:** [agent_skills_and_mcp_setup_a99b2472.plan.md](/Users/alaughingkitsune/.cursor/plans/agent_skills_and_mcp_setup_a99b2472.plan.md).

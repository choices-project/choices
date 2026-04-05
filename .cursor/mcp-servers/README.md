# Pre-installed MCP Servers

LegisMCP, Playwright MCP, and US Gov Open Data MCP are installed here to avoid npx cache/resolution issues (e.g. `@standard-schema/spec` notarget errors).

**Vercel** and **Supabase** MCPs are configured separately in **`.cursor/mcp.json`** (hosted URLs). That is **different** from [Vercel AI Gateway](https://vercel.com/docs/agent-resources/coding-agents), which routes **LLM API** calls for terminal coding agents—see **`docs/AGENT_SETUP.md`**.

**Paths:** script-based entries use **`bash`** with paths relative to the **repository root** (e.g. **`.cursor/mcp-servers/run-legismcp.sh`**). Open the repo folder as the Cursor workspace so MCP resolves those paths correctly.

## Setup

After cloning, run:

```bash
cd .cursor/mcp-servers && npm install
```

If you hit npm cache errors, use a fresh cache:

```bash
cd .cursor/mcp-servers && npm_config_cache=/tmp/npm-mcp-cache npm install
```

## Environment Variables

- **LegisMCP** / **US Gov Open Data**: In **`.cursor/mcp.json`**, `CONGRESS_API_KEY` is supplied from your env var **`CONGRESS_GOV_API_KEY`** (same key as the app; sign up at https://api.congress.gov/sign-up/). Set **`CONGRESS_GOV_API_KEY`** in Cursor MCP env or shell.
- **Playwright MCP**: Install browsers: `cd web && npx playwright install chromium`

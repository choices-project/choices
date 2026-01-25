# GovInfo MCP Server - Complete Guide

**Date:** 2026-01-25  
**Status:** ✅ Installed, configured, and tested - Ready for future use

## Overview

The GovInfo MCP (Model Context Protocol) server provides LLM-friendly access to the official GovInfo API v4 for searching and retrieving U.S. government documents including bills, laws, regulations, and other official publications.

**Key Finding:** The MCP server does **NOT** help with our current use case (fetching `govinfo_id` for representatives), but it **has high potential value** for planned features like "Walk the Talk" analysis, vote tracking, and legislative history.

## Current Status

### ✅ Installation & Configuration
- **Location:** `/Users/alaughingkitsune/src/Choices/.cursor/govinfo-mcp/`
- **Python:** 3.13.7 ✅
- **FastMCP:** 2.14.4 ✅
- **Status:** All 17 tools registered and working
- **MCP Configuration:** Configured in `.cursor/mcp.json`

### ✅ Test Results
- ✅ Module imports successfully
- ✅ All 6 tool servers imported
- ✅ All 17 tools registered
- ✅ Server starts without errors
- ⏳ **Pending:** Cursor restart to activate MCP connection
- ⏳ **Pending:** API key configuration for actual API calls

## Potential Benefits for Future Features

### 1. "Walk the Talk" Analysis ✅ **HIGH VALUE**

**How GovInfo MCP Helps:**
- **Bill Text Access:** Get full bill text to analyze what representatives actually voted on
- **Related Documents:** Find related bills, amendments, committee reports
- **Congressional Record:** Access statements and speeches from Congressional Record
- **Public Laws:** Track which bills became law and their final text
- **Regulatory Impact:** Access CFR to see how laws translate to regulations

**Example Use Cases:**
- "Representative X promised to support climate action" → Search bills related to climate, get full text, analyze votes
- "Representative Y voted against constituent preferences" → Get bill details, related documents, understand context
- "Representative Z's votes align with major donors" → Cross-reference votes with bill text and donor interests

### 2. Voting Record Tracking ✅ **HIGH VALUE**

**How GovInfo MCP Helps:**
- **Full Bill Text:** Access complete bill text (HTML, XML, PDF, plain text)
- **Bill Versions:** Track bill through different versions and amendments
- **Related Bills:** Find related bills, amendments, committee reports
- **Congressional Record:** Access floor statements and debate transcripts
- **Advanced Search:** Lucene syntax search for complex queries

**Example Use Cases:**
- Get full text of bills representatives voted on
- Track bill evolution through amendments
- Find related bills that might show voting patterns
- Access Congressional Record statements explaining votes

### 3. Legislative Activity & Bill Tracking ✅ **MEDIUM VALUE**

**How GovInfo MCP Helps:**
- **Bill Content:** Get full bill text, not just metadata
- **Bill History:** Track bill through committee, floor, conference
- **Related Documents:** Find committee reports, hearings, related bills
- **Collection Browsing:** Browse bills by collection, date, congress
- **Package Retrieval:** Get all available formats (HTML, XML, PDF, text)

### 4. Congressional Record Access ✅ **MEDIUM VALUE**

**How GovInfo MCP Helps:**
- **Congressional Record:** Access full Congressional Record entries
- **Statements & Speeches:** Get official statements from floor
- **Search:** Search Congressional Record by keyword, date, member
- **Granules:** Access individual sections of Congressional Record

### 5. Regulatory Tracking (CFR) ⚠️ **LOW-MEDIUM VALUE**

**How GovInfo MCP Helps:**
- **CFR Access:** Access Code of Federal Regulations
- **Regulatory Changes:** Track changes to regulations
- **Related Documents:** Find regulations related to specific laws

## Available Tools (17 Total)

### Collections (1 tool)
- `collections_get_collections` - List all available GovInfo collections

### Packages (3 tools)
- `packages_get_package_content` - Get package content in various formats (HTML, XML, PDF, text)
- `packages_get_package_summary` - Get package metadata
- `packages_get_packages_by_collection` - List packages from a collection

### Published (2 tools)
- `published_get_published_packages` - Get packages published on a specific date
- `published_get_published_range` - Get packages published within a date range

### Related (2 tools)
- `related_get_granule_related` - Find related items for a specific granule
- `related_get_related_packages` - Find packages related to a specific package

### Search (2 tools)
- `search_advanced_search` - Advanced search with Lucene syntax and filters
- `search_search_packages` - Full-text search across all GovInfo collections

### Statutes (6 tools)
- `statutes_get_public_laws_by_congress` - List public laws from a specific Congress
- `statutes_get_statute_content` - Get content or metadata for a specific statute package
- `statutes_get_statutes_at_large` - Search Statutes at Large by volume
- `statutes_get_uscode_title` - Search US Code sections within a specific title
- `statutes_list_statute_collections` - List all statute-related collections
- `statutes_search_statutes` - Search US statutes across statute-related collections

### Server (1 tool)
- `status` - Check the status of the GovInfo MCP server

## Setup & Installation

### Prerequisites
- ✅ Python 3.12+ (Python 3.13.7 installed)
- ✅ `uv` package manager (installed to `~/.local/bin/uv`)
- ⚠️ GovInfo API key (set `GOVINFO_API_KEY` environment variable)

### Installation Steps

1. **Install `uv` package manager:**
   ```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh
   ```

2. **Clone GovInfo MCP repository:**
   ```bash
   git clone https://github.com/Travis-Prall/govinfo-mcp.git .cursor/govinfo-mcp
   ```

3. **Create virtual environment and install dependencies:**
   ```bash
   cd .cursor/govinfo-mcp
   export PATH="$HOME/.local/bin:$PATH"
   uv venv
   source .venv/bin/activate
   uv pip install -e .
   ```

### MCP Configuration

Added to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "govinfo": {
      "command": "/Users/alaughingkitsune/src/Choices/.cursor/govinfo-mcp/.venv/bin/python3",
      "args": ["-m", "app.server"],
      "cwd": "/Users/alaughingkitsune/src/Choices/.cursor/govinfo-mcp",
      "env": {
        "GOVINFO_API_KEY": "${GOVINFO_API_KEY}"
      }
    }
  }
}
```

### Environment Variables

The server requires `GOVINFO_API_KEY` to be set. This can be:
- Set in your shell environment: `export GOVINFO_API_KEY=your_api_key_here`
- Added to your shell profile (`~/.zshrc` or `~/.bashrc`) for persistence
- Passed via MCP server `env` configuration (uses `${GOVINFO_API_KEY}`)

**Note:** You need to restart Cursor after adding the MCP server configuration.

## How to Use

### Basic Usage

Once the MCP server is connected in Cursor (after restart), you can use it in several ways:

1. **Via Cursor Chat:**
   - Use `@govinfo` in Cursor chat
   - Ask questions like "List available GovInfo collections" or "Search for bills related to artificial intelligence"

2. **Via MCP Tool Calls:**
   ```typescript
   call_mcp_tool({
     server: "govinfo",
     toolName: "collections_get_collections",
     arguments: {
       page_size: 10
     }
   })
   ```

### Example Use Cases

#### Example 1: Search for Recent Bills
```typescript
call_mcp_tool({
  server: "govinfo",
  toolName: "search_search_packages",
  arguments: {
    query: "artificial intelligence",
    collection: "BILLS",
    page_size: 5
  }
})
```

#### Example 2: Get Bill Content
```typescript
call_mcp_tool({
  server: "govinfo",
  toolName: "packages_get_package_content",
  arguments: {
    package_id: "BILLS-119hr1234-ih",
    content_type: "html"
  }
})
```

#### Example 3: Find Related Documents
```typescript
call_mcp_tool({
  server: "govinfo",
  toolName: "related_get_related_packages",
  arguments: {
    package_id: "BILLS-119hr1234-ih"
  }
})
```

#### Example 4: Search Statutes
```typescript
call_mcp_tool({
  server: "govinfo",
  toolName: "statutes_search_statutes",
  arguments: {
    query: "civil rights",
    collection: "USCODE",
    page_size: 5
  }
})
```

### Integration with Existing Data

**Potential Use Cases:**

1. **Enrich Bill Activity:**
   - Use `packages_get_package_content` to get full bill text for bills in `representative_activity`
   - Use `related_get_related_packages` to find related bills and amendments

2. **Vote Analysis:**
   - Get full bill text for votes tracked in the application
   - Find related documents for context

3. **"Walk the Talk" Analysis:**
   - Search for bills related to campaign promises
   - Get full text to analyze what representatives actually voted on
   - Track bill evolution through amendments

4. **Congressional Record:**
   - Search for official statements by representatives
   - Track floor speeches and debate transcripts

## Troubleshooting

### Issue: Server Not Starting / Import Errors

**Problem:** Server was failing with `AttributeError: 'str' object has no attribute 'get_tools'`

**Root Causes:**
1. `asyncio.run(setup())` was called at module import time
2. `import_server()` parameter order was incorrect

**Fixes Applied:**
- ✅ Moved `asyncio.run(setup())` to `main()` function
- ✅ Fixed `import_server()` parameter order (signature is `(server, prefix)`, not `(prefix, server)`)

**Verification:**
```bash
cd .cursor/govinfo-mcp
source .venv/bin/activate
python3 -c "import app.server; print('✅ Import successful')"
```

### Issue: Environment Variable Configuration

**Problem:** `.env` file was using template syntax that doesn't work with `load_dotenv()`

**Fix:** Removed template syntax - MCP config handles env vars via `${GOVINFO_API_KEY}`

### Issue: "Server 'govinfo' not found"

**Solution:** Restart Cursor after updating `mcp.json`. MCP configuration changes require a restart.

### Issue: "GOVINFO_API_KEY not found"

**Solution:**
1. Set `GOVINFO_API_KEY` in your shell environment:
   ```bash
   export GOVINFO_API_KEY=your_api_key_here
   ```
2. Add to your shell profile for persistence:
   ```bash
   echo 'export GOVINFO_API_KEY=your_api_key_here' >> ~/.zshrc
   source ~/.zshrc
   ```

### Testing the Server

1. **Verify Module Import:**
   ```bash
   cd .cursor/govinfo-mcp
   source .venv/bin/activate
   python3 -c "import app.server; print('✅ Import successful')"
   ```

2. **Test Server Startup:**
   ```bash
   cd .cursor/govinfo-mcp
   source .venv/bin/activate
   python3 -m app.server
   ```
   Should show FastMCP banner without errors

3. **Check MCP Connection:**
   - Cursor Settings → Features → MCP
   - Verify "govinfo" server is listed with "17 tools enabled"
   - Check connection status

4. **Test Tools:**
   - Use `@govinfo` in Cursor chat
   - Or test tools via `call_mcp_tool`

## Current Limitations

### What MCP Does NOT Do
- **No Member Lookup:** MCP doesn't solve our current `govinfo_id` lookup problem
- **Document-Focused:** MCP is for documents, not member data
- **LLM-Optimized:** Designed for LLM workflows, may be overkill for simple lookups

### Current GovInfo Usage
- **Purpose:** Fetch `govinfo_id` for federal representatives
- **Method:** REST API endpoint `/members/{bioguideId}`
- **Status:** Experiencing 500 errors (0/547 have `govinfo_id`)
- **Impact:** Low (optional enrichment)
- **Recommendation:** Continue with REST API for member lookups, use MCP for document access

## Recommendations

### Immediate (Current Problem)
- **Continue with REST API** for `govinfo_id` lookups
- **Add retry logic** with exponential backoff
- **Monitor API status** and retry when stable
- **Do NOT use MCP** for this use case

### Short Term (Next 3-6 Months)
- **Monitor MCP Development:** Track documentation and feature updates
- **Plan Integration:** Design MCP integration for future features
- **Evaluate Alternatives:** Consider if Congress.gov API covers bill needs

### Long Term (6+ Months)
- **Implement MCP for Document Access:** When building "Walk the Talk" features
- **Use MCP for Bill Text:** Enrich bill activity with full text
- **Use MCP for Congressional Record:** Track official statements
- **Hybrid Approach:** REST API for simple lookups, MCP for document access

## Test Results

### ✅ All Tests Passed

| Test | Status | Result |
|------|--------|--------|
| Module Import | ✅ PASSED | No import-time errors |
| Setup Function | ✅ PASSED | All 6 tool servers imported |
| Tool Registration | ✅ PASSED | **17 tools** registered |
| Server Startup | ✅ PASSED | Server starts successfully |

### Tool Servers Imported
- ✅ `collections_server` (Collections tools)
- ✅ `packages` (Package tools)
- ✅ `published_server` (Published document tools)
- ✅ `related_server` (Related document tools)
- ✅ `search_server` (Search tools)
- ✅ `statutes` (Statute tools)

## Next Steps

1. **Set API Key:**
   ```bash
   export GOVINFO_API_KEY=your_api_key_here
   echo 'export GOVINFO_API_KEY=your_api_key_here' >> ~/.zshrc
   ```

2. **Restart Cursor:**
   - MCP configuration requires a Cursor restart
   - After restart, check Settings → Features → MCP
   - Verify "govinfo" server appears with "17 tools enabled"

3. **Test MCP Connection:**
   - Use `@govinfo` in Cursor chat
   - Or test tools via `call_mcp_tool`

4. **Plan Future Integration:**
   - Design integration for "Walk the Talk" features
   - Plan bill text enrichment for activity records
   - Design Congressional Record access patterns

## Resources

- **Repository:** https://github.com/Travis-Prall/govinfo-mcp
- **GovInfo API Docs:** https://api.govinfo.gov/docs/
- **MCP Specification:** https://modelcontextprotocol.io/
- **Installation Location:** `.cursor/govinfo-mcp/`
- **Current Implementation:** `services/civics-backend/src/clients/govinfo.ts` (REST API)

## Conclusion

**For Current Use Case:** GovInfo MCP is **NOT useful** - it doesn't provide member lookups. Continue using REST API for `govinfo_id` lookups.

**For Future Features:** GovInfo MCP could be **highly valuable** for:
- "Walk the Talk" analysis (bill text, related documents, Congressional Record)
- Vote tracking enhancement (full bill context, related bills)
- Legislative history tracking (bill evolution, amendments, related documents)
- Congressional Record access (official statements, speeches)

**Status:** The server is fully functional and ready for use. Circle back to it when implementing document-centric features that require bill text, Congressional Record, or legislative history access.

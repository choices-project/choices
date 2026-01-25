# GovInfo MCP Server Setup & Testing

**Date:** 2026-01-27  
**Status:** ✅ Installed and configured

## Overview

The GovInfo MCP server provides LLM-friendly access to the official GovInfo API v4 for searching and retrieving U.S. government documents including bills, laws, regulations, and other official publications.

## Installation

### Prerequisites
- ✅ Python 3.12+ (Python 3.13.7 installed)
- ✅ `uv` package manager (installed to `~/.local/bin/uv`)
- ✅ GovInfo API key (set `GOVINFO_API_KEY` environment variable)

### Installation Steps

1. **Installed `uv` package manager:**
   ```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh
   ```

2. **Cloned GovInfo MCP repository:**
   ```bash
   git clone https://github.com/Travis-Prall/govinfo-mcp.git .cursor/govinfo-mcp
   ```

3. **Created virtual environment and installed dependencies:**
   ```bash
   cd .cursor/govinfo-mcp
   export PATH="$HOME/.local/bin:$PATH"
   uv venv
   source .venv/bin/activate
   uv pip install -e .
   ```

4. **Location:** `/Users/alaughingkitsune/src/Choices/.cursor/govinfo-mcp/`

## Configuration

### MCP Server Configuration

Added to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "govinfo": {
      "command": "/Users/alaughingkitsune/src/Choices/.cursor/govinfo-mcp/.venv/bin/python",
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
- Set in your shell environment
- Set in `.cursor/govinfo-mcp/.env` file
- Passed via MCP server `env` configuration (uses `${GOVINFO_API_KEY}`)

**Note:** You may need to restart Cursor after adding the MCP server configuration.

## Available Tools

The GovInfo MCP server provides **16+ tools** for accessing government documents:

### Collections
- `get_collections` - List all available GovInfo collections
- `get_collection_details` - Get details for a specific collection

### Search
- `search_packages` - Search packages by query and filters
- `advanced_search` - Advanced search with Lucene syntax
- `search_statutes` - Search US statutes across collections

### Packages
- `get_packages_by_collection` - List packages from a collection
- `get_package_summary` - Get metadata for a specific package
- `get_package_content` - Download package content (HTML, XML, PDF, text)

### Published
- `get_published_packages` - Get packages published on a specific date
- `get_published_range` - Get packages published within a date range

### Related
- `get_related_packages` - Find packages related to a specific package
- `get_granule_related` - Find items related to a specific granule

### Statutes
- `get_public_laws_by_congress` - List public laws from a specific Congress
- `get_statutes_at_large` - Search Statutes at Large by volume
- `get_uscode_title` - Search US Code sections within a title
- `list_statute_collections` - List all statute-related collections

## Testing

### Quick Test Queries

Once the MCP server is connected in Cursor, you can test it with:

1. **List Collections:**
   ```
   Use the get_collections tool to list available GovInfo collections
   ```

2. **Search for Bills:**
   ```
   Use search_packages to find bills related to "artificial intelligence" from the 119th Congress
   ```

3. **Get Bill Content:**
   ```
   Use get_package_content to get the full text of a specific bill
   ```

4. **Search Statutes:**
   ```
   Use search_statutes to find civil rights related statutes
   ```

### Test with Existing Data

We can test using our existing federal representatives:

1. **Find Bills by Representative:**
   - Use bioguide IDs from our `representatives_core` table
   - Search for bills sponsored/cosponsored by specific representatives
   - Get full bill text for analysis

2. **Congressional Record:**
   - Search Congressional Record for statements by representatives
   - Track voting records and floor statements

3. **Public Laws:**
   - Find which bills became public laws
   - Track legislative history

## Verification

### Check MCP Server Status

1. **In Cursor:**
   - Go to Settings → Features → MCP
   - Verify "govinfo" server is listed
   - Check connection status

2. **Test Connection:**
   - Try using `@govinfo` in Cursor chat
   - Or use MCP tools directly via `call_mcp_tool`

### Verify API Key

The server will return an error if `GOVINFO_API_KEY` is not set. Check:
- Environment variable is set: `echo $GOVINFO_API_KEY`
- Or check `.cursor/govinfo-mcp/.env` file

## Usage Examples

### Example 1: Search for Recent Bills

```typescript
// Via MCP tool call
call_mcp_tool({
  server: "govinfo",
  toolName: "search_packages",
  arguments: {
    query: "artificial intelligence",
    collection: "BILLS",
    page_size: 5
  }
})
```

### Example 2: Get Bill Content

```typescript
call_mcp_tool({
  server: "govinfo",
  toolName: "get_package_content",
  arguments: {
    package_id: "BILLS-119hr1234-ih",
    content_type: "html"
  }
})
```

### Example 3: Find Related Documents

```typescript
call_mcp_tool({
  server: "govinfo",
  toolName: "get_related_packages",
  arguments: {
    package_id: "BILLS-119hr1234-ih"
  }
})
```

## Integration with Existing Data

### Potential Use Cases

1. **Enrich Bill Activity:**
   - Use `get_package_content` to get full bill text for bills in `representative_activity`
   - Use `get_related_packages` to find related bills and amendments

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

### Server Won't Start
- Check Python version: `python3 --version` (needs 3.12+)
- Verify virtual environment: `ls .cursor/govinfo-mcp/.venv`
- Check dependencies: `cd .cursor/govinfo-mcp && source .venv/bin/activate && pip list`

### API Key Issues
- Verify `GOVINFO_API_KEY` is set: `echo $GOVINFO_API_KEY`
- Check `.cursor/govinfo-mcp/.env` file exists
- Restart Cursor after setting environment variables

### Connection Issues
- Restart Cursor after modifying `.cursor/mcp.json`
- Check MCP server logs in Cursor Settings → Features → MCP
- Verify server path is correct in `mcp.json`

## Next Steps

1. **Test Basic Functionality:**
   - [ ] List collections
   - [ ] Search for bills
   - [ ] Get package content
   - [ ] Test with existing representative data

2. **Integration Planning:**
   - [ ] Design integration for "Walk the Talk" features
   - [ ] Plan bill text enrichment for activity records
   - [ ] Design Congressional Record access patterns

3. **Documentation:**
   - [ ] Document specific use cases
   - [ ] Create integration examples
   - [ ] Update ROADMAP with MCP integration plans

## Resources

- **Repository:** https://github.com/Travis-Prall/govinfo-mcp
- **GovInfo API Docs:** https://api.govinfo.gov/docs/
- **MCP Specification:** https://modelcontextprotocol.io/
- **Installation Location:** `.cursor/govinfo-mcp/`

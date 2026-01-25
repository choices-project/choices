# GovInfo MCP Troubleshooting Guide

## Issue: Server Not Starting / Import Errors

### Problem
The GovInfo MCP server was failing to start with errors like:
- `AttributeError: 'str' object has no attribute 'get_tools'`
- `asyncio.run()` called at module import time
- Server trying to run async code during import

### Root Cause
The `app/server.py` file was calling `asyncio.run(setup())` at module import time (line 144), which caused the server to try to run async code when the module was imported. This is problematic for MCP servers because they need to be importable without executing code.

### Fix Applied
**File:** `.cursor/govinfo-mcp/app/server.py`

**Change:** Moved `asyncio.run(setup())` from module-level to inside the `main()` function:

```python
# BEFORE (line 144):
asyncio.run(setup())  # ❌ Runs at import time

# AFTER:
def main() -> None:
    """Run the GovInfo MCP server asynchronously."""
    logger.info("Starting GovInfo MCP server")
    # Run setup before starting the server
    asyncio.run(setup())  # ✅ Runs when server starts
    mcp.run()
```

### Verification
After the fix, the server module can be imported without errors:
```bash
cd .cursor/govinfo-mcp
source .venv/bin/activate
python3 -c "import app.server; print('✅ Import successful')"
```

## Issue: Environment Variable Configuration

### Problem
The `.env` file was using template syntax that doesn't work with `load_dotenv()`:
```
GOVINFO_API_KEY=${GOVINFO_API_KEY}  # ❌ Not expanded by load_dotenv()
```

### Fix Applied
**File:** `.cursor/govinfo-mcp/.env`

**Change:** Removed template syntax (MCP config will pass env vars):
```
# Note: API key is passed via MCP configuration in .cursor/mcp.json
# The env var will be set by Cursor when starting the MCP server
GOVINFO_API_KEY=
```

### MCP Configuration
The `.cursor/mcp.json` file should reference the environment variable:
```json
{
  "mcpServers": {
    "govinfo": {
      "command": "/path/to/.venv/bin/python3",
      "args": ["-m", "app.server"],
      "cwd": "/path/to/govinfo-mcp",
      "env": {
        "GOVINFO_API_KEY": "${GOVINFO_API_KEY}"
      }
    }
  }
}
```

**Note:** Cursor should expand `${GOVINFO_API_KEY}` from your system environment when starting the MCP server. Make sure `GOVINFO_API_KEY` is set in your shell environment.

## Testing the Fix

### 1. Verify Module Import
```bash
cd .cursor/govinfo-mcp
source .venv/bin/activate
python3 -c "import app.server; print('✅ Import successful')"
```

### 2. Verify Environment Variable Loading
```bash
cd .cursor/govinfo-mcp
source .venv/bin/activate
GOVINFO_API_KEY=test_key python3 -c "import os; from dotenv import load_dotenv; load_dotenv(); print('API Key:', os.getenv('GOVINFO_API_KEY'))"
```

### 3. Test MCP Server Connection
After restarting Cursor:
1. Open Cursor settings
2. Check MCP servers - "govinfo" should appear
3. Try using `@govinfo` or MCP tools to test connection

## Common Issues

### Issue: "Server 'govinfo' not found"
**Solution:** Restart Cursor after updating `mcp.json`. MCP configuration changes require a restart.

### Issue: "GOVINFO_API_KEY not found"
**Solution:** 
1. Set `GOVINFO_API_KEY` in your shell environment:
   ```bash
   export GOVINFO_API_KEY=your_api_key_here
   ```
2. Or update `mcp.json` to use the actual key (not recommended for security):
   ```json
   "env": {
     "GOVINFO_API_KEY": "your_actual_key_here"
   }
   ```

### Issue: "AttributeError: 'str' object has no attribute 'get_tools'"
**Solution:** This was fixed by moving `asyncio.run(setup())` to `main()`. If you still see this, ensure you're using the updated `app/server.py`.

## Next Steps

1. **Restart Cursor** - Required for MCP config changes to take effect
2. **Verify MCP Connection** - Check that "govinfo" appears in MCP servers
3. **Test Tools** - Try calling GovInfo MCP tools to verify functionality
4. **Check Logs** - Server logs are in `.cursor/govinfo-mcp/logs/server.log`

## Status

✅ **Fixed:** Module import issue (asyncio.run at import time)
✅ **Fixed:** Environment variable template syntax
⏳ **Pending:** Cursor restart required to test MCP connection
⏳ **Pending:** Verify API key is accessible to MCP server

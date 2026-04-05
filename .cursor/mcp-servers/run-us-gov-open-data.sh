#!/usr/bin/env bash
# Run US Gov Open Data MCP from pre-installed node_modules (avoids npx cache issues)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec node "$SCRIPT_DIR/node_modules/us-gov-open-data-mcp/dist/server.js" "$@"

#!/usr/bin/env bash
# Run LegisMCP from pre-installed node_modules (avoids npx cache issues)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec node "$SCRIPT_DIR/node_modules/legismcp/bin/legismcp.js" "$@"

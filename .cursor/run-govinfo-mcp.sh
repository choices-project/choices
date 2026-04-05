#!/usr/bin/env bash
# Repo-relative GovInfo MCP launcher (avoids absolute paths in .cursor/mcp.json).
set -euo pipefail
CURSOR_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GOVINFO_DIR="$CURSOR_DIR/govinfo-mcp"
PY="$GOVINFO_DIR/.venv/bin/python3"
if [[ ! -x "$PY" ]]; then
  echo "govinfo MCP: missing $PY — create the venv under .cursor/govinfo-mcp (see README there)." >&2
  exit 1
fi
cd "$GOVINFO_DIR"
exec "$PY" -m app.server "$@"

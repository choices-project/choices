#!/usr/bin/env bash
set -euo pipefail

# Block adding new files under legacy paths
added=$(git diff --cached --name-only --diff-filter=A || true)
echo "$added" | grep -E '^web/components/(polls|voting)/' && {{ echo "❌ New files under legacy path. Use /features/* canonical."; exit 1; }} || true
echo "$added" | grep -E '^web/components/(Dashboard|EnhancedDashboard)\.tsx$' && {{ echo "❌ Use AnalyticsDashboard (canonical)."; exit 1; }} || true
echo "$added" | grep -E '^web/components/auth/AuthProvider\.tsx$' && {{ echo "❌ Use contexts/AuthContext (canonical)."; exit 1; }} || true

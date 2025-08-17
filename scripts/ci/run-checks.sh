#!/bin/bash

# Manual CI Checks Script
# Run this to manually validate your changes

set -e

echo "🔍 Running manual CI checks..."
echo "=============================="

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Run pre-push validation
if [ -f "$PROJECT_ROOT/scripts/ci/pre-push-validation.sh" ]; then
    echo "Running pre-push validation..."
    bash "$PROJECT_ROOT/scripts/ci/pre-push-validation.sh"
else
    echo "❌ Pre-push validation script not found"
    exit 1
fi

echo ""
echo "✅ All CI checks passed!"
echo "🚀 Ready to push to GitHub"

#!/bin/bash

# Safe Cleanup Script - Runs cleanup with automatic backup branch creation
# This is a convenience wrapper around safe-run.sh specifically for cleanup operations

set -e

# Colors for output
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧹 Safe Cleanup Script${NC}"
echo "=========================="
echo ""

echo "This script will:"
echo "1. Create a backup branch of your current work"
echo "2. Run code cleanup analysis"
echo "3. Optionally apply fixes automatically"
echo "4. Provide recovery instructions"
echo ""

# Check if --fix argument is provided
if [[ "$*" == *"--fix"* ]]; then
    echo "⚠️  WARNING: You're running with --fix flag"
    echo "This will automatically modify your code files!"
    echo ""
    read -p "Continue with automatic fixes? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Operation cancelled. Run without --fix to analyze only."
        exit 0
    fi
else
    echo "ℹ️  Running in analysis mode only (no changes will be made)"
    echo "Add --fix to automatically apply changes"
    echo ""
fi

# Run the safe-run script with cleanup-code.js
./safe-run.sh cleanup-code.js "$@"

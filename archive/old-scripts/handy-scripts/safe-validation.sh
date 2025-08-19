#!/bin/bash

# Safe Validation Script - Runs pre-push validation with automatic backup branch creation
# This is a convenience wrapper around safe-run.sh specifically for validation operations

set -e

# Colors for output
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}✅ Safe Validation Script${NC}"
echo "============================="
echo ""

echo "This script will:"
echo "1. Create a backup branch of your current work"
echo "2. Run comprehensive pre-push validation"
echo "3. Check for potential issues before pushing"
echo "4. Provide recovery instructions"
echo ""

echo -e "${YELLOW}ℹ️  Note: This runs the same checks as the CI pipeline${NC}"
echo ""

# Run the safe-run script with pre-push-validation.sh
./safe-run.sh pre-push-validation.sh

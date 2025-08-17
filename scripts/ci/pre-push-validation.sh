#!/bin/bash

# Pre-push CI Validation Script
# This script runs all the same checks that the CI pipeline will run
# to catch issues before pushing to GitHub

set -e  # Exit on any error

echo "🔍 Starting pre-push CI validation..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "SUCCESS")
            echo -e "${GREEN}✅ $message${NC}"
            ;;
        "ERROR")
            echo -e "${RED}❌ $message${NC}"
            ;;
        "WARNING")
            echo -e "${YELLOW}⚠️  $message${NC}"
            ;;
        "INFO")
            echo -e "${BLUE}ℹ️  $message${NC}"
            ;;
    esac
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
print_status "INFO" "Checking prerequisites..."

if ! command_exists node; then
    print_status "ERROR" "Node.js is not installed"
    exit 1
fi

if ! command_exists npm; then
    print_status "ERROR" "npm is not installed"
    exit 1
fi

if ! command_exists git; then
    print_status "ERROR" "git is not installed"
    exit 1
fi

print_status "SUCCESS" "All prerequisites found"

# Check if we're in the right directory
if [ ! -f "web/package.json" ]; then
    print_status "ERROR" "web/package.json not found. Please run from project root."
    exit 1
fi

# Navigate to web directory
cd web

print_status "INFO" "Installing dependencies..."
npm ci --silent
print_status "SUCCESS" "Dependencies installed"

# Run linting
print_status "INFO" "Running ESLint..."
if npm run lint > /dev/null 2>&1; then
    print_status "SUCCESS" "ESLint passed"
else
    print_status "ERROR" "ESLint failed"
    npm run lint
    exit 1
fi

# Run type checking
print_status "INFO" "Running TypeScript type check..."
if npm run type-check > /dev/null 2>&1; then
    print_status "SUCCESS" "TypeScript type check passed"
else
    print_status "ERROR" "TypeScript type check failed"
    npm run type-check
    exit 1
fi

# Run build test
print_status "INFO" "Testing production build..."
if npm run build > /dev/null 2>&1; then
    print_status "SUCCESS" "Production build successful"
else
    print_status "ERROR" "Production build failed"
    npm run build
    exit 1
fi

# Check for common issues
print_status "INFO" "Checking for common issues..."

# Check for useSearchParams without Suspense
if grep -r "useSearchParams" --include="*.tsx" --include="*.ts" . | grep -v "Suspense" > /dev/null 2>&1; then
    print_status "WARNING" "Found useSearchParams usage - ensure Suspense boundaries are in place"
fi

# Check for console.log statements in production code
if grep -r "console\.log" --include="*.tsx" --include="*.ts" . | grep -v "node_modules" > /dev/null 2>&1; then
    print_status "WARNING" "Found console.log statements - consider removing for production"
fi

# Check for TODO comments
TODO_COUNT=$(grep -r "TODO" --include="*.tsx" --include="*.ts" . | grep -v "node_modules" | wc -l)
if [ "$TODO_COUNT" -gt 0 ]; then
    print_status "WARNING" "Found $TODO_COUNT TODO comments"
fi

# Check for FIXME comments
FIXME_COUNT=$(grep -r "FIXME" --include="*.tsx" --include="*.ts" . | grep -v "node_modules" | wc -l)
if [ "$FIXME_COUNT" -gt 0 ]; then
    print_status "WARNING" "Found $FIXME_COUNT FIXME comments"
fi

# Check bundle size
print_status "INFO" "Checking bundle size..."
BUILD_OUTPUT=$(npm run build 2>&1)
if echo "$BUILD_OUTPUT" | grep -q "First Load JS shared by all"; then
    BUNDLE_SIZE=$(echo "$BUILD_OUTPUT" | grep "First Load JS shared by all" | awk '{print $NF}' | sed 's/kB//')
    if [ "$BUNDLE_SIZE" -gt 200 ]; then
        print_status "WARNING" "Bundle size is ${BUNDLE_SIZE}kB - consider optimization"
    else
        print_status "SUCCESS" "Bundle size is ${BUNDLE_SIZE}kB - acceptable"
    fi
fi

# Check for security vulnerabilities
print_status "INFO" "Checking for security vulnerabilities..."
if command_exists npm-audit; then
    if npm audit --audit-level=moderate > /dev/null 2>&1; then
        print_status "SUCCESS" "No moderate or higher security vulnerabilities found"
    else
        print_status "WARNING" "Security vulnerabilities found - run 'npm audit' for details"
    fi
else
    print_status "WARNING" "npm audit not available - skipping security check"
fi

# Check git status
cd ..
print_status "INFO" "Checking git status..."
if [ -n "$(git status --porcelain)" ]; then
    print_status "WARNING" "Uncommitted changes detected"
    git status --short
else
    print_status "SUCCESS" "Working directory is clean"
fi

# Check if we're on a feature branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" = "main" ] || [ "$CURRENT_BRANCH" = "master" ]; then
    print_status "WARNING" "You're on the main branch - consider using a feature branch"
else
    print_status "SUCCESS" "On feature branch: $CURRENT_BRANCH"
fi

echo ""
echo "=================================="
print_status "SUCCESS" "Pre-push validation completed successfully!"
print_status "INFO" "Ready to push to GitHub"
echo ""
print_status "INFO" "Next steps:"
echo "  1. git add ."
echo "  2. git commit -m 'your message'"
echo "  3. git push origin $CURRENT_BRANCH"
echo ""
print_status "INFO" "The CI pipeline will run the same checks on GitHub"

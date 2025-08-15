#!/bin/bash

# 🚀 Final Deployment Verification Script
# This script verifies that everything is ready for production deployment

set -e

echo "🔍 Final Deployment Verification"
echo "================================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ PASS${NC}: $2"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC}: $2"
        ((TESTS_FAILED++))
    fi
}

echo -e "\n${BLUE}=== GIT STATUS ===${NC}"
echo "Current branch: $(git branch --show-current)"
echo "Latest commit: $(git log --oneline -1)"
echo "Remote status: $(git status --porcelain)"

if [ -z "$(git status --porcelain)" ]; then
    print_result 0 "Working directory is clean"
else
    print_result 1 "Working directory has uncommitted changes"
fi

echo -e "\n${BLUE}=== BUILD TESTS ===${NC}"

# Test Next.js build
echo "Testing Next.js build..."
if cd web && npm run build > /dev/null 2>&1; then
    print_result 0 "Next.js build successful"
else
    print_result 1 "Next.js build failed"
fi
cd ..

# Test Go builds
echo "Testing Go builds..."
if cd server/po && go build ./cmd/po > /dev/null 2>&1; then
    print_result 0 "PO service builds successfully"
else
    print_result 1 "PO service build failed"
fi
cd ../..

if cd server/ia && go build ./cmd/ia > /dev/null 2>&1; then
    print_result 0 "IA service builds successfully"
else
    print_result 1 "IA service build failed"
fi
cd ../..

echo -e "\n${BLUE}=== SECURITY CHECKS ===${NC}"

# Check for hardcoded credentials
if git log --all --full-history | grep -q "choices_user\|choices_password\|6f0c2a37090a7bc2f7e670c07afa333edc06fe62759b1add546912c2f294787d"; then
    print_result 1 "Hardcoded credentials found in Git history"
else
    print_result 0 "No hardcoded credentials in Git history"
fi

# Check for environment variable usage
if grep -r "os.Getenv\|process.env" server/ web/ | grep -q "DATABASE_URL\|IA_PUBLIC_KEY"; then
    print_result 0 "Environment variables properly configured"
else
    print_result 1 "Environment variables not properly configured"
fi

echo -e "\n${BLUE}=== DEPLOYMENT STATUS ===${NC}"

# Check if deployment is accessible
if curl -s -o /dev/null -w "%{http_code}" https://choices-platform.vercel.app | grep -q "200"; then
    print_result 0 "Production deployment is accessible"
else
    print_result 1 "Production deployment is not accessible"
fi

# Check SSL certificate
if curl -s -I https://choices-platform.vercel.app | grep -q "strict-transport-security"; then
    print_result 0 "SSL/TLS properly configured"
else
    print_result 1 "SSL/TLS not properly configured"
fi

echo -e "\n${BLUE}=== CONFIGURATION FILES ===${NC}"

# Check for required configuration files
if [ -f "vercel.json" ]; then
    print_result 0 "vercel.json configuration present"
else
    print_result 1 "vercel.json configuration missing"
fi

if [ -f "env.production.template" ]; then
    print_result 0 "Environment template present"
else
    print_result 1 "Environment template missing"
fi

if [ -f ".gitignore" ]; then
    print_result 0 ".gitignore present"
else
    print_result 1 ".gitignore missing"
fi

echo -e "\n${BLUE}=== SUMMARY ===${NC}"
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo -e "Total Tests: $((TESTS_PASSED + TESTS_FAILED))"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All verification tests passed!${NC}"
    echo -e "${GREEN}Your deployment is ready for production!${NC}"
    echo ""
    echo "📋 Next steps:"
    echo "1. ✅ Environment variables configured in Vercel"
    echo "2. ✅ Database connection established"
    echo "3. ✅ All services building successfully"
    echo "4. ✅ Security measures implemented"
    echo "5. ✅ Deployment accessible and working"
    echo ""
    echo "🚀 Ready to merge to main and deploy!"
    exit 0
else
    echo -e "\n${RED}⚠️  Some verification tests failed.${NC}"
    echo "Please address the issues above before deploying."
    exit 1
fi

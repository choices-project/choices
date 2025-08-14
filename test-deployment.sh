#!/bin/bash

# 🚀 Deployment Testing Script for Choices Platform
# This script tests the deployed application for functionality and security

set -e

echo "🔍 Testing Choices Platform Deployment..."
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_URL="https://choices-platform.vercel.app"
LOCAL_URL="http://localhost:3000"

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

# Function to test HTTP response
test_http() {
    local url=$1
    local expected_status=$2
    local test_name=$3
    
    echo -e "\n${BLUE}Testing:${NC} $test_name"
    echo "URL: $url"
    
    # Get HTTP status code
    status_code=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$status_code" -eq "$expected_status" ]; then
        print_result 0 "$test_name (Status: $status_code)"
    else
        print_result 1 "$test_name (Expected: $expected_status, Got: $status_code)"
    fi
}

# Function to test security headers
test_security_headers() {
    local url=$1
    local test_name=$2
    
    echo -e "\n${BLUE}Testing Security Headers:${NC} $test_name"
    echo "URL: $url"
    
    # Test for security headers
    headers=$(curl -s -I "$url")
    
    # Check for security headers
    if echo "$headers" | grep -q "X-Content-Type-Options: nosniff"; then
        print_result 0 "X-Content-Type-Options header present"
    else
        print_result 1 "X-Content-Type-Options header missing"
    fi
    
    if echo "$headers" | grep -q "X-Frame-Options: DENY"; then
        print_result 0 "X-Frame-Options header present"
    else
        print_result 1 "X-Frame-Options header missing"
    fi
    
    if echo "$headers" | grep -q "X-XSS-Protection: 1; mode=block"; then
        print_result 0 "X-XSS-Protection header present"
    else
        print_result 1 "X-XSS-Protection header missing"
    fi
    
    if echo "$headers" | grep -q "Strict-Transport-Security"; then
        print_result 0 "HSTS header present"
    else
        print_result 1 "HSTS header missing"
    fi
}

# Function to test CORS
test_cors() {
    local url=$1
    local test_name=$2
    
    echo -e "\n${BLUE}Testing CORS:${NC} $test_name"
    echo "URL: $url"
    
    # Test CORS headers
    cors_response=$(curl -s -H "Origin: https://choices-platform.vercel.app" -I "$url")
    
    if echo "$cors_response" | grep -q "Access-Control-Allow-Origin: https://choices-platform.vercel.app"; then
        print_result 0 "CORS properly configured for production domain"
    else
        print_result 1 "CORS not properly configured"
    fi
}

# Function to test SSL/TLS
test_ssl() {
    local url=$1
    local test_name=$2
    
    echo -e "\n${BLUE}Testing SSL/TLS:${NC} $test_name"
    echo "URL: $url"
    
    # Test SSL certificate
    if curl -s -I "$url" > /dev/null 2>&1; then
        print_result 0 "SSL/TLS connection successful"
    else
        print_result 1 "SSL/TLS connection failed"
    fi
}

# Function to test page load
test_page_load() {
    local url=$1
    local test_name=$2
    
    echo -e "\n${BLUE}Testing Page Load:${NC} $test_name"
    echo "URL: $url"
    
    # Test if page loads without errors
    response=$(curl -s "$url")
    
    if [ -n "$response" ]; then
        print_result 0 "Page loads successfully"
        
        # Check for common error indicators
        if echo "$response" | grep -q "error\|Error\|ERROR"; then
            print_result 1 "Page contains error indicators"
        else
            print_result 0 "No error indicators found"
        fi
    else
        print_result 1 "Page failed to load"
    fi
}

# Function to test API endpoints
test_api() {
    local base_url=$1
    local test_name=$2
    
    echo -e "\n${BLUE}Testing API Endpoints:${NC} $test_name"
    
    # Test polls API
    polls_status=$(curl -s -o /dev/null -w "%{http_code}" "$base_url/api/polls")
    if [ "$polls_status" -eq "500" ] || [ "$polls_status" -eq "200" ]; then
        print_result 0 "Polls API responds (Status: $polls_status)"
    else
        print_result 1 "Polls API failed (Status: $polls_status)"
    fi
    
    # Test demographics API
    demo_status=$(curl -s -o /dev/null -w "%{http_code}" "$base_url/api/demographics")
    if [ "$demo_status" -eq "500" ] || [ "$demo_status" -eq "200" ]; then
        print_result 0 "Demographics API responds (Status: $demo_status)"
    else
        print_result 1 "Demographics API failed (Status: $demo_status)"
    fi
}

# Function to test build process
test_build() {
    echo -e "\n${BLUE}Testing Build Process:${NC}"
    
    cd web
    
    # Test TypeScript compilation
    if npx tsc --noEmit > /dev/null 2>&1; then
        print_result 0 "TypeScript compilation successful"
    else
        print_result 1 "TypeScript compilation failed"
    fi
    
    # Test Next.js build
    if npm run build > /dev/null 2>&1; then
        print_result 0 "Next.js build successful"
    else
        print_result 1 "Next.js build failed"
    fi
    
    cd ..
}

# Main testing sequence
echo -e "\n${YELLOW}Starting comprehensive deployment tests...${NC}"

# Test production deployment
echo -e "\n${YELLOW}=== PRODUCTION DEPLOYMENT TESTS ===${NC}"

test_http "$APP_URL" 200 "Production homepage"
test_security_headers "$APP_URL" "Production security headers"
test_ssl "$APP_URL" "Production SSL/TLS"
test_cors "$APP_URL/api/polls" "Production CORS"
test_api "$APP_URL" "Production API endpoints"

# Test local development (if running)
echo -e "\n${YELLOW}=== LOCAL DEVELOPMENT TESTS ===${NC}"

# Check if local server is running
if curl -s "$LOCAL_URL" > /dev/null 2>&1; then
    test_http "$LOCAL_URL" 200 "Local homepage"
    test_security_headers "$LOCAL_URL" "Local security headers"
    test_api "$LOCAL_URL" "Local API endpoints"
else
    echo -e "${YELLOW}⚠️  Local development server not running${NC}"
fi

# Test build process
echo -e "\n${YELLOW}=== BUILD PROCESS TESTS ===${NC}"
test_build

# Summary
echo -e "\n${YELLOW}=== TEST SUMMARY ===${NC}"
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo -e "Total Tests: $((TESTS_PASSED + TESTS_FAILED))"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All tests passed! Deployment is working correctly.${NC}"
    exit 0
else
    echo -e "\n${RED}⚠️  Some tests failed. Please review the issues above.${NC}"
    exit 1
fi

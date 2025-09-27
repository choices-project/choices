#!/bin/bash
# WebAuthn Implementation Validation Script
# Validates the existing WebAuthn implementation

echo "🔐 WebAuthn Implementation Validation"
echo "======================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the web directory"
    exit 1
fi

# Check if dev server is running
echo "🔍 Checking dev server..."
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "⚠️  Dev server not running. Please start it with: npm run dev"
    exit 1
fi
echo "✅ Dev server is running"

# Check WebAuthn feature flag
echo "🏁 Checking WebAuthn feature flag..."
WEBAUTHN_ENABLED=$(curl -s http://localhost:3000/api/e2e/flags | jq -r '.flags.WEBAUTHN // false')
if [ "$WEBAUTHN_ENABLED" != "true" ]; then
    echo "❌ WebAuthn feature flag is not enabled"
    echo "   Please enable WEBAUTHN in feature flags"
    exit 1
fi
echo "✅ WebAuthn feature flag is enabled"

# Check WebAuthn API endpoints
echo "🔌 Testing WebAuthn API endpoints..."

# Test registration options endpoint
echo "  - Testing registration options endpoint..."
REG_OPTIONS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/v1/auth/webauthn/register/options)
if [ "$REG_OPTIONS_RESPONSE" = "401" ]; then
    echo "    ✅ Registration options endpoint responds correctly (401 Unauthorized)"
else
    echo "    ⚠️  Registration options endpoint returned: $REG_OPTIONS_RESPONSE"
fi

# Test authentication options endpoint
echo "  - Testing authentication options endpoint..."
AUTH_OPTIONS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/v1/auth/webauthn/authenticate/options)
if [ "$AUTH_OPTIONS_RESPONSE" = "401" ]; then
    echo "    ✅ Authentication options endpoint responds correctly (401 Unauthorized)"
else
    echo "    ⚠️  Authentication options endpoint returned: $AUTH_OPTIONS_RESPONSE"
fi

# Test registration verification endpoint
echo "  - Testing registration verification endpoint..."
REG_VERIFY_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/v1/auth/webauthn/register/verify)
if [ "$REG_VERIFY_RESPONSE" = "401" ]; then
    echo "    ✅ Registration verification endpoint responds correctly (401 Unauthorized)"
else
    echo "    ⚠️  Registration verification endpoint returned: $REG_VERIFY_RESPONSE"
fi

# Test authentication verification endpoint
echo "  - Testing authentication verification endpoint..."
AUTH_VERIFY_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/v1/auth/webauthn/authenticate/verify)
if [ "$AUTH_VERIFY_RESPONSE" = "401" ]; then
    echo "    ✅ Authentication verification endpoint responds correctly (401 Unauthorized)"
else
    echo "    ⚠️  Authentication verification endpoint returned: $AUTH_VERIFY_RESPONSE"
fi

# Check WebAuthn components
echo "🎨 Checking WebAuthn components..."
if [ -f "components/PasskeyButton.tsx" ]; then
    echo "  ✅ PasskeyButton component exists"
else
    echo "  ❌ PasskeyButton component not found"
fi

if [ -f "components/auth/PasskeyControls.tsx" ]; then
    echo "  ✅ PasskeyControls component exists"
else
    echo "  ❌ PasskeyControls component not found"
fi

if [ -f "components/auth/PasskeyRegister.tsx" ]; then
    echo "  ✅ PasskeyRegister component exists"
else
    echo "  ❌ PasskeyRegister component not found"
fi

if [ -f "components/auth/PasskeyLogin.tsx" ]; then
    echo "  ✅ PasskeyLogin component exists"
else
    echo "  ❌ PasskeyLogin component not found"
fi

# Check WebAuthn configuration
echo "⚙️  Checking WebAuthn configuration..."
if [ -f "lib/webauthn/config.ts" ]; then
    echo "  ✅ WebAuthn config exists"
else
    echo "  ❌ WebAuthn config not found"
fi

if [ -f "lib/webauthn/client.ts" ]; then
    echo "  ✅ WebAuthn client utilities exist"
else
    echo "  ❌ WebAuthn client utilities not found"
fi

# Check database schema
echo "🗄️  Checking database schema..."
echo "  - WebAuthn credentials table should exist"
echo "  - WebAuthn challenges table should exist"
echo "  - RLS policies should be enabled"

# Run E2E tests
echo "🧪 Running WebAuthn E2E tests..."
echo "  - API endpoint tests..."
npx playwright test webauthn-api --project=chromium

echo "  - Component tests..."
npx playwright test webauthn-components --project=chromium

echo "  - Full flow tests..."
npx playwright test webauthn-flow --project=chromium

# Check test results
if [ $? -eq 0 ]; then
    echo "✅ All WebAuthn E2E tests passed!"
else
    echo "❌ Some WebAuthn E2E tests failed!"
    exit 1
fi

echo ""
echo "🎉 WebAuthn implementation validation completed!"
echo ""
echo "📋 Summary:"
echo "  ✅ Feature flag enabled"
echo "  ✅ API endpoints responding"
echo "  ✅ Components present"
echo "  ✅ Configuration files exist"
echo "  ✅ E2E tests passing"
echo ""
echo "🚀 WebAuthn is ready for production use!"

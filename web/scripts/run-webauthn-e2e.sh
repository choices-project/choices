#!/bin/bash
# WebAuthn E2E Test Runner
# Tests the existing WebAuthn implementation

echo "🚀 Starting WebAuthn E2E Tests..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the web directory"
    exit 1
fi

# Check if dev server is running
echo "🔍 Checking if dev server is running..."
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "⚠️  Dev server not running. Please start it with: npm run dev"
    echo "   Then run this script again."
    exit 1
fi

# Check WebAuthn feature flag
echo "🏁 Checking WebAuthn feature flag..."
WEBAUTHN_ENABLED=$(curl -s http://localhost:3000/api/e2e/flags | jq -r '.flags.WEBAUTHN // false')
if [ "$WEBAUTHN_ENABLED" != "true" ]; then
    echo "❌ WebAuthn feature flag is not enabled. Please enable it in feature flags."
    exit 1
fi
echo "✅ WebAuthn feature flag is enabled"

# Run WebAuthn E2E tests
echo "🧪 Running WebAuthn E2E tests..."
npx playwright test webauthn-flow --project=chromium

# Check test results
if [ $? -eq 0 ]; then
    echo "✅ WebAuthn E2E tests passed!"
else
    echo "❌ WebAuthn E2E tests failed!"
    exit 1
fi

echo "🎉 WebAuthn E2E testing completed successfully!"

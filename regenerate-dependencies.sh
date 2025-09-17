#!/bin/bash

echo "🔄 Regenerating all dependencies for a fresh start..."

# Clean everything
echo "🧹 Cleaning existing dependencies..."
rm -rf node_modules
rm -rf web/node_modules
rm -f package-lock.json
rm -f web/package-lock.json

# Clean build artifacts
echo "🧹 Cleaning build artifacts..."
rm -rf web/.next
rm -rf web/dist
rm -rf web/build
rm -rf web/coverage
rm -rf web/playwright-report
rm -rf web/test-results

# Clean TypeScript build info
echo "🧹 Cleaning TypeScript build info..."
rm -f web/tsconfig.tsbuildinfo
rm -f tsconfig.tsbuildinfo

# Clean Jest cache
echo "🧹 Cleaning Jest cache..."
rm -rf web/.jest-cache

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install web dependencies
echo "📦 Installing web dependencies..."
cd web
npm install
cd ..

# Verify installations
echo "✅ Verifying installations..."
echo "Root dependencies:"
npm list --depth=0

echo "Web dependencies:"
cd web
npm list --depth=0
cd ..

echo "🎉 Fresh dependency regeneration complete!"
echo ""
echo "Next steps:"
echo "1. Run 'npm run types:ci' to test TypeScript compilation"
echo "2. Run 'npm run lint:test' to test ESLint"
echo "3. Run 'npm run jest:ci' to test Jest"
echo "4. Run 'npm run build' to test the build process"

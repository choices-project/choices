#!/bin/bash
set -euo pipefail

# Enhanced pre-commit validation script
echo "🔍 Running comprehensive pre-commit checks..."
echo "=============================================="

# 1. Security checks (repo-wide)
echo ""
echo "[INFO] 🔒 SECURITY CHECKS"
echo "-------------------"

# Check for common security issues across the entire repo
echo "Scanning for security issues..."

# JWT/API key patterns
if git diff --cached --name-only | xargs grep -l -E "(jwt|api[_-]?key|secret[_-]?key|private[_-]?key)" 2>/dev/null; then
  echo "::error::Potential JWT/API key patterns detected"
  exit 1
fi

# Database URL patterns
if git diff --cached --name-only | xargs grep -l -E "(postgres://|mysql://|mongodb://|redis://)" 2>/dev/null; then
  echo "::error::Database URL patterns detected"
  exit 1
fi

# Hex secrets (32+ chars)
if git diff --cached --name-only | xargs grep -l -E "[a-fA-F0-9]{32,}" 2>/dev/null; then
  echo "::error::Potential hex secrets detected"
  exit 1
fi

# UUID patterns that might be secrets
if git diff --cached --name-only | xargs grep -l -E "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}" 2>/dev/null; then
  echo "::error::UUID patterns detected (might be secrets)"
  exit 1
fi

echo "[SUCCESS] Security checks passed! ✅"

# 2. Code quality checks (web-specific)
echo ""
echo "[INFO] 📝 CODE QUALITY CHECKS"
echo "------------------------"

# Get staged TypeScript/JavaScript files in web directory
STAGED_WEB_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '^web/.*\.(ts|tsx|js|jsx)$' || true)

if [ -n "$STAGED_WEB_FILES" ]; then
  echo "Linting staged web files..."
  echo "$STAGED_WEB_FILES" | xargs -0 -r -n 50 bash -c 'cd web && npx eslint --cache --max-warnings=0 -- "$@"' _ || {
    echo "::error::Linting failed on staged web files"
    exit 1
  }
  echo "[SUCCESS] Web linting passed! ✅"
else
  echo "No staged TypeScript/JavaScript files in web directory"
fi

# 3. Type checking (web-specific)
if [ -n "$STAGED_WEB_FILES" ]; then
  echo "Running TypeScript type check..."
  cd web && npm run type-check || {
    echo "::error::TypeScript type check failed"
    exit 1
  }
  cd ..
  echo "[SUCCESS] TypeScript check passed! ✅"
fi

# 4. Warn about underscore declarations in non-test files
echo ""
echo "[INFO] ⚠️  WARNINGS & SUGGESTIONS"
echo "----------------------------"

OFFENDERS=$(git diff --cached --name-only --diff-filter=ACM \
  | grep -Ev '(\.test\.|/__tests__/)' \
  | xargs -I{} git diff --cached --unified=0 -- {} \
  | grep -En "^\+[^+].*\b(const|let|var)\s+_[a-zA-Z0-9_]+" || true)

if [ -n "$OFFENDERS" ]; then
  echo "⚠️  Leading-underscore variable declarations detected outside tests:"
  echo "$OFFENDERS" | head -20
  echo "   (CI will still fail if these are unused.)"
  echo ""
fi

echo "[SUCCESS] 🎉 All pre-commit checks passed! Commit proceeding..."

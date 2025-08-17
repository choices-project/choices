#!/bin/bash

# Git Hooks Setup Script
# Automatically runs CI checks before pushing to catch issues early

set -e

echo "🔧 Setting up Git hooks for CI validation..."
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    print_status "ERROR" "Not in a git repository. Please run from the project root."
    exit 1
fi

# Create hooks directory if it doesn't exist
HOOKS_DIR=".git/hooks"
if [ ! -d "$HOOKS_DIR" ]; then
    mkdir -p "$HOOKS_DIR"
fi

# Create pre-push hook
print_status "INFO" "Creating pre-push hook..."

cat > "$HOOKS_DIR/pre-push" << 'EOF'
#!/bin/bash

# Pre-push Git Hook
# Runs CI validation before pushing to catch issues early

set -e

echo "🔍 Running pre-push CI validation..."
echo "=================================="

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Run the pre-push validation script
if [ -f "$PROJECT_ROOT/scripts/ci/pre-push-validation.sh" ]; then
    bash "$PROJECT_ROOT/scripts/ci/pre-push-validation.sh"
    
    if [ $? -ne 0 ]; then
        echo ""
        echo "❌ Pre-push validation failed!"
        echo "Please fix the issues above before pushing."
        echo ""
        echo "To skip this check (not recommended):"
        echo "  git push --no-verify"
        exit 1
    fi
else
    echo "⚠️  Pre-push validation script not found"
    echo "Continuing with push..."
fi

echo ""
echo "✅ Pre-push validation passed!"
echo "🚀 Proceeding with push..."
EOF

# Make the hook executable
chmod +x "$HOOKS_DIR/pre-push"
print_status "SUCCESS" "Pre-push hook created and made executable"

# Create pre-commit hook
print_status "INFO" "Creating pre-commit hook..."

cat > "$HOOKS_DIR/pre-commit" << 'EOF'
#!/bin/bash

# Pre-commit Git Hook
# Runs basic checks before committing

set -e

echo "🔍 Running pre-commit checks..."
echo "=============================="

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Check for staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)

if [ -z "$STAGED_FILES" ]; then
    echo "⚠️  No files staged for commit"
    exit 0
fi

# Check for TypeScript/JavaScript files
TS_JS_FILES=$(echo "$STAGED_FILES" | grep -E '\.(ts|tsx|js|jsx)$' || true)

if [ -n "$TS_JS_FILES" ]; then
    echo "📝 Checking TypeScript/JavaScript files..."
    
    # Navigate to web directory if it exists
    if [ -d "$PROJECT_ROOT/web" ]; then
        cd "$PROJECT_ROOT/web"
        
        # Run ESLint on staged files
        if npm run lint > /dev/null 2>&1; then
            echo "✅ ESLint passed"
        else
            echo "❌ ESLint failed"
            echo "Please fix linting issues before committing"
            exit 1
        fi
        
        cd "$PROJECT_ROOT"
    fi
fi

# Check for TODO/FIXME comments in staged files
TODO_FILES=$(git diff --cached --name-only | xargs grep -l "TODO\|FIXME" 2>/dev/null || true)

if [ -n "$TODO_FILES" ]; then
    echo "⚠️  Found TODO/FIXME comments in staged files:"
    echo "$TODO_FILES"
    echo ""
    echo "Consider addressing these before committing"
fi

# Check commit message format (if using conventional commits)
COMMIT_MSG_FILE="$1"
if [ -f "$COMMIT_MSG_FILE" ]; then
    COMMIT_MSG=$(cat "$COMMIT_MSG_FILE")
    
    # Basic conventional commit format check
    if ! echo "$COMMIT_MSG" | grep -qE "^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\(.+\))?: .+"; then
        echo "⚠️  Consider using conventional commit format:"
        echo "   type(scope): description"
        echo "   Examples: feat: add new feature, fix: resolve bug"
    fi
fi

echo ""
echo "✅ Pre-commit checks passed!"
EOF

# Make the hook executable
chmod +x "$HOOKS_DIR/pre-commit"
print_status "SUCCESS" "Pre-commit hook created and made executable"

# Create commit-msg hook for conventional commits
print_status "INFO" "Creating commit-msg hook..."

cat > "$HOOKS_DIR/commit-msg" << 'EOF'
#!/bin/bash

# Commit Message Hook
# Validates commit message format

set -e

COMMIT_MSG_FILE="$1"
COMMIT_MSG=$(cat "$COMMIT_MSG_FILE")

# Skip validation for merge commits
if echo "$COMMIT_MSG" | grep -q "^Merge"; then
    exit 0
fi

# Conventional commit format validation
if ! echo "$COMMIT_MSG" | grep -qE "^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\(.+\))?: .+"; then
    echo "❌ Invalid commit message format"
    echo ""
    echo "Please use conventional commit format:"
    echo "  type(scope): description"
    echo ""
    echo "Types: feat, fix, docs, style, refactor, test, chore, perf, ci, build, revert"
    echo "Examples:"
    echo "  feat: add new feature"
    echo "  fix(auth): resolve login issue"
    echo "  docs: update README"
    echo "  chore: update dependencies"
    echo ""
    echo "To skip this check:"
    echo "  git commit --no-verify"
    exit 1
fi

echo "✅ Commit message format is valid"
EOF

# Make the hook executable
chmod +x "$HOOKS_DIR/commit-msg"
print_status "SUCCESS" "Commit message hook created and made executable"

# Create post-merge hook for dependency updates
print_status "INFO" "Creating post-merge hook..."

cat > "$HOOKS_DIR/post-merge" << 'EOF'
#!/bin/bash

# Post-merge Git Hook
# Runs after merging to ensure everything is up to date

set -e

echo "🔄 Running post-merge checks..."
echo "=============================="

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Check if package.json was modified
if git diff-tree --name-only HEAD@{1} HEAD | grep -q "package.json"; then
    echo "📦 package.json was modified, checking for dependency updates..."
    
    if [ -d "$PROJECT_ROOT/web" ]; then
        cd "$PROJECT_ROOT/web"
        
        # Check if node_modules needs updating
        if [ package.json -nt node_modules/.package-lock.json ]; then
            echo "🔄 Installing updated dependencies..."
            npm install
            echo "✅ Dependencies updated"
        fi
        
        cd "$PROJECT_ROOT"
    fi
fi

# Check for environment file changes
if git diff-tree --name-only HEAD@{1} HEAD | grep -q "\.env"; then
    echo "⚠️  Environment files were modified"
    echo "Please ensure your local environment is properly configured"
fi

echo "✅ Post-merge checks completed"
EOF

# Make the hook executable
chmod +x "$HOOKS_DIR/post-merge"
print_status "SUCCESS" "Post-merge hook created and made executable"

# Create a script to run CI checks manually
print_status "INFO" "Creating manual CI check script..."

cat > "scripts/ci/run-checks.sh" << 'EOF'
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
EOF

# Make the manual script executable
chmod +x "scripts/ci/run-checks.sh"
print_status "SUCCESS" "Manual CI check script created"

# Create a configuration file for CI settings
print_status "INFO" "Creating CI configuration..."

cat > "scripts/ci/ci-config.json" << 'EOF'
{
  "checks": {
    "linting": true,
    "typeChecking": true,
    "buildTest": true,
    "securityAudit": true,
    "bundleSize": true
  },
  "thresholds": {
    "maxBundleSizeKB": 200,
    "maxWarnings": 10,
    "maxTodos": 5
  },
  "notifications": {
    "slack": false,
    "email": false,
    "github": true
  },
  "environments": {
    "development": {
      "strictChecks": false,
      "allowWarnings": true
    },
    "production": {
      "strictChecks": true,
      "allowWarnings": false
    }
  }
}
EOF

print_status "SUCCESS" "CI configuration created"

echo ""
echo "=========================================="
print_status "SUCCESS" "Git hooks setup completed!"
echo ""
echo "📋 What was installed:"
echo "  ✅ Pre-push hook - Runs CI validation before pushing"
echo "  ✅ Pre-commit hook - Runs basic checks before committing"
echo "  ✅ Commit-msg hook - Validates commit message format"
echo "  ✅ Post-merge hook - Handles dependency updates"
echo "  ✅ Manual CI script - scripts/ci/run-checks.sh"
echo "  ✅ CI configuration - scripts/ci/ci-config.json"
echo ""
echo "🚀 Next steps:"
echo "  1. Test the hooks: git commit -m 'test: testing hooks'"
echo "  2. Run manual checks: ./scripts/ci/run-checks.sh"
echo "  3. Push to test: git push origin your-branch"
echo ""
echo "📚 Documentation:"
echo "  - Pre-push validation: scripts/ci/pre-push-validation.sh"
echo "  - CI monitoring: scripts/ci/ci-monitor.js"
echo "  - Configuration: scripts/ci/ci-config.json"

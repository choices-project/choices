#!/bin/bash

# Enhanced Pre-Push Validation Script
# Incorporates our critical lessons learned and best practices

set -e

echo "🔍 Enhanced Pre-Push CI Validation"
echo "=================================="
echo "🎯 Incorporating our critical lessons learned"
echo ""

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
        "success")
            echo -e "${GREEN}✅${NC} $message"
            ;;
        "warning")
            echo -e "${YELLOW}⚠️${NC} $message"
            ;;
        "error")
            echo -e "${RED}❌${NC} $message"
            ;;
        "info")
            echo -e "${BLUE}ℹ️${NC} $message"
            ;;
    esac
}

# Function to check if we're on main branch
check_branch_safety() {
    local current_branch=$(git branch --show-current)
    if [ "$current_branch" = "main" ]; then
        print_status "warning" "You're on main branch - consider using a feature branch for big changes"
        print_status "info" "Best practice: git checkout -b feature/your-feature-name"
        return 1
    else
        print_status "success" "Working on feature branch: $current_branch"
        return 0
    fi
}

# Function to check for console.log statements
check_console_logs() {
    print_status "info" "Checking for console.log statements (Lesson 17)..."
    
    # Check production code (web directory) for unguarded console.log
    local unguarded_console_logs=""
    
    while IFS= read -r -d '' file; do
        # Skip node_modules and build files
        if [[ "$file" == *"node_modules"* ]] || [[ "$file" == *".next"* ]]; then
            continue
        fi
        
        # Check if file contains console.log
        if grep -q "console\.log" "$file"; then
            # Check if console.log is properly guarded for development
            if ! grep -q "process\.env\.NODE_ENV.*development" "$file"; then
                unguarded_console_logs="$unguarded_console_logs$file"$'\n'
            fi
        fi
    done < <(find ./web -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -print0)
    
    if [ -n "$unguarded_console_logs" ]; then
        print_status "error" "Found unguarded console.log statements in production code:"
        echo "$unguarded_console_logs" | while read -r file; do
            if [ -n "$file" ]; then
                echo "  - $file"
            fi
        done
        print_status "warning" "Guard console.log statements with process.env.NODE_ENV === 'development'"
        return 1
    else
        print_status "success" "All console.log statements are properly guarded"
        return 0
    fi
}

# Function to check for useSearchParams without Suspense
check_use_search_params() {
    print_status "info" "Checking useSearchParams usage (Lesson 18)..."
    
    local unguarded_search_params=""
    
    while IFS= read -r -d '' file; do
        # Skip node_modules and build files
        if [[ "$file" == *"node_modules"* ]] || [[ "$file" == *".next"* ]]; then
            continue
        fi
        
        # Check if file contains useSearchParams
        if grep -q "useSearchParams" "$file"; then
            # Check if the component using useSearchParams is wrapped in Suspense
            # Look for Suspense wrapper around the component
            if ! grep -q "Suspense.*fallback" "$file"; then
                unguarded_search_params="$unguarded_search_params$file"$'\n'
            fi
        fi
    done < <(find ./web -name "*.tsx" -print0)
    
    if [ -n "$unguarded_search_params" ]; then
        print_status "warning" "Found useSearchParams usage without proper Suspense boundaries:"
        echo "$unguarded_search_params" | while read -r file; do
            if [ -n "$file" ]; then
                echo "  - $file"
            fi
        done
        print_status "info" "Wrap useSearchParams components in Suspense boundaries"
        return 1
    else
        print_status "success" "All useSearchParams usage is properly wrapped in Suspense"
        return 0
    fi
}

# Function to check for unused imports
check_unused_imports() {
    print_status "info" "Checking for unused imports (Lesson 16)..."
    
    # Run ESLint with unused imports rule
    if npm run lint 2>&1 | grep -q "no-unused-vars"; then
        print_status "warning" "Found unused imports/variables:"
        npm run lint 2>&1 | grep "no-unused-vars" | head -5
        print_status "info" "Remove unused imports to reduce bundle size and improve performance"
        return 1
    else
        print_status "success" "No unused imports found"
        return 0
    fi
}

# Function to check for select('*') usage
check_select_star() {
    print_status "info" "Checking for select('*') usage (Lesson 7)..."
    
    # Check production code for select('*') usage
    local select_star_files=$(find ./web -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | grep -v node_modules | grep -v .git | grep -v .next | xargs grep -l "select('\\*')" 2>/dev/null || true)
    
    if [ -n "$select_star_files" ]; then
        print_status "error" "Found select('*') usage - always select specific fields:"
        echo "$select_star_files" | while read -r file; do
            echo "  - $file"
        done
        print_status "warning" "Replace select('*') with specific field selection for better performance"
        return 1
    else
        print_status "success" "No select('*') usage found"
        return 0
    fi
}

# Function to check for proper error handling
check_error_handling() {
    print_status "info" "Checking for proper error handling (Lesson 8)..."
    
    local supabase_queries=$(find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v .git | xargs grep -l "supabase.*from" 2>/dev/null || true)
    
    local missing_error_handling=0
    if [ -n "$supabase_queries" ]; then
        echo "$supabase_queries" | while read -r file; do
            if grep -q "supabase.*from" "$file" && ! grep -q "error.*{" "$file"; then
                echo "  - $file (missing error handling)"
                missing_error_handling=1
            fi
        done
        
        if [ $missing_error_handling -eq 1 ]; then
            print_status "warning" "Some Supabase queries may be missing error handling"
            print_status "info" "Always check for errors after database operations"
            return 1
        fi
    fi
    
    print_status "success" "Error handling appears to be in place"
    return 0
}

# Function to check documentation timestamps
check_documentation_timestamps() {
    print_status "info" "Checking documentation timestamps (Lesson 5)..."
    
    local doc_files=$(find . -name "*.md" | grep -v node_modules | grep -v .git | head -10)
    local missing_timestamps=0
    
    echo "$doc_files" | while read -r file; do
        if ! grep -q "Last Updated" "$file"; then
            echo "  - $file (missing timestamp)"
            missing_timestamps=1
        fi
    done
    
    if [ $missing_timestamps -eq 1 ]; then
        print_status "warning" "Some documentation files may be missing timestamps"
        print_status "info" "Add 'Last Updated: YYYY-MM-DD' to documentation files"
        return 1
    fi
    
    print_status "success" "Documentation timestamps appear to be in place"
    return 0
}

# Function to check for TypeScript strict mode
check_typescript_strict() {
    print_status "info" "Checking TypeScript configuration (Lesson 2)..."
    
    if [ -f "web/tsconfig.json" ]; then
        if grep -q '"strict": true' web/tsconfig.json; then
            print_status "success" "TypeScript strict mode is enabled"
            return 0
        else
            print_status "warning" "TypeScript strict mode is not enabled"
            print_status "info" "Enable strict mode in tsconfig.json for better type safety"
            return 1
        fi
    else
        print_status "warning" "tsconfig.json not found"
        return 1
    fi
}

# Function to check for proper commit messages
check_commit_messages() {
    print_status "info" "Checking commit message format..."
    
    local last_commit_msg=$(git log -1 --pretty=%B)
    if echo "$last_commit_msg" | grep -qE "^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert):"; then
        print_status "success" "Commit message follows conventional format"
        return 0
    else
        print_status "warning" "Commit message should follow conventional format: type(scope): description"
        print_status "info" "Examples: feat: add new feature, fix: resolve bug, docs: update README"
        return 1
    fi
}

# Function to check for large files
check_large_files() {
    print_status "info" "Checking for large files..."
    
    # Exclude common build artifacts and legitimate large files
    local large_files=$(find . -type f -size +1M | grep -v node_modules | grep -v .git | grep -v .next | grep -v archive | grep -v "\.exe$" | grep -v "\.dll$" | grep -v "\.so$" | grep -v "\.dylib$" | grep -v "\.test$" | grep -v "\.out$" | grep -v "server/ia/ia$" | grep -v "server/po/po$" | grep -v "server/ia/cmd/ia/ia$" | head -5)
    
    if [ -n "$large_files" ]; then
        print_status "warning" "Found large files (>1MB) that may not belong in version control:"
        echo "$large_files" | while read -r file; do
            local file_type=$(file "$file" 2>/dev/null | cut -d: -f2- | xargs)
            echo "  - $file ($(du -h "$file" | cut -f1)) - $file_type"
        done
        print_status "info" "Consider if these files should be in .gitignore"
        return 1
    else
        print_status "success" "No problematic large files found"
        return 0
    fi
}

# Main validation function
main() {
    local exit_code=0
    
    echo "🚀 Starting enhanced validation..."
    echo ""
    
    # Check prerequisites
    print_status "info" "Checking prerequisites..."
    if ! command -v npm &> /dev/null; then
        print_status "error" "npm not found"
        exit 1
    fi
    if ! command -v git &> /dev/null; then
        print_status "error" "git not found"
        exit 1
    fi
    print_status "success" "All prerequisites found"
    echo ""
    
    # Run all checks
    check_branch_safety || exit_code=1
    echo ""
    
    check_console_logs || exit_code=1
    echo ""
    
    # Run all checks - no bypassing!
    check_branch_safety || exit_code=1
    echo ""
    
    check_console_logs || exit_code=1
    echo ""
    
    check_use_search_params || exit_code=1
    echo ""
    
    check_unused_imports || exit_code=1
    echo ""
    
    check_select_star || exit_code=1
    echo ""
    
    check_error_handling || exit_code=1
    echo ""
    
    check_documentation_timestamps || exit_code=1
    echo ""
    
    check_typescript_strict || exit_code=1
    echo ""
    
    check_commit_messages || exit_code=1
    echo ""
    
    check_large_files || exit_code=1
    echo ""
    
    check_commit_messages || exit_code=1
    echo ""
    
    check_large_files || exit_code=1
    echo ""
    
    # Summary
    echo "📊 Enhanced Validation Summary"
    echo "=============================="
    
    if [ $exit_code -eq 0 ]; then
        print_status "success" "All enhanced checks passed!"
        print_status "info" "Your code follows our critical lessons learned"
        echo ""
        print_status "info" "Ready to push to GitHub"
        echo ""
        print_status "info" "The CI pipeline will run the same checks on GitHub"
        echo ""
        print_status "info" "Would you like to automatically monitor the CI pipeline after push?"
        print_status "info" "Run: ./scripts/ci/monitor-ci.sh"
        print_status "info" "Or add this to your push command: git push && ./scripts/ci/monitor-ci.sh"
    else
        print_status "warning" "Some enhanced checks failed"
        print_status "info" "Please address the issues above before pushing"
        print_status "info" "These checks help maintain our quality standards and best practices"
    fi
    
    echo ""
    print_status "info" "Enhanced validation completed!"
    
    return $exit_code
}

# Run main function
main "$@"

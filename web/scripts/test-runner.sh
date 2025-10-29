#!/bin/bash

# Test Runner Script
# Provides easy commands for running different types of tests

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if dev server is running
check_dev_server() {
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to start dev server
start_dev_server() {
    print_status "Starting development server..."
    npm run dev &
    DEV_PID=$!

    # Wait for server to start
    print_status "Waiting for server to start..."
    for i in {1..30}; do
        if check_dev_server; then
            print_success "Development server started successfully!"
            return 0
        fi
        sleep 2
    done

    print_error "Failed to start development server"
    kill $DEV_PID 2>/dev/null || true
    exit 1
}

# Function to run E2E tests
run_e2e_tests() {
    print_status "Running E2E tests..."

    if ! check_dev_server; then
        print_warning "Development server not running. Starting it..."
        start_dev_server
    fi

    # Run the critical user journeys test with proper config
    npx playwright test tests/playwright/e2e/core/critical-user-journeys.spec.ts --config=tests/playwright/configs/playwright.config.chrome-only.ts

    print_success "E2E tests completed!"
}

# Function to run unit tests
run_unit_tests() {
    print_status "Running unit tests (business logic only)..."

    # Run only the remaining business logic tests
    npm run test:jest:unit

    print_success "Unit tests completed!"
}

# Function to run all tests
run_all_tests() {
    print_status "Running all tests..."

    run_unit_tests
    run_e2e_tests

    print_success "All tests completed!"
}

# Function to check TypeScript errors
check_typescript() {
    print_status "Checking TypeScript errors..."

    local error_count=$(npx tsc --noEmit --project tsconfig.json 2>&1 | grep -E "error TS" | grep -v "tests/archive" | wc -l)

    if [ "$error_count" -eq 0 ]; then
        print_success "No TypeScript errors found!"
    else
        print_warning "Found $error_count TypeScript errors"
        echo "Run 'npm run type-check' to see details"
    fi
}

# Function to clean up
cleanup() {
    if [ ! -z "$DEV_PID" ]; then
        print_status "Stopping development server..."
        kill $DEV_PID 2>/dev/null || true
    fi
}

# Set up cleanup trap
trap cleanup EXIT

# Main script logic
case "${1:-help}" in
    "e2e")
        run_e2e_tests
        ;;
    "unit")
        run_unit_tests
        ;;
    "all")
        run_all_tests
        ;;
    "typescript"|"ts")
        check_typescript
        ;;
    "dev")
        start_dev_server
        ;;
    "help"|*)
        echo "Usage: $0 {e2e|unit|all|typescript|dev|help}"
        echo ""
        echo "Commands:"
        echo "  e2e        Run E2E tests (requires dev server)"
        echo "  unit       Run unit tests (business logic only)"
        echo "  all        Run all tests"
        echo "  typescript Check TypeScript errors"
        echo "  dev        Start development server"
        echo "  help       Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0 e2e              # Run E2E tests"
        echo "  $0 unit             # Run unit tests"
        echo "  $0 all              # Run all tests"
        echo "  $0 typescript       # Check TypeScript errors"
        ;;
esac

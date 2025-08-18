#!/bin/bash

# Safe Run Script - Creates backup branch before running potentially destructive operations
# Usage: ./safe-run.sh <script-name> [arguments]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_BRANCH_PREFIX="backup/auto-"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")

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

# Function to check if we're in a git repository
check_git_repo() {
    if [ ! -d ".git" ]; then
        print_status "ERROR" "Not in a git repository. Please run from project root."
        exit 1
    fi
}

# Function to check if working directory is clean
check_clean_working_dir() {
    if [ -n "$(git status --porcelain)" ]; then
        print_status "WARNING" "Working directory has uncommitted changes"
        git status --short
        echo ""
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "INFO" "Operation cancelled by user"
            exit 0
        fi
    fi
}

# Function to create backup branch
create_backup_branch() {
    local current_branch=$(git branch --show-current)
    local backup_branch="${BACKUP_BRANCH_PREFIX}${TIMESTAMP}"
    
    print_status "INFO" "Creating backup branch: $backup_branch"
    
    # Create and switch to backup branch
    git checkout -b "$backup_branch"
    
    # Commit current state if there are changes
    if [ -n "$(git status --porcelain)" ]; then
        git add .
        git commit -m "backup: auto-save before running $1 - $(date)"
    fi
    
    # Switch back to original branch
    git checkout "$current_branch"
    
    print_status "SUCCESS" "Backup branch created: $backup_branch"
    echo ""
    print_status "INFO" "If something goes wrong, you can restore with:"
    echo "  git checkout $backup_branch"
    echo "  git checkout -b recovery-branch"
    echo ""
}

# Function to run the script safely
run_script_safely() {
    local script_name=$1
    shift
    local script_args="$@"
    
    print_status "INFO" "Running script: $script_name"
    print_status "INFO" "Arguments: $script_args"
    echo ""
    
    # Run the script
    if [ -f "$script_name" ]; then
        if [[ "$script_name" == *.sh ]]; then
            bash "$script_name" $script_args
        elif [[ "$script_name" == *.js ]]; then
            node "$script_name" $script_args
        else
            print_status "ERROR" "Unsupported script type: $script_name"
            exit 1
        fi
    else
        print_status "ERROR" "Script not found: $script_name"
        exit 1
    fi
}

# Function to show recovery instructions
show_recovery_instructions() {
    local backup_branch="${BACKUP_BRANCH_PREFIX}${TIMESTAMP}"
    
    echo ""
    print_status "INFO" "🔧 Recovery Instructions:"
    echo ""
    echo "If something went wrong, you can recover using:"
    echo ""
    echo "1. View backup branch:"
    echo "   git checkout $backup_branch"
    echo ""
    echo "2. Create recovery branch:"
    echo "   git checkout -b recovery-$(date +%Y%m%d-%H%M%S)"
    echo ""
    echo "3. Delete backup branch (if everything is OK):"
    echo "   git branch -D $backup_branch"
    echo ""
    echo "4. List all backup branches:"
    echo "   git branch | grep '$BACKUP_BRANCH_PREFIX'"
    echo ""
}

# Function to cleanup old backup branches
cleanup_old_backups() {
    local max_backups=5
    local backup_count=$(git branch | grep "$BACKUP_BRANCH_PREFIX" | wc -l)
    
    if [ "$backup_count" -gt "$max_backups" ]; then
        print_status "INFO" "Cleaning up old backup branches (keeping $max_backups most recent)"
        
        # Get list of backup branches sorted by creation date
        local old_backups=$(git for-each-ref --sort=-committerdate --format='%(refname:short)' refs/heads/ | grep "$BACKUP_BRANCH_PREFIX" | tail -n +$((max_backups + 1)))
        
        for branch in $old_backups; do
            print_status "INFO" "Deleting old backup branch: $branch"
            git branch -D "$branch" 2>/dev/null || true
        done
    fi
}

# Main execution
main() {
    if [ $# -eq 0 ]; then
        echo "🛡️  Safe Run Script - Creates backup branch before running scripts"
        echo "================================================================"
        echo ""
        echo "Usage: ./safe-run.sh <script-name> [arguments]"
        echo ""
        echo "Examples:"
        echo "  ./safe-run.sh cleanup-code.js --fix"
        echo "  ./safe-run.sh pre-push-validation.sh"
        echo "  ./safe-run.sh monitor-ci.sh"
        echo ""
        echo "Safety Features:"
        echo "  ✅ Creates backup branch before running"
        echo "  ✅ Checks for uncommitted changes"
        echo "  ✅ Provides recovery instructions"
        echo "  ✅ Auto-cleanup of old backup branches"
        echo ""
        exit 0
    fi
    
    local script_name=$1
    shift
    local script_args="$@"
    
    # Change to project root
    cd "$PROJECT_ROOT"
    
    print_status "INFO" "🛡️  Safe Run Script Starting..."
    echo ""
    
    # Safety checks
    check_git_repo
    check_clean_working_dir
    
    # Create backup branch
    create_backup_branch "$script_name"
    
    # Cleanup old backups
    cleanup_old_backups
    
    # Run the script
    run_script_safely "$script_name" $script_args
    
    # Show recovery instructions
    show_recovery_instructions
    
    print_status "SUCCESS" "Script completed successfully!"
}

# Run main function with all arguments
main "$@"

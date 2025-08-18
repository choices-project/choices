#!/bin/bash

# AI New Task Instruction Script
# Usage: ./ai-new-task.sh "your task description here"
# This script provides comprehensive context for new AI agents

set -e

# Colors for output
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Get the task description from arguments
TASK_DESCRIPTION="$*"

if [ -z "$TASK_DESCRIPTION" ]; then
    echo -e "${RED}❌ Error: Please provide a task description${NC}"
    echo "Usage: ./ai-new-task.sh \"your task description here\""
    echo ""
    echo "Examples:"
    echo "  ./ai-new-task.sh \"implement user feedback system\""
    echo "  ./ai-new-task.sh \"fix TypeScript errors in auth module\""
    echo "  ./ai-new-task.sh \"add new admin dashboard feature\""
    exit 1
fi

echo -e "${PURPLE}🤖 NEW AI TASK INSTRUCTIONS${NC}"
echo "====================================="
echo ""
echo -e "${GREEN}📋 TASK:${NC} $TASK_DESCRIPTION"
echo ""
echo -e "${BLUE}🎯 WORKING STYLE & EXPECTATIONS${NC}"
echo "====================================="
echo ""

echo -e "${GREEN}✅ CORE PRINCIPLES TO FOLLOW:${NC}"
echo "• Build tools first, then apply them systematically"
echo "• Fix root causes, not symptoms"
echo "• Follow best practices religiously"
echo "• Be systematic and thorough - no shortcuts"
echo "• Create reusable solutions"
echo "• Only import necessary modules"
echo "• Don't prefix variables with underscores"
echo "• Wait for user approval before committing/deploying"
echo "• Think first, ask for a plan before proceeding"
echo "• Prioritize root cause fixes over quick fixes"
echo ""

echo -e "${RED}🚫 RED FLAGS (AVOID THESE):${NC}"
echo "• Prefixing unused variables with _"
echo "• Disabling ESLint rules"
echo "• Using // eslint-disable-next-line"
echo "• Quick fixes or workarounds"
echo "• Manual one-time changes"
echo "• Bypassing pre-commit hooks"
echo "• Ignoring warnings"
echo "• Reactive approaches"
echo "• Treating symptoms instead of causes"
echo ""

echo -e "${YELLOW}��️  PROJECT CONTEXT:${NC}"
echo "• Next.js 14 application with TypeScript"
echo "• Supabase for database and authentication"
echo "• Vercel for deployment"
echo "• Postgres exclusively (SQLite removed)"
echo "• Service role only for admin database access"
echo "• Environment variables managed via .env.local"
echo "• Comprehensive testing and security evaluation"
echo "• Row Level Security (RLS) enabled"
echo ""

echo -e "${BLUE}📚 DOCUMENTATION REQUIREMENTS:${NC}"
echo "• Update relevant documentation files"
echo "• Document any new features or changes"
echo "• Update project status and roadmap"
echo "• Include usage examples and instructions"
echo "• Document any configuration changes"
echo "• Update API documentation if needed"
echo ""

echo -e "${GREEN}🔧 VERSION CONTROL REQUIREMENTS:${NC}"
echo "• Create feature branches for new work"
echo "• Use descriptive commit messages"
echo "• Run pre-push validation before committing"
echo "• Test thoroughly before pushing"
echo "• Wait for CI approval before merging"
echo "• Keep commits atomic and focused"
echo "• Document changes in commit messages"
echo ""

echo -e "${YELLOW}🧪 TESTING REQUIREMENTS:${NC}"
echo "• Test locally before pushing"
echo "• Ensure all TypeScript checks pass"
echo "• Verify ESLint rules are followed"
echo "• Test with production build settings"
echo "• Check for security vulnerabilities"
echo "• Validate environment variables"
echo "• Test critical functionality"
echo ""

echo -e "${PURPLE}💡 EFFECTIVE APPROACH PATTERN:${NC}"
echo "1. ANALYSIS: Understand the full scope and requirements"
echo "2. PLANNING: Create a systematic approach with tools"
echo "3. TOOL BUILDING: Build analysis/automation tools first"
echo "4. IMPLEMENTATION: Apply solutions systematically"
echo "5. TESTING: Thorough validation and testing"
echo "6. DOCUMENTATION: Update all relevant docs"
echo "7. VERSION CONTROL: Proper branching and commits"
echo ""

echo -e "${BLUE}�� SUCCESS METRICS:${NC}"
echo "• Pre-commit hooks pass"
echo "• No ESLint warnings"
echo "• No TypeScript errors"
echo "• Build succeeds"
echo "• Code follows best practices"
echo "• Documentation is updated"
echo "• Version control is proper"
echo "• User is satisfied with approach"
echo ""

echo -e "${GREEN}🔧 AVAILABLE TOOLS:${NC}"
echo "• ./safe-cleanup.sh --fix          # Safe code cleanup"
echo "• ./safe-validation.sh             # Safe pre-push validation"
echo "• ./push-and-monitor.sh origin <branch>  # Push and monitor CI"
echo "• ./monitor-ci.sh                  # Monitor CI status"
echo "• node cleanup-code.js [--fix]     # Code quality analysis"
echo ""

echo -e "${YELLOW}📝 LANGUAGE TO USE:${NC}"
echo "✅ EFFECTIVE PHRASES:"
echo "• 'Let me build a tool to analyze this systematically'"
echo "• 'I'll create a script to identify all instances'"
echo "• 'Let's approach this thoroughly and carefully'"
echo "• 'I'll build a reusable solution for this'"
echo "• 'Let me create a testing framework first'"
echo "• 'I want to be systematic and thorough'"
echo ""
echo "❌ PHRASES TO AVOID:"
echo "• 'Let me quickly fix this'"
echo "• 'I'll disable the check for now'"
echo "• 'Let's use a workaround'"
echo "• 'I'll bypass the validation'"
echo "• 'This is just a temporary fix'"
echo ""

echo -e "${PURPLE}🎯 TASK EXECUTION PLAN:${NC}"
echo "====================================="
echo ""
echo "1. 📋 UNDERSTAND: Analyze the task requirements thoroughly"
echo "2. 🛠️  PLAN: Create a systematic approach with tools"
echo "3. 🔍 ANALYZE: Build tools to understand the current state"
echo "4. 🏗️  IMPLEMENT: Apply solutions systematically"
echo "5. 🧪 TEST: Validate thoroughly with all checks"
echo "6. 📚 DOCUMENT: Update all relevant documentation"
echo "7. 🔄 VERSION: Use proper version control"
echo "8. ✅ VALIDATE: Ensure everything works correctly"
echo ""

echo -e "${GREEN}🚀 READY TO START WORKING ON:${NC}"
echo "\"$TASK_DESCRIPTION\""
echo ""
echo -e "${BLUE}💡 Remember: Be systematic, thorough, and follow best practices!${NC}"
echo ""


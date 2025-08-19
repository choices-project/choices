#!/bin/bash

# AI Context Builder Script
# Usage: ./ai-context-builder.sh "task description" "brainstorming notes"
# This script creates a context file after you've brainstormed with an AI agent

set -e

# Colors for output
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Get the task description and brainstorming notes
TASK_DESCRIPTION="$1"
BRAINSTORMING_NOTES="$2"

if [ -z "$TASK_DESCRIPTION" ]; then
    echo -e "${RED}❌ Error: Please provide a task description${NC}"
    echo "Usage: ./ai-context-builder.sh \"task description\" \"brainstorming notes\""
    echo ""
    echo "Examples:"
    echo "  ./ai-context-builder.sh \"implement user feedback system\" \"User wants real-time feedback collection with admin dashboard\""
    echo "  ./ai-context-builder.sh \"fix TypeScript errors\" \"Found 15 type errors in auth module, need systematic approach\""
    exit 1
fi

# Create timestamp
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
CONTEXT_FILE="ai-context-${TIMESTAMP}.txt"

echo -e "${PURPLE}🤖 AI CONTEXT BUILDER${NC}"
echo "=========================="
echo ""
echo -e "${GREEN}📋 TASK:${NC} $TASK_DESCRIPTION"
echo ""

if [ -n "$BRAINSTORMING_NOTES" ]; then
    echo -e "${YELLOW}💡 BRAINSTORMING NOTES:${NC}"
    echo "$BRAINSTORMING_NOTES"
    echo ""
fi

echo -e "${BLUE}📝 Creating context file: $CONTEXT_FILE${NC}"
echo ""

# Create the context file
cat > "$CONTEXT_FILE" << CONTEXT_EOF
🤖 AI TASK CONTEXT & IMPLEMENTATION GUIDELINES
==============================================

📋 TASK: $TASK_DESCRIPTION

💡 BRAINSTORMING SUMMARY:
$BRAINSTORMING_NOTES

🎯 WORKING STYLE & EXPECTATIONS
=====================================

✅ CORE PRINCIPLES TO FOLLOW:
• Build tools first, then apply them systematically
• Fix root causes, not symptoms
• Follow best practices religiously
• Be systematic and thorough - no shortcuts
• Create reusable solutions
• Only import necessary modules
• Don't prefix variables with underscores
• Wait for user approval before committing/deploying
• Think first, ask for a plan before proceeding
• Prioritize root cause fixes over quick fixes

🚫 RED FLAGS (AVOID THESE):
• Prefixing unused variables with _
• Disabling ESLint rules
• Using // eslint-disable-next-line
• Quick fixes or workarounds
• Manual one-time changes
• Bypassing pre-commit hooks
• Ignoring warnings
• Reactive approaches
• Treating symptoms instead of causes

🏗️ PROJECT CONTEXT:
• Next.js 14 application with TypeScript
• Supabase for database and authentication
• Vercel for deployment
• Postgres exclusively (SQLite removed)
• Service role only for admin database access
• Environment variables managed via .env.local
• Comprehensive testing and security evaluation
• Row Level Security (RLS) enabled

📚 DOCUMENTATION REQUIREMENTS:
• Update relevant documentation files
• Document any new features or changes
• Update project status and roadmap
• Include usage examples and instructions
• Document any configuration changes
• Update API documentation if needed

🔧 VERSION CONTROL REQUIREMENTS:
• Create feature branches for new work
• Use descriptive commit messages
• Run pre-push validation before committing
• Test thoroughly before pushing
• Wait for CI approval before merging
• Keep commits atomic and focused
• Document changes in commit messages

🧪 TESTING REQUIREMENTS:
• Test locally before pushing
• Ensure all TypeScript checks pass
• Verify ESLint rules are followed
• Test with production build settings
• Check for security vulnerabilities
• Validate environment variables
• Test critical functionality

💡 EFFECTIVE APPROACH PATTERN:
1. ANALYSIS: Understand the full scope and requirements
2. PLANNING: Create a systematic approach with tools
3. TOOL BUILDING: Build analysis/automation tools first
4. IMPLEMENTATION: Apply solutions systematically
5. TESTING: Thorough validation and testing
6. DOCUMENTATION: Update all relevant docs
7. VERSION CONTROL: Proper branching and commits

🎯 SUCCESS METRICS:
• Pre-commit hooks pass
• No ESLint warnings
• No TypeScript errors
• Build succeeds
• Code follows best practices
• Documentation is updated
• Version control is proper
• User is satisfied with approach

🔧 AVAILABLE TOOLS:
• ./safe-cleanup.sh --fix          # Safe code cleanup
• ./safe-validation.sh             # Safe pre-push validation
• ./push-and-monitor.sh origin <branch>  # Push and monitor CI
• ./monitor-ci.sh                  # Monitor CI status
• node cleanup-code.js [--fix]     # Code quality analysis

📝 LANGUAGE TO USE:
✅ EFFECTIVE PHRASES:
• 'Let me build a tool to analyze this systematically'
• 'I'll create a script to identify all instances'
• 'Let's approach this thoroughly and carefully'
• 'I'll build a reusable solution for this'
• 'Let me create a testing framework first'
• 'I want to be systematic and thorough'

❌ PHRASES TO AVOID:
• 'Let me quickly fix this'
• 'I'll disable the check for now'
• 'Let's use a workaround'
• 'I'll bypass the validation'
• 'This is just a temporary fix'

🎯 TASK EXECUTION PLAN:
=====================================

1. 📋 UNDERSTAND: Analyze the task requirements thoroughly
2. 🛠️  PLAN: Create a systematic approach with tools
3. 🔍 ANALYZE: Build tools to understand the current state
4. 🏗️  IMPLEMENT: Apply solutions systematically
5. 🧪 TEST: Validate thoroughly with all checks
6. 📚 DOCUMENT: Update all relevant documentation
7. 🔄 VERSION: Use proper version control
8. ✅ VALIDATE: Ensure everything works correctly

🚀 READY TO START WORKING ON:
"$TASK_DESCRIPTION"

💡 Remember: Be systematic, thorough, and follow best practices!

---
Context file created: $CONTEXT_FILE
Copy this content and paste it to your AI agent to start implementation.
CONTEXT_EOF

echo -e "${GREEN}✅ Context file created: $CONTEXT_FILE${NC}"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "1. Review the context file: cat $CONTEXT_FILE"
echo "2. Copy the content and paste it to your AI agent"
echo "3. Start implementation with proper guidelines"
echo ""
echo -e "${YELLOW}💡 Tip: You can also copy to clipboard with:${NC}"
echo "cat $CONTEXT_FILE | pbcopy"
echo ""

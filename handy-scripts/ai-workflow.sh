#!/bin/bash

# AI Workflow Helper Script
# Usage: ./ai-workflow.sh
# Guides you through the AI task workflow

set -e

# Colors for output
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${PURPLE}🤖 AI TASK WORKFLOW HELPER${NC}"
echo "================================"
echo ""

echo -e "${GREEN}📋 This workflow helps you:${NC}"
echo "1. Brainstorm with AI using /ask mode"
echo "2. Create structured context for implementation"
echo "3. Start systematic development with guidelines"
echo ""

echo -e "${BLUE}🎯 PHASE 1: BRAINSTORMING${NC}"
echo "====================================="
echo "1. Start a new chat with an AI agent"
echo "2. Use /ask mode to discuss your ideas"
echo "3. Explore requirements, approach, and design"
echo "4. Get the AI to help you think through the problem"
echo "5. Establish what you want to build"
echo ""

read -p "Press Enter when you're ready for Phase 2..."

echo -e "${BLUE}🎯 PHASE 2: CREATE CONTEXT${NC}"
echo "====================================="
echo "Enter your task description and brainstorming summary:"
echo ""

read -p "Task description: " TASK_DESC
read -p "Brainstorming notes: " BRAINSTORM_NOTES

if [ -n "$TASK_DESC" ]; then
    echo ""
    echo -e "${GREEN}📝 Creating context file...${NC}"
    ./ai-context-builder.sh "$TASK_DESC" "$BRAINSTORM_NOTES"
    
    echo -e "${BLUE}🎯 PHASE 3: COPY TO CLIPBOARD${NC}"
    echo "====================================="
    echo "Copying context to clipboard..."
    ./ai-copy-context.sh
    
    echo ""
    echo -e "${GREEN}✅ Ready for Phase 4!${NC}"
    echo ""
    read -p "Press Enter when ready to continue..."
    
    echo -e "${BLUE}🎯 PHASE 4: START IMPLEMENTATION${NC}"
    echo "====================================="
    echo "1. Paste the context to your AI agent"
    echo "2. Start implementation with proper guidelines"
    echo "3. Use the available tools for safe development"
    echo ""
    echo -e "${YELLOW}💡 Available tools:${NC}"
    echo "• ./safe-cleanup.sh --fix          # Safe code cleanup"
    echo "• ./safe-validation.sh             # Safe pre-push validation"
    echo "• ./push-and-monitor.sh origin <branch>  # Push and monitor CI"
    echo "• ./monitor-ci.sh                  # Monitor CI status"
    echo ""
    echo -e "${GREEN}🎉 Workflow complete! Happy coding! 🚀${NC}"
else
    echo -e "${RED}❌ No task description provided. Exiting.${NC}"
    exit 1
fi

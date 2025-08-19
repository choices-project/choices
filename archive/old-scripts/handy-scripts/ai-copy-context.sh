#!/bin/bash

# AI Copy Context Script
# Usage: ./ai-copy-context.sh [context-file]
# Copies the latest or specified context file to clipboard

set -e

# Colors for output
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to find the latest context file
find_latest_context() {
    ls -t ai-context-*.txt 2>/dev/null | head -1
}

# Get the context file
if [ -n "$1" ]; then
    CONTEXT_FILE="$1"
else
    CONTEXT_FILE=$(find_latest_context)
fi

if [ -z "$CONTEXT_FILE" ] || [ ! -f "$CONTEXT_FILE" ]; then
    echo -e "${RED}❌ Error: No context file found${NC}"
    echo ""
    echo "Available context files:"
    ls -la ai-context-*.txt 2>/dev/null || echo "No context files found"
    echo ""
    echo "Usage:"
    echo "  ./ai-copy-context.sh                    # Copy latest context file"
    echo "  ./ai-copy-context.sh ai-context-20250818-143000.txt  # Copy specific file"
    exit 1
fi

echo -e "${BLUE}📋 Copying context to clipboard...${NC}"
echo "File: $CONTEXT_FILE"
echo ""

# Copy to clipboard
if command -v pbcopy >/dev/null 2>&1; then
    cat "$CONTEXT_FILE" | pbcopy
    echo -e "${GREEN}✅ Context copied to clipboard!${NC}"
    echo ""
    echo -e "${YELLOW}💡 You can now paste it to your AI agent${NC}"
elif command -v xclip >/dev/null 2>&1; then
    cat "$CONTEXT_FILE" | xclip -selection clipboard
    echo -e "${GREEN}✅ Context copied to clipboard!${NC}"
    echo ""
    echo -e "${YELLOW}💡 You can now paste it to your AI agent${NC}"
else
    echo -e "${YELLOW}⚠️  Clipboard tool not found. Please copy manually:${NC}"
    echo "cat $CONTEXT_FILE"
fi

echo ""
echo -e "${BLUE}�� Context file content:${NC}"
echo "====================================="
cat "$CONTEXT_FILE"

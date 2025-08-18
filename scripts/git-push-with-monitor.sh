#!/bin/bash

# Git push wrapper with automatic CI monitoring

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Pushing with automatic CI monitoring...${NC}"
echo ""

# Run the actual git push
if git push "$@"; then
    echo ""
    echo -e "${GREEN}✅ Push successful!${NC}"
    echo ""
    echo -e "${BLUE}🔍 Starting CI monitoring...${NC}"
    echo "Press Ctrl+C to stop monitoring"
    echo ""
    
    # Start monitoring
    ./scripts/monitor-ci.sh
else
    echo ""
    echo -e "${RED}❌ Push failed!${NC}"
    exit 1
fi

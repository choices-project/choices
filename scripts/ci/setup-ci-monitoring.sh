#!/bin/bash

# Setup CI Monitoring Script
# Installs git hooks to automatically monitor CI after pushes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Setting up automatic CI monitoring...${NC}"
echo ""

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ Not in a git repository. Please run this from the project root.${NC}"
    exit 1
fi

# Create hooks directory if it doesn't exist
if [ ! -d ".git/hooks" ]; then
    mkdir -p .git/hooks
fi

# Create post-push hook
echo -e "${BLUE}📝 Creating post-push hook...${NC}"

cat > .git/hooks/post-push << 'EOF'
#!/bin/bash

# Post-push hook to automatically monitor CI
# This hook runs after a successful push

# Only run if we're pushing to a remote
if [ "$1" = "origin" ] && [ -n "$2" ]; then
    echo ""
    echo "🚀 Push completed! Starting CI monitoring..."
    echo ""
    
    # Start monitoring in background
    ./scripts/monitor-ci.sh &
    MONITOR_PID=$!
    
    echo "📊 CI monitoring started (PID: $MONITOR_PID)"
    echo "💡 To stop monitoring: kill $MONITOR_PID"
    echo "🔗 View manually: https://github.com/choices-project/choices/actions"
fi
EOF

chmod +x .git/hooks/post-push

# Create a wrapper script for git push that includes monitoring
echo -e "${BLUE}📝 Creating git push wrapper...${NC}"

cat > scripts/git-push-with-monitor.sh << 'EOF'
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
EOF

chmod +x scripts/git-push-with-monitor.sh

# Create an alias script
echo -e "${BLUE}📝 Creating convenient alias...${NC}"

cat > scripts/push-and-monitor.sh << 'EOF'
#!/bin/bash

# Convenient alias for push with monitoring
./scripts/git-push-with-monitor.sh "$@"
EOF

chmod +x scripts/push-and-monitor.sh

echo ""
echo -e "${GREEN}✅ CI monitoring setup complete!${NC}"
echo ""
echo -e "${BLUE}📋 Available commands:${NC}"
echo "• ${GREEN}./scripts/push-and-monitor.sh${NC} - Push and automatically monitor CI"
echo "• ${GREEN}./scripts/monitor-ci.sh${NC} - Monitor CI manually"
echo "• ${GREEN}git push && ./scripts/monitor-ci.sh${NC} - Manual push with monitoring"
echo ""
echo -e "${BLUE}💡 Usage examples:${NC}"
echo "  ./scripts/push-and-monitor.sh origin feature/enhanced-feedback-system"
echo "  ./scripts/push-and-monitor.sh origin main"
echo ""
echo -e "${BLUE}🔧 The monitoring will:${NC}"
echo "• Check CI status every 10 seconds"
echo "• Show real-time progress updates"
echo "• Display detailed error analysis if CI fails"
echo "• Provide helpful suggestions for fixes"
echo "• Auto-timeout after 5 minutes"
echo ""
echo -e "${GREEN}🎉 You're all set! Happy coding!${NC}"

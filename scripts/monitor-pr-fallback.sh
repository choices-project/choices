#!/bin/bash
# monitor-pr-fallback.sh - Monitor pull request status without GitHub CLI

set -e

PR_NUMBER=$1
REPO="choices-project/choices"
MAX_WAIT_TIME=1800  # 30 minutes
CHECK_INTERVAL=30   # 30 seconds

if [ -z "$PR_NUMBER" ]; then
    echo "❌ Usage: $0 <PR_NUMBER>"
    echo "Example: $0 123"
    exit 1
fi

# Check if GitHub token is available
if [ -z "$GITHUB_TOKEN" ]; then
    echo "⚠️  GITHUB_TOKEN not set. Using unauthenticated API (limited rate)"
    echo "💡 Set GITHUB_TOKEN for better monitoring:"
    echo "   export GITHUB_TOKEN=your_github_token"
    echo ""
fi

echo "🔍 Monitoring PR #$PR_NUMBER..."
echo "⏱️  Maximum wait time: $((MAX_WAIT_TIME / 60)) minutes"
echo "🔄 Check interval: ${CHECK_INTERVAL} seconds"
echo ""

start_time=$(date +%s)
attempts=0

while true; do
    attempts=$((attempts + 1))
    current_time=$(date +%s)
    elapsed=$((current_time - start_time))
    
    if [ $elapsed -gt $MAX_WAIT_TIME ]; then
        echo "⏰ Timeout reached! PR checks took longer than $((MAX_WAIT_TIME / 60)) minutes"
        echo "🔗 PR URL: https://github.com/$REPO/pull/$PR_NUMBER"
        exit 1
    fi
    
    echo "[$(date '+%H:%M:%S')] Attempt $attempts - Checking PR status..."
    
    # Get PR status using GitHub API
    if [ -n "$GITHUB_TOKEN" ]; then
        # Authenticated request
        RESPONSE=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
            "https://api.github.com/repos/$REPO/pulls/$PR_NUMBER/checks")
    else
        # Unauthenticated request (limited rate)
        RESPONSE=$(curl -s "https://api.github.com/repos/$REPO/pulls/$PR_NUMBER/checks")
    fi
    
    # Check if we got a valid response
    if echo "$RESPONSE" | grep -q "Not Found"; then
        echo "   ❌ PR not found or access denied"
        echo "   💡 Make sure PR #$PR_NUMBER exists and is accessible"
        exit 1
    fi
    
    # Parse the response to get status
    STATUS=$(echo "$RESPONSE" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "unknown")
    CONCLUSION=$(echo "$RESPONSE" | grep -o '"conclusion":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "unknown")
    
    echo "   Status: $STATUS, Conclusion: $CONCLUSION"
    
    if [ "$STATUS" = "completed" ]; then
        if [ "$CONCLUSION" = "success" ]; then
            echo ""
            echo "✅ All checks passed!"
            echo "🎉 PR #$PR_NUMBER is ready for review"
            echo "🔗 PR URL: https://github.com/$REPO/pull/$PR_NUMBER"
            echo ""
            echo "📊 Summary:"
            echo "   - Total attempts: $attempts"
            echo "   - Total time: $((elapsed / 60)) minutes $((elapsed % 60)) seconds"
            break
        else
            echo ""
            echo "❌ Checks failed! Please review the following:"
            echo ""
            echo "🔗 PR URL: https://github.com/$REPO/pull/$PR_NUMBER"
            echo ""
            echo "💡 To fix issues:"
            echo "   1. Visit the PR URL above"
            echo "   2. Check the failed checks"
            echo "   3. Fix the issues locally"
            echo "   4. Push the fixes"
            echo "   5. Re-run this monitoring script"
            exit 1
        fi
    elif [ "$STATUS" = "queued" ]; then
        echo "   ⏳ Checks are queued, waiting..."
    elif [ "$STATUS" = "in_progress" ]; then
        echo "   🔄 Checks are running..."
    elif [ "$STATUS" = "unknown" ]; then
        echo "   ❓ Unable to get PR status, retrying..."
    else
        echo "   ⏳ Status: $STATUS, waiting..."
    fi
    
    echo "   ⏱️  Elapsed: $((elapsed / 60))m $((elapsed % 60))s"
    echo ""
    
    sleep $CHECK_INTERVAL
done

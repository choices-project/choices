#!/bin/bash
# create-pr-with-monitoring.sh - Create PR and monitor until all checks pass

set -e

BRANCH_NAME=$1
TITLE=$2
BODY=$3

if [ -z "$BRANCH_NAME" ] || [ -z "$TITLE" ]; then
    echo "❌ Usage: $0 <BRANCH_NAME> <TITLE> [BODY]"
    echo "Example: $0 feature/user-auth 'feat: add user authentication' 'Implements user authentication with WebAuthn'"
    exit 1
fi

# Default body if not provided
if [ -z "$BODY" ]; then
    BODY="Implements changes for $TITLE"
fi

echo "🚀 Creating PR for branch: $BRANCH_NAME"
echo "📝 Title: $TITLE"
echo "📄 Body: $BODY"
echo ""

# Check if we're on the right branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "$BRANCH_NAME" ]; then
    echo "⚠️  Warning: You're on branch '$CURRENT_BRANCH', not '$BRANCH_NAME'"
    echo "   Make sure you want to create a PR for the current branch"
    read -p "   Continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Aborted"
        exit 1
    fi
fi

# Check if branch exists on remote
if ! git ls-remote --heads origin "$BRANCH_NAME" | grep -q "$BRANCH_NAME"; then
    echo "📤 Pushing branch to remote..."
    git push origin "$BRANCH_NAME"
    if [ $? -ne 0 ]; then
        echo "❌ Failed to push branch to remote"
        exit 1
    fi
fi

echo "📋 Creating pull request..."

# Create PR and get the number
PR_NUMBER=$(gh pr create \
    --title "$TITLE" \
    --body "$BODY" \
    --json number \
    --jq '.number' 2>/dev/null)

if [ $? -ne 0 ] || [ -z "$PR_NUMBER" ]; then
    echo "❌ Failed to create pull request"
    echo "💡 Make sure you're authenticated with GitHub CLI:"
    echo "   gh auth login"
    exit 1
fi

echo "✅ Created PR #$PR_NUMBER"
echo "🔗 PR URL: https://github.com/choices-project/choices/pull/$PR_NUMBER"
echo ""

# Start monitoring
echo "🔍 Starting PR monitoring..."
echo "⏱️  This will wait until all checks pass or timeout after 30 minutes"
echo ""

# Run the monitoring script
./scripts/monitor-pr.sh "$PR_NUMBER"

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Success! PR #$PR_NUMBER is ready for review"
    echo "🔗 PR URL: https://github.com/choices-project/choices/pull/$PR_NUMBER"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Review the PR"
    echo "   2. Request reviews if needed"
    echo "   3. Merge when approved"
else
    echo ""
    echo "❌ PR checks failed"
    echo "🔗 PR URL: https://github.com/choices-project/choices/pull/$PR_NUMBER"
    echo ""
    echo "💡 To fix:"
    echo "   1. Check the failed checks above"
    echo "   2. Fix issues locally"
    echo "   3. Push fixes"
    echo "   4. Re-run monitoring: ./scripts/monitor-pr.sh $PR_NUMBER"
    exit 1
fi

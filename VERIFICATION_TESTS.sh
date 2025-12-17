#!/bin/bash

# Verification Tests for Feed & Feedback Fixes
# Run this script after deployment completes

echo "🧪 Running Verification Tests..."
echo "================================="
echo ""

# Test 1: Diagnostics Endpoint
echo "1️⃣  Testing Diagnostics Endpoint..."
DIAG_RESULT=$(curl -s https://www.choices-app.com/api/diagnostics)
OVERALL_STATUS=$(echo "$DIAG_RESULT" | jq -r '.data.overallStatus')
FEEDBACK_STATUS=$(echo "$DIAG_RESULT" | jq -r '.data.checks.feedbackTable.status')
ADMIN_STATUS=$(echo "$DIAG_RESULT" | jq -r '.data.checks.supabaseAdminClient.status')

echo "   Overall Status: $OVERALL_STATUS"
echo "   Feedback Table: $FEEDBACK_STATUS"
echo "   Admin Client:   $ADMIN_STATUS"

if [ "$FEEDBACK_STATUS" = "ok" ]; then
    echo "   ✅ Diagnostics: PASS"
else
    echo "   ❌ Diagnostics: FAIL - Feedback table status is $FEEDBACK_STATUS"
    echo "   Error details:"
    echo "$DIAG_RESULT" | jq '.data.checks.feedbackTable'
fi
echo ""

# Test 2: Feed API Structure
echo "2️⃣  Testing Feed API Structure..."
FEED_RESULT=$(curl -s 'https://www.choices-app.com/api/feeds?limit=1')
FEED_SUCCESS=$(echo "$FEED_RESULT" | jq -r '.success')
HAS_METADATA=$(echo "$FEED_RESULT" | jq -r '.data.feeds[0].metadata != null')
HAS_BOOKMARKS=$(echo "$FEED_RESULT" | jq -r '.data.feeds[0].engagement.bookmarks != null')

echo "   API Success:    $FEED_SUCCESS"
echo "   Has Metadata:   $HAS_METADATA"
echo "   Has Bookmarks:  $HAS_BOOKMARKS"

if [ "$FEED_SUCCESS" = "true" ] && [ "$HAS_METADATA" = "true" ] && [ "$HAS_BOOKMARKS" = "true" ]; then
    echo "   ✅ Feed API: PASS"
else
    echo "   ❌ Feed API: FAIL"
    echo "   Response:"
    echo "$FEED_RESULT" | jq '.data.feeds[0] | {title, hasMetadata: (.metadata != null), hasBookmarks: (.engagement.bookmarks != null)}'
fi
echo ""

# Test 3: Feedback Submission
echo "3️⃣  Testing Feedback Submission..."
FEEDBACK_RESULT=$(curl -s -X POST https://www.choices-app.com/api/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "type": "general",
    "title": "Automated verification test",
    "description": "Testing feedback submission after deployment",
    "sentiment": "positive",
    "userJourney": {
      "currentPage": "/verification",
      "sessionId": "verify-'$(date +%s)'"
    }
  }')

FEEDBACK_SUCCESS=$(echo "$FEEDBACK_RESULT" | jq -r '.success')
echo "   Submission:     $FEEDBACK_SUCCESS"

if [ "$FEEDBACK_SUCCESS" = "true" ]; then
    echo "   ✅ Feedback Submission: PASS"
else
    echo "   ❌ Feedback Submission: FAIL"
    echo "   Response:"
    echo "$FEEDBACK_RESULT" | jq
fi
echo ""

# Summary
echo "================================="
echo "📊 Test Summary"
echo "================================="

PASS_COUNT=0
FAIL_COUNT=0

[ "$FEEDBACK_STATUS" = "ok" ] && ((PASS_COUNT++)) || ((FAIL_COUNT++))
[ "$FEED_SUCCESS" = "true" ] && [ "$HAS_METADATA" = "true" ] && [ "$HAS_BOOKMARKS" = "true" ] && ((PASS_COUNT++)) || ((FAIL_COUNT++))
[ "$FEEDBACK_SUCCESS" = "true" ] && ((PASS_COUNT++)) || ((FAIL_COUNT++))

echo "✅ Passed: $PASS_COUNT/3"
echo "❌ Failed: $FAIL_COUNT/3"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo "🎉 ALL TESTS PASSED! Deployment successful!"
    exit 0
else
    echo "⚠️  Some tests failed. Check details above."
    exit 1
fi


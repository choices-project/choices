#!/bin/bash

# Fix Feedback Table Schema
set -e

echo "🔧 Fixing Feedback Table Schema..."

# Load environment variables
if [ -f ".env.local" ]; then
    source .env.local
    echo "✅ Loaded environment variables"
else
    echo "❌ .env.local not found"
    exit 1
fi

# Check if required variables are set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Missing Supabase environment variables"
    echo "   Need: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
    exit 1
fi

echo "📋 Supabase URL: $NEXT_PUBLIC_SUPABASE_URL"
echo "🔑 Using Service Role Key (admin access)"

# Read the SQL content
SQL_CONTENT=$(cat fix_feedback_table.sql)

echo "🔧 Executing SQL to fix feedback table..."

# Execute the SQL using the service role key
RESPONSE=$(curl -s -X POST \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d "{\"query\": \"$SQL_CONTENT\"}" \
  "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/rpc/exec_sql")

if [[ $RESPONSE == *"error"* ]] || [[ $RESPONSE == *"not found"* ]]; then
    echo "❌ Error executing SQL:"
    echo "$RESPONSE"
    echo ""
    echo "🔧 Manual fix required:"
    echo ""
    echo "1. Go to: https://supabase.com/dashboard/project/muqwrehywjrbaeerjgfb"
    echo "2. Click 'SQL Editor' in the left sidebar"
    echo "3. Copy and paste the contents of fix_feedback_table.sql"
    echo "4. Click 'Run' button"
    echo ""
    exit 1
fi

echo "✅ Feedback table schema fixed successfully!"
echo ""
echo "🧪 Test the feedback system:"
echo "1. Visit: https://choices-platform.vercel.app"
echo "2. Look for the floating feedback widget (bottom right)"
echo "3. Submit test feedback"
echo "4. Check the API: curl https://choices-platform.vercel.app/api/feedback"
echo ""
echo "🤖 AI Analysis Features:"
echo "- Feedback is automatically tagged for categorization"
echo "- User journey data is structured for context analysis"
echo "- Sentiment analysis data is aggregated"
echo "- AI-ready views are created for processing"

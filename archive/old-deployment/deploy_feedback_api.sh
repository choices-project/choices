#!/bin/bash

# Deploy Feedback Table using Supabase REST API
set -e

echo "🚀 Deploying Feedback Table via Supabase API..."

# Load environment variables
if [ -f "web/.env.local" ]; then
    source web/.env.local
    echo "✅ Loaded environment variables"
else
    echo "❌ web/.env.local not found"
    exit 1
fi

# Check if required variables are set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo "❌ Missing Supabase environment variables"
    exit 1
fi

echo "📋 Supabase URL: $NEXT_PUBLIC_SUPABASE_URL"

# Try to create the table using the REST API
echo "🔧 Attempting to create feedback table via API..."

# First, let's test if we can connect to the database
RESPONSE=$(curl -s -X GET \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/")

if [[ $RESPONSE == *"error"* ]]; then
    echo "❌ Cannot access Supabase API directly"
    echo ""
    echo "🔧 Manual deployment required:"
    echo ""
    echo "1. Go to: https://supabase.com/dashboard/project/muqwrehywjrbaeerjgfb"
    echo "2. Click 'SQL Editor' in the left sidebar"
    echo "3. Copy and paste this SQL:"
    echo ""
    cat database/create_feedback_table.sql
    echo ""
    echo "4. Click 'Run' button"
    echo ""
    echo "✅ After running the SQL, your feedback widget will store data in the database!"
    exit 1
fi

echo "✅ Successfully connected to Supabase API"

# Try to create the table using a simpler approach
echo "🔧 Creating feedback table..."

# Create a minimal table first
SQL_COMMAND="CREATE TABLE IF NOT EXISTS feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    sentiment TEXT NOT NULL,
    user_journey JSONB DEFAULT '{}',
    status TEXT DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);"

# Try to execute via REST API (this might not work due to RLS)
echo "⚠️  Note: Table creation via REST API may be restricted"
echo "   You may need to use the SQL Editor manually"
echo ""
echo "🔧 Alternative: Use the Supabase Dashboard"
echo "1. Go to: https://supabase.com/dashboard/project/muqwrehywjrbaeerjgfb"
echo "2. Click 'SQL Editor'"
echo "3. Copy and paste the SQL from: database/create_feedback_table.sql"
echo "4. Click 'Run'"
echo ""
echo "🧪 Test after deployment:"
echo "- Visit: http://localhost:3000"
echo "- Look for the floating feedback widget"
echo "- Submit test feedback"
echo "- Check your Supabase dashboard"

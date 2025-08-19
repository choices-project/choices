#!/bin/bash

# Deploy Feedback Schema to Supabase
# This script sets up the feedback table with AI-optimized structure

set -e

echo "🚀 Deploying Feedback Schema to Supabase..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing..."
    npm install -g supabase
fi

# Check if we're in a Supabase project
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Not in a Supabase project. Please run 'supabase init' first."
    exit 1
fi

# Deploy the feedback schema
echo "📋 Deploying feedback table schema..."
supabase db push --include-all

# Verify the deployment
echo "✅ Verifying feedback table creation..."
supabase db diff --schema public

echo "🎉 Feedback schema deployed successfully!"
echo ""
echo "📊 Next steps:"
echo "1. Test the feedback widget at http://localhost:3001"
echo "2. Check the feedback dashboard at http://localhost:3001/feedback-dashboard"
echo "3. Monitor feedback submissions in your Supabase dashboard"
echo ""
echo "🤖 AI Analysis Features:"
echo "- Feedback is automatically tagged for categorization"
echo "- User journey data is structured for context analysis"
echo "- Sentiment analysis data is aggregated"
echo "- AI-ready views are created for processing"

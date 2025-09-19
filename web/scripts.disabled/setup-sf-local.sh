#!/bin/bash
# Setup script for SF Local Trial
# Run this from the web/ directory

echo "🌉 Setting up San Francisco Local Trial..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the web/ directory"
    exit 1
fi

# Check for required environment variables
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "❌ NEXT_PUBLIC_SUPABASE_URL is not set"
    echo "   Please set it with: export NEXT_PUBLIC_SUPABASE_URL=your_supabase_url"
    exit 1
fi

if [ -z "$SUPABASE_SECRET_KEY" ]; then
    echo "❌ SUPABASE_SECRET_KEY is not set"
    echo "   Please set it with: export SUPABASE_SECRET_KEY=your_supabase_service_role"
    exit 1
fi

if [ -z "$GOOGLE_CIVIC_API_KEY" ] && [ -z "$GOOGLE_CIVIC_INFO_API_KEY" ]; then
    echo "❌ Google Civic API key is not set"
    echo "   Please set it with: export GOOGLE_CIVIC_API_KEY=your_google_civic_key"
    echo "   Or: export GOOGLE_CIVIC_INFO_API_KEY=your_google_civic_key"
    exit 1
fi

echo "✅ Environment variables are set"

# Run the seeding script
echo "🚀 Running SF local seeding script..."
npx tsx scripts/civics-seed-sf-local.ts

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 SF Local Trial is now live!"
    echo ""
    echo "📡 Test the API:"
    echo "   curl \"http://localhost:3000/api/civics/local/sf\""
    echo ""
    echo "🌐 Or visit in your browser:"
    echo "   http://localhost:3000/api/civics/local/sf"
    echo ""
    echo "✨ You can now show your friends the SF local government data!"
else
    echo "❌ Seeding failed. Check the error messages above."
    exit 1
fi



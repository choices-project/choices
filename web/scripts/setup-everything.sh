#!/bin/bash
# Complete Civics Setup Script
# Seeds federal + state (top 10) + optionally SF local with one command

echo "🚀 Setting up Complete Civics System..."

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

if [ -z "$OPEN_STATES_API_KEY" ]; then
    echo "❌ OPEN_STATES_API_KEY is not set"
    echo "   Please set it with: export OPEN_STATES_API_KEY=your_open_states_key"
    exit 1
fi

# Check for SF local requirements if enabled
if [ "$INCLUDE_SF_LOCAL" = "1" ]; then
    if [ -z "$GOOGLE_CIVIC_API_KEY" ] && [ -z "$GOOGLE_CIVIC_INFO_API_KEY" ]; then
        echo "❌ Google Civic API key is not set (required for SF local)"
        echo "   Please set it with: export GOOGLE_CIVIC_API_KEY=your_google_civic_key"
        echo "   Or: export GOOGLE_CIVIC_INFO_API_KEY=your_google_civic_key"
        exit 1
    fi
fi

echo "✅ Environment variables are set"

# Show what we're about to do
echo ""
echo "📊 What we're seeding:"
echo "   • Top 10 states: CA, TX, FL, NY, PA, IL, OH, GA, NC, MI"
echo "   • Federal: U.S. Senate + House representatives"
echo "   • State: State Senate + Assembly representatives"
if [ "$INCLUDE_SF_LOCAL" = "1" ]; then
    echo "   • SF Local: Mayor, Board of Supervisors, citywide offices"
else
    echo "   • SF Local: DISABLED (set INCLUDE_SF_LOCAL=1 to enable)"
fi
echo ""

# Ask for confirmation
read -p "🤔 Ready to seed? This will take a few minutes. (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cancelled by user"
    exit 1
fi

# Run the unified seeding script
echo "🚀 Running comprehensive civics seeding..."
npx tsx scripts/civics-seed-everything.ts

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Complete Civics System is now live!"
    echo ""
    echo "📡 Test your APIs:"
    echo "   # Federal representatives for California"
    echo "   curl \"http://localhost:3000/api/civics/by-state?state=CA&level=federal\""
    echo ""
    echo "   # State representatives for California"
    echo "   curl \"http://localhost:3000/api/civics/by-state?state=CA&level=state\""
    echo ""
    if [ "$INCLUDE_SF_LOCAL" = "1" ]; then
        echo "   # SF local government"
        echo "   curl \"http://localhost:3000/api/civics/local/sf\""
        echo ""
    fi
    echo "🌐 Or visit in your browser:"
    echo "   http://localhost:3000/api/civics/by-state?state=CA&level=federal"
    echo ""
    echo "✨ You now have comprehensive government data for the top 10 states!"
    if [ "$INCLUDE_SF_LOCAL" = "1" ]; then
        echo "🌉 Plus San Francisco local government data!"
    fi
else
    echo "❌ Seeding failed. Check the error messages above."
    exit 1
fi



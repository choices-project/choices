#!/bin/bash

# =====================================================
# SUPABASE RLS POLICIES DEPLOYMENT SCRIPT (CLI VERSION)
# =====================================================

set -e

echo "🔐 Deploying Row Level Security (RLS) policies to Supabase..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Error: Supabase CLI is not installed"
    echo "Please install it with: npm install -g supabase"
    exit 1
fi

# Check if we're in a Supabase project
if [ ! -f "supabase/config.toml" ]; then
    echo "📁 Initializing Supabase project..."
    supabase init
fi

# Create migrations directory if it doesn't exist
mkdir -p supabase/migrations

# Copy RLS policies to migrations
echo "📝 Creating migration file..."
cp database/rls-policies.sql supabase/migrations/$(date +%Y%m%d%H%M%S)_enable_rls_policies.sql

# Deploy to Supabase
echo "🚀 Deploying to Supabase..."
supabase db push

echo "✅ RLS policies deployed successfully!"
echo ""
echo "📋 To verify the deployment:"
echo "   supabase db diff"
echo ""
echo "🔐 To check RLS status in Supabase dashboard:"
echo "   1. Go to your Supabase project dashboard"
echo "   2. Navigate to Authentication > Policies"
echo "   3. Verify all tables have RLS enabled"

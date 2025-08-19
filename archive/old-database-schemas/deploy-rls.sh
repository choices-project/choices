#!/bin/bash

# =====================================================
# SUPABASE RLS POLICIES DEPLOYMENT SCRIPT
# =====================================================

set -e

echo "🔐 Deploying Row Level Security (RLS) policies to Supabase..."

# Check if required environment variables are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set"
    echo "Please set these environment variables:"
    echo "export SUPABASE_URL='your-supabase-project-url'"
    echo "export SUPABASE_SERVICE_ROLE_KEY='your-service-role-key'"
    exit 1
fi

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ Error: psql is not installed"
    echo "Please install PostgreSQL client tools"
    exit 1
fi

# Create connection string
CONNECTION_STRING="postgresql://postgres:${SUPABASE_SERVICE_ROLE_KEY}@db.${SUPABASE_URL#https://}:5432/postgres"

echo "📡 Connecting to Supabase database..."

# Test connection
if ! psql "$CONNECTION_STRING" -c "SELECT version();" > /dev/null 2>&1; then
    echo "❌ Error: Could not connect to Supabase database"
    echo "Please check your SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
    exit 1
fi

echo "✅ Connected to Supabase database"

# Apply RLS policies
echo "🔒 Applying RLS policies..."

# Read and execute the RLS policies SQL file
if [ -f "database/rls-policies.sql" ]; then
    psql "$CONNECTION_STRING" -f database/rls-policies.sql
    echo "✅ RLS policies applied successfully"
else
    echo "❌ Error: database/rls-policies.sql not found"
    exit 1
fi

# Verify RLS is enabled on all tables
echo "🔍 Verifying RLS status..."

psql "$CONNECTION_STRING" -c "
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('ia_users', 'ia_tokens', 'po_polls', 'po_votes')
ORDER BY tablename;
"

echo "✅ RLS deployment completed successfully!"
echo ""
echo "📋 Summary of applied policies:"
echo "   • ia_users: User profile access control"
echo "   • ia_tokens: Token management security"
echo "   • po_polls: Poll creation and access control"
echo "   • po_votes: Immutable voting with access control"
echo ""
echo "🔐 Security features enabled:"
echo "   • Row-level access control"
echo "   • User verification tier enforcement"
echo "   • Immutable voting records"
echo "   • Admin privilege management"

#!/bin/bash

# Script to link Supabase CLI and generate TypeScript types
# This addresses the TODO comment in web/utils/supabase/server.ts

set -e

echo "🔗 Linking Supabase CLI to project..."
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
  echo "❌ Supabase CLI is not installed."
  echo "   Install it with: npm install -g supabase"
  exit 1
fi

echo "✅ Supabase CLI found: $(supabase --version)"
echo ""

# Check for environment variables
if [ -f ".env.local" ]; then
  source .env.local
fi

SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL}"
SUPABASE_PROJECT_ID=""

# Extract project ID from URL if available
if [ -n "$SUPABASE_URL" ]; then
  SUPABASE_PROJECT_ID=$(echo "$SUPABASE_URL" | sed -n 's|https://\([^.]*\)\.supabase\.co.*|\1|p')
  echo "📋 Found Supabase URL: $SUPABASE_URL"
  if [ -n "$SUPABASE_PROJECT_ID" ]; then
    echo "📋 Extracted Project ID: $SUPABASE_PROJECT_ID"
  fi
else
  echo "⚠️  NEXT_PUBLIC_SUPABASE_URL not found in environment"
  echo "   Please set it in .env.local"
fi

echo ""
echo "🔗 Linking to Supabase project..."
echo ""

# Option 1: Link to remote project (requires access token)
if [ -n "$SUPABASE_PROJECT_ID" ]; then
  echo "To link to your remote project, run:"
  echo "  supabase link --project-ref $SUPABASE_PROJECT_ID"
  echo ""
  echo "You'll need a Supabase access token. Get one from:"
  echo "  https://supabase.com/dashboard/account/tokens"
  echo ""
  echo "Or set SUPABASE_ACCESS_TOKEN in your environment."
  echo ""
fi

# Option 2: Initialize local development (requires Docker)
echo "Alternatively, for local development:"
echo "  1. Start Docker"
echo "  2. Run: supabase start"
echo "  3. Run: supabase link --project-ref <project-id>"
echo ""

echo "📝 After linking, generate types with:"
echo "  cd web && npm run types:generate"
echo "  # OR manually:"
echo "  # supabase gen types typescript --linked > web/utils/supabase/database.types.ts"
echo ""

# Check if already linked
if [ -f "supabase/config.toml" ]; then
  echo "✅ Supabase config found at supabase/config.toml"
  echo "   Project may already be linked."
  echo ""
  echo "Try generating types now:"
  echo "  cd web && npm run types:generate"
else
  echo "⚠️  No supabase/config.toml found - project not linked yet"
  echo ""
  echo "To initialize Supabase for this project:"
  echo "  supabase init"
fi

echo ""
echo "📚 Documentation: https://supabase.com/docs/reference/cli/introduction"


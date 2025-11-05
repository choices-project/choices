#!/bin/bash

# Apply Database Migrations - November 5, 2025
# Applies all new migrations to Supabase database

set -e

echo "🚀 Applying Database Migrations..."
echo ""

# Check for Supabase project reference
if [ -z "$SUPABASE_PROJECT_REF" ]; then
    echo "⚠️  SUPABASE_PROJECT_REF not set"
    echo "Please set it with: export SUPABASE_PROJECT_REF=your-project-ref"
    echo "Or apply migrations manually in Supabase SQL Editor"
    echo ""
    echo "Migration files to apply:"
    ls -1 supabase/migrations/20251105*.sql
    exit 1
fi

echo "Project: $SUPABASE_PROJECT_REF"
echo ""

# Apply each migration
for migration in supabase/migrations/20251105*.sql; do
    echo "📝 Applying: $(basename $migration)"
    
    # Use Supabase CLI to apply migration
    supabase db push --db-url "$DATABASE_URL" --file "$migration" 2>&1 || {
        echo "❌ Failed to apply $migration"
        echo ""
        echo "💡 Manual application required:"
        echo "   1. Go to https://supabase.com/dashboard/project/$SUPABASE_PROJECT_REF/editor"
        echo "   2. Copy contents of: $migration"
        echo "   3. Run in SQL Editor"
        exit 1
    }
    
    echo "✅ Applied successfully"
    echo ""
done

echo "🎉 All migrations applied successfully!"
echo ""
echo "Next steps:"
echo "  1. Verify tables exist: supabase db diff"
echo "  2. Regenerate types: cd web && npm run types:generate"
echo "  3. Test analytics tracking"


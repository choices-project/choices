#!/bin/bash

echo "🔧 Fixing Feedback Table Schema..."
echo "=================================="

echo ""
echo "📋 Instructions:"
echo "1. Go to: https://supabase.com/dashboard/project/muqwrehywjrbaeerjgfb"
echo "2. Click 'SQL Editor' in the left sidebar"
echo "3. Copy the SQL from fix_feedback_table_complete.sql"
echo "4. Paste it into the SQL editor"
echo "5. Click 'Run' button"
echo ""

echo "📄 SQL Content:"
echo "================"
cat fix_feedback_table_complete.sql

echo ""
echo "✅ After running the SQL, the feedback system should work properly!"
echo "🧪 You can then test it by running: cd web && node test-feedback-comprehensive.js"

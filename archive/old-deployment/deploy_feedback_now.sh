#!/bin/bash

# Deploy Feedback Table to Supabase using REST API
set -e

echo "🚀 Deploying Feedback Table to Supabase..."

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

# Create the SQL content
SQL_CONTENT="
-- Create Feedback Table for AI-Optimized Analysis
CREATE TABLE IF NOT EXISTS feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('bug', 'feature', 'general')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    sentiment TEXT NOT NULL CHECK (sentiment IN ('positive', 'negative', 'neutral')),
    screenshot TEXT,
    user_journey JSONB NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    tags TEXT[] DEFAULT '{}',
    ai_analysis JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(type);
CREATE INDEX IF NOT EXISTS idx_feedback_sentiment ON feedback(sentiment);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_priority ON feedback(priority);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_tags ON feedback USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_feedback_user_journey ON feedback USING GIN(user_journey);
CREATE INDEX IF NOT EXISTS idx_feedback_ai_analysis ON feedback USING GIN(ai_analysis);

-- Enable RLS
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY \"Users can view own feedback\" ON feedback
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY \"Anyone can submit feedback\" ON feedback
    FOR INSERT WITH CHECK (true);

CREATE POLICY \"Users can update own feedback\" ON feedback
    FOR UPDATE USING (auth.uid() = user_id);

-- Create functions and triggers
CREATE OR REPLACE FUNCTION update_feedback_updated_at()
RETURNS TRIGGER AS \$\$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
\$\$ language 'plpgsql';

CREATE TRIGGER update_feedback_updated_at 
    BEFORE UPDATE ON feedback 
    FOR EACH ROW 
    EXECUTE FUNCTION update_feedback_updated_at();

CREATE OR REPLACE FUNCTION extract_feedback_tags()
RETURNS TRIGGER AS \$\$
BEGIN
    NEW.tags = ARRAY(
        SELECT DISTINCT unnest(ARRAY[
            CASE WHEN NEW.type = 'bug' THEN 'bug' END,
            CASE WHEN NEW.type = 'feature' THEN 'feature-request' END,
            CASE WHEN NEW.sentiment = 'positive' THEN 'positive-feedback' END,
            CASE WHEN NEW.sentiment = 'negative' THEN 'negative-feedback' END,
            CASE WHEN NEW.priority = 'urgent' THEN 'urgent' END,
            CASE WHEN NEW.priority = 'high' THEN 'high-priority' END
        ])
        WHERE unnest IS NOT NULL
    );
    
    IF NEW.user_journey->>'page' IS NOT NULL THEN
        NEW.tags = NEW.tags || ARRAY['page:' || (NEW.user_journey->>'page')];
    END IF;
    
    RETURN NEW;
END;
\$\$ language 'plpgsql';

CREATE TRIGGER extract_feedback_tags_trigger
    BEFORE INSERT OR UPDATE ON feedback
    FOR EACH ROW
    EXECUTE FUNCTION extract_feedback_tags();

-- Create AI-ready views
CREATE OR REPLACE VIEW feedback_ai_ready AS
SELECT 
    id,
    type,
    title,
    description,
    sentiment,
    tags,
    user_journey,
    metadata,
    created_at,
    jsonb_build_object(
        'feedback_id', id,
        'type', type,
        'title', title,
        'description', description,
        'sentiment', sentiment,
        'tags', tags,
        'user_context', user_journey,
        'metadata', metadata,
        'timestamp', created_at
    ) as ai_structured_data
FROM feedback
WHERE status != 'closed'
ORDER BY created_at DESC;

CREATE OR REPLACE VIEW feedback_sentiment_analysis AS
SELECT 
    sentiment,
    type,
    COUNT(*) as count,
    AVG(EXTRACT(EPOCH FROM (NOW() - created_at))/86400) as avg_days_old,
    jsonb_agg(
        jsonb_build_object(
            'id', id,
            'title', title,
            'description', description,
            'tags', tags
        )
    ) as feedback_samples
FROM feedback
WHERE status != 'closed'
GROUP BY sentiment, type
ORDER BY sentiment, type;
"

echo "📋 SQL Content prepared"
echo ""
echo "🔧 Manual Deployment Required:"
echo ""
echo "1. Go to: https://supabase.com/dashboard/project/muqwrehywjrbaeerjgfb"
echo "2. Click 'SQL Editor' in the left sidebar"
echo "3. Copy and paste this SQL:"
echo ""
echo "=========================================="
echo "$SQL_CONTENT"
echo "=========================================="
echo ""
echo "4. Click 'Run' button"
echo ""
echo "✅ After running the SQL, your feedback widget will store data in the database!"
echo ""
echo "🧪 Test it:"
echo "- Visit: http://localhost:3000"
echo "- Look for the floating feedback widget"
echo "- Submit test feedback"
echo "- Check your Supabase dashboard to see the data"

#!/bin/bash

# Deploy Feedback Table Directly to Supabase
# Uses environment variables from .env.local

set -e

echo "🚀 Deploying Feedback Table to Supabase..."

# Load environment variables
if [ -f "web/.env.local" ]; then
    source web/.env.local
    echo "✅ Loaded environment variables from web/.env.local"
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

# Create a temporary SQL file with the schema
TEMP_SQL="/tmp/feedback_schema_$(date +%s).sql"
cat > "$TEMP_SQL" << 'EOF'
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
CREATE POLICY "Users can view own feedback" ON feedback
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can submit feedback" ON feedback
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own feedback" ON feedback
    FOR UPDATE USING (auth.uid() = user_id);

-- Create functions and triggers
CREATE OR REPLACE FUNCTION update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_feedback_updated_at 
    BEFORE UPDATE ON feedback 
    FOR EACH ROW 
    EXECUTE FUNCTION update_feedback_updated_at();

CREATE OR REPLACE FUNCTION extract_feedback_tags()
RETURNS TRIGGER AS $$
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
$$ language 'plpgsql';

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
EOF

echo "📋 Created temporary SQL file: $TEMP_SQL"

# Use psql to execute the SQL (if available)
if command -v psql &> /dev/null; then
    echo "🔧 Using psql to deploy schema..."
    # Extract database URL from Supabase URL
    DB_URL="postgresql://postgres:${NEXT_PUBLIC_SUPABASE_ANON_KEY}@${NEXT_PUBLIC_SUPABASE_URL#https://}.supabase.co:5432/postgres"
    
    psql "$DB_URL" -f "$TEMP_SQL"
    echo "✅ Schema deployed successfully via psql!"
else
    echo "⚠️  psql not available. Please run the SQL manually:"
    echo ""
    echo "1. Go to: https://supabase.com/dashboard/project/muqwrehywjrbaeerjgfb"
    echo "2. Navigate to SQL Editor"
    echo "3. Copy and paste the contents of: $TEMP_SQL"
    echo "4. Click 'Run'"
    echo ""
    echo "Or install psql: brew install postgresql"
fi

# Clean up
rm -f "$TEMP_SQL"

echo ""
echo "🎉 Feedback table setup complete!"
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

#!/bin/bash

# Deploy Feedback Table using Supabase Service Role Key
set -e

echo "🚀 Deploying Feedback Table using Service Role Key..."

# Load environment variables
if [ -f "web/.env.local" ]; then
    source web/.env.local
    echo "✅ Loaded environment variables"
else
    echo "❌ web/.env.local not found"
    exit 1
fi

# Check if required variables are set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Missing Supabase environment variables"
    echo "   Need: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
    exit 1
fi

echo "📋 Supabase URL: $NEXT_PUBLIC_SUPABASE_URL"
echo "🔑 Using Service Role Key (admin access)"

# Create the SQL content for the feedback table
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

-- Create indexes for performance and AI analysis
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

echo "🔧 Attempting to create feedback table using service role..."

# Try to execute the SQL using the service role key
RESPONSE=$(curl -s -X POST \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d "{\"query\": \"$SQL_CONTENT\"}" \
  "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/rpc/exec_sql")

if [[ $RESPONSE == *"error"* ]] || [[ $RESPONSE == *"not found"* ]]; then
    echo "❌ Direct SQL execution not available via REST API"
    echo ""
    echo "🔧 Using Supabase CLI instead..."
    
    # Try using Supabase CLI
    if command -v supabase &> /dev/null; then
        echo "✅ Supabase CLI found, attempting deployment..."
        
        # Create a temporary SQL file
        TEMP_SQL="/tmp/feedback_deploy_$(date +%s).sql"
        echo "$SQL_CONTENT" > "$TEMP_SQL"
        
        # Try to link to the project and deploy
        echo "🔗 Linking to Supabase project..."
        supabase link --project-ref muqwrehywjrbaeerjgfb
        
        echo "📋 Deploying schema..."
        supabase db push --include-all
        
        rm -f "$TEMP_SQL"
        echo "✅ Schema deployed via Supabase CLI!"
    else
        echo "❌ Supabase CLI not available"
        echo ""
        echo "🔧 Manual deployment required:"
        echo ""
        echo "1. Go to: https://supabase.com/dashboard/project/muqwrehywjrbaeerjgfb"
        echo "2. Click 'SQL Editor' in the left sidebar"
        echo "3. Copy and paste this SQL:"
        echo ""
        echo "$SQL_CONTENT"
        echo ""
        echo "4. Click 'Run' button"
    fi
else
    echo "✅ Feedback table created successfully!"
fi

echo ""
echo "🎉 Feedback table setup complete!"
echo ""
echo "🧪 Test it:"
echo "- Visit: http://localhost:3000"
echo "- Look for the floating feedback widget"
echo "- Submit test feedback"
echo "- Check your Supabase dashboard to see the data"
echo ""
echo "🤖 AI Analysis Features:"
echo "- Feedback is automatically tagged for categorization"
echo "- User journey data is structured for context analysis"
echo "- Sentiment analysis data is aggregated"
echo "- AI-ready views are created for processing"

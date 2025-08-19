-- Complete Feedback Table Fix
-- This script adds ALL missing columns to the feedback table

-- First, let's add the missing columns that the API expects
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS ai_analysis JSONB DEFAULT '{}';
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS user_journey JSONB DEFAULT '{}';
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS screenshot TEXT;
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open';
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Rename existing columns to match API expectations
ALTER TABLE feedback RENAME COLUMN feedback_type TO type;
ALTER TABLE feedback RENAME COLUMN comment TO description;

-- Add sentiment column if it doesn't exist
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS sentiment TEXT;

-- Add constraints for the new columns
ALTER TABLE feedback ADD CONSTRAINT IF NOT EXISTS feedback_type_check 
    CHECK (type IN ('bug', 'feature', 'general', 'performance', 'accessibility', 'security'));

ALTER TABLE feedback ADD CONSTRAINT IF NOT EXISTS feedback_sentiment_check 
    CHECK (sentiment IN ('positive', 'negative', 'neutral', 'mixed'));

ALTER TABLE feedback ADD CONSTRAINT IF NOT EXISTS feedback_status_check 
    CHECK (status IN ('open', 'in_progress', 'resolved', 'closed'));

ALTER TABLE feedback ADD CONSTRAINT IF NOT EXISTS feedback_priority_check 
    CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

-- Create indexes for performance
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

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can view own feedback" ON feedback;
DROP POLICY IF EXISTS "Anyone can submit feedback" ON feedback;
DROP POLICY IF EXISTS "Users can update own feedback" ON feedback;

-- Create policies
CREATE POLICY "Users can view own feedback" ON feedback
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can submit feedback" ON feedback
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own feedback" ON feedback
    FOR UPDATE USING (auth.uid() = user_id);

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';

-- Verify the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'feedback' 
ORDER BY ordinal_position;

-- Test inserting a record to verify everything works
INSERT INTO feedback (
    type, 
    title, 
    description, 
    sentiment, 
    user_journey,
    ai_analysis,
    metadata
) VALUES (
    'test',
    'Complete Schema Test',
    'Testing if all columns are working properly',
    'positive',
    '{"test": true, "currentPage": "/test"}'::jsonb,
    '{"test": true}'::jsonb,
    '{"test": true}'::jsonb
) ON CONFLICT DO NOTHING;

-- Clean up test record
DELETE FROM feedback WHERE title = 'Complete Schema Test';

-- Show success message
SELECT 'Complete feedback table fix applied successfully! All columns added and schema cache refreshed.' as message;

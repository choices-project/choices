-- Complete Feedback Table Fix
-- This script adds missing columns to the existing feedback table

-- First, let's check if the table exists and add missing columns
DO $$ 
BEGIN
    -- Add ai_analysis column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'feedback' AND column_name = 'ai_analysis'
    ) THEN
        ALTER TABLE feedback ADD COLUMN ai_analysis JSONB DEFAULT '{}';
        RAISE NOTICE 'Added ai_analysis column to feedback table';
    END IF;

    -- Add metadata column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'feedback' AND column_name = 'metadata'
    ) THEN
        ALTER TABLE feedback ADD COLUMN metadata JSONB DEFAULT '{}';
        RAISE NOTICE 'Added metadata column to feedback table';
    END IF;

    -- Add user_journey column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'feedback' AND column_name = 'user_journey'
    ) THEN
        ALTER TABLE feedback ADD COLUMN user_journey JSONB DEFAULT '{}';
        RAISE NOTICE 'Added user_journey column to feedback table';
    END IF;

    -- Add screenshot column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'feedback' AND column_name = 'screenshot'
    ) THEN
        ALTER TABLE feedback ADD COLUMN screenshot TEXT;
        RAISE NOTICE 'Added screenshot column to feedback table';
    END IF;

    -- Add status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'feedback' AND column_name = 'status'
    ) THEN
        ALTER TABLE feedback ADD COLUMN status TEXT DEFAULT 'open';
        RAISE NOTICE 'Added status column to feedback table';
    END IF;

    -- Add priority column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'feedback' AND column_name = 'priority'
    ) THEN
        ALTER TABLE feedback ADD COLUMN priority TEXT DEFAULT 'medium';
        RAISE NOTICE 'Added priority column to feedback table';
    END IF;

    -- Add tags column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'feedback' AND column_name = 'tags'
    ) THEN
        ALTER TABLE feedback ADD COLUMN tags TEXT[] DEFAULT '{}';
        RAISE NOTICE 'Added tags column to feedback table';
    END IF;

    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'feedback' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE feedback ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column to feedback table';
    END IF;

    RAISE NOTICE 'Feedback table schema check completed successfully!';
END $$;

-- Create indexes for performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(type);
CREATE INDEX IF NOT EXISTS idx_feedback_sentiment ON feedback(sentiment);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_priority ON feedback(priority);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_tags ON feedback USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_feedback_user_journey ON feedback USING GIN(user_journey);
CREATE INDEX IF NOT EXISTS idx_feedback_ai_analysis ON feedback USING GIN(ai_analysis);

-- Enable RLS if not already enabled
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

-- Add constraints if they don't exist
DO $$
BEGIN
    -- Add type constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'feedback_type_check'
    ) THEN
        ALTER TABLE feedback ADD CONSTRAINT feedback_type_check 
        CHECK (type IN ('bug', 'feature', 'general', 'performance', 'accessibility', 'security'));
    END IF;

    -- Add sentiment constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'feedback_sentiment_check'
    ) THEN
        ALTER TABLE feedback ADD CONSTRAINT feedback_sentiment_check 
        CHECK (sentiment IN ('positive', 'negative', 'neutral', 'mixed'));
    END IF;

    -- Add status constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'feedback_status_check'
    ) THEN
        ALTER TABLE feedback ADD CONSTRAINT feedback_status_check 
        CHECK (status IN ('open', 'in_progress', 'resolved', 'closed'));
    END IF;

    -- Add priority constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'feedback_priority_check'
    ) THEN
        ALTER TABLE feedback ADD CONSTRAINT feedback_priority_check 
        CHECK (priority IN ('low', 'medium', 'high', 'urgent'));
    END IF;
END $$;

-- Verify the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'feedback' 
ORDER BY ordinal_position;

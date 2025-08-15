-- Feedback System Database Schema
-- Run this in your Supabase SQL editor

-- Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL CHECK (type IN ('bug', 'feature', 'general')),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  sentiment VARCHAR(20) NOT NULL CHECK (sentiment IN ('positive', 'negative', 'neutral')),
  screenshot TEXT, -- Base64 encoded image or URL
  user_journey JSONB, -- Store user journey data
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  metadata JSONB, -- Additional metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(type);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_priority ON feedback(priority);
CREATE INDEX IF NOT EXISTS idx_feedback_sentiment ON feedback(sentiment);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_feedback_updated_at 
    BEFORE UPDATE ON feedback 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create feedback analytics view
CREATE OR REPLACE VIEW feedback_analytics AS
SELECT 
  type,
  sentiment,
  status,
  priority,
  COUNT(*) as count,
  AVG(CASE WHEN sentiment = 'positive' THEN 1 WHEN sentiment = 'negative' THEN -1 ELSE 0 END) as avg_sentiment_score,
  DATE_TRUNC('day', created_at) as date
FROM feedback
GROUP BY type, sentiment, status, priority, DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- Create Row Level Security (RLS) policies
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert feedback (for public feedback collection)
CREATE POLICY "Allow public feedback insertion" ON feedback
  FOR INSERT WITH CHECK (true);

-- Allow reading feedback (you might want to restrict this to admins only)
CREATE POLICY "Allow feedback reading" ON feedback
  FOR SELECT USING (true);

-- Allow updating feedback (you might want to restrict this to admins only)
CREATE POLICY "Allow feedback updating" ON feedback
  FOR UPDATE USING (true);

-- Create feedback summary function
CREATE OR REPLACE FUNCTION get_feedback_summary()
RETURNS TABLE (
  total_feedback INTEGER,
  open_feedback INTEGER,
  bug_reports INTEGER,
  feature_requests INTEGER,
  positive_sentiment INTEGER,
  negative_sentiment INTEGER,
  avg_response_time INTERVAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_feedback,
    COUNT(*) FILTER (WHERE status = 'open')::INTEGER as open_feedback,
    COUNT(*) FILTER (WHERE type = 'bug')::INTEGER as bug_reports,
    COUNT(*) FILTER (WHERE type = 'feature')::INTEGER as feature_requests,
    COUNT(*) FILTER (WHERE sentiment = 'positive')::INTEGER as positive_sentiment,
    COUNT(*) FILTER (WHERE sentiment = 'negative')::INTEGER as negative_sentiment,
    AVG(updated_at - created_at) as avg_response_time
  FROM feedback;
END;
$$ LANGUAGE plpgsql;

-- Insert some sample feedback for testing
INSERT INTO feedback (type, title, description, sentiment, status, priority) VALUES
('feature', 'Dark Mode Support', 'Would love to have a dark mode option for better user experience', 'positive', 'open', 'medium'),
('bug', 'Mobile Layout Issue', 'The poll interface breaks on mobile devices smaller than 375px', 'negative', 'open', 'high'),
('general', 'Great Platform', 'Really enjoying using this platform for creating polls', 'positive', 'closed', 'low'),
('feature', 'Export Results', 'Ability to export poll results to CSV would be very helpful', 'positive', 'in_progress', 'medium'),
('bug', 'Slow Loading', 'The dashboard takes too long to load on slower connections', 'negative', 'open', 'high');

-- Create feedback notification function (for future use)
CREATE OR REPLACE FUNCTION notify_new_feedback()
RETURNS TRIGGER AS $$
BEGIN
  -- This could be used to send notifications when new feedback is submitted
  -- For now, just log it
  RAISE NOTICE 'New feedback submitted: % - %', NEW.type, NEW.title;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER feedback_notification_trigger
  AFTER INSERT ON feedback
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_feedback();

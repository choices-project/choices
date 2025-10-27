-- Add missing tables for optimal schema
-- Created: 2025-10-26

-- Site Messages table for admin announcements and notifications
CREATE TABLE IF NOT EXISTS site_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  type TEXT DEFAULT 'announcement' CHECK (type IN ('announcement', 'maintenance', 'feature', 'warning', 'info')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft', 'archived')),
  target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'authenticated', 'admin', 'new_users')),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies for site_messages
ALTER TABLE site_messages ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read active messages
CREATE POLICY "Anyone can read active site messages" ON site_messages
  FOR SELECT USING (is_active = true AND (start_date IS NULL OR start_date <= NOW()) AND (end_date IS NULL OR end_date >= NOW()));

-- Only admins can manage site messages
CREATE POLICY "Admins can manage site messages" ON site_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- Update the feedback table to match the expected structure
-- First, let's check if we need to add missing columns
DO $$ 
BEGIN
  -- Add missing columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feedback' AND column_name = 'type') THEN
    ALTER TABLE feedback ADD COLUMN type TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feedback' AND column_name = 'sentiment') THEN
    ALTER TABLE feedback ADD COLUMN sentiment TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feedback' AND column_name = 'screenshot') THEN
    ALTER TABLE feedback ADD COLUMN screenshot TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feedback' AND column_name = 'user_journey') THEN
    ALTER TABLE feedback ADD COLUMN user_journey JSONB DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feedback' AND column_name = 'ai_analysis') THEN
    ALTER TABLE feedback ADD COLUMN ai_analysis JSONB DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feedback' AND column_name = 'metadata') THEN
    ALTER TABLE feedback ADD COLUMN metadata JSONB DEFAULT '{}';
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_site_messages_active ON site_messages(is_active, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_site_messages_priority ON site_messages(priority);
CREATE INDEX IF NOT EXISTS idx_site_messages_type ON site_messages(type);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(type);
CREATE INDEX IF NOT EXISTS idx_feedback_sentiment ON feedback(sentiment);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);

-- Create updated_at trigger for site_messages
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_site_messages_updated_at 
  BEFORE UPDATE ON site_messages 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add some sample data for testing
INSERT INTO site_messages (title, message, priority, type, target_audience) VALUES
  ('Welcome to Choices!', 'Thank you for joining our platform. We''re excited to have you participate in democratic decision-making.', 'medium', 'announcement', 'new_users'),
  ('Platform Maintenance', 'Scheduled maintenance will occur on Sunday from 2-4 AM EST. Some features may be temporarily unavailable.', 'high', 'maintenance', 'all')
ON CONFLICT DO NOTHING;

-- Grant necessary permissions
GRANT SELECT ON site_messages TO authenticated;
GRANT ALL ON site_messages TO service_role;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

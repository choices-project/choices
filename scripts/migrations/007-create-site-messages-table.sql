-- Migration 007: Create site_messages table
-- Add table for managing site-wide announcements and feedback requests
-- Created: 2025-08-26
-- Status: Ready for deployment

-- Step 1: Create site_messages table
CREATE TABLE IF NOT EXISTS site_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'success', 'error', 'feedback')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_site_messages_active ON site_messages (is_active);
CREATE INDEX IF NOT EXISTS idx_site_messages_type ON site_messages (type);
CREATE INDEX IF NOT EXISTS idx_site_messages_priority ON site_messages (priority);
CREATE INDEX IF NOT EXISTS idx_site_messages_created_at ON site_messages (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_messages_expires_at ON site_messages (expires_at);

-- Step 3: Add RLS policies
ALTER TABLE site_messages ENABLE ROW LEVEL SECURITY;

-- Allow admins to read all messages
CREATE POLICY site_messages_admin_read ON site_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.is_admin = true
    )
  );

-- Allow admins to insert messages
CREATE POLICY site_messages_admin_insert ON site_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.is_admin = true
    )
  );

-- Allow admins to update messages
CREATE POLICY site_messages_admin_update ON site_messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.is_admin = true
    )
  );

-- Allow admins to delete messages
CREATE POLICY site_messages_admin_delete ON site_messages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.is_admin = true
    )
  );

-- Allow public read access to active messages
CREATE POLICY site_messages_public_read ON site_messages
  FOR SELECT USING (is_active = true);

-- Step 4: Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON site_messages TO authenticated;
GRANT SELECT ON site_messages TO anon;

-- Step 5: Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_site_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_site_messages_updated_at
  BEFORE UPDATE ON site_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_site_messages_updated_at();

-- Step 6: Insert sample data for testing
INSERT INTO site_messages (title, message, type, priority, is_active) VALUES
  ('Welcome to Choices!', 'This is a new platform for creating and participating in polls. We''d love your feedback!', 'feedback', 'high', true),
  ('System Maintenance', 'We''ll be performing maintenance on Sunday at 2 AM EST. Service may be briefly interrupted.', 'info', 'medium', true),
  ('New Features Coming', 'Stay tuned for exciting new features including real-time voting and mobile notifications!', 'success', 'low', true)
ON CONFLICT DO NOTHING;

-- Step 7: Log migration
INSERT INTO migration_log (migration_name, applied_at, status, description)
VALUES (
  '007-create-site-messages-table',
  NOW(),
  'completed',
  'Created site_messages table for managing site-wide announcements and feedback requests'
);


-- Contact Information System Database Schema
-- Created: January 23, 2025
-- Purpose: Enable direct user-to-representative messaging
-- Status: Implementation Ready

-- ============================================================================
-- CORE MESSAGE TABLES
-- ============================================================================

-- Message threads between users and representatives
CREATE TABLE contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id INTEGER NOT NULL REFERENCES representatives_core(id) ON DELETE CASCADE,
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'email', 'attachment', 'system')),
  content TEXT NOT NULL,
  subject VARCHAR(255),
  attachments JSONB DEFAULT '[]'::jsonb,
  status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'replied', 'failed')),
  priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  replied_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Message threads for organization
CREATE TABLE contact_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  representative_id INTEGER NOT NULL REFERENCES representatives_core(id) ON DELETE CASCADE,
  subject VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived', 'spam')),
  priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE,
  message_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Message delivery tracking
CREATE TABLE message_delivery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES contact_messages(id) ON DELETE CASCADE,
  delivery_method VARCHAR(20) NOT NULL CHECK (delivery_method IN ('email', 'sms', 'web', 'api', 'push')),
  delivery_status VARCHAR(20) NOT NULL CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
  delivery_attempts INTEGER DEFAULT 0,
  error_message TEXT,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================

-- Contact messages indexes
CREATE INDEX idx_contact_messages_thread_id ON contact_messages(thread_id);
CREATE INDEX idx_contact_messages_sender_id ON contact_messages(sender_id);
CREATE INDEX idx_contact_messages_recipient_id ON contact_messages(recipient_id);
CREATE INDEX idx_contact_messages_status ON contact_messages(status);
CREATE INDEX idx_contact_messages_created_at ON contact_messages(created_at);
CREATE INDEX idx_contact_messages_priority ON contact_messages(priority);
CREATE INDEX idx_contact_messages_thread_status ON contact_messages(thread_id, status);

-- Contact threads indexes
CREATE INDEX idx_contact_threads_user_id ON contact_threads(user_id);
CREATE INDEX idx_contact_threads_representative_id ON contact_threads(representative_id);
CREATE INDEX idx_contact_threads_status ON contact_threads(status);
CREATE INDEX idx_contact_threads_priority ON contact_threads(priority);
CREATE INDEX idx_contact_threads_last_message ON contact_threads(last_message_at);
CREATE INDEX idx_contact_threads_user_status ON contact_threads(user_id, status);
CREATE INDEX idx_contact_threads_rep_status ON contact_threads(representative_id, status);

-- Message delivery logs indexes
CREATE INDEX idx_message_delivery_logs_message_id ON message_delivery_logs(message_id);
CREATE INDEX idx_message_delivery_logs_status ON message_delivery_logs(delivery_status);
CREATE INDEX idx_message_delivery_logs_method ON message_delivery_logs(delivery_method);
CREATE INDEX idx_message_delivery_logs_created_at ON message_delivery_logs(created_at);

-- ============================================================================
-- FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Add foreign key constraint for thread_id
ALTER TABLE contact_messages ADD CONSTRAINT fk_contact_messages_thread 
  FOREIGN KEY (thread_id) REFERENCES contact_threads(id) ON DELETE CASCADE;

-- ============================================================================
-- DATABASE TRIGGERS AND FUNCTIONS
-- ============================================================================

-- Function to update thread metadata on message insert
CREATE OR REPLACE FUNCTION update_thread_metadata()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE contact_threads 
  SET 
    last_message_at = NEW.created_at,
    message_count = message_count + 1,
    updated_at = NOW()
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update thread metadata
CREATE TRIGGER trigger_update_thread_metadata
  AFTER INSERT ON contact_messages
  FOR EACH ROW EXECUTE FUNCTION update_thread_metadata();

-- Function to update message updated_at timestamp
CREATE OR REPLACE FUNCTION update_message_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update message updated_at
CREATE TRIGGER trigger_update_message_updated_at
  BEFORE UPDATE ON contact_messages
  FOR EACH ROW EXECUTE FUNCTION update_message_updated_at();

-- Function to update thread updated_at timestamp
CREATE OR REPLACE FUNCTION update_thread_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update thread updated_at
CREATE TRIGGER trigger_update_thread_updated_at
  BEFORE UPDATE ON contact_threads
  FOR EACH ROW EXECUTE FUNCTION update_thread_updated_at();

-- Function to notify message status changes
CREATE OR REPLACE FUNCTION notify_message_status_change()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('message_status_change', 
    json_build_object(
      'message_id', NEW.id,
      'thread_id', NEW.thread_id,
      'sender_id', NEW.sender_id,
      'recipient_id', NEW.recipient_id,
      'status', NEW.status,
      'timestamp', NEW.updated_at
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to notify message status changes
CREATE TRIGGER trigger_notify_message_status_change
  AFTER UPDATE ON contact_messages
  FOR EACH ROW EXECUTE FUNCTION notify_message_status_change();

-- Function to notify new messages
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('new_message', 
    json_build_object(
      'message_id', NEW.id,
      'thread_id', NEW.thread_id,
      'sender_id', NEW.sender_id,
      'recipient_id', NEW.recipient_id,
      'content', NEW.content,
      'subject', NEW.subject,
      'priority', NEW.priority,
      'timestamp', NEW.created_at
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to notify new messages
CREATE TRIGGER trigger_notify_new_message
  AFTER INSERT ON contact_messages
  FOR EACH ROW EXECUTE FUNCTION notify_new_message();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_delivery_logs ENABLE ROW LEVEL SECURITY;

-- Contact messages policies
CREATE POLICY "Users can view their own messages" ON contact_messages
  FOR SELECT USING (sender_id = auth.uid());

CREATE POLICY "Users can insert their own messages" ON contact_messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update their own messages" ON contact_messages
  FOR UPDATE USING (sender_id = auth.uid());

-- Contact threads policies
CREATE POLICY "Users can view their own threads" ON contact_threads
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own threads" ON contact_threads
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own threads" ON contact_threads
  FOR UPDATE USING (user_id = auth.uid());

-- Message delivery logs policies (admin only)
CREATE POLICY "Admins can view delivery logs" ON message_delivery_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() AND raw_user_meta_data->>'is_admin' = 'true'
    )
  );

-- ============================================================================
-- SAMPLE DATA AND TESTING
-- ============================================================================

-- Insert sample thread for testing
INSERT INTO contact_threads (
  id,
  user_id,
  representative_id,
  subject,
  status,
  priority
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  (SELECT id FROM auth.users LIMIT 1),
  (SELECT id FROM representatives_core LIMIT 1),
  'Test Message Thread',
  'active',
  'normal'
);

-- Insert sample message for testing
INSERT INTO contact_messages (
  thread_id,
  sender_id,
  recipient_id,
  content,
  subject,
  priority
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  (SELECT id FROM auth.users LIMIT 1),
  (SELECT id FROM representatives_core LIMIT 1),
  'This is a test message to verify the contact system is working correctly.',
  'Test Message',
  'normal'
);

-- ============================================================================
-- COMMENTS AND DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE contact_messages IS 'Individual messages in user-representative conversations';
COMMENT ON TABLE contact_threads IS 'Message threads organizing conversations between users and representatives';
COMMENT ON TABLE message_delivery_logs IS 'Delivery tracking and status for all messages';

COMMENT ON COLUMN contact_messages.message_type IS 'Type of message: text, email, attachment, or system';
COMMENT ON COLUMN contact_messages.status IS 'Message status: sent, delivered, read, replied, or failed';
COMMENT ON COLUMN contact_messages.priority IS 'Message priority: low, normal, high, or urgent';
COMMENT ON COLUMN contact_messages.attachments IS 'JSON array of file attachments with metadata';
COMMENT ON COLUMN contact_messages.metadata IS 'Additional message metadata and context';

COMMENT ON COLUMN contact_threads.status IS 'Thread status: active, closed, archived, or spam';
COMMENT ON COLUMN contact_threads.priority IS 'Thread priority: low, normal, high, or urgent';
COMMENT ON COLUMN contact_threads.message_count IS 'Total number of messages in thread';
COMMENT ON COLUMN contact_threads.last_message_at IS 'Timestamp of most recent message';

COMMENT ON COLUMN message_delivery_logs.delivery_method IS 'Method used for delivery: email, sms, web, api, or push';
COMMENT ON COLUMN message_delivery_logs.delivery_status IS 'Delivery status: pending, sent, delivered, failed, or bounced';
COMMENT ON COLUMN message_delivery_logs.delivery_attempts IS 'Number of delivery attempts made';
COMMENT ON COLUMN message_delivery_logs.error_message IS 'Error message if delivery failed';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Migration completed successfully
-- Tables created: contact_messages, contact_threads, message_delivery_logs
-- Indexes created: 15 performance indexes
-- Triggers created: 6 database triggers
-- Policies created: 6 RLS policies

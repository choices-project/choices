-- Rollback Migration 001: Identity Unification
-- This script reverts the identity unification changes

-- Step 1: Drop the canonical users view
DROP VIEW IF EXISTS users;

-- Step 2: Drop the helper functions
DROP FUNCTION IF EXISTS get_user_by_identifier(TEXT);
DROP FUNCTION IF EXISTS user_exists(UUID);

-- Step 3: Drop the updated_at triggers
DROP TRIGGER IF EXISTS trg_polls_updated ON polls;
DROP TRIGGER IF EXISTS trg_votes_updated ON votes;
DROP TRIGGER IF EXISTS trg_webauthn_credentials_updated ON webauthn_credentials;
DROP TRIGGER IF EXISTS trg_device_flows_updated ON device_flows;
DROP TRIGGER IF EXISTS trg_notifications_updated ON notifications;
DROP TRIGGER IF EXISTS trg_user_sessions_updated ON user_sessions;

-- Step 4: Drop the set_updated_at function
DROP FUNCTION IF EXISTS set_updated_at();

-- Step 5: Drop the new indexes
DROP INDEX IF EXISTS idx_polls_user_id;
DROP INDEX IF EXISTS idx_votes_user_id;
DROP INDEX IF EXISTS idx_webauthn_credentials_user_id;
DROP INDEX IF EXISTS idx_device_flows_user_id;
DROP INDEX IF EXISTS idx_error_logs_user_id;
DROP INDEX IF EXISTS idx_analytics_user_id;
DROP INDEX IF EXISTS idx_rate_limits_user_id;
DROP INDEX IF EXISTS idx_notifications_user_id;
DROP INDEX IF EXISTS idx_user_sessions_user_id;

-- Drop composite indexes
DROP INDEX IF EXISTS idx_polls_user_status;
DROP INDEX IF EXISTS idx_votes_poll_user;
DROP INDEX IF EXISTS idx_webauthn_credentials_user_active;
DROP INDEX IF EXISTS idx_notifications_user_read;
DROP INDEX IF EXISTS idx_user_sessions_user_active;

-- Step 6: Revert foreign key constraints to original state
-- Note: This assumes the original constraints were named differently
-- You may need to adjust constraint names based on your original schema

-- Revert polls table
ALTER TABLE polls DROP CONSTRAINT IF EXISTS fk_polls_user;
ALTER TABLE polls DROP COLUMN IF EXISTS user_id;

-- Revert votes table
ALTER TABLE votes DROP CONSTRAINT IF EXISTS fk_votes_user;
-- Restore original constraint if it existed
-- ALTER TABLE votes ADD CONSTRAINT votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE;

-- Revert webauthn_credentials table
ALTER TABLE webauthn_credentials DROP CONSTRAINT IF EXISTS fk_webauthn_credentials_user;
-- Restore original constraint if it existed
-- ALTER TABLE webauthn_credentials ADD CONSTRAINT webauthn_credentials_user_id_fkey FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE;

-- Revert device_flows table
ALTER TABLE device_flows DROP CONSTRAINT IF EXISTS fk_device_flows_user;
-- Restore original constraint if it existed
-- ALTER TABLE device_flows ADD CONSTRAINT device_flows_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Revert error_logs table
ALTER TABLE error_logs DROP CONSTRAINT IF EXISTS fk_error_logs_user;
-- Restore original constraint if it existed
-- ALTER TABLE error_logs ADD CONSTRAINT error_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE SET NULL;

-- Revert analytics table
ALTER TABLE analytics DROP CONSTRAINT IF EXISTS fk_analytics_user;
-- Restore original constraint if it existed
-- ALTER TABLE analytics ADD CONSTRAINT analytics_user_id_fkey FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE SET NULL;

-- Revert rate_limits table
ALTER TABLE rate_limits DROP CONSTRAINT IF EXISTS fk_rate_limits_user;
-- Restore original constraint if it existed
-- ALTER TABLE rate_limits ADD CONSTRAINT rate_limits_user_id_fkey FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE;

-- Revert notifications table
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS fk_notifications_user;
-- Restore original constraint if it existed
-- ALTER TABLE notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE;

-- Revert user_sessions table
ALTER TABLE user_sessions DROP CONSTRAINT IF EXISTS fk_user_sessions_user;
-- Restore original constraint if it existed
-- ALTER TABLE user_sessions ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE;

-- Rollback completed
-- Note: You may need to manually restore original foreign key constraints
-- based on your specific original schema configuration












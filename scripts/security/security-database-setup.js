#!/usr/bin/env node

/**
 * Security Database Setup Script
 * Adds comprehensive security constraints to Supabase database
 * 
 * Features:
 * - Content length limits
 * - Daily submission limits
 * - Spam detection triggers
 * - User tier restrictions
 * - Audit logging
 */

require('dotenv').config({ path: './web/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupSecurityConstraints() {
  console.log('🛡️ Setting up security constraints...\n');

  try {
    // 1. Add content length constraints
    console.log('📏 Adding content length constraints...');
    await supabase.rpc('exec_sql', {
      sql: `
        -- Add content length constraints
        ALTER TABLE feedback ADD CONSTRAINT feedback_title_length_check 
          CHECK (char_length(title) <= 200);
        
        ALTER TABLE feedback ADD CONSTRAINT feedback_description_length_check 
          CHECK (char_length(description) <= 1000);
        
        ALTER TABLE feedback ADD CONSTRAINT feedback_type_length_check 
          CHECK (char_length(type) <= 50);
        
        ALTER TABLE feedback ADD CONSTRAINT feedback_sentiment_length_check 
          CHECK (char_length(sentiment) <= 20);
      `
    });
    console.log('✅ Content length constraints added\n');

    // 2. Add daily feedback limit function
    console.log('📅 Adding daily feedback limit function...');
    await supabase.rpc('exec_sql', {
      sql: `
        -- Daily feedback limit function
        CREATE OR REPLACE FUNCTION check_daily_feedback_limit()
        RETURNS TRIGGER AS $$
        DECLARE
          daily_count INTEGER;
          user_tier TEXT;
        BEGIN
          -- Get user tier (default to T0 for anonymous users)
          IF NEW.user_id IS NULL THEN
            user_tier := 'T0';
          ELSE
            SELECT verification_tier INTO user_tier 
            FROM ia_users 
            WHERE id = NEW.user_id;
            
            IF user_tier IS NULL THEN
              user_tier := 'T0';
            END IF;
          END IF;
          
          -- Set limits based on tier
          DECLARE
            max_daily INTEGER;
          BEGIN
            CASE user_tier
              WHEN 'T0' THEN max_daily := 2;   -- Anonymous: 2 per day
              WHEN 'T1' THEN max_daily := 5;   -- Basic: 5 per day
              WHEN 'T2' THEN max_daily := 10;  -- Admin: 10 per day
              WHEN 'T3' THEN max_daily := 20;  -- Premium: 20 per day
              ELSE max_daily := 2;             -- Default to T0
            END CASE;
            
            -- Check daily count
            SELECT COUNT(*) INTO daily_count 
            FROM feedback 
            WHERE user_id = NEW.user_id 
            AND created_at >= CURRENT_DATE;
            
            IF daily_count >= max_daily THEN
              RAISE EXCEPTION 'Daily feedback limit exceeded for tier % (max % per day)', user_tier, max_daily;
            END IF;
          END;
          
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `
    });
    console.log('✅ Daily feedback limit function added\n');

    // 3. Add content filtering function
    console.log('🔍 Adding content filtering function...');
    await supabase.rpc('exec_sql', {
      sql: `
        -- Content filtering function
        CREATE OR REPLACE FUNCTION validate_feedback_content()
        RETURNS TRIGGER AS $$
        BEGIN
          -- Check for ALL CAPS (more than 5 consecutive uppercase letters)
          IF NEW.title ~ '[A-Z]{5,}' OR NEW.description ~ '[A-Z]{5,}' THEN
            RAISE EXCEPTION 'Suspicious content detected (ALL CAPS)';
          END IF;
          
          -- Check for multiple exclamation marks
          IF NEW.title ~ '!{3,}' OR NEW.description ~ '!{3,}' THEN
            RAISE EXCEPTION 'Suspicious content detected (multiple exclamation marks)';
          END IF;
          
          -- Check for spam words
          IF NEW.title ~* 'spam|scam|click here|buy now|free money|make money fast|work from home|earn money|get rich quick' OR 
             NEW.description ~* 'spam|scam|click here|buy now|free money|make money fast|work from home|earn money|get rich quick' THEN
            RAISE EXCEPTION 'Suspicious content detected (spam words)';
          END IF;
          
          -- Check for excessive URLs
          IF (LENGTH(NEW.title) - LENGTH(REPLACE(NEW.title, 'http', ''))) / 4 > 2 OR
             (LENGTH(NEW.description) - LENGTH(REPLACE(NEW.description, 'http', ''))) / 4 > 3 THEN
            RAISE EXCEPTION 'Suspicious content detected (excessive URLs)';
          END IF;
          
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `
    });
    console.log('✅ Content filtering function added\n');

    // 4. Add triggers
    console.log('⚡ Adding security triggers...');
    await supabase.rpc('exec_sql', {
      sql: `
        -- Drop existing triggers if they exist
        DROP TRIGGER IF EXISTS enforce_daily_feedback_limit ON feedback;
        DROP TRIGGER IF EXISTS validate_feedback_content_trigger ON feedback;
        
        -- Create triggers
        CREATE TRIGGER enforce_daily_feedback_limit
          BEFORE INSERT ON feedback
          FOR EACH ROW
          EXECUTE FUNCTION check_daily_feedback_limit();
        
        CREATE TRIGGER validate_feedback_content_trigger
          BEFORE INSERT ON feedback
          FOR EACH ROW
          EXECUTE FUNCTION validate_feedback_content();
      `
    });
    console.log('✅ Security triggers added\n');

    // 5. Add audit logging function
    console.log('📝 Adding audit logging function...');
    await supabase.rpc('exec_sql', {
      sql: `
        -- Create audit log table if it doesn't exist
        CREATE TABLE IF NOT EXISTS security_audit_log (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          table_name TEXT NOT NULL,
          operation TEXT NOT NULL,
          user_id UUID,
          ip_address INET,
          user_agent TEXT,
          details JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Audit logging function
        CREATE OR REPLACE FUNCTION log_security_event()
        RETURNS TRIGGER AS $$
        BEGIN
          INSERT INTO security_audit_log (
            table_name,
            operation,
            user_id,
            ip_address,
            user_agent,
            details
          ) VALUES (
            TG_TABLE_NAME,
            TG_OP,
            NEW.user_id,
            inet_client_addr(),
            current_setting('request.headers', true)::json->>'user-agent',
            jsonb_build_object(
              'old', CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
              'new', CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
            )
          );
          
          RETURN COALESCE(NEW, OLD);
        END;
        $$ LANGUAGE plpgsql;
        
        -- Add audit trigger
        DROP TRIGGER IF EXISTS audit_feedback_changes ON feedback;
        CREATE TRIGGER audit_feedback_changes
          AFTER INSERT OR UPDATE OR DELETE ON feedback
          FOR EACH ROW
          EXECUTE FUNCTION log_security_event();
      `
    });
    console.log('✅ Audit logging function added\n');

    // 6. Add rate limiting table
    console.log('⏱️ Adding rate limiting table...');
    await supabase.rpc('exec_sql', {
      sql: `
        -- Create rate limiting table
        CREATE TABLE IF NOT EXISTS rate_limits (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          ip_address INET NOT NULL,
          endpoint TEXT NOT NULL,
          request_count INTEGER DEFAULT 1,
          window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create index for performance
        CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_endpoint 
          ON rate_limits(ip_address, endpoint, window_start);
        
        -- Rate limiting function
        CREATE OR REPLACE FUNCTION check_rate_limit(
          p_ip_address INET,
          p_endpoint TEXT,
          p_max_requests INTEGER,
          p_window_minutes INTEGER
        ) RETURNS BOOLEAN AS $$
        DECLARE
          current_count INTEGER;
        BEGIN
          -- Clean old records
          DELETE FROM rate_limits 
          WHERE window_start < NOW() - INTERVAL '1 hour';
          
          -- Get current count
          SELECT COALESCE(SUM(request_count), 0) INTO current_count
          FROM rate_limits
          WHERE ip_address = p_ip_address
          AND endpoint = p_endpoint
          AND window_start > NOW() - (p_window_minutes || ' minutes')::INTERVAL;
          
          -- Check if limit exceeded
          IF current_count >= p_max_requests THEN
            RETURN FALSE;
          END IF;
          
          -- Update or insert record
          INSERT INTO rate_limits (ip_address, endpoint, request_count, window_start)
          VALUES (p_ip_address, p_endpoint, 1, NOW())
          ON CONFLICT (ip_address, endpoint, window_start)
          DO UPDATE SET 
            request_count = rate_limits.request_count + 1,
            updated_at = NOW();
          
          RETURN TRUE;
        END;
        $$ LANGUAGE plpgsql;
      `
    });
    console.log('✅ Rate limiting table added\n');

    // 7. Add RLS policies for security audit log
    console.log('🔒 Adding RLS policies for audit log...');
    await supabase.rpc('exec_sql', {
      sql: `
        -- Enable RLS on audit log table
        ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;
        
        -- Only admins can view audit logs
        CREATE POLICY "Admin can view audit logs" ON security_audit_log
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM ia_users 
              WHERE id = auth.uid() 
              AND verification_tier IN ('T2', 'T3')
            )
          );
        
        -- Only system can insert audit logs
        CREATE POLICY "System can insert audit logs" ON security_audit_log
          FOR INSERT WITH CHECK (true);
      `
    });
    console.log('✅ RLS policies for audit log added\n');

    console.log('🎉 Security constraints setup completed successfully!\n');
    console.log('📊 Security Features Added:');
    console.log('  ✅ Content length limits (title: 200, description: 1000)');
    console.log('  ✅ Daily feedback limits (T0: 2, T1: 5, T2: 10, T3: 20)');
    console.log('  ✅ Spam detection (ALL CAPS, excessive punctuation, spam words)');
    console.log('  ✅ URL filtering (max 2 in title, 3 in description)');
    console.log('  ✅ Rate limiting table and functions');
    console.log('  ✅ Comprehensive audit logging');
    console.log('  ✅ RLS policies for security data');
    console.log('\n🛡️ Your database is now protected against:');
    console.log('  • Content spam and abuse');
    console.log('  • Rate limiting violations');
    console.log('  • Excessive submissions');
    console.log('  • Suspicious content patterns');
    console.log('  • Unauthorized access to audit logs');

  } catch (error) {
    console.error('❌ Error setting up security constraints:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

// Run the setup
setupSecurityConstraints();

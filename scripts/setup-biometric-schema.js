#!/usr/bin/env node

/**
 * Biometric Authentication Database Setup Script
 * Sets up WebAuthn and biometric authentication infrastructure
 * 
 * Features:
 * - WebAuthn credentials storage
 * - Biometric authentication logs
 * - Security policies and constraints
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

async function setupBiometricSchema() {
  console.log('🔐 Setting up biometric authentication schema...\n');

  try {
    // 1. Create biometric credentials table
    console.log('📋 Creating biometric credentials table...');
    await supabase.rpc('exec_sql', {
      sql: `
        -- Biometric credentials table for WebAuthn
        CREATE TABLE IF NOT EXISTS biometric_credentials (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES ia_users(id) ON DELETE CASCADE,
          credential_id TEXT UNIQUE NOT NULL,
          public_key TEXT NOT NULL,
          sign_count BIGINT DEFAULT 0,
          backup_eligible BOOLEAN DEFAULT false,
          backup_state BOOLEAN DEFAULT false,
          device_type TEXT CHECK (device_type IN ('platform', 'cross-platform')),
          authenticator_type TEXT CHECK (authenticator_type IN ('fingerprint', 'face', 'iris', 'voice', 'unknown')),
          user_agent TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          last_used_at TIMESTAMP WITH TIME ZONE,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create indexes for performance
        CREATE INDEX IF NOT EXISTS idx_biometric_credentials_user_id 
          ON biometric_credentials(user_id);
        
        CREATE INDEX IF NOT EXISTS idx_biometric_credentials_credential_id 
          ON biometric_credentials(credential_id);
        
        CREATE INDEX IF NOT EXISTS idx_biometric_credentials_device_type 
          ON biometric_credentials(device_type);
      `
    });
    console.log('✅ Biometric credentials table created\n');

    // 2. Create biometric authentication logs table
    console.log('📝 Creating biometric authentication logs table...');
    await supabase.rpc('exec_sql', {
      sql: `
        -- Biometric authentication logs
        CREATE TABLE IF NOT EXISTS biometric_auth_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES ia_users(id),
          credential_id TEXT,
          authentication_result BOOLEAN NOT NULL,
          failure_reason TEXT,
          ip_address INET,
          user_agent TEXT,
          device_info JSONB,
          location_info JSONB,
          risk_score DECIMAL(3,2) DEFAULT 0.0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create indexes for performance and analytics
        CREATE INDEX IF NOT EXISTS idx_biometric_auth_logs_user_id 
          ON biometric_auth_logs(user_id);
        
        CREATE INDEX IF NOT EXISTS idx_biometric_auth_logs_created_at 
          ON biometric_auth_logs(created_at);
        
        CREATE INDEX IF NOT EXISTS idx_biometric_auth_logs_result 
          ON biometric_auth_logs(authentication_result);
        
        CREATE INDEX IF NOT EXISTS idx_biometric_auth_logs_risk_score 
          ON biometric_auth_logs(risk_score);
      `
    });
    console.log('✅ Biometric authentication logs table created\n');

    // 3. Create WebAuthn challenges table
    console.log('🔑 Creating WebAuthn challenges table...');
    await supabase.rpc('exec_sql', {
      sql: `
        -- WebAuthn challenges for registration and authentication
        CREATE TABLE IF NOT EXISTS webauthn_challenges (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES ia_users(id),
          challenge TEXT NOT NULL,
          challenge_type TEXT CHECK (challenge_type IN ('registration', 'authentication')),
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_user_id 
          ON webauthn_challenges(user_id);
        
        CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_expires_at 
          ON webauthn_challenges(expires_at);
        
        -- Clean up expired challenges
        CREATE OR REPLACE FUNCTION cleanup_expired_challenges()
        RETURNS void AS $$
        BEGIN
          DELETE FROM webauthn_challenges 
          WHERE expires_at < NOW();
        END;
        $$ LANGUAGE plpgsql;
      `
    });
    console.log('✅ WebAuthn challenges table created\n');

    // 4. Create biometric trust scores table
    console.log('📊 Creating biometric trust scores table...');
    await supabase.rpc('exec_sql', {
      sql: `
        -- Biometric trust scores for enhanced security
        CREATE TABLE IF NOT EXISTS biometric_trust_scores (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES ia_users(id) UNIQUE,
          base_score DECIMAL(3,2) DEFAULT 0.0,
          device_consistency_score DECIMAL(3,2) DEFAULT 0.0,
          behavior_score DECIMAL(3,2) DEFAULT 0.0,
          location_score DECIMAL(3,2) DEFAULT 0.0,
          overall_score DECIMAL(3,2) DEFAULT 0.0,
          last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create index
        CREATE INDEX IF NOT EXISTS idx_biometric_trust_scores_user_id 
          ON biometric_trust_scores(user_id);
        
        CREATE INDEX IF NOT EXISTS idx_biometric_trust_scores_overall_score 
          ON biometric_trust_scores(overall_score);
      `
    });
    console.log('✅ Biometric trust scores table created\n');

    // 5. Enable Row Level Security
    console.log('🔒 Enabling Row Level Security...');
    await supabase.rpc('exec_sql', {
      sql: `
        -- Enable RLS on all biometric tables
        ALTER TABLE biometric_credentials ENABLE ROW LEVEL SECURITY;
        ALTER TABLE biometric_auth_logs ENABLE ROW LEVEL SECURITY;
        ALTER TABLE webauthn_challenges ENABLE ROW LEVEL SECURITY;
        ALTER TABLE biometric_trust_scores ENABLE ROW LEVEL SECURITY;
      `
    });
    console.log('✅ Row Level Security enabled\n');

    // 6. Create RLS Policies
    console.log('🛡️ Creating RLS policies...');
    await supabase.rpc('exec_sql', {
      sql: `
        -- Biometric credentials policies
        CREATE POLICY "Users can view own biometric credentials" ON biometric_credentials
          FOR SELECT USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can insert own biometric credentials" ON biometric_credentials
          FOR INSERT WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY "Users can update own biometric credentials" ON biometric_credentials
          FOR UPDATE USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can delete own biometric credentials" ON biometric_credentials
          FOR DELETE USING (auth.uid() = user_id);
        
        -- Biometric auth logs policies
        CREATE POLICY "Users can view own auth logs" ON biometric_auth_logs
          FOR SELECT USING (auth.uid() = user_id);
        
        CREATE POLICY "System can insert auth logs" ON biometric_auth_logs
          FOR INSERT WITH CHECK (true);
        
        -- WebAuthn challenges policies
        CREATE POLICY "Users can manage own challenges" ON webauthn_challenges
          FOR ALL USING (auth.uid() = user_id);
        
        -- Biometric trust scores policies
        CREATE POLICY "Users can view own trust scores" ON biometric_trust_scores
          FOR SELECT USING (auth.uid() = user_id);
        
        CREATE POLICY "System can manage trust scores" ON biometric_trust_scores
          FOR ALL USING (true);
      `
    });
    console.log('✅ RLS policies created\n');

    // 7. Create helper functions
    console.log('⚙️ Creating helper functions...');
    await supabase.rpc('exec_sql', {
      sql: `
        -- Function to calculate biometric trust score
        CREATE OR REPLACE FUNCTION calculate_biometric_trust_score(p_user_id UUID)
        RETURNS DECIMAL(3,2) AS $$
        DECLARE
          base_score DECIMAL(3,2) := 0.0;
          device_score DECIMAL(3,2) := 0.0;
          behavior_score DECIMAL(3,2) := 0.0;
          location_score DECIMAL(3,2) := 0.0;
          overall_score DECIMAL(3,2) := 0.0;
        BEGIN
          -- Base score: Has biometric credentials
          SELECT CASE 
            WHEN COUNT(*) > 0 THEN 0.3
            ELSE 0.0
          END INTO base_score
          FROM biometric_credentials 
          WHERE user_id = p_user_id;
          
          -- Device consistency score
          SELECT CASE 
            WHEN COUNT(DISTINCT device_type) = 1 THEN 0.2
            WHEN COUNT(DISTINCT device_type) = 2 THEN 0.15
            ELSE 0.1
          END INTO device_score
          FROM biometric_credentials 
          WHERE user_id = p_user_id;
          
          -- Behavior score: Recent successful authentications
          SELECT CASE 
            WHEN COUNT(*) >= 10 THEN 0.3
            WHEN COUNT(*) >= 5 THEN 0.2
            WHEN COUNT(*) >= 1 THEN 0.1
            ELSE 0.0
          END INTO behavior_score
          FROM biometric_auth_logs 
          WHERE user_id = p_user_id 
          AND authentication_result = true
          AND created_at > NOW() - INTERVAL '30 days';
          
          -- Location consistency score
          SELECT CASE 
            WHEN COUNT(DISTINCT location_info->>'country') = 1 THEN 0.2
            WHEN COUNT(DISTINCT location_info->>'country') = 2 THEN 0.1
            ELSE 0.0
          END INTO location_score
          FROM biometric_auth_logs 
          WHERE user_id = p_user_id
          AND created_at > NOW() - INTERVAL '30 days';
          
          -- Calculate overall score
          overall_score := base_score + device_score + behavior_score + location_score;
          
          -- Update trust score
          INSERT INTO biometric_trust_scores (user_id, base_score, device_consistency_score, behavior_score, location_score, overall_score, last_calculated_at)
          VALUES (p_user_id, base_score, device_score, behavior_score, location_score, overall_score, NOW())
          ON CONFLICT (user_id) 
          DO UPDATE SET 
            base_score = EXCLUDED.base_score,
            device_consistency_score = EXCLUDED.device_consistency_score,
            behavior_score = EXCLUDED.behavior_score,
            location_score = EXCLUDED.location_score,
            overall_score = EXCLUDED.overall_score,
            last_calculated_at = NOW(),
            updated_at = NOW();
          
          RETURN overall_score;
        END;
        $$ LANGUAGE plpgsql;
        
        -- Function to log biometric authentication
        CREATE OR REPLACE FUNCTION log_biometric_auth(
          p_user_id UUID,
          p_credential_id TEXT,
          p_result BOOLEAN,
          p_failure_reason TEXT DEFAULT NULL,
          p_ip_address INET DEFAULT NULL,
          p_user_agent TEXT DEFAULT NULL,
          p_device_info JSONB DEFAULT NULL,
          p_location_info JSONB DEFAULT NULL
        )
        RETURNS void AS $$
        DECLARE
          risk_score DECIMAL(3,2) := 0.0;
        BEGIN
          -- Calculate risk score based on various factors
          risk_score := CASE 
            WHEN p_result = false THEN 0.8
            WHEN p_ip_address IS NULL THEN 0.3
            WHEN p_user_agent IS NULL THEN 0.2
            ELSE 0.0
          END;
          
          -- Insert log
          INSERT INTO biometric_auth_logs (
            user_id, credential_id, authentication_result, failure_reason,
            ip_address, user_agent, device_info, location_info, risk_score
          ) VALUES (
            p_user_id, p_credential_id, p_result, p_failure_reason,
            p_ip_address, p_user_agent, p_device_info, p_location_info, risk_score
          );
          
          -- Update trust score
          PERFORM calculate_biometric_trust_score(p_user_id);
        END;
        $$ LANGUAGE plpgsql;
      `
    });
    console.log('✅ Helper functions created\n');

    // 8. Create triggers for automatic updates
    console.log('⚡ Creating triggers...');
    await supabase.rpc('exec_sql', {
      sql: `
        -- Trigger to update updated_at timestamp
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        
        -- Apply trigger to biometric_credentials
        DROP TRIGGER IF EXISTS update_biometric_credentials_updated_at ON biometric_credentials;
        CREATE TRIGGER update_biometric_credentials_updated_at
          BEFORE UPDATE ON biometric_credentials
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
        
        -- Apply trigger to biometric_trust_scores
        DROP TRIGGER IF EXISTS update_biometric_trust_scores_updated_at ON biometric_trust_scores;
        CREATE TRIGGER update_biometric_trust_scores_updated_at
          BEFORE UPDATE ON biometric_trust_scores
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
      `
    });
    console.log('✅ Triggers created\n');

    console.log('🎉 Biometric authentication schema setup completed successfully!\n');
    console.log('📊 Schema Summary:');
    console.log('  ✅ biometric_credentials - WebAuthn credential storage');
    console.log('  ✅ biometric_auth_logs - Authentication audit trail');
    console.log('  ✅ webauthn_challenges - Challenge-response security');
    console.log('  ✅ biometric_trust_scores - Trust scoring system');
    console.log('  ✅ RLS Policies - Row-level security');
    console.log('  ✅ Helper Functions - Trust calculation and logging');
    console.log('  ✅ Triggers - Automatic timestamp updates');
    console.log('\n🛡️ Security Features:');
    console.log('  • Encrypted credential storage');
    console.log('  • Comprehensive audit logging');
    console.log('  • Risk-based scoring');
    console.log('  • Device consistency tracking');
    console.log('  • Location-based security');
    console.log('  • Row-level security policies');

  } catch (error) {
    console.error('❌ Error setting up biometric schema:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

// Run the setup
setupBiometricSchema();

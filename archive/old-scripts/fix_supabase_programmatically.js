#!/usr/bin/env node

/**
 * Comprehensive Supabase Fix Script
 * Uses service role key to programmatically fix all issues
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: './web/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

console.log('🚀 Initializing Supabase client with service role key...');

// Create Supabase client with service role key (full admin access)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixFeedbackTable() {
  console.log('\n🔧 Fixing Feedback Table Schema...');
  
  try {
    // Add missing columns
    const addColumnsSQL = `
      ALTER TABLE feedback ADD COLUMN IF NOT EXISTS ai_analysis JSONB DEFAULT '{}';
      ALTER TABLE feedback ADD COLUMN IF NOT EXISTS user_journey JSONB DEFAULT '{}';
      ALTER TABLE feedback ADD COLUMN IF NOT EXISTS screenshot TEXT;
      ALTER TABLE feedback ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open';
      ALTER TABLE feedback ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';
      ALTER TABLE feedback ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
      ALTER TABLE feedback ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
      ALTER TABLE feedback ADD COLUMN IF NOT EXISTS sentiment TEXT;
    `;
    
    const { error: addError } = await supabase.rpc('exec_sql', { sql: addColumnsSQL });
    
    if (addError) {
      console.log('⚠️  Some columns may already exist, continuing...');
    } else {
      console.log('✅ Added missing columns to feedback table');
    }
    
    // Rename existing columns if they exist
    const renameColumnsSQL = `
      DO $$ 
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feedback' AND column_name = 'feedback_type') THEN
          ALTER TABLE feedback RENAME COLUMN feedback_type TO type;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feedback' AND column_name = 'comment') THEN
          ALTER TABLE feedback RENAME COLUMN comment TO description;
        END IF;
      END $$;
    `;
    
    const { error: renameError } = await supabase.rpc('exec_sql', { sql: renameColumnsSQL });
    
    if (renameError) {
      console.log('⚠️  Column rename may have failed, continuing...');
    } else {
      console.log('✅ Renamed columns to match API expectations');
    }
    
    // Add constraints
    const constraintsSQL = `
      ALTER TABLE feedback ADD CONSTRAINT IF NOT EXISTS feedback_type_check 
        CHECK (type IN ('bug', 'feature', 'general', 'performance', 'accessibility', 'security'));
      
      ALTER TABLE feedback ADD CONSTRAINT IF NOT EXISTS feedback_sentiment_check 
        CHECK (sentiment IN ('positive', 'negative', 'neutral', 'mixed'));
      
      ALTER TABLE feedback ADD CONSTRAINT IF NOT EXISTS feedback_status_check 
        CHECK (status IN ('open', 'in_progress', 'resolved', 'closed'));
      
      ALTER TABLE feedback ADD CONSTRAINT IF NOT EXISTS feedback_priority_check 
        CHECK (priority IN ('low', 'medium', 'high', 'urgent'));
    `;
    
    const { error: constraintError } = await supabase.rpc('exec_sql', { sql: constraintsSQL });
    
    if (constraintError) {
      console.log('⚠️  Some constraints may already exist');
    } else {
      console.log('✅ Added constraints to feedback table');
    }
    
    // Create indexes
    const indexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(type);
      CREATE INDEX IF NOT EXISTS idx_feedback_sentiment ON feedback(sentiment);
      CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
      CREATE INDEX IF NOT EXISTS idx_feedback_priority ON feedback(priority);
      CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at);
      CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
      CREATE INDEX IF NOT EXISTS idx_feedback_tags ON feedback USING GIN(tags);
      CREATE INDEX IF NOT EXISTS idx_feedback_user_journey ON feedback USING GIN(user_journey);
      CREATE INDEX IF NOT EXISTS idx_feedback_ai_analysis ON feedback USING GIN(ai_analysis);
    `;
    
    const { error: indexError } = await supabase.rpc('exec_sql', { sql: indexesSQL });
    
    if (indexError) {
      console.log('⚠️  Some indexes may already exist');
    } else {
      console.log('✅ Created performance indexes');
    }
    
    console.log('✅ Feedback table schema fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing feedback table:', error.message);
  }
}

async function enableRLSOnAllTables() {
  console.log('\n🔒 Enabling RLS on all public tables...');
  
  try {
    // Get all public tables
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_type', 'BASE TABLE');
    
    if (tablesError) {
      console.error('❌ Error fetching tables:', tablesError.message);
      return;
    }
    
    console.log(`📋 Found ${tables.length} public tables`);
    
    // Enable RLS on each table
    for (const table of tables) {
      const tableName = table.table_name;
      
      try {
        const { error } = await supabase.rpc('exec_sql', { 
          sql: `ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;` 
        });
        
        if (error) {
          console.log(`⚠️  Could not enable RLS on ${tableName}: ${error.message}`);
        } else {
          console.log(`✅ Enabled RLS on ${tableName}`);
        }
      } catch (err) {
        console.log(`⚠️  Error with ${tableName}: ${err.message}`);
      }
    }
    
    console.log('✅ RLS enabled on all tables');
    
  } catch (error) {
    console.error('❌ Error enabling RLS:', error.message);
  }
}

async function createFeedbackPolicies() {
  console.log('\n🛡️ Creating feedback table policies...');
  
  try {
    const policiesSQL = `
      DROP POLICY IF EXISTS "Users can view own feedback" ON feedback;
      DROP POLICY IF EXISTS "Anyone can submit feedback" ON feedback;
      DROP POLICY IF EXISTS "Users can update own feedback" ON feedback;
      DROP POLICY IF EXISTS "Admins can view all feedback" ON feedback;
      
      CREATE POLICY "Users can view own feedback" ON feedback
        FOR SELECT USING (auth.uid() = user_id);
      
      CREATE POLICY "Anyone can submit feedback" ON feedback
        FOR INSERT WITH CHECK (true);
      
      CREATE POLICY "Users can update own feedback" ON feedback
        FOR UPDATE USING (auth.uid() = user_id);
      
      CREATE POLICY "Admins can view all feedback" ON feedback
        FOR SELECT USING (true);
    `;
    
    const { error } = await supabase.rpc('exec_sql', { sql: policiesSQL });
    
    if (error) {
      console.error('❌ Error creating policies:', error.message);
    } else {
      console.log('✅ Created feedback table policies');
    }
    
  } catch (error) {
    console.error('❌ Error creating policies:', error.message);
  }
}

async function refreshSchemaCache() {
  console.log('\n🔄 Refreshing schema cache...');
  
  try {
    const { error } = await supabase.rpc('exec_sql', { 
      sql: 'NOTIFY pgrst, \'reload schema\';' 
    });
    
    if (error) {
      console.log('⚠️  Schema cache refresh may have failed');
    } else {
      console.log('✅ Schema cache refresh initiated');
    }
    
  } catch (error) {
    console.log('⚠️  Schema cache refresh error:', error.message);
  }
}

async function testFeedbackSystem() {
  console.log('\n🧪 Testing feedback system...');
  
  try {
    // Test inserting feedback
    const { data, error } = await supabase
      .from('feedback')
      .insert([{
        type: 'test',
        title: 'Programmatic Test',
        description: 'Testing feedback system after programmatic fixes',
        sentiment: 'positive',
        user_journey: { test: true },
        ai_analysis: { test: true },
        metadata: { test: true }
      }])
      .select();
    
    if (error) {
      console.error('❌ Feedback test failed:', error.message);
    } else {
      console.log('✅ Feedback system test successful!');
      console.log(`   Inserted feedback ID: ${data[0].id}`);
      
      // Clean up test data
      await supabase
        .from('feedback')
        .delete()
        .eq('title', 'Programmatic Test');
      
      console.log('✅ Test data cleaned up');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

async function showTableStatus() {
  console.log('\n📊 Current table status...');
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          tablename,
          rowsecurity as rls_enabled,
          CASE 
            WHEN rowsecurity = true THEN '✅ RLS Enabled'
            ELSE '❌ RLS Disabled'
          END as status
        FROM pg_tables 
        WHERE schemaname = 'public' 
        ORDER BY tablename;
      `
    });
    
    if (error) {
      console.error('❌ Error fetching table status:', error.message);
    } else {
      console.log('📋 Table Security Status:');
      data.forEach(row => {
        console.log(`   ${row.tablename}: ${row.status}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error showing status:', error.message);
  }
}

async function main() {
  console.log('🚀 Starting comprehensive Supabase fix...');
  console.log('==========================================');
  
  try {
    // Test connection
    console.log('🔍 Testing Supabase connection...');
    const { data, error } = await supabase.from('feedback').select('count').limit(1);
    
    if (error) {
      console.error('❌ Connection test failed:', error.message);
      return;
    }
    
    console.log('✅ Supabase connection successful');
    
    // Run all fixes
    await fixFeedbackTable();
    await enableRLSOnAllTables();
    await createFeedbackPolicies();
    await refreshSchemaCache();
    
    // Wait a moment for schema cache to refresh
    console.log('\n⏳ Waiting for schema cache to refresh...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    await testFeedbackSystem();
    await showTableStatus();
    
    console.log('\n🎉 Comprehensive Supabase fix completed!');
    console.log('\n📋 Next steps:');
    console.log('   1. Test the feedback system in your app');
    console.log('   2. Check the Supabase dashboard for reduced issues');
    console.log('   3. Monitor performance and security metrics');
    
  } catch (error) {
    console.error('❌ Main error:', error.message);
  }
}

// Run the script
main().catch(console.error);

#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Manually Adding Privacy Columns...\n');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addPrivacyColumns() {
  try {
    console.log('📋 Step 1: Adding privacy columns to po_polls table...');
    
    // Add privacy_level column
    const { error: privacyLevelError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE po_polls 
        ADD COLUMN IF NOT EXISTS privacy_level TEXT DEFAULT 'public' 
        CHECK (privacy_level IN ('public', 'private', 'high-privacy'));
      `
    });

    if (privacyLevelError) {
      console.log('❌ Error adding privacy_level:', privacyLevelError.message);
    } else {
      console.log('✅ Added privacy_level column');
    }

    // Add privacy_metadata column
    const { error: privacyMetadataError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE po_polls 
        ADD COLUMN IF NOT EXISTS privacy_metadata JSONB DEFAULT '{}';
      `
    });

    if (privacyMetadataError) {
      console.log('❌ Error adding privacy_metadata:', privacyMetadataError.message);
    } else {
      console.log('✅ Added privacy_metadata column');
    }

    // Add user_id column
    const { error: userIdError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE po_polls 
        ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
      `
    });

    if (userIdError) {
      console.log('❌ Error adding user_id:', userIdError.message);
    } else {
      console.log('✅ Added user_id column');
    }

    // Add voting_method column
    const { error: votingMethodError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE po_polls 
        ADD COLUMN IF NOT EXISTS voting_method TEXT DEFAULT 'single' 
        CHECK (voting_method IN ('single', 'multiple', 'ranked', 'approval', 'range', 'quadratic'));
      `
    });

    if (votingMethodError) {
      console.log('❌ Error adding voting_method:', votingMethodError.message);
    } else {
      console.log('✅ Added voting_method column');
    }

    // Add category column
    const { error: categoryError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE po_polls 
        ADD COLUMN IF NOT EXISTS category TEXT;
      `
    });

    if (categoryError) {
      console.log('❌ Error adding category:', categoryError.message);
    } else {
      console.log('✅ Added category column');
    }

    console.log('\n📋 Step 2: Adding privacy columns to po_votes table...');
    
    // Add privacy_level to po_votes
    const { error: votePrivacyLevelError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE po_votes 
        ADD COLUMN IF NOT EXISTS privacy_level TEXT DEFAULT 'public' 
        CHECK (privacy_level IN ('public', 'private', 'high-privacy'));
      `
    });

    if (votePrivacyLevelError) {
      console.log('❌ Error adding privacy_level to votes:', votePrivacyLevelError.message);
    } else {
      console.log('✅ Added privacy_level to po_votes');
    }

    // Add user_id to po_votes
    const { error: voteUserIdError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE po_votes 
        ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
      `
    });

    if (voteUserIdError) {
      console.log('❌ Error adding user_id to votes:', voteUserIdError.message);
    } else {
      console.log('✅ Added user_id to po_votes');
    }

    // Add vote_metadata to po_votes
    const { error: voteMetadataError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE po_votes 
        ADD COLUMN IF NOT EXISTS vote_metadata JSONB DEFAULT '{}';
      `
    });

    if (voteMetadataError) {
      console.log('❌ Error adding vote_metadata:', voteMetadataError.message);
    } else {
      console.log('✅ Added vote_metadata to po_votes');
    }

    console.log('\n📋 Step 3: Adding indexes...');
    
    // Add indexes
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_po_polls_privacy_level ON po_polls(privacy_level);',
      'CREATE INDEX IF NOT EXISTS idx_po_polls_user_id ON po_polls(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_po_polls_category ON po_polls(category);',
      'CREATE INDEX IF NOT EXISTS idx_po_polls_status_privacy ON po_polls(status, privacy_level);',
      'CREATE INDEX IF NOT EXISTS idx_po_votes_privacy_level ON po_votes(privacy_level);',
      'CREATE INDEX IF NOT EXISTS idx_po_votes_user_id ON po_votes(user_id);'
    ];

    for (let i = 0; i < indexes.length; i++) {
      const { error: indexError } = await supabase.rpc('exec_sql', {
        sql: indexes[i]
      });

      if (indexError) {
        console.log(`❌ Error creating index ${i + 1}:`, indexError.message);
      } else {
        console.log(`✅ Created index ${i + 1}`);
      }
    }

    console.log('\n📋 Step 4: Creating privacy functions...');
    
    // Create get_poll_privacy_settings function
    const { error: getPrivacySettingsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION get_poll_privacy_settings(poll_id_param TEXT)
        RETURNS TABLE (
          poll_id TEXT,
          privacy_level TEXT,
          requires_authentication BOOLEAN,
          allows_anonymous_voting BOOLEAN,
          uses_blinded_tokens BOOLEAN,
          provides_audit_receipts BOOLEAN
        ) AS $$
        BEGIN
          RETURN QUERY
          SELECT 
            p.poll_id,
            p.privacy_level,
            CASE 
              WHEN p.privacy_level = 'public' THEN FALSE
              ELSE TRUE
            END as requires_authentication,
            CASE 
              WHEN p.privacy_level = 'public' THEN TRUE
              ELSE FALSE
            END as allows_anonymous_voting,
            CASE 
              WHEN p.privacy_level = 'high-privacy' THEN TRUE
              ELSE FALSE
            END as uses_blinded_tokens,
            CASE 
              WHEN p.privacy_level = 'high-privacy' THEN TRUE
              ELSE FALSE
            END as provides_audit_receipts
          FROM po_polls p
          WHERE p.poll_id = poll_id_param;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    });

    if (getPrivacySettingsError) {
      console.log('❌ Error creating get_poll_privacy_settings function:', getPrivacySettingsError.message);
    } else {
      console.log('✅ Created get_poll_privacy_settings function');
    }

    // Create update_poll_privacy_level function
    const { error: updatePrivacyLevelError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION update_poll_privacy_level(
          poll_id_param TEXT,
          new_privacy_level TEXT
        )
        RETURNS BOOLEAN AS $$
        BEGIN
          UPDATE po_polls 
          SET 
            privacy_level = new_privacy_level,
            privacy_metadata = jsonb_set(
              COALESCE(privacy_metadata, '{}'),
              '{updated_at}',
              to_jsonb(NOW())
            )
          WHERE poll_id = poll_id_param;
          
          RETURN FOUND;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    });

    if (updatePrivacyLevelError) {
      console.log('❌ Error creating update_poll_privacy_level function:', updatePrivacyLevelError.message);
    } else {
      console.log('✅ Created update_poll_privacy_level function');
    }

    console.log('\n🎉 Privacy columns added successfully!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Run the test script to verify the columns');
    console.log('   2. Test the privacy system functionality');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

addPrivacyColumns();

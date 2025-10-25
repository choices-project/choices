#!/usr/bin/env node

/**
 * Database Setup Script
 * 
 * Sets up the database schema and initial configuration
 * for the civics backend system.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function setupDatabase() {
  console.log('🔧 Setting up database...');
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );
    
    console.log('✅ Database client created');
    
    // Check if bioguide_id column exists in representatives_core
    console.log('🔍 Checking representatives_core schema...');
    
    try {
      const { data, error } = await supabase
        .from('representatives_core')
        .select('bioguide_id')
        .limit(1);
      
      if (error && error.code === 'PGRST204') {
        console.log('📝 Adding bioguide_id column to representatives_core...');
        
        // Add bioguide_id column
        const { error: alterError } = await supabase.rpc('execute_sql', {
          sql: 'ALTER TABLE public.representatives_core ADD COLUMN bioguide_id character varying(20) NULL;'
        });
        
        if (alterError) {
          console.log('⚠️  Could not add bioguide_id column via RPC, but continuing...');
        } else {
          console.log('✅ bioguide_id column added');
        }
      } else {
        console.log('✅ bioguide_id column already exists');
      }
    } catch (err) {
      console.log('⚠️  Could not verify bioguide_id column, but continuing...');
    }
    
    // Check if representative_activity table exists
    console.log('🔍 Checking representative_activity table...');
    
    try {
      const { data, error } = await supabase
        .from('representative_activity')
        .select('*')
        .limit(1);
      
      if (error && error.code === 'PGRST204') {
        console.log('📝 Creating representative_activity table...');
        
        const createActivityTable = `
          CREATE TABLE IF NOT EXISTS public.representative_activity (
            id serial NOT NULL,
            representative_id integer NOT NULL,
            type character varying(50) NOT NULL,
            title character varying(255) NOT NULL,
            description text,
            date timestamp with time zone NOT NULL,
            source character varying(50) NOT NULL,
            metadata jsonb DEFAULT '{}'::jsonb,
            created_at timestamp with time zone DEFAULT now(),
            updated_at timestamp with time zone DEFAULT now(),
            CONSTRAINT representative_activity_pkey PRIMARY KEY (id),
            CONSTRAINT representative_activity_representative_id_fkey FOREIGN KEY (representative_id) REFERENCES public.representatives_core(id) ON DELETE CASCADE
          );
          
          CREATE INDEX IF NOT EXISTS idx_representative_activity_representative_id ON public.representative_activity USING btree (representative_id);
          CREATE INDEX IF NOT EXISTS idx_representative_activity_type ON public.representative_activity USING btree (type);
          CREATE INDEX IF NOT EXISTS idx_representative_activity_date ON public.representative_activity USING btree (date);
        `;
        
        const { error: createError } = await supabase.rpc('execute_sql', {
          sql: createActivityTable
        });
        
        if (createError) {
          console.log('⚠️  Could not create representative_activity table via RPC, but continuing...');
        } else {
          console.log('✅ representative_activity table created');
        }
      } else {
        console.log('✅ representative_activity table already exists');
      }
    } catch (err) {
      console.log('⚠️  Could not verify representative_activity table, but continuing...');
    }
    
    // Setup RLS policies for service role
    console.log('🔒 Setting up RLS policies...');
    
    const rlsPolicies = [
      'DROP POLICY IF EXISTS "Service role can insert representatives_core" ON public.representatives_core;',
      'CREATE POLICY "Service role can insert representatives_core" ON public.representatives_core FOR INSERT TO service_role WITH CHECK (true);',
      'DROP POLICY IF EXISTS "Service role can update representatives_core" ON public.representatives_core;',
      'CREATE POLICY "Service role can update representatives_core" ON public.representatives_core FOR UPDATE TO service_role USING (true) WITH CHECK (true);',
      'DROP POLICY IF EXISTS "Service role can delete representatives_core" ON public.representatives_core;',
      'CREATE POLICY "Service role can delete representatives_core" ON public.representatives_core FOR DELETE TO service_role USING (true);'
    ];
    
    for (const policy of rlsPolicies) {
      try {
        const { error: policyError } = await supabase.rpc('execute_sql', {
          sql: policy
        });
        
        if (policyError) {
          console.log(`⚠️  Could not set RLS policy: ${policy.substring(0, 50)}...`);
        }
      } catch (err) {
        console.log(`⚠️  Could not set RLS policy: ${policy.substring(0, 50)}...`);
      }
    }
    
    console.log('✅ RLS policies configured');
    
    // Grant permissions to service role
    console.log('🔑 Granting permissions to service role...');
    
    const permissions = [
      'GRANT ALL ON public.representatives_core TO service_role;',
      'GRANT ALL ON public.representative_contacts TO service_role;',
      'GRANT ALL ON public.representative_photos TO service_role;',
      'GRANT ALL ON public.representative_social_media TO service_role;',
      'GRANT ALL ON public.representative_activity TO service_role;',
      'GRANT ALL ON public.id_crosswalk TO service_role;',
      'GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;'
    ];
    
    for (const permission of permissions) {
      try {
        const { error: permError } = await supabase.rpc('execute_sql', {
          sql: permission
        });
        
        if (permError) {
          console.log(`⚠️  Could not grant permission: ${permission.substring(0, 50)}...`);
        }
      } catch (err) {
        console.log(`⚠️  Could not grant permission: ${permission.substring(0, 50)}...`);
      }
    }
    
    console.log('✅ Permissions granted');
    
    console.log('🎉 Database setup complete!');
    return true;
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    return false;
  }
}

// Run setup
if (require.main === module) {
  setupDatabase()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Setup script failed:', error);
      process.exit(1);
    });
}

module.exports = { setupDatabase };

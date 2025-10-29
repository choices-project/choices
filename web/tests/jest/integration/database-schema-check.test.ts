import { describe, it, expect, beforeAll } from '@jest/globals';

/**
 * Database Schema Check Integration Test
 * 
 * Checks what tables and schema exist in the database
 * 
 * Created: January 27, 2025
 * Status: ✅ PRODUCTION READY
 */

describe('Database Schema Check', () => {
  let supabase: any;

  beforeAll(async () => {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not found');
    }
    
    supabase = createClient(supabaseUrl, supabaseKey);
  });

  it('should list all tables in the database', async () => {
    console.log('🔍 Checking database schema...');
    
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_schema')
      .eq('table_schema', 'public');

    console.log('Tables query result:', { tables, error });
    
    if (error) {
      console.log('❌ Error querying tables:', error);
      throw error;
    }

    expect(tables).toBeDefined();
    console.log('📋 Available tables:', tables?.map((t: any) => t.table_name));
  });

  it('should check polls table structure', async () => {
    console.log('🔍 Checking polls table structure...');
    
    const { data: columns, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'polls')
      .eq('table_schema', 'public');

    console.log('Polls columns query result:', { columns, error });
    
    if (error) {
      console.log('❌ Error querying polls columns:', error);
      throw error;
    }

    expect(columns).toBeDefined();
    console.log('📋 Polls table columns:', columns?.map((c: any) => ({
      name: c.column_name,
      type: c.data_type,
      nullable: c.is_nullable,
      default: c.column_default
    })));
  });

  it('should check if polls table has any data', async () => {
    console.log('🔍 Checking polls table data...');
    
    const { data: polls, error, count } = await supabase
      .from('polls')
      .select('*', { count: 'exact' })
      .limit(5);

    console.log('Polls data query result:', { polls, error, count });
    
    if (error) {
      console.log('❌ Error querying polls data:', error);
      throw error;
    }

    console.log(`📊 Polls table has ${count} records`);
    if (polls && polls.length > 0) {
      console.log('📋 Sample poll data:', polls[0]);
    }
  });

  it('should check database permissions', async () => {
    console.log('🔍 Checking database permissions...');
    
    // Try to insert a simple test record
    const testData = {
      title: 'Test Poll',
      description: 'Test Description',
      options: ['Option 1', 'Option 2'],
      poll_type: 'single_choice',
      status: 'draft',
      created_by: 'test-user'
    };

    const { data: insertResult, error: insertError } = await supabase
      .from('polls')
      .insert(testData)
      .select();

    console.log('Insert test result:', { insertResult, insertError });
    
    if (insertError) {
      console.log('❌ Insert permission error:', insertError);
      console.log('Error details:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      });
    } else {
      console.log('✅ Insert permission test passed');
      
      // Clean up the test record
      if (insertResult && insertResult.length > 0) {
        const { error: deleteError } = await supabase
          .from('polls')
          .delete()
          .eq('id', insertResult[0].id);
        
        if (deleteError) {
          console.log('⚠️ Could not clean up test record:', deleteError);
        } else {
          console.log('🧹 Test record cleaned up');
        }
      }
    }
  });
});
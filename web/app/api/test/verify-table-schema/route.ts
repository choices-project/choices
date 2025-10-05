import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireServiceKey } from '@/lib/service-auth';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
);

export async function GET(request: NextRequest) {
  try {
    // Require service key authentication
    const serviceCheck = await requireServiceKey();
    if (serviceCheck) return serviceCheck;
    
    // Test inserting a simple record into representative_contacts
    const testContact = {
      representative_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
      type: 'email',
      value: 'test@example.com',
      label: 'Test',
      is_primary: false,
      is_verified: false,
      source: 'test'
    };
    
    const { data, error } = await supabase
      .from('representative_contacts')
      .insert(testContact)
      .select();
    
    if (error) {
      return NextResponse.json({
        success: false,
        error: `Table schema issue: ${error.message}`,
        errorCode: error.code,
        errorDetails: error.details,
        hint: error.hint,
        recommendation: 'The representative_contacts table may not have the correct schema. Run create-missing-tables.sql in Supabase SQL Editor.'
      });
    }
    
    // If successful, clean up the test record
    await supabase
      .from('representative_contacts')
      .delete()
      .eq('value', 'test@example.com');
    
    return NextResponse.json({
      success: true,
      message: 'Table schema is correct!',
      testResult: 'representative_contacts table has proper schema'
    });
    
  } catch (error) {
    console.error('Schema verification failed:', error);
    return NextResponse.json({
      success: false,
      error: `Schema verification failed: ${error}`,
      recommendation: 'Run create-missing-tables.sql in Supabase SQL Editor to create the proper table schema'
    }, { status: 500 });
  }
}

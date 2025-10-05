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

export async function POST(request: NextRequest) {
  try {
    // Require service key authentication
    const serviceCheck = await requireServiceKey();
    if (serviceCheck) return serviceCheck;
    
    console.log('🔧 Fixing photo constraint issue...');
    
    // Check current table structure
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'representative_photos');
    
    if (tableError) {
      return NextResponse.json({
        success: false,
        error: `Failed to check table structure: ${tableError.message}`
      });
    }
    
    console.log('📋 Current representative_photos table structure:', tableInfo);
    
    // Check if the table exists and has the right columns
    if (!tableInfo || tableInfo.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'representative_photos table does not exist'
      });
    }
    
    // Test a simple insert to see what the actual error is
    const testPhoto = {
      representative_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
      url: 'https://example.com/test.jpg',
      source: 'test',
      quality: 'high',
      is_primary: true,
      width: 200,
      height: 200,
      alt_text: 'Test photo'
    };
    
    const { data: insertResult, error: insertError } = await supabase
      .from('representative_photos')
      .insert(testPhoto)
      .select();
    
    if (insertError) {
      console.log('❌ Insert error details:', insertError);
      
      // Check if it's a constraint issue
      if (insertError.message.includes('constraint') || insertError.message.includes('conflict')) {
        return NextResponse.json({
          success: false,
          error: 'Photo constraint issue identified',
          details: insertError.message,
          tableStructure: tableInfo,
          recommendations: [
            'The onConflict parameter may be incorrect',
            'Check if representative_id exists in representatives_core',
            'Verify the constraint name and columns',
            'Try using a different conflict resolution strategy'
          ]
        });
      }
    }
    
    // Clean up test data
    await supabase
      .from('representative_photos')
      .delete()
      .eq('representative_id', '00000000-0000-0000-0000-000000000000');
    
    return NextResponse.json({
      success: true,
      message: 'Photo constraint test completed',
      tableStructure: tableInfo,
      testResult: insertResult,
      status: 'Table structure looks correct'
    });
    
  } catch (error) {
    console.error('Photo constraint fix failed:', error);
    return NextResponse.json({
      success: false,
      error: `Photo constraint fix failed: ${error}`,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

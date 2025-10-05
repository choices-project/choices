/**
 * Database Schema Inspector
 * 
 * Checks the actual database schema to see what tables and columns exist
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

export const dynamic = 'force-dynamic';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
);

export async function GET() {
  try {
    console.log('🔍 Inspecting database schema...');

    // Check if representatives_core table exists and get its structure
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'representatives_core')
      .eq('table_schema', 'public');

    if (tableError) {
      throw new Error(`Failed to get table info: ${tableError.message}`);
    }

    // Check if id_crosswalk table exists
    const { data: crosswalkInfo, error: crosswalkError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'id_crosswalk')
      .eq('table_schema', 'public');

    // Get sample data from representatives_core
    const { data: sampleData, error: sampleError } = await supabase
      .from('representatives_core')
      .select('*')
      .limit(1);

    // Get sample data from id_crosswalk
    const { data: crosswalkData, error: crosswalkDataError } = await supabase
      .from('id_crosswalk')
      .select('*')
      .limit(1);

    return NextResponse.json({
      success: true,
      schema: {
        representatives_core: {
          exists: tableInfo && tableInfo.length > 0,
          columns: tableInfo || [],
          sampleData: sampleData || [],
          error: sampleError?.message
        },
        id_crosswalk: {
          exists: crosswalkInfo && crosswalkInfo.length > 0,
          columns: crosswalkInfo || [],
          sampleData: crosswalkData || [],
          error: crosswalkDataError?.message
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Database schema inspection failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Database schema inspection failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

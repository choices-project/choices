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
    
    const schema = {
      representatives_core: [] as string[],
      id_crosswalk: [] as string[],
      missingColumns: [] as string[],
      errors: [] as string[]
    };
    
    // Check representatives_core columns
    try {
      const { data, error } = await supabase
        .from('representatives_core')
        .select('*')
        .limit(1);
      
      if (error) {
        schema.errors.push(`representatives_core: ${error.message}`);
      } else if (data && data.length > 0) {
        schema.representatives_core = Object.keys(data[0]);
      }
    } catch (err) {
      schema.errors.push(`representatives_core check failed: ${err}`);
    }
    
    // Check id_crosswalk columns
    try {
      const { data, error } = await supabase
        .from('id_crosswalk')
        .select('*')
        .limit(1);
      
      if (error) {
        schema.errors.push(`id_crosswalk: ${error.message}`);
      } else if (data && data.length > 0) {
        schema.id_crosswalk = Object.keys(data[0]);
      }
    } catch (err) {
      schema.errors.push(`id_crosswalk check failed: ${err}`);
    }
    
    // Check for columns the code expects
    const expectedColumns = [
      'primary_email',
      'primary_phone', 
      'primary_website',
      'primary_photo_url',
      'data_sources',
      'data_quality_score',
      'verification_status',
      'last_verified'
    ];
    
    for (const column of expectedColumns) {
      if (!schema.representatives_core.includes(column)) {
        schema.missingColumns.push(column);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Schema column check completed',
      schema,
      summary: {
        representatives_core_columns: schema.representatives_core.length,
        id_crosswalk_columns: schema.id_crosswalk.length,
        missing_columns: schema.missingColumns.length,
        has_errors: schema.errors.length > 0
      },
      recommendations: schema.missingColumns.length > 0 ? [
        'Add missing columns to representatives_core table',
        'Run schema update SQL if needed'
      ] : [
        'Schema looks good!'
      ]
    });
    
  } catch (error) {
    console.error('Schema check failed:', error);
    return NextResponse.json({
      success: false,
      error: `Schema check failed: ${error}`,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

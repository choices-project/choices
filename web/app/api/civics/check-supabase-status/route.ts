import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireServiceKey } from '@/lib/service-auth';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
);

export async function GET(request: NextRequest) {
  try {
    // Log the request for debugging
    console.log('Supabase status check requested from:', request.headers.get('user-agent'));
    
    // Require service key authentication
    const serviceCheck = await requireServiceKey();
    if (serviceCheck) return serviceCheck;
    
    const status = {
      connection: false,
      rlsStatus: {} as Record<string, boolean>,
      tableCounts: {} as Record<string, number>,
      warnings: [] as string[],
      recommendations: [] as string[]
    };
    
    // Test database connection
    try {
      const { error } = await supabase
        .from('representatives_core')
        .select('id')
        .limit(1);
      
      if (error) {
        status.warnings.push(`Database connection error: ${error.message}`);
      } else {
        status.connection = true;
      }
    } catch (error) {
      status.warnings.push(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    // Check RLS status on key tables
    const tablesToCheck = [
      'representatives_core',
      'representative_contacts', 
      'representative_social_media',
      'representative_photos',
      'id_crosswalk',
      'data_quality_metrics'
    ];
    
    for (const table of tablesToCheck) {
      try {
        // Try to query the table (this will fail if RLS is blocking)
        const { error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          if (error.message.includes('row level security')) {
            status.rlsStatus[table] = true;
          } else {
            status.warnings.push(`${table}: ${error.message}`);
          }
        } else {
          status.rlsStatus[table] = false; // RLS not enabled
          status.recommendations.push(`Enable RLS on ${table}`);
        }
        
        // Get table count
        const { count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        status.tableCounts[table] = count || 0;
        
      } catch (error) {
        status.warnings.push(`${table} check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    // Check for common issues
    if (status.tableCounts.representatives_core === 0) {
      status.warnings.push('No representatives found in database');
    }
    
    if (Object.values(status.rlsStatus).every(enabled => !enabled)) {
      status.warnings.push('No RLS policies detected - security risk!');
      status.recommendations.push('Implement RLS policies immediately');
    }
    
    // Check for missing indexes
    try {
      const { data: indexData } = await supabase
        .rpc('get_table_indexes', { table_name: 'representatives_core' });
      
      if (!indexData || indexData.length === 0) {
        status.recommendations.push('Add performance indexes to representatives_core');
      }
    } catch {
      // Index check failed, not critical
    }
    
    return NextResponse.json({
      success: true,
      message: 'Supabase status check completed',
      status,
      timestamp: new Date().toISOString(),
      nextSteps: [
        'Review warnings and recommendations',
        'Implement RLS policies if needed',
        'Add performance indexes',
        'Monitor database performance'
      ]
    });
    
  } catch (error) {
    console.error('Supabase status check failed:', error);
    return NextResponse.json({
      success: false,
      error: `Status check failed: ${error}`,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

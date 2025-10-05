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
    
    const tablesToCheck = [
      'representatives_core',
      'id_crosswalk',
      'representative_contacts',
      'representative_social_media',
      'representative_photos',
      'representative_activity',
      'representative_committees',
      'representative_bills',
      'representative_speeches',
      'representative_accountability',
      'data_quality_metrics',
      'ingestion_logs',
      'api_usage_tracking'
    ];
    
    const tableStatus = {} as Record<string, { exists: boolean; columns: string[]; error?: string }>;
    
    for (const tableName of tablesToCheck) {
      try {
        // Try to query the table to see if it exists and get columns
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (error) {
          if (error.message.includes('does not exist') || error.message.includes('relation') || error.message.includes('42P01')) {
            tableStatus[tableName] = { exists: false, columns: [] };
          } else {
            tableStatus[tableName] = { exists: true, columns: [], error: error.message };
          }
        } else {
          // Table exists, get column names
          const columns = data && data.length > 0 ? Object.keys(data[0]) : [];
          tableStatus[tableName] = { exists: true, columns };
        }
      } catch (err) {
        tableStatus[tableName] = { exists: false, columns: [], error: String(err) };
      }
    }
    
    const summary = {
      totalTables: tablesToCheck.length,
      existingTables: Object.values(tableStatus).filter(t => t.exists).length,
      missingTables: Object.values(tableStatus).filter(t => !t.exists).length,
      coreTables: {
        representatives_core: tableStatus.representatives_core?.exists || false,
        id_crosswalk: tableStatus.id_crosswalk?.exists || false
      },
      detailTables: {
        representative_contacts: tableStatus.representative_contacts?.exists || false,
        representative_social_media: tableStatus.representative_social_media?.exists || false,
        representative_photos: tableStatus.representative_photos?.exists || false,
        representative_activity: tableStatus.representative_activity?.exists || false
      }
    };
    
    return NextResponse.json({
      success: true,
      message: 'Table existence check completed',
      tableStatus,
      summary,
      recommendations: summary.missingTables > 0 ? [
        'Run create-missing-tables.sql to create the missing tables',
        'Then run the enhanced hybrid ingestion'
      ] : [
        'All tables exist! Ready for enhanced hybrid ingestion'
      ]
    });
    
  } catch (error) {
    console.error('Table existence check failed:', error);
    return NextResponse.json({
      success: false,
      error: `Table existence check failed: ${error}`,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

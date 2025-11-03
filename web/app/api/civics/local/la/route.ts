import { NextResponse } from 'next/server';

import { logger } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    logger.info('Fetching Los Angeles local representatives');
    
    const supabase = await getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { 
          ok: false, 
          error: 'Database connection not available'
        },
        { status: 500 }
      );
    }
    
    const { data: representatives, error } = await supabase
      .from('representatives_core')
      .select('*')
      .eq('level', 'local')
      .eq('state', 'CA')
      .ilike('jurisdiction', '%Los Angeles%')
      .order('office', { ascending: true });
    
    if (error) {
      logger.error('Database error fetching LA local representatives:', error instanceof Error ? error : new Error(String(error)));
      return NextResponse.json(
        { 
          ok: false, 
          error: 'Failed to fetch LA local representatives',
          details: error instanceof Error ? error.message : String(error)
        },
        { status: 500 }
      );
    }
    
    if (!representatives || representatives.length === 0) {
      return NextResponse.json(
        { 
          ok: false, 
          error: 'No LA local representatives found',
          count: 0,
          data: []
        },
        { status: 404 }
      );
    }
    
    // Transform the data for the frontend
    const transformedData = representatives.map(rep => ({
      id: rep.id,
      name: rep.name,
      party: rep.party,
      office: rep.office,
      level: rep.level,
      jurisdiction: rep.jurisdiction,
      state: rep.state,
      district: rep.district,
      primary_email: rep.primary_email ?? null,
      primary_phone: rep.primary_phone ?? null,
      primary_website: rep.primary_website ?? null,
      data_sources: rep.data_sources ?? ['manual_verification_la'],
      last_verified: rep.last_verified ?? null,
      data_quality_score: rep.data_quality_score ?? 100,
      verification_status: rep.verification_status ?? 'verified'
    }));
    
    logger.info(`Found ${representatives.length} LA local representatives`);
    
    return NextResponse.json({
      ok: true,
      count: representatives.length,
      data: transformedData,
      source: 'manual_verification_la',
      last_updated: new Date().toISOString(),
      coverage: {
        mayor: 1,
        city_attorney: 1,
        controller: 1,
        city_council: 15,
        total: 18
      }
    });
    
  } catch (error) {
    logger.error('Unexpected error in LA local representatives API:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { 
        ok: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}


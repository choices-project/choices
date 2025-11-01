import { NextResponse } from 'next/server';

import { getSupabaseServerClient } from '@/utils/supabase/server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('🏙️ Fetching Los Angeles local representatives...');
    
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
      .from('civics_representatives')
      .select('*')
      .eq('level', 'local')
      .eq('jurisdiction', 'Los Angeles, CA')
      .order('office', { ascending: true });
    
    if (error) {
      console.error('❌ Database error:', error);
      return NextResponse.json(
        { 
          ok: false, 
          error: 'Failed to fetch LA local representatives',
          details: error.message 
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
      name: rep.name,
      party: rep.party,
      office: rep.office,
      level: rep.level,
      jurisdiction: rep.jurisdiction,
      district: rep.office.includes('District') ? 
        rep.office.match(/District (\d+)/)?.[1] || null : null,
      contact: rep.contact || null,
      data_source: rep.data_source || 'manual_verification_la',
      last_verified: rep.last_verified || null,
      data_quality_score: rep.data_quality_score || 100,
      verification_notes: rep.verification_notes || 'Manually verified current LA official'
    }));
    
    console.log(`✅ Found ${representatives.length} LA local representatives`);
    
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
    console.error('❌ Unexpected error:', error);
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


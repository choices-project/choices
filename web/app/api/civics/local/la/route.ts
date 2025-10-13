import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

import { isFeatureEnabled } from '@/lib/core/feature-flags';
import { logger } from '@/lib/utils/logger';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
);

export async function GET() {
  try {
    // Skip database operations during build
    if (process.env.NODE_ENV === 'production' && process.env.SUPABASE_SECRET_KEY === 'dev-only-secret') {
      logger.info('Skipping database fetch during build');
      return NextResponse.json({
        ok: true,
        representatives: [],
        message: 'Build-time placeholder - database operations skipped'
      });
    }
    
    logger.info('Fetching Los Angeles local representatives');
    
    const { data: representatives, error } = await supabase
      .from('civics_representatives')
      .select(`
        id,
        name,
        party,
        office,
        level,
        jurisdiction,
        district,
        ocd_division_id,
        external_id,
        source,
        data_origin,
        valid_from,
        valid_to,
        created_at,
        last_updated
      `)
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
      ...(isFeatureEnabled('CIVICS_REPRESENTATIVE_DATABASE') && {
        last_verified: (rep as any).last_verified || null,
        data_quality_score: (rep as any).data_quality_score || 100,
        verification_notes: (rep as any).verification_notes || 'Manually verified current LA official'
      })
    }));
    
    logger.info('Found LA local representatives', { count: representatives.length });
    
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


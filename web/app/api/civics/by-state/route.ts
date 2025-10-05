// web/app/api/civics/by-state/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering since we use nextUrl.searchParams
export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
);

export async function GET(req: NextRequest) {
  try {
    const state = req.nextUrl.searchParams.get('state');
    const level = req.nextUrl.searchParams.get('level'); // 'federal' | 'state' | 'local'
    const chamber = req.nextUrl.searchParams.get('chamber'); // 'us_senate' | 'us_house' | 'state_upper' | 'state_lower'

    if (!state) {
      return NextResponse.json({ error: 'State parameter required' }, { status: 400 });
    }

    let query = supabase
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
      `);

    // Handle different levels of government
    if (level === 'federal') {
      // Federal representatives have jurisdiction = "US" and state info in name field
      query = query.eq('level', 'federal').eq('jurisdiction', 'US');
      
      // Filter by state using name field (e.g., "Rep. Ken Calvert [R-CA41]")
      const stateCode = state.toUpperCase();
      query = query.ilike('name', `%${stateCode}%`);
    } else {
      // State and local representatives use jurisdiction field
      query = query.eq('jurisdiction', state.toUpperCase());
      
      if (level) {
        query = query.eq('level', level);
      }
    }

    if (chamber) {
      // Filter by chamber using the office field instead of joining with civics_divisions
      const chamberMapping: Record<string, string[]> = {
        'us_senate': ['US Senate', 'Senator'],
        'us_house': ['US House', 'Representative'],
        'state_upper': ['State Senate', 'Senator'],
        'state_lower': ['State House', 'State Assembly', 'Representative']
      };
      
      const chamberTerms = chamberMapping[chamber] || [];
      if (chamberTerms.length > 0) {
        query = query.or(chamberTerms.map(term => `office.ilike.%${term}%`).join(','));
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ 
      ok: true, 
      data: data || [],
      count: data.length || 0
    });
  } catch (e: any) {
    console.error('API error:', e);
    return NextResponse.json({ 
      ok: false, 
      error: 'Service temporarily unavailable' 
    }, { status: 502 });
  }
}



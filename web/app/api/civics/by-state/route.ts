// web/app/api/civics/by-state/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
        *,
        civics_divisions (
          ocd_division_id,
          level,
          chamber,
          state,
          district_number,
          name
        )
      `)
      .eq('jurisdiction', state.toUpperCase());

    if (level) {
      query = query.eq('level', level);
    }

    if (chamber) {
      query = query.eq('civics_divisions.chamber', chamber);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ 
      ok: true, 
      data: data || [],
      count: data?.length || 0
    });
  } catch (e: any) {
    console.error('API error:', e);
    return NextResponse.json({ 
      ok: false, 
      error: 'Service temporarily unavailable' 
    }, { status: 502 });
  }
}



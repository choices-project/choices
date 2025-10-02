// web/app/api/civics/by-state/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering since we use nextUrl.searchParams
export const dynamic = 'force-dynamic';

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function GET(req: NextRequest) {
  try {
    const state = req.nextUrl.searchParams.get('state');
    const level = req.nextUrl.searchParams.get('level'); // 'federal' | 'state' | 'local'
    const chamber = req.nextUrl.searchParams.get('chamber'); // 'us_senate' | 'us_house' | 'state_upper' | 'state_lower'

    if (!state) {
      const response = NextResponse.json({ error: 'State parameter required' }, { status: 400 });
      response.headers.set('Access-Control-Allow-Origin', '*');
      return response;
    }

    const supabase = getSupabaseClient();
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
      const response = NextResponse.json({ error: 'Database error' }, { status: 500 });
      response.headers.set('Access-Control-Allow-Origin', '*');
      return response;
    }

    const response = NextResponse.json(data || [], { status: 200 });
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return response;
  } catch (e: any) {
    console.error('API error:', e);
    const response = NextResponse.json({ 
      error: 'Service temporarily unavailable' 
    }, { status: 502 });
    response.headers.set('Access-Control-Allow-Origin', '*');
    return response;
  }
}



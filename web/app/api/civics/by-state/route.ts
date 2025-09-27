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
    const _chamber = req.nextUrl.searchParams.get('chamber'); // 'us_senate' | 'us_house' | 'state_upper' | 'state_lower'

    if (!state) {
      return NextResponse.json({ error: 'State parameter required' }, { status: 400 });
    }

    // Simplified query without problematic join
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
        contact,
        last_updated
      `)
      .eq('jurisdiction', state.toUpperCase());

    if (level) {
      query = query.eq('level', level);
    }

    // Note: chamber filtering removed since it requires the join
    // This can be added back once the foreign key relationship is fixed

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



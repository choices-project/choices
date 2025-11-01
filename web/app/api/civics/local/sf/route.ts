import { NextResponse } from 'next/server';

import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Database connection not available' },
      { status: 500 }
    );
  }

  const { data, error } = await supabase
    .from('civics_representatives')
    .select('name,party,office,contact,ocd_division_id')
    .eq('level','local')
    .eq('jurisdiction','San Francisco, CA')
    .order('office', { ascending: true });

  if (error) return NextResponse.json({ error: 'Database error' }, { status: 500 });
  return NextResponse.json({ ok: true, count: data.length ?? 0, data: data ?? [] });
}



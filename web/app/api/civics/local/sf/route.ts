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
    .from('representatives_core')
    .select('id,name,party,office,level,jurisdiction,state,district,primary_email,primary_phone,primary_website')
    .eq('level','local')
    .eq('state','CA')
    .ilike('jurisdiction','%San Francisco%')
    .order('office', { ascending: true });

  if (error) return NextResponse.json({ error: 'Database error' }, { status: 500 });
  return NextResponse.json({ ok: true, count: data.length ?? 0, data: data ?? [] });
}



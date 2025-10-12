// web/app/api/civics/local/sf/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, { auth: { persistSession: false } });

export async function GET() {
  const { data, error } = await supabase
    .from('civics_representatives')
    .select(`
      id,
      name,
      party,
      office,
      contact,
      ocd_division_id,
      district,
      jurisdiction,
      level,
      created_at,
      last_updated
    `)
    .eq('level','local')
    .eq('jurisdiction','San Francisco, CA')
    .order('office', { ascending: true });

  if (error) return NextResponse.json({ error: 'Database error' }, { status: 500 });
  return NextResponse.json({ ok: true, count: data.length ?? 0, data: data ?? [] });
}



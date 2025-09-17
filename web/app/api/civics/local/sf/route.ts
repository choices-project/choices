// web/app/api/civics/local/sf/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, { auth: { persistSession: false } });

export async function GET(_req: NextRequest) {
  const { data, error } = await supabase
    .from('civics_representatives')
    .select('name,party,office,contact,ocd_division_id')
    .eq('level','local')
    .eq('jurisdiction','San Francisco, CA')
    .order('office', { ascending: true });

  if (error) return NextResponse.json({ error: 'Database error' }, { status: 500 });
  return NextResponse.json({ ok: true, count: data.length ?? 0, data: data ?? [] });
}



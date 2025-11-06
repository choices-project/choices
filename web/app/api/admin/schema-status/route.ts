import type { SupabaseClient } from '@supabase/supabase-js';
import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';

import { TypeGuardError, assertIsRecord } from '@/lib/core/types/guards';
import { logger } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

type TableShape = { table: string; columns: string[] };

const REQUIRED: TableShape[] = [
  { table: 'polls', columns: ['id', 'title', 'visibility', 'start_at', 'end_at'] },
  { table: 'votes', columns: ['id', 'poll_id', 'voter_id', 'created_at'] },
  { table: 'user_profiles', columns: ['id', 'email', 'username'] },
];

async function getColumns(supabase: SupabaseClient, table: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('information_schema.columns')
    .select('column_name')
    .eq('table_name', table);

  if (error) throw error;
  const cols = (data ?? []).map((r: unknown) => {
    assertIsRecord(r, 'column row');
    const name = r['column_name'];
    if (typeof name !== 'string') throw new TypeGuardError(`Expected string column_name, got ${typeof name}`, name);
    return name;
  });
  return cols;
}

export async function GET(req: NextRequest) {
  try {
    // For API routes, we need to handle admin auth differently
    // This is a placeholder - implement proper admin auth for API routes
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const refresh = url.searchParams.get('refresh') === 'true';

    const supabase = getSupabaseServerClient();
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase client not available' },
        { status: 500 }
      );
    }

    // Optional cache refresh path (e.g., warm schema cache)
    if (refresh) {
      // your cache refresh logic here
      logger.info('Schema-status: refresh requested');
    }

    const results: Array<{
      table: string;
      ok: boolean;
      missing: string[];
      present: string[];
    }> = [];

    for (const shape of REQUIRED) {
      const cols = await getColumns(supabase as any, shape.table);
      const present = shape.columns.filter((c) => cols.includes(c));
      const missing = shape.columns.filter((c) => !cols.includes(c));
      const ok = missing.length === 0;

      results.push({ table: shape.table, ok, missing, present });

      if (!ok) {
        logger.warn('Schema mismatch', { table: shape.table, missing, present });
      } else {
        logger.info('Schema ok', { table: shape.table, count: present.length });
      }
    }

    const ok = results.every((r) => r.ok);
    return NextResponse.json(
      {
        ok,
        results,
        meta: {
          generatedAt: new Date().toISOString(),
          refreshApplied: refresh,
        },
      },
      { status: ok ? 200 : 422 }
    );
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    logger.error('Schema-status failed', err instanceof Error ? err : new Error(reason));
    return NextResponse.json({ ok: false, error: reason }, { status: 500 });
  }
}

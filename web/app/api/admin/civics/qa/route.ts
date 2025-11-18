// Server route handler

/**
 * Admin: Civics Data QA
 * GET /api/admin/civics/qa
 * Headers: x-admin-key: ADMIN_MONITORING_KEY
 *
 * Returns:
 * - duplicate representatives by (name, office)
 * - representatives missing division mapping (if representative_divisions exists)
 */

import type { NextRequest } from 'next/server';

import { withErrorHandling, successResponse, forbiddenError, errorResponse, methodNotAllowed } from '@/lib/api';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const adminHeader = request.headers.get('x-admin-key') ?? request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  const adminKey = process.env.ADMIN_MONITORING_KEY ?? '';
  if (!adminKey || adminHeader !== adminKey) {
    return forbiddenError('Invalid admin key');
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return errorResponse('Database connection not available', 500);
  }

  // duplicates by (name, office)
  const { data: dupRows, error: dupErr } = await (supabase as any)
    .rpc('jsonb_build_object', {}) // no-op to ensure RPC type available; skip
    .then(async () => {
      // emulate group by with supabase client
      const { data, error } = await (supabase as any)
        .from('representatives_core')
        .select('name, office, id');
      if (error) return { data: null, error };
      const map = new Map<string, number>();
      for (const row of data as Array<{ name?: string; office?: string }>) {
        const key = `${row.name ?? ''}::${row.office ?? ''}`;
        map.set(key, (map.get(key) ?? 0) + 1);
      }
      const duplicates = Array.from(map.entries())
        .filter(([, count]) => count > 1)
        .map(([key, count]) => {
          const [name, office] = key.split('::');
          return { name, office, count };
        });
      return { data: duplicates, error: null };
    });

  // missing division mapping (representative_divisions)
  let missingDivision: Array<{ id: number; name: string; office: string }> = [];
  let missingDivisionError: string | null = null;
  try {
    const { data } = await (supabase as any)
      .from('representatives_core')
      .select('id, name, office, representative_divisions:representative_divisions(count)')
      .limit(1000);
    const rows = Array.isArray(data) ? data : [];
    missingDivision = rows
      .filter((r: any) => !Array.isArray(r.representative_divisions) || r.representative_divisions.length === 0)
      .map((r: any) => ({ id: r.id, name: r.name, office: r.office }));
  } catch (e) {
    missingDivisionError = e instanceof Error ? e.message : 'Unknown error';
  }

  return successResponse({
    timestamp: new Date().toISOString(),
    duplicates: {
      rows: dupRows ?? [],
      error: dupErr ? dupErr.message : null
    },
    missing_divisions: {
      rows: missingDivision,
      error: missingDivisionError
    }
  });
});

export const POST = withErrorHandling(async () => methodNotAllowed(['GET']));


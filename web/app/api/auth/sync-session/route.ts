import { NextResponse } from 'next/server';

import { getSupabaseApiRouteClient } from '@/utils/supabase/api-route';

import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * After client-side OAuth (PKCE), copy the browser session into httpOnly cookies
 * on the response so Edge middleware can authenticate document navigations.
 */
export async function POST(request: NextRequest) {
  const response = NextResponse.json({ ok: true });
  const supabase = await getSupabaseApiRouteClient(request, response);
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    return NextResponse.json(
      { ok: false, error: error?.message ?? 'No session' },
      { status: 401 },
    );
  }

  await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });

  response.headers.set('cache-control', 'no-store');
  return response;
}

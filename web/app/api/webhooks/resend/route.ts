'use server'

import type { NextRequest } from 'next/server';

import { withErrorHandling, successResponse, methodNotAllowed } from '@/lib/api';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export const POST = withErrorHandling(async (request: NextRequest) => {
  const supabase = await getSupabaseServerClient();
  const payload = await request.json().catch(() => ({}));
  // Example payload shape (varies); we store minimal useful fields
  const eventType = String(payload?.type ?? 'unknown');
  const messageId = payload?.data?.id ?? payload?.id ?? null;
  const to = payload?.data?.to ?? null;
  const status = payload?.data?.status ?? null;

  if (supabase) {
    try {
      await (supabase as any)
        .from('platform_analytics')
        .insert({
          event_type: 'resend_webhook',
          metadata: { eventType, messageId, to, status },
        });
    } catch {
      // Webhook handling should always succeed; ignore analytics insertion errors
    }
  }

  return successResponse({ ok: true });
});

export const GET = withErrorHandling(async () => methodNotAllowed(['POST']));


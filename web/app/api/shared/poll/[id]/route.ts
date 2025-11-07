import { createClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';

import { withErrorHandling, successResponse, notFoundError } from '@/lib/api';

export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Await params in Next.js 15
    const { id } = await params;

    // Get poll with options
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select(`
        id,
        question,
        created_at,
        is_public,
        is_shareable,
        poll_options (
          id,
          text,
          created_at
        )
      `)
      .eq('id', id)
      .eq('is_public', true)
      .eq('is_shareable', true)
      .single();

  if (pollError) {
    return notFoundError('Poll not found or not shareable');
  }

    // Get current results (equal weight)
    const { data: results } = await supabase
      .rpc('get_poll_results_by_trust_tier', {
        p_poll_id: id,
        p_trust_tier: null // All tiers
      });

  return successResponse({
    ...poll,
    results: results ?? []
  });
});

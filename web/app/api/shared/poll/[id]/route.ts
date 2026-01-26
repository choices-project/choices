import { createClient } from '@supabase/supabase-js';

import { withErrorHandling, successResponse, notFoundError, toCamelCase } from '@/lib/api';

import type { NextRequest } from 'next/server';


export const GET = withErrorHandling(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase environment variables are not configured');
    }
    const supabase = createClient(
      supabaseUrl,
      supabaseKey
    );

    // Await params in Next.js 15
    const { id } = await params;

    // Get poll with options (allows both public and private shared polls)
    // Private polls can be shared via link and allow anonymous voting for user acquisition
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select(`
        id,
        question,
        created_at,
        is_public,
        is_shareable,
        privacy_level,
        status,
        poll_options (
          id,
          text,
          created_at
        )
      `)
      .eq('id', id)
      .eq('is_shareable', true)
      .eq('status', 'active')
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

  const normalizedResults = Array.isArray(results)
    ? results.map((result: Record<string, any>) => toCamelCase(result))
    : [];

  const normalizedPoll = {
    id: poll.id,
    question: poll.question,
    createdAt: poll.created_at,
    isPublic: poll.is_public,
    isShareable: poll.is_shareable,
    options: (poll.poll_options ?? []).map((option: any) => ({
      id: option.id,
      text: option.text,
      createdAt: option.created_at,
    })),
    results: normalizedResults,
  };

  return successResponse({ poll: normalizedPoll });
});

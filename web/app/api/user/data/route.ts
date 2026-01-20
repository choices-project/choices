import { NextResponse } from 'next/server';

import { getSupabaseServerClient } from '@/utils/supabase/server';

import { authError, errorResponse } from '@/lib/api';
import { logger } from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export const GET = async (_request: NextRequest) => {
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return errorResponse('Database connection not available', 500);
  }

  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return authError('Authentication required');
  }

  const userId = user.id;

  const [{ data: profile, error: profileError }, pollsResult, votesResult] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('display_name, username, email, created_at')
      .eq('user_id', userId)
      .single(),
    supabase
      .from('polls')
      .select('id, title, created_at, total_votes', { count: 'exact' })
      .eq('created_by', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('votes')
      .select('id, poll_id, created_at', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
  ]);

  if (profileError) {
    logger.error('Failed to load account data profile', profileError);
    return errorResponse('Failed to load user data', 500);
  }

  const polls = pollsResult.data ?? [];
  const votes = votesResult.data ?? [];

  return NextResponse.json({
    profile: {
      displayname: profile?.display_name ?? profile?.username ?? 'User',
      email: profile?.email ?? user.email ?? '',
      createdat: profile?.created_at ?? user.created_at ?? new Date().toISOString(),
      pollscreated: pollsResult.count ?? polls.length ?? 0,
      votescast: votesResult.count ?? votes.length ?? 0,
      commentsmade: 0,
    },
    polls: polls.map((poll) => ({
      id: poll.id,
      title: poll.title,
      createdat: poll.created_at,
      totalvotes: poll.total_votes ?? 0,
    })),
    votes: votes.map((vote) => ({
      pollid: vote.poll_id,
      polltitle: '',
      votedat: vote.created_at,
      optionselected: '',
    })),
    comments: [],
  });
};

import type { NextRequest} from 'next/server';

import { withErrorHandling, successResponse, errorResponse } from '@/lib/api';
import { logger } from '@/lib/utils/logger'
import { getSupabaseServerClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export const GET = withErrorHandling(async (request: NextRequest) => {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') ?? '3')
    
    const supabase = await getSupabaseServerClient()
    
    // Get trending polls (most votes in last 7 days)
    const { data: polls, error } = await supabase
      .from('polls')
      .select(`
        id,
        title,
        description,
        category,
        created_at,
        end_date,
        total_votes,
        options (
          id,
          text,
          votes
        )
      `)
      .eq('is_active', true)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('total_votes', { ascending: false })
      .limit(limit)
    
  if (error) {
    logger.error('Error fetching trending polls:', error)
    return errorResponse('Failed to fetch trending polls', 500);
  }
    
    // Transform data for frontend
    const transformedPolls = polls.map(poll => ({
      id: poll.id,
      title: poll.title,
      description: poll.description,
      category: poll.category ?? 'General',
      totalVotes: poll.total_votes ?? 0,
      timeRemaining: getTimeRemaining(poll.end_date),
      isActive: true,
      options: (poll as any).options?.map((option: { id: string; text: string; votes?: number }) => ({
        id: option.id,
        text: option.text,
        votes: option.votes ?? 0,
        percentage: (poll.total_votes ?? 0) > 0 ? Math.round((option.votes ?? 0) / (poll.total_votes ?? 1) * 100) : 0
      })) ?? []
    })) ?? []
    
  return successResponse({ polls: transformedPolls });
});

function getTimeRemaining(endDate: string | null): string {
  if (!endDate) return 'No end date'
  
  const end = new Date(endDate)
  const now = new Date()
  const diff = end.getTime() - now.getTime()
  
  if (diff <= 0) return 'Ended'
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} left`
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} left`
  return 'Less than 1 hour left'
}

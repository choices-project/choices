// NextRequest import removed - not used
import { NextResponse } from 'next/server'

import { logger } from '@/lib/utils/logger'
import { getSupabaseServerClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient()
    
    // Get total polls
    const { count: totalPolls, error: pollsError } = await supabase
      .from('polls')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
    
    if (pollsError) {
      logger.error('Error fetching total polls:', pollsError)
    }
    
    // Get total votes across all polls
    const { data: pollsWithVotes, error: votesError } = await supabase
      .from('polls')
      .select('total_votes')
      .eq('is_active', true)
    
    if (votesError) {
      logger.error('Error fetching total votes:', votesError)
    }
    
    const totalVotes = pollsWithVotes?.reduce((sum: number, poll: { total_votes: number | null }) => sum + (poll.total_votes || 0), 0) || 0
    
    // Get active users (users who have voted in the last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { count: activeUsers, error: usersError } = await supabase
      .from('votes')
      .select('user_id', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo)
      .not('user_id', 'is', null)
    
    if (usersError) {
      logger.error('Error fetching active users:', usersError)
    }
    
    return NextResponse.json({
      totalPolls: totalPolls || 0,
      totalVotes,
      activeUsers: activeUsers || 0
    })
    
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error('Error in public stats API:', err)
    return NextResponse.json({
      totalPolls: 0,
      totalVotes: 0,
      activeUsers: 0
    }, { status: 500 })
  }
}

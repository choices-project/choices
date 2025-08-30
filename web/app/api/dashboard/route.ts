import { NextRequest, NextResponse } from 'next/server'
import { devLog } from '@/lib/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server'
import { getCurrentUser } from '@/lib/auth-utils'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Get Supabase client
    const cookieStore = await cookies()
    const supabase = getSupabaseServerClient()
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      )
    }

    // Get current user from JWT token
    const user = getCurrentUser(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Get user-specific statistics
    const userStats = await getUserStats(supabase, user.userId)
    
    // Get general platform statistics
    const platformStats = await getPlatformStats(supabase)

    const dashboardData = {
      user: {
        id: user.userId,
        email: user.email,
        name: user.email?.split('@')[0]
      },
      stats: userStats,
      platform: platformStats,
      recentActivity: await getRecentActivity(supabase, user.userId),
      polls: await getActivePolls(supabase)
    }

    return NextResponse.json(dashboardData)

  } catch (error) {
    devLog('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function getUserStats(supabase: any, userId: string) {
  try {
    // Get polls created by user
    const { data: createdPolls, error: pollsError } = await supabase
      .from('po_polls')
      .select('id, title, created_at')
      .eq('created_by', userId)

    if (pollsError) {
      devLog('Error fetching created polls:', pollsError)
    }

    // Get votes cast by user
    const { data: userVotes, error: votesError } = await supabase
      .from('po_votes')
      .select('id, poll_id, created_at')
      .eq('user_id', userId)

    if (votesError) {
      devLog('Error fetching user votes:', votesError)
    }

    // Get active polls count
    const { data: activePolls, error: activeError } = await supabase
      .from('po_polls')
      .select('id')
      .eq('status', 'active')

    if (activeError) {
      devLog('Error fetching active polls:', activeError)
    }

    // Calculate participation rate
    const totalPolls = activePolls?.length || 0
    const userVoteCount = userVotes?.length || 0
    const participationRate = totalPolls > 0 ? Math.round((userVoteCount / totalPolls) * 100) : 0

    return {
      pollsCreated: createdPolls?.length || 0,
      votesCast: userVotes?.length || 0,
      activePolls: activePolls?.length || 0,
      participationRate: Math.min(participationRate, 100),
      averageVotesPerPoll: totalPolls > 0 ? Math.round((userVoteCount / totalPolls) * 10) / 10 : 0
    }
  } catch (error) {
    devLog('Error calculating user stats:', error)
    return {
      pollsCreated: 0,
      votesCast: 0,
      activePolls: 0,
      participationRate: 0,
      averageVotesPerPoll: 0
    }
  }
}

async function getPlatformStats(supabase: any) {
  try {
    // Get total polls
    const { data: totalPolls, error: totalPollsError } = await supabase
      .from('po_polls')
      .select('id', { count: 'exact' })

    if (totalPollsError) {
      devLog('Error fetching total polls:', totalPollsError)
    }

    // Get total votes
    const { data: totalVotes, error: totalVotesError } = await supabase
      .from('po_votes')
      .select('id', { count: 'exact' })

    if (totalVotesError) {
      devLog('Error fetching total votes:', totalVotesError)
    }

    // Get total users (from user_profiles)
    const { data: totalUsers, error: totalUsersError } = await supabase
      .from('user_profiles')
      .select('id', { count: 'exact' })

    if (totalUsersError) {
      devLog('Error fetching total users:', totalUsersError)
    }

    // Get active polls
    const { data: activePolls, error: activePollsError } = await supabase
      .from('po_polls')
      .select('id')
      .eq('status', 'active')

    if (activePollsError) {
      devLog('Error fetching active polls:', activePollsError)
    }

    return {
      totalPolls: totalPolls?.length || 0,
      totalVotes: totalVotes?.length || 0,
      totalUsers: totalUsers?.length || 0,
      activePolls: activePolls?.length || 0,
      averageParticipation: totalPolls?.length > 0 ? Math.round((totalVotes?.length / totalPolls?.length) * 10) / 10 : 0
    }
  } catch (error) {
    devLog('Error calculating platform stats:', error)
    return {
      totalPolls: 0,
      totalVotes: 0,
      totalUsers: 0,
      activePolls: 0,
      averageParticipation: 0
    }
  }
}

async function getRecentActivity(supabase: any, userId: string) {
  try {
    // Get recent votes by user
    const { data: recentVotes, error: votesError } = await supabase
      .from('po_votes')
      .select(`
        id,
        created_at,
        po_polls!inner(title)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5)

    if (votesError) {
      devLog('Error fetching recent votes:', votesError)
      return []
    }

    // Get recent polls created by user
    const { data: recentPolls, error: pollsError } = await supabase
      .from('po_polls')
      .select('id, title, created_at')
      .eq('created_by', userId)
      .order('created_at', { ascending: false })
      .limit(5)

    if (pollsError) {
      devLog('Error fetching recent polls:', pollsError)
      return []
    }

    // Combine and sort activities
    const activities = [
      ...(recentVotes?.map((vote: any) => ({
        id: vote.id,
        type: 'vote',
        title: `Voted on "${vote.po_polls.title}"`,
        timestamp: vote.created_at,
        icon: 'vote'
      })) || []),
      ...(recentPolls?.map((poll: any) => ({
        id: poll.id,
        type: 'poll',
        title: `Created poll "${poll.title}"`,
        timestamp: poll.created_at,
        icon: 'poll'
      })) || [])
    ]

    // Sort by timestamp and return top 5
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5)

  } catch (error) {
    devLog('Error fetching recent activity:', error)
    return []
  }
}

async function getActivePolls(supabase: any) {
  try {
    const { data: polls, error } = await supabase
      .from('po_polls')
      .select(`
        id,
        title,
        description,
        status,
        created_at,
        ends_at,
        total_votes
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(6)

    if (error) {
      devLog('Error fetching active polls:', error)
      return []
    }

    return polls || []
  } catch (error) {
    devLog('Error fetching active polls:', error)
    return []
  }
}

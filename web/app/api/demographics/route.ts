import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { getMockDemographicsResponse } from '@/lib/mock-data';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    // If Supabase client is not available, return mock data
    if (!supabase) {
      console.log('Supabase client not available, using mock data');
      return NextResponse.json(getMockDemographicsResponse());
    }
    
    try {
      // Get total users
      const { data: users, error: usersError } = await supabase
        .from('ia_users')
        .select('*')
        .eq('is_active', true);

      if (usersError) throw usersError;

      const totalUsers = users?.length || 0;

      // Get recent polls
      const { data: polls, error: pollsError } = await supabase
        .from('po_polls')
        .select('poll_id, title, total_votes, participation_rate, created_at')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(5);

      if (pollsError) throw pollsError;

      // Get recent votes
      const { data: votes, error: votesError } = await supabase
        .from('po_votes')
        .select('poll_id, voted_at')
        .gte('voted_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('voted_at', { ascending: false })
        .limit(10);

      if (votesError) throw votesError;

      // Generate demographics data with real user count
      const demographics = getMockDemographicsResponse();
      demographics.totalUsers = totalUsers;
      demographics.recentPolls = polls || [];
      demographics.recentVotes = votes || [];

      return NextResponse.json(demographics);
    } catch (error) {
      console.error('Supabase error:', error);
      // Fallback to mock data
      return NextResponse.json(getMockDemographicsResponse());
    }
  } catch (error) {
    console.error('Error in demographics API:', error);
    // Always return mock data as final fallback
    return NextResponse.json(getMockDemographicsResponse());
  }
}

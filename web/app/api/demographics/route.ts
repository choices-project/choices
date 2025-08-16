import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseConfig, supabase, postgresPool } from '@/lib/database-config';
import { getMockDemographicsResponse } from '@/lib/mock-data';

export async function GET(request: NextRequest) {
  try {
    const dbConfig = getDatabaseConfig();
    
    // If database is not available, return mock data
    if (dbConfig.type === 'mock' || !dbConfig.enabled) {
      console.log('Using mock data for demographics API');
      return NextResponse.json(getMockDemographicsResponse());
    }

    // Try to fetch from database
    if (dbConfig.type === 'supabase' && supabase) {
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
    }

    if (dbConfig.type === 'postgres' && postgresPool) {
      try {
        const client = await postgresPool.connect();
        
        // Get total users
        const totalUsersResult = await client.query(
          'SELECT COUNT(*) as total FROM ia_users WHERE is_active = TRUE'
        );
        const totalUsers = parseInt(totalUsersResult.rows[0].total);

        // Get recent polls
        const recentPollsResult = await client.query(`
          SELECT 
            poll_id,
            title,
            total_votes,
            participation_rate,
            created_at
          FROM po_polls 
          WHERE status = 'active' 
          ORDER BY created_at DESC 
          LIMIT 5
        `);

        // Get recent votes
        const recentVotesResult = await client.query(`
          SELECT 
            pv.poll_id,
            pp.title,
            COUNT(*) as vote_count,
            pv.voted_at
          FROM po_votes pv
          JOIN po_polls pp ON pv.poll_id = pp.poll_id
          WHERE pv.voted_at >= NOW() - INTERVAL '24 hours'
          GROUP BY pv.poll_id, pp.title, pv.voted_at
          ORDER BY pv.voted_at DESC
          LIMIT 10
        `);

        client.release();

        // Generate demographics data with real user count
        const demographics = getMockDemographicsResponse();
        demographics.totalUsers = totalUsers;
        demographics.recentPolls = recentPollsResult.rows;
        demographics.recentVotes = recentVotesResult.rows;

        return NextResponse.json(demographics);
      } catch (error) {
        console.error('PostgreSQL error:', error);
        // Fallback to mock data
        return NextResponse.json(getMockDemographicsResponse());
      }
    }

    // Fallback to mock data
    return NextResponse.json(getMockDemographicsResponse());
  } catch (error) {
    console.error('Error in demographics API:', error);
    // Always return mock data as final fallback
    return NextResponse.json(getMockDemographicsResponse());
  }
}

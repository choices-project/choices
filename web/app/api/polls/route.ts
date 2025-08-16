import { NextResponse } from 'next/server';
import { getDatabaseConfig, supabase, postgresPool } from '@/lib/database-config';
import { getMockPollsResponse } from '@/lib/mock-data';

export async function GET() {
  try {
    const dbConfig = getDatabaseConfig();
    
    // If database is not available, return mock data
    if (dbConfig.type === 'mock' || !dbConfig.enabled) {
      console.log('Using mock data for polls API');
      return NextResponse.json(getMockPollsResponse());
    }

    // Try to fetch from database
    if (dbConfig.type === 'supabase' && supabase) {
      try {
        const { data, error } = await supabase
          .from('po_polls')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Transform Supabase data to match expected format
        const polls = data?.map(poll => ({
          id: poll.poll_id,
          question: poll.title,
          options: poll.options || [],
          totalVotes: poll.total_votes || 0,
          results: {}, // Will be calculated from votes
          expiresAt: poll.end_time,
          category: 'Community', // Default category
          isActive: poll.status === 'active',
          description: poll.description,
          createdBy: 'Community'
        })) || [];

        return NextResponse.json({ polls });
      } catch (error) {
        console.error('Supabase error:', error);
        // Fallback to mock data
        return NextResponse.json(getMockPollsResponse());
      }
    }

    if (dbConfig.type === 'postgres' && postgresPool) {
      try {
        const client = await postgresPool.connect();
        
        const result = await client.query(`
          SELECT 
            poll_id,
            title,
            description,
            options,
            total_votes,
            participation_rate,
            start_time,
            end_time,
            status,
            created_at
          FROM po_polls 
          WHERE status = 'active' 
          ORDER BY created_at DESC
        `);
        
        client.release();

        const polls = result.rows.map(poll => ({
          id: poll.poll_id,
          question: poll.title,
          options: poll.options || [],
          totalVotes: poll.total_votes || 0,
          results: {}, // Will be calculated from votes
          expiresAt: poll.end_time,
          category: 'Community', // Default category
          isActive: poll.status === 'active',
          description: poll.description,
          createdBy: 'Community'
        }));

        return NextResponse.json({ polls });
      } catch (error) {
        console.error('PostgreSQL error:', error);
        // Fallback to mock data
        return NextResponse.json(getMockPollsResponse());
      }
    }

    // Fallback to mock data
    return NextResponse.json(getMockPollsResponse());
  } catch (error) {
    console.error('Error in polls API:', error);
    // Always return mock data as final fallback
    return NextResponse.json(getMockPollsResponse());
  }
}

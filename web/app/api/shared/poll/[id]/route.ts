import { createClient } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
      return NextResponse.json(
        { error: 'Poll not found or not shareable' }, 
        { status: 404 }
      );
    }

    // Get current results (equal weight)
    const { data: results } = await supabase
      .rpc('get_poll_results_by_trust_tier', {
        p_poll_id: id,
        p_trust_tier: null // All tiers
      });

    return NextResponse.json({
      ...poll,
      results: results || []
    });

  } catch (error) {
    console.error('Shared poll API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase configuration missing');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: pollId } = await params;
  const { searchParams } = new URL(request.url);
  const analysisWindow = searchParams.get('analysisWindow') || '24 hours';
  const trustTiers = searchParams.getAll('tier').map(Number);

  try {
    // Call comprehensive analytics function
    const { data: comprehensiveData, error } = await supabase.rpc('get_comprehensive_analytics', {
      p_poll_id: pollId,
      p_analysis_window: analysisWindow
    });

    if (error) {
      console.error('Error getting comprehensive analytics:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Filter by trust tiers if specified
    let filteredData = comprehensiveData;
    if (trustTiers && trustTiers.length > 0 && comprehensiveData.sentiment_analysis?.tier_breakdown) {
      const filteredBreakdown: Record<string, any> = {};
      trustTiers.forEach(tier => {
        const tierKey = `tier_${tier}`;
        if (comprehensiveData.sentiment_analysis.tier_breakdown[tierKey]) {
          filteredBreakdown[tierKey] = comprehensiveData.sentiment_analysis.tier_breakdown[tierKey];
        }
      });
      filteredData = {
        ...comprehensiveData,
        sentiment_analysis: {
          ...comprehensiveData.sentiment_analysis,
          tier_breakdown: filteredBreakdown
        }
      };
    }

    return NextResponse.json({
      success: true,
      data: filteredData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Unexpected error in comprehensive analytics:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
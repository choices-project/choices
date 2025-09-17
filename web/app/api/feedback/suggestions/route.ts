import { type NextRequest, NextResponse } from 'next/server';
import { feedbackParser } from '@/lib/feedback/FeedbackParser';
import type { InterestSuggestion } from '@/lib/feedback/FeedbackParser';
import { getSupabaseServerClient } from '@/utils/supabase/server';
import { devLog } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, text, userId } = body;

    // Validate input
    if (!type || !text || !['interest', 'demographic'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid input. Type must be "interest" or "demographic" and text is required.' },
        { status: 400 }
      );
    }

    // Create suggestion object
    const suggestion: InterestSuggestion = {
      type: type as 'interest' | 'demographic',
      text: text.trim(),
      userId: userId || 'anonymous',
      timestamp: new Date().toISOString()
    };

    // Parse the suggestion
    const parsedFeedback = await feedbackParser.parseInterestSuggestion(suggestion);

    // Store in database
    const supabase = await getSupabaseServerClient();
    if (supabase) {
      const { error } = await supabase
        .from('feedback')
        .insert({
          id: parsedFeedback.id,
          user_id: parsedFeedback.metadata.userId,
          type: parsedFeedback.type,
          title: parsedFeedback.title,
          description: parsedFeedback.description,
          sentiment: parsedFeedback.sentiment,
          priority: parsedFeedback.priority,
          tags: parsedFeedback.tags,
          metadata: parsedFeedback.metadata,
          ai_analysis: parsedFeedback.aiAnalysis,
          status: 'pending',
          created_at: parsedFeedback.metadata.timestamp
        });

      if (error) {
        devLog('Error storing feedback:', error);
        return NextResponse.json(
          { error: 'Failed to store suggestion' },
          { status: 500 }
        );
      }
    }

    devLog('Successfully processed suggestion:', parsedFeedback);

    return NextResponse.json({
      success: true,
      message: 'Suggestion received and will be reviewed',
      id: parsedFeedback.id
    });

  } catch (error) {
    devLog('Error processing suggestion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status') || 'pending';
    const limit = parseInt(searchParams.get('limit') || '50');

    const supabase = await getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 500 }
      );
    }

    let query = supabase
      .from('feedback')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) {
      devLog('Error fetching suggestions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch suggestions' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      suggestions: data || [],
      count: data.length || 0
    });

  } catch (error) {
    devLog('Error fetching suggestions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

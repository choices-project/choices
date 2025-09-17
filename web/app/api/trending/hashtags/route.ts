import { NextRequest, NextResponse } from 'next/server';
import { trendingHashtagsTracker } from '@/lib/trending/TrendingHashtags';
import { devLog } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { hashtags, userId, source, metadata } = body;

    // Validate input
    if (!hashtags || !Array.isArray(hashtags) || !userId) {
      return NextResponse.json(
        { error: 'Invalid input. hashtags array and userId are required.' },
        { status: 400 }
      );
    }

    // Track multiple hashtags
    await trendingHashtagsTracker.trackMultipleHashtags(
      hashtags,
      userId,
      source || 'custom'
    );

    devLog('Hashtags tracked:', { hashtags, userId, source });

    return NextResponse.json({
      success: true,
      message: 'Hashtags tracked successfully',
      count: hashtags.length
    });

  } catch (error) {
    devLog('Error tracking hashtags:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type') || 'trending';

    let result;

    switch (type) {
      case 'trending':
        result = await trendingHashtagsTracker.getTrendingHashtags(limit);
        break;
      case 'analytics':
        result = await trendingHashtagsTracker.getHashtagAnalytics();
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid type. Use "trending" or "analytics"' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result,
      type
    });

  } catch (error) {
    devLog('Error fetching trending hashtags:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

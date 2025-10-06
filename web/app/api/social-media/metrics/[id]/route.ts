/**
 * Social Media Metrics API
 * Retrieves social media metrics for a specific representative
 * Created: October 6, 2025
 */

import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const representativeId = params.id;

    if (!representativeId) {
      return NextResponse.json(
        { error: 'Representative ID is required' },
        { status: 400 }
      );
    }

    // Get social media metrics
    const { data: metrics, error: metricsError } = await supabase
      .from('representative_social_media_metrics')
      .select('*')
      .eq('representative_id', representativeId)
      .order('last_updated', { ascending: false });

    if (metricsError) {
      throw metricsError;
    }

    // Get social media handles
    const { data: handles, error: handlesError } = await supabase
      .from('representative_social_handles')
      .select('*')
      .eq('representative_id', representativeId)
      .eq('is_active', true);

    if (handlesError) {
      throw handlesError;
    }

    // Get engagement history for trends
    const { data: engagementHistory, error: historyError } = await supabase
      .from('representative_social_engagement_history')
      .select('*')
      .eq('representative_id', representativeId)
      .order('date', { ascending: false })
      .limit(30);

    if (historyError) {
      throw historyError;
    }

    // Calculate summary statistics
    const totalFollowers = metrics?.reduce((sum, m) => sum + (m.followers_count || 0), 0) || 0;
    const averageEngagement = metrics?.reduce((sum, m) => sum + (m.engagement_rate || 0), 0) / (metrics?.length || 1) || 0;
    const averageSentiment = metrics?.reduce((sum, m) => sum + (m.sentiment_score || 0), 0) / (metrics?.length || 1) || 0;
    const verifiedPlatforms = metrics?.filter(m => m.verification_status).length || 0;

    return NextResponse.json({
      success: true,
      representativeId,
      summary: {
        totalFollowers,
        averageEngagement: Math.round(averageEngagement * 100) / 100,
        averageSentiment: Math.round(averageSentiment * 100) / 100,
        verifiedPlatforms,
        totalPlatforms: metrics?.length || 0
      },
      metrics: metrics?.map(m => ({
        platform: m.platform,
        followersCount: m.followers_count,
        engagementRate: m.engagement_rate,
        recentPostsCount: m.recent_posts_count,
        sentimentScore: m.sentiment_score,
        verificationStatus: m.verification_status,
        lastUpdated: m.last_updated,
        dataSource: m.data_source
      })) || [],
      handles: handles?.map(h => ({
        platform: h.platform,
        handle: h.handle,
        url: h.url,
        isVerified: h.is_verified,
        isActive: h.is_active,
        lastUpdated: h.last_updated
      })) || [],
      engagementHistory: engagementHistory?.map(e => ({
        platform: e.platform,
        date: e.date,
        followersCount: e.followers_count,
        engagementRate: e.engagement_rate,
        sentimentScore: e.sentiment_score
      })) || [],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching social media metrics:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch social media metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const representativeId = params.id;
    const { platform, handle, url, isVerified = false } = await request.json();

    if (!representativeId || !platform || !handle) {
      return NextResponse.json(
        { error: 'Representative ID, platform, and handle are required' },
        { status: 400 }
      );
    }

    // Add or update social media handle
    const { data, error } = await supabase
      .from('representative_social_handles')
      .upsert({
        representative_id: representativeId,
        platform,
        handle,
        url,
        is_verified: isVerified,
        is_active: true
      }, {
        onConflict: 'representative_id,platform'
      })
      .select();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      representativeId,
      handle: data?.[0],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error adding social media handle:', error);
    return NextResponse.json(
      { 
        error: 'Failed to add social media handle',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const representativeId = params.id;
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');

    if (!representativeId || !platform) {
      return NextResponse.json(
        { error: 'Representative ID and platform are required' },
        { status: 400 }
      );
    }

    // Deactivate social media handle
    const { error } = await supabase
      .from('representative_social_handles')
      .update({ is_active: false })
      .eq('representative_id', representativeId)
      .eq('platform', platform);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      representativeId,
      platform,
      message: 'Social media handle deactivated',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error deactivating social media handle:', error);
    return NextResponse.json(
      { 
        error: 'Failed to deactivate social media handle',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

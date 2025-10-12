/**
 * Social Media Data Ingestion API
 * Handles ingestion of social media data for representatives
 * Created: October 6, 2025
 */

import { type NextRequest, NextResponse } from 'next/server';

import { SocialMediaService } from '@/lib/social-media/social-media-service';

export async function POST(request: NextRequest) {
  try {
    const { representativeId } = await request.json();

    if (!representativeId) {
      return NextResponse.json(
        { error: 'Representative ID is required' },
        { status: 400 }
      );
    }

    const socialMediaService = new SocialMediaService();
    const metrics = await socialMediaService.getRepresentativeSocialData(representativeId);

    return NextResponse.json({
      success: true,
      representativeId,
      platforms: metrics.map(m => m.platform),
      metricsCount: metrics.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error ingesting social media data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to ingest social media data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const representativeId = searchParams.get('representativeId');

    if (!representativeId) {
      return NextResponse.json(
        { error: 'Representative ID is required' },
        { status: 400 }
      );
    }

    const socialMediaService = new SocialMediaService();
    const handles = await socialMediaService.getSocialMediaHandles(representativeId);

    return NextResponse.json({
      success: true,
      representativeId,
      handles: handles.map(h => ({
        platform: h.platform,
        handle: h.handle,
        url: h.url,
        isVerified: h.isVerified,
        isActive: h.isActive
      })),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching social media handles:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch social media handles',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

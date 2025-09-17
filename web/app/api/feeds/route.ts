/**
 * Electoral Feeds API
 * 
 * Accepts only public jurisdiction IDs - no addresses or GPS
 * Server never receives plaintext location data
 */

import { NextRequest, NextResponse } from 'next/server';
import { ElectoralFeedService } from '@/lib/electoral/feed-service';
import type { JurisdictionID } from '@/lib/privacy/location-resolver';
import { logger } from '@/lib/logger';

const feedService = new ElectoralFeedService();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jurisdictionIds, feedVersion = 'v1' } = body;

    // Validate input
    if (!jurisdictionIds || !Array.isArray(jurisdictionIds)) {
      return NextResponse.json(
        { error: 'jurisdictionIds array is required' },
        { status: 400 }
      );
    }

    if (jurisdictionIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one jurisdiction ID is required' },
        { status: 400 }
      );
    }

    // Validate jurisdiction IDs
    for (const id of jurisdictionIds) {
      if (typeof id !== 'string' || !isValidJurisdictionId(id)) {
        return NextResponse.json(
          { error: `Invalid jurisdiction ID format: ${id}` },
          { status: 400 }
        );
      }
    }

    // Get feeds for all jurisdictions
    const feeds = await feedService.getFeed(jurisdictionIds as JurisdictionID[], feedVersion);

    logger.info('Generated electoral feeds', {
      jurisdictionCount: jurisdictionIds.length,
      feedVersion,
      generatedAt: new Date().toISOString()
    });

    return NextResponse.json({
      feeds,
      version: feedVersion,
      generatedAt: new Date().toISOString(),
      jurisdictionCount: jurisdictionIds.length
    });

  } catch (error) {
    logger.error('Failed to generate electoral feeds', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json(
      { error: 'Failed to generate electoral feeds' },
      { status: 500 }
    );
  }
}

/**
 * Validate jurisdiction ID format
 */
function isValidJurisdictionId(id: string): boolean {
  // Allowlist regex for OCD format
  const ocdPattern = /^ocd-division\/country:us(\/state:[a-z]{2})?(\/county:[a-z0-9_-]+)?(\/place:[a-z0-9_-]+)?$/;
  return ocdPattern.test(id);
}

/**
 * GET endpoint for health check
 */
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'electoral-feeds',
    version: 'v1',
    timestamp: new Date().toISOString()
  });
}

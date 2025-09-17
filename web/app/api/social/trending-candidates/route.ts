import { type NextRequest, NextResponse } from 'next/server';
import { TrendingCandidateDetector } from '@/lib/social/social-discovery';
import { devLog } from '@/lib/logger';
import { handleError, getUserMessage, getHttpStatus } from '@/lib/error-handler';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pollId = searchParams.get('pollId');
    const timeWindow = parseInt(searchParams.get('timeWindow') || '3600000'); // 1 hour default
    const limit = parseInt(searchParams.get('limit') || '5');

    if (!pollId) {
      return NextResponse.json(
        { success: false, error: 'Poll ID is required' },
        { status: 400 }
      );
    }

    devLog('Detecting trending candidates for poll:', pollId, 'timeWindow:', timeWindow);

    // Detect trending candidates
    const trendingCandidates = await TrendingCandidateDetector.detectTrendingCandidates(
      pollId,
      timeWindow
    );

    // Sort by trend score and limit results
    const sortedCandidates = trendingCandidates
      .sort((a, b) => b.trendScore - a.trendScore)
      .slice(0, limit);

    devLog(`Found ${sortedCandidates.length} trending candidates for poll ${pollId}`);

    return NextResponse.json({
      success: true,
      trendingCandidates: sortedCandidates,
      count: sortedCandidates.length,
      pollId,
      timeWindow,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    devLog('Error in trending candidates API:', error);
    const appError = handleError(error as Error);
    const userMessage = getUserMessage(appError);
    const statusCode = getHttpStatus(appError);
    
    return NextResponse.json({ 
      success: false, 
      error: userMessage 
    }, { status: statusCode });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pollId, candidateId, activityType, metadata = {} } = body;

    if (!pollId || !candidateId || !activityType) {
      return NextResponse.json(
        { success: false, error: 'Poll ID, Candidate ID, and Activity Type are required' },
        { status: 400 }
      );
    }

    devLog('Recording candidate activity:', {
      pollId,
      candidateId,
      activityType,
      metadata
    });

    // Record activity for trending detection
    // This would typically store in a database for real-time trending calculation
    const activityRecord = {
      pollId,
      candidateId,
      activityType,
      metadata,
      timestamp: new Date(),
      intensity: calculateActivityIntensity(activityType, metadata)
    };

    // Store activity (mock implementation)
    await storeActivityRecord(activityRecord);

    // Check if this activity should trigger trending recalculation
    const shouldRecalculate = await shouldRecalculateTrending(pollId, candidateId);
    
    if (shouldRecalculate) {
      devLog('Triggering trending recalculation for poll:', pollId);
      // In a real implementation, this might trigger a background job
      // or update a real-time trending cache
    }

    return NextResponse.json({
      success: true,
      activityRecord,
      shouldRecalculate,
      pollId,
      candidateId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    devLog('Error in trending candidates activity API:', error);
    const appError = handleError(error as Error);
    const userMessage = getUserMessage(appError);
    const statusCode = getHttpStatus(appError);
    
    return NextResponse.json({ 
      success: false, 
      error: userMessage 
    }, { status: statusCode });
  }
}

// Helper methods (would be moved to a service class in production)
function calculateActivityIntensity(activityType: string, metadata: Record<string, unknown>): number {
  const baseIntensities: Record<string, number> = {
    'vote': 1.0,
    'view': 0.3,
    'share': 1.5,
    'discuss': 1.2,
    'recommend': 1.8
  };

  const baseIntensity = baseIntensities[activityType] || 0.5;
  
  // Adjust based on metadata
  let multiplier = 1.0;
  if (metadata.isFirstTime) multiplier += 0.2;
  if (metadata.hasEngagement) multiplier += 0.3;
  if (metadata.isViral) multiplier += 0.5;

  return baseIntensity * multiplier;
}

async function storeActivityRecord(activityRecord: Record<string, unknown>): Promise<void> {
  // Mock implementation - would store in database
  devLog('Storing activity record:', activityRecord);
}

async function shouldRecalculateTrending(pollId: string, candidateId: string): Promise<boolean> {
  // Mock implementation - would check if enough activity has occurred
  // to warrant a trending recalculation
  return Math.random() > 0.7; // 30% chance of recalculation
}

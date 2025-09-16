import { NextRequest, NextResponse } from 'next/server';
import { DiversityNudgeEngine, ExposureCapManager } from '@/lib/social/network-effects';
import { devLog } from '@/lib/logger';
import { handleError, getUserMessage, getHttpStatus } from '@/lib/error-handler';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const pollId = searchParams.get('pollId');
    const userRanking = searchParams.get('userRanking')?.split(',') || [];

    if (!userId || !pollId) {
      return NextResponse.json(
        { success: false, error: 'User ID and Poll ID are required' },
        { status: 400 }
      );
    }

    devLog('Generating diversity nudges for user:', userId, 'poll:', pollId);

    // Check exposure caps
    const canShowDiversity = await ExposureCapManager.checkExposureCap(
      userId, 
      'diversity', 
      pollId
    );

    if (!canShowDiversity) {
      devLog('User has hit diversity nudge exposure cap');
      return NextResponse.json({
        success: true,
        nudges: [],
        count: 0,
        reason: 'exposure_cap_reached',
        userId,
        pollId,
        timestamp: new Date().toISOString()
      });
    }

    // Generate diversity nudges
    const nudges = await DiversityNudgeEngine.generateDiversityNudges(
      userId,
      userRanking,
      pollId
    );

    // Record exposure for each nudge
    for (const nudge of nudges) {
      await ExposureCapManager.recordExposure(
        userId,
        'diversity',
        `${nudge.type}_${nudge.candidateId}`
      );
    }

    devLog(`Generated ${nudges.length} diversity nudges for user ${userId}`);

    return NextResponse.json({
      success: true,
      nudges,
      count: nudges.length,
      userId,
      pollId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    devLog('Error in diversity nudges API:', error);
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
    const { userId, pollId, userRanking = [], action } = body;

    if (!userId || !pollId) {
      return NextResponse.json(
        { success: false, error: 'User ID and Poll ID are required' },
        { status: 400 }
      );
    }

    devLog('Processing diversity nudge action:', action, 'for user:', userId);

    switch (action) {
      case 'dismiss':
        const { nudgeId } = body;
        if (!nudgeId) {
          return NextResponse.json(
            { success: false, error: 'Nudge ID is required for dismiss action' },
            { status: 400 }
          );
        }
        
        // Record dismissal
        await ExposureCapManager.recordExposure(
          userId,
          'diversity',
          `dismissed_${nudgeId}`
        );
        
        devLog('Diversity nudge dismissed:', nudgeId);
        break;

      case 'click':
        const { candidateId } = body;
        if (!candidateId) {
          return NextResponse.json(
            { success: false, error: 'Candidate ID is required for click action' },
            { status: 400 }
          );
        }
        
        // Record click
        await ExposureCapManager.recordExposure(
          userId,
          'candidate',
          candidateId
        );
        
        devLog('Diversity nudge candidate clicked:', candidateId);
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      action,
      userId,
      pollId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    devLog('Error in diversity nudges action API:', error);
    const appError = handleError(error as Error);
    const userMessage = getUserMessage(appError);
    const statusCode = getHttpStatus(appError);
    
    return NextResponse.json({ 
      success: false, 
      error: userMessage 
    }, { status: statusCode });
  }
}

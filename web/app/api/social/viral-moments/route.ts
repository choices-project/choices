import { NextRequest, NextResponse } from 'next/server';
import { ViralMomentDetector } from '@/lib/social/viral-detection';
import { devLog } from '@/lib/logger';
import { handleError, getUserMessage, getHttpStatus } from '@/lib/error-handler';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pollId = searchParams.get('pollId');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!pollId) {
      return NextResponse.json(
        { success: false, error: 'Poll ID is required' },
        { status: 400 }
      );
    }

    devLog('Detecting viral moments for poll:', pollId);

    // Detect viral moments
    const viralMoments = await ViralMomentDetector.detectViralMoments(pollId);

    // Sort by shareability and confidence
    const sortedMoments = viralMoments
      .sort((a, b) => {
        const scoreA = a.shareability * 0.7 + a.confidence * 0.3;
        const scoreB = b.shareability * 0.7 + b.confidence * 0.3;
        return scoreB - scoreA;
      })
      .slice(0, limit);

    devLog(`Found ${sortedMoments.length} viral moments for poll ${pollId}`);

    return NextResponse.json({
      success: true,
      viralMoments: sortedMoments,
      count: sortedMoments.length,
      pollId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    devLog('Error in viral moments API:', error);
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
    const { pollId, triggerType = 'manual' } = body;

    if (!pollId) {
      return NextResponse.json(
        { success: false, error: 'Poll ID is required' },
        { status: 400 }
      );
    }

    devLog('Triggering viral moment detection for poll:', pollId, 'Type:', triggerType);

    // Trigger viral moment detection
    const viralMoments = await ViralMomentDetector.detectViralMoments(pollId);

    // Filter for high-confidence moments
    const highConfidenceMoments = viralMoments.filter(
      moment => moment.confidence > 0.8 && moment.shareability > 0.7
    );

    devLog(`Triggered detection found ${highConfidenceMoments.length} high-confidence moments`);

    return NextResponse.json({
      success: true,
      viralMoments: highConfidenceMoments,
      count: highConfidenceMoments.length,
      pollId,
      triggerType,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    devLog('Error in viral moments trigger API:', error);
    const appError = handleError(error as Error);
    const userMessage = getUserMessage(appError);
    const statusCode = getHttpStatus(appError);
    
    return NextResponse.json({ 
      success: false, 
      error: userMessage 
    }, { status: statusCode });
  }
}

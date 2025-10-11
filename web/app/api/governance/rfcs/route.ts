/**
 * RFC Management API Endpoint
 * 
 * Provides endpoints for managing Request for Comments (RFC) system.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { RFCManager } from '@/lib/governance/rfcs';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'list';
    
    switch (action) {
      case 'list':
        const rfcs = await RFCManager.getPublicRFCs();
        return NextResponse.json({
          success: true,
          data: rfcs,
          timestamp: new Date().toISOString()
        });
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action parameter'
        }, { status: 400 });
    }
  } catch (error) {
    logger.error('Failed to get RFCs', error instanceof Error ? error : new Error('Unknown error'));
    
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve RFCs',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;
    
    switch (action) {
      case 'create':
        const rfcId = await RFCManager.createRFC(data);
        return NextResponse.json({
          success: true,
          data: { rfcId },
          message: 'RFC created successfully',
          timestamp: new Date().toISOString()
        });
        
      case 'publish':
        const { rfcId: publishRfcId } = data;
        if (!publishRfcId) {
          return NextResponse.json({
            success: false,
            error: 'Missing rfcId for publish action'
          }, { status: 400 });
        }
        
        await RFCManager.publishRFC(publishRfcId);
        return NextResponse.json({
          success: true,
          message: 'RFC published successfully',
          timestamp: new Date().toISOString()
        });
        
      case 'comment':
        const { rfcId: commentRfcId, author, content, parentId } = data;
        if (!commentRfcId || !author || !content) {
          return NextResponse.json({
            success: false,
            error: 'Missing required fields for comment action'
          }, { status: 400 });
        }
        
        const commentId = await RFCManager.addComment(commentRfcId, author, content, parentId);
        return NextResponse.json({
          success: true,
          data: { commentId },
          message: 'Comment added successfully',
          timestamp: new Date().toISOString()
        });
        
      case 'vote':
        const { rfcId: voteRfcId, voter, vote, reasoning } = data;
        if (!voteRfcId || !voter || !vote) {
          return NextResponse.json({
            success: false,
            error: 'Missing required fields for vote action'
          }, { status: 400 });
        }
        
        const voteId = await RFCManager.castVote(voteRfcId, voter, vote, reasoning);
        return NextResponse.json({
          success: true,
          data: { voteId },
          message: 'Vote cast successfully',
          timestamp: new Date().toISOString()
        });
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action parameter'
        }, { status: 400 });
    }
  } catch (error) {
    logger.error('Failed to process RFC action', error instanceof Error ? error : new Error('Unknown error'));
    
    return NextResponse.json({
      success: false,
      error: 'Failed to process RFC action',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

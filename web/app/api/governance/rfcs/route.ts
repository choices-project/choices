import type { NextRequest } from 'next/server';

import { withErrorHandling, successResponse, validationError } from '@/lib/api';
import { RFCManager } from '@/lib/governance/rfcs';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') ?? 'list';
  
  switch (action) {
    case 'list': {
      const rfcs = await RFCManager.getPublicRFCs();
      return successResponse({ rfcs }, { action: 'list' });
    }
      
    default:
      return validationError({ action: 'Invalid action parameter' });
  }
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const { action, ...data } = body;

  switch (action) {
    case 'create': {
      const rfcId = await RFCManager.createRFC(data);
      return successResponse(
        { rfcId },
        { action: 'create' },
        201
      );
    }

    case 'publish': {
      const { rfcId: publishRfcId } = data;
      if (!publishRfcId) {
        return validationError({ rfcId: 'rfcId is required to publish' });
      }

      await RFCManager.publishRFC(publishRfcId);
      return successResponse(
        { rfcId: publishRfcId, status: 'published' },
        { action: 'publish' }
      );
    }

    case 'comment': {
      const { rfcId: commentRfcId, author, content, parentId } = data;
      if (!commentRfcId || !author || !content) {
        const errors: Record<string, string> = {};
        if (!commentRfcId) errors.rfcId = 'rfcId is required';
        if (!author) errors.author = 'author is required';
        if (!content) errors.content = 'content is required';
        return validationError(errors);
      }

      const commentId = await RFCManager.addComment(commentRfcId, author, content, parentId);
      return successResponse(
        { commentId, rfcId: commentRfcId },
        { action: 'comment' },
        201
      );
    }

    case 'vote': {
      const { rfcId: voteRfcId, voter, vote, reasoning } = data;
      if (!voteRfcId || !voter || !vote) {
        const errors: Record<string, string> = {};
        if (!voteRfcId) errors.rfcId = 'rfcId is required';
        if (!voter) errors.voter = 'voter is required';
        if (!vote) errors.vote = 'vote is required';
        return validationError(errors);
      }

      const voteId = await RFCManager.castVote(voteRfcId, voter, vote, reasoning);
      return successResponse(
        { voteId, rfcId: voteRfcId },
        { action: 'vote' }
      );
    }

    default:
      return validationError({ action: 'Invalid action parameter' });
  }
});

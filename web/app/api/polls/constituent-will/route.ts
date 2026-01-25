/**
 * Constituent Will Poll Creation API
 * 
 * Creates polls where constituents express how they want their representative to vote
 * on specific bills. These polls can then be compared to actual votes.
 * 
 * POST /api/polls/constituent-will
 * Body: { title, description, representativeId, billId, billTitle?, billSummary? }
 * 
 * @author Choices Platform Team
 * @date 2026-01-25
 */

import { getSupabaseServerClient } from '@/utils/supabase/server';

import { withErrorHandling, successResponse, errorResponse, validationError, authError } from '@/lib/api';
import { govInfoMCPService } from '@/lib/services/govinfo-mcp-service';
import { logger } from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const POST = withErrorHandling(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { 
      title, 
      description, 
      representativeId, 
      billId,
      billTitle,
      billSummary 
    } = body;

    // Validation
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return validationError({ title: 'Title is required' });
    }
    if (!representativeId || typeof representativeId !== 'number') {
      return validationError({ representativeId: 'representativeId is required and must be a number' });
    }
    if (!billId || typeof billId !== 'string' || billId.trim().length === 0) {
      return validationError({ billId: 'billId (GovInfo package ID) is required' });
    }

    const supabase = await getSupabaseServerClient();
    if (!supabase) {
      return errorResponse('Database unavailable', 503);
    }

    // Get authenticated user
    const { data: { user }, error: userAuthError } = await supabase.auth.getUser();
    if (userAuthError || !user) {
      return authError('Authentication required');
    }

    // Fetch bill context if not provided
    let finalBillTitle = billTitle;
    let finalBillSummary = billSummary;

    if (!finalBillTitle || !finalBillSummary) {
      try {
        const billSummary = await govInfoMCPService.getPackageSummary(billId);
        if (billSummary) {
          finalBillTitle = finalBillTitle || billSummary.title;
          finalBillSummary = finalBillSummary || billSummary.summary;
        }
      } catch (error) {
        logger.warn('Failed to fetch bill summary, continuing without it', {
          billId,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    // Create poll with constituent_will type
    // Standard options: Yes, No, Abstain
    const pollOptions = [
      { text: 'Yes - Support this bill', order_index: 0 },
      { text: 'No - Oppose this bill', order_index: 1 },
      { text: 'Abstain - No position', order_index: 2 }
    ];

    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .insert({
        title: title.trim(),
        description: description?.trim() || null,
        created_by: user.id,
        status: 'active',
        privacy_level: 'public',
        voting_method: 'single',
        poll_type: 'constituent_will',
        bill_id: billId,
        representative_id: representativeId,
        bill_title: finalBillTitle || null,
        bill_summary: finalBillSummary || null,
        total_votes: 0,
        category: 'civics',
        tags: ['constituent-will', 'accountability'],
        hashtags: ['constituent-will', 'accountability'],
        primary_hashtag: 'constituent-will'
      } as any)
      .select('id')
      .single();

    if (pollError || !poll) {
      logger.error('Failed to create constituent will poll', {
        error: pollError?.message,
        representativeId,
        billId
      });
      return errorResponse('Failed to create poll', 500, { 
        reason: pollError?.message || 'Unknown error' 
      });
    }

    // Create poll options
    const { error: optionsError } = await supabase
      .from('poll_options')
      .insert(
        pollOptions.map(opt => ({
          poll_id: poll.id,
          text: opt.text,
          option_text: opt.text,
          order_index: opt.order_index
        }))
      );

    if (optionsError) {
      logger.error('Failed to create poll options', {
        pollId: poll.id,
        error: optionsError.message
      });
      // Poll was created, but options failed - still return success but log error
      logger.warn('Poll created but options failed', { pollId: poll.id });
    }

    logger.info('Constituent will poll created', {
      pollId: poll.id,
      representativeId,
      billId,
      createdBy: user.id
    });

    return successResponse({
      id: poll.id,
      title: title.trim(),
      pollType: 'constituent_will',
      representativeId,
      billId,
      billTitle: finalBillTitle,
      billSummary: finalBillSummary,
      options: pollOptions
    }, {
      created: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to create constituent will poll', {
      error: error instanceof Error ? error.message : String(error)
    });

    return errorResponse(
      'Failed to create constituent will poll',
      500,
      { 
        reason: error instanceof Error ? error.message : 'Unknown error'
      }
    );
  }
});

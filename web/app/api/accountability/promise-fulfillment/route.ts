/**
 * Promise Fulfillment Analysis API
 * 
 * Analyzes how well representatives fulfill campaign promises
 * by comparing promises to actual votes and bill text
 * 
 * POST /api/accountability/promise-fulfillment
 * Body: { candidateId, issue, position, campaignDate, billIds?, description?, source? }
 * 
 * @author Choices Platform Team
 * @date 2026-01-25
 */

import { withErrorHandling, successResponse, errorResponse, validationError } from '@/lib/api';
import { promiseFulfillmentService } from '@/lib/services/promise-fulfillment-service';
import { logger } from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const POST = withErrorHandling(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { candidateId, issue, position, campaignDate, billIds, description, source } = body;

    // Validation
    if (!candidateId) {
      return validationError({ candidateId: 'candidateId is required' });
    }
    if (!issue) {
      return validationError({ issue: 'issue is required' });
    }
    if (!position) {
      return validationError({ position: 'position is required (support/oppose/neutral)' });
    }
    if (!campaignDate) {
      return validationError({ campaignDate: 'campaignDate is required (YYYY-MM-DD)' });
    }

    logger.info('Analyzing promise fulfillment', {
      candidateId,
      issue,
      position
    });

    // Generate promise ID
    const promiseId = `${candidateId}-${issue}-${Date.now()}`;

    const promise = {
      id: promiseId,
      candidateId,
      issue,
      position,
      campaignDate,
      billIds: billIds || [],
      description,
      source
    };

    // Analyze promise fulfillment
    const analysis = await promiseFulfillmentService.analyzePromiseFulfillment(promise);

    return successResponse(analysis, {
      candidateId,
      issue,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to analyze promise fulfillment', {
      error: error instanceof Error ? error.message : String(error)
    });

    return errorResponse(
      'Failed to analyze promise fulfillment',
      500,
      { 
        reason: error instanceof Error ? error.message : 'Unknown error'
      }
    );
  }
});

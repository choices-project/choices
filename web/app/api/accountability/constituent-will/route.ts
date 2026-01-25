/**
 * Constituent Will Analysis API
 *
 * Compares constituent poll results to actual representative votes.
 * GET /api/accountability/constituent-will?representativeId=&billId=&pollId=
 *
 * @author Choices Platform Team
 * @date 2026-01-26
 */

import {
  withErrorHandling,
  successResponse,
  errorResponse,
  validationError,
  authError,
  notFoundError
} from '@/lib/api';
import { promiseFulfillmentService } from '@/lib/services/promise-fulfillment-service';
import { getSupabaseServerClient } from '@/utils/supabase/server';
import { logger } from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = withErrorHandling(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const representativeId = searchParams.get('representativeId')?.trim();
    const billId = searchParams.get('billId')?.trim();
    const pollIdParam = searchParams.get('pollId')?.trim();

    if (!representativeId) {
      return validationError({ representativeId: 'representativeId is required' });
    }
    const repIdNum = parseInt(representativeId, 10);
    if (Number.isNaN(repIdNum) || repIdNum < 1) {
      return validationError({ representativeId: 'representativeId must be a positive integer' });
    }
    if (!billId) {
      return validationError({ billId: 'billId (GovInfo package ID) is required' });
    }

    const supabase = await getSupabaseServerClient();
    if (!supabase) {
      return errorResponse('Database unavailable', 503);
    }

    const {
      data: { user },
      error: userAuthError
    } = await supabase.auth.getUser();
    if (userAuthError || !user) {
      return authError('Authentication required');
    }

    let pollId = pollIdParam;
    if (!pollId) {
      const { data: poll, error: pollErr } = await supabase
        .from('polls')
        .select('id')
        .eq('poll_type', 'constituent_will')
        .eq('representative_id', repIdNum)
        .eq('bill_id', billId)
        .limit(1)
        .maybeSingle();

      if (pollErr) {
        logger.warn('Failed to lookup constituent-will poll', {
          representativeId,
          billId,
          error: pollErr.message
        });
        return errorResponse('Failed to lookup poll', 502, { reason: pollErr.message });
      }
      if (!poll?.id) {
        return notFoundError('No constituent-will poll found for this representative and bill');
      }
      pollId = String(poll.id);
    }

    const analysis = await promiseFulfillmentService.analyzeConstituentWill(
      representativeId,
      billId,
      pollId
    );

    return successResponse(analysis, {
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to analyze constituent will', {
      error: error instanceof Error ? error.message : String(error)
    });

    return errorResponse('Failed to analyze constituent will', 500, {
      reason: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

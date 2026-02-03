/**
 * Bill context API — GovInfo summary and related bills for a given package ID.
 * GET /api/polls/bill-context?billId=<GovInfo package ID>
 *
 * Used by poll creation/detail UIs to show bill summary and related bills
 * without calling the full accountability flow.
 */

import { withErrorHandling, successResponse, errorResponse, validationError } from '@/lib/api';
import { govInfoMCPService } from '@/lib/services/govinfo-mcp-service';

import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const billId = searchParams.get('billId')?.trim();

  if (!billId || billId.length === 0) {
    return validationError({ billId: 'billId (GovInfo package ID) is required' });
  }

  try {
    const [summary, relatedBills] = await Promise.all([
      govInfoMCPService.getPackageSummary(billId),
      govInfoMCPService.getRelatedBills(billId)
    ]);

    return successResponse({
      billId,
      summary: summary?.summary ?? null,
      title: summary?.title ?? null,
      lastModified: summary?.lastModified ?? null,
      relatedBills: (relatedBills ?? []).map((p) => ({
        packageId: p.packageId,
        title: p.title ?? undefined
      }))
    });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to fetch bill context',
      500
    );
  }
});

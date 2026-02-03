/**
 * Bill content API — GovInfo full bill text for collapsible viewer.
 * GET /api/bills/content?packageId=<GovInfo package ID>&format=html|text
 *
 * Server-only; uses cached getBillContent. format defaults to 'html'.
 */

import { withErrorHandling, successResponse, errorResponse, validationError } from '@/lib/api';
import { govInfoMCPService } from '@/lib/services/govinfo-mcp-service';

import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ALLOWED_FORMATS = ['html', 'text'] as const;

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const packageId = searchParams.get('packageId')?.trim();
  const formatParam = (searchParams.get('format') ?? 'html').toLowerCase();

  if (!packageId || packageId.length === 0) {
    return validationError({ packageId: 'packageId (GovInfo package ID) is required' });
  }

  const format = ALLOWED_FORMATS.includes(formatParam as (typeof ALLOWED_FORMATS)[number])
    ? (formatParam as 'html' | 'text')
    : 'html';

  try {
    const billContent = await govInfoMCPService.getBillContent(packageId, format);
    if (!billContent) {
      return errorResponse('Bill content not found', 404);
    }
    return successResponse({
      packageId: billContent.packageId,
      content: billContent.content,
      format: billContent.format
    });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to fetch bill content',
      500
    );
  }
});

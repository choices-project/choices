/**
 * Bill search API — GovInfo bill search for constituent-will poll creation.
 * GET /api/bills/search?q=...&congress=119&page_size=20
 */

import { withErrorHandling, successResponse, errorResponse, validationError } from '@/lib/api';
import { govInfoMCPService } from '@/lib/services/govinfo-mcp-service';

import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();
  const congressParam = searchParams.get('congress');
  const pageSizeParam = searchParams.get('page_size');

  if (!q || q.length === 0) {
    return validationError({ q: 'Query q is required' });
  }

  const congress = congressParam ? parseInt(congressParam, 10) : undefined;
  if (congressParam != null && (congress === undefined || Number.isNaN(congress) || congress < 1 || congress > 999)) {
    return validationError({ congress: 'congress must be a positive integer' });
  }

  const page_size = pageSizeParam ? parseInt(pageSizeParam, 10) : 20;
  if (Number.isNaN(page_size) || page_size < 1 || page_size > 100) {
    return validationError({ page_size: 'page_size must be between 1 and 100' });
  }

  try {
    const result = await govInfoMCPService.searchBills(q, {
      collection: 'BILLS',
      congress,
      page_size
    });

    return successResponse({
      packages: result.packages,
      nextPage: result.nextPage,
      count: result.count ?? result.packages.length
    });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : 'Bill search failed',
      500
    );
  }
});

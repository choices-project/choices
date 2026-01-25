/**
 * Admin: Trending Topics API (stub)
 *
 * GET /api/admin/trending-topics
 *
 * Returns trending topics for admin review. Stub implementation returns
 * empty array; wire to trending_topics or topic pipeline when ready.
 *
 * Used by: DashboardOverview, useTrendingTopics hook
 * Authentication: Requires admin
 */

import { requireAdminOr401 } from '@/features/auth/lib/admin-auth';

import { withErrorHandling, successResponse } from '@/lib/api';

import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = withErrorHandling(async (_request: NextRequest) => {
  const authGate = await requireAdminOr401();
  if (authGate) return authGate;

  return successResponse({ topics: [] });
});

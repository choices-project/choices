/**
 * Admin: Generated Polls API (stub)
 *
 * GET /api/admin/generated-polls
 *
 * Returns AI-generated polls awaiting admin approval. Stub implementation
 * returns empty array; wire to polls/generation pipeline when ready.
 *
 * Used by: DashboardOverview, useGeneratedPolls hook
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

  return successResponse({ polls: [] });
});

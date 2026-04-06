import { getSupabaseAdminClient, getSupabaseServerClient } from '@/utils/supabase/server';

import { requireAdminOr401, getAdminUser } from '@/features/auth/lib/admin-auth';

import {
  withErrorHandling,
  successResponse,
  errorResponse,
  validationError,
} from '@/lib/api';
import { env } from '@/lib/config/env';
import {
  createGithubIssueAndPersistMetadata,
  parseGithubRepository,
  type FeedbackRowForIssue,
} from '@/lib/integrations/github/feedback-github-issue';
import { devLog } from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export const POST = withErrorHandling(async (request: NextRequest) => {
  const authGate = await requireAdminOr401();
  if (authGate) return authGate;

  const adminUser = await getAdminUser();
  if (!adminUser) {
    return errorResponse('Admin access required', 403);
  }

  const token = env.GITHUB_ISSUES_TOKEN?.trim();
  const repoParsed = parseGithubRepository(env.GITHUB_ISSUES_REPOSITORY?.trim());
  if (!token || !repoParsed) {
    return errorResponse(
      'GitHub issue creation is not configured. Set GITHUB_ISSUES_TOKEN and GITHUB_ISSUES_REPOSITORY (owner/repo) on the server.',
      503,
    );
  }

  const body = await request.json().catch(() => null);
  const ids = body && Array.isArray(body.feedbackIds) ? body.feedbackIds : null;
  if (!ids || ids.length === 0) {
    return validationError({ feedbackIds: 'Non-empty feedbackIds array is required' });
  }

  const trimmedIds: string[] = ids
    .map((x: unknown) => String(x).trim())
    .filter((s: string) => s.length > 0);
  const uniqueIds: string[] = [...new Set(trimmedIds)];
  if (uniqueIds.length === 0) {
    return validationError({ feedbackIds: 'No valid feedback IDs' });
  }
  if (uniqueIds.length > 25) {
    return validationError({ feedbackIds: 'Maximum 25 feedback items per bulk request' });
  }

  const supabase = await getSupabaseServerClient();
  const adminClient = await getSupabaseAdminClient();

  const { data: rows, error: loadError } = await supabase
    .from('feedback')
    .select(
      'id, title, description, type, feedback_type, priority, sentiment, status, created_at, user_id, ai_analysis, metadata',
    )
    .in('id', uniqueIds);

  if (loadError) {
    devLog('bulk-generate-issues: load failed', { error: loadError });
    return errorResponse('Failed to load feedback rows', 500);
  }

  const byId = new Map((rows ?? []).map((r) => [r.id, r as FeedbackRowForIssue]));
  const issues: Awaited<ReturnType<typeof createGithubIssueAndPersistMetadata>>[] = [];

  for (const id of uniqueIds) {
    const row = byId.get(id);
    if (!row) {
      return errorResponse(`Feedback not found: ${id}`, 404);
    }
    try {
      const payload = await createGithubIssueAndPersistMetadata(adminClient, row, {
        token,
        owner: repoParsed.owner,
        repo: repoParsed.repo,
      });
      issues.push(payload);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      if (message.includes('already has a linked GitHub issue')) {
        return errorResponse(`Skipped or conflict for ${id}: ${message}`, 409);
      }
      devLog('bulk-generate-issues: item failed', { id, message });
      return errorResponse(`Failed for ${id}: ${message}`, 502);
    }
  }

  return successResponse({ issues });
});

import { getSupabaseAdminClient, getSupabaseServerClient } from '@/utils/supabase/server';

import { requireAdminOr401, getAdminUser } from '@/features/auth/lib/admin-auth';

import {
  withErrorHandling,
  successResponse,
  errorResponse,
  validationError,
  notFoundError,
} from '@/lib/api';
import {
  createGithubIssueAndPersistMetadata,
  parseGithubRepository,
  type FeedbackRowForIssue,
} from '@/lib/integrations/github/feedback-github-issue';
import { env } from '@/lib/config/env';
import { devLog } from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export const POST = withErrorHandling(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
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

  const { id } = await params;
  const feedbackId = String(id ?? '').trim();
  if (!feedbackId) {
    return validationError({ feedbackId: 'Feedback ID is required' });
  }

  const supabase = await getSupabaseServerClient();
  const adminClient = await getSupabaseAdminClient();

  const { data: row, error: loadError } = await supabase
    .from('feedback')
    .select(
      'id, title, description, type, feedback_type, priority, sentiment, status, created_at, user_id, ai_analysis, metadata',
    )
    .eq('id', feedbackId)
    .single();

  if (loadError || !row) {
    devLog('generate-issue: feedback not found', { feedbackId, error: loadError });
    return notFoundError('Feedback not found');
  }

  const feedbackRow = row as FeedbackRowForIssue;

  try {
    const payload = await createGithubIssueAndPersistMetadata(adminClient, feedbackRow, {
      token,
      owner: repoParsed.owner,
      repo: repoParsed.repo,
    });
    return successResponse(payload);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (message.includes('already has a linked GitHub issue')) {
      return errorResponse(message, 409);
    }
    devLog('generate-issue: failed', { feedbackId, message });
    return errorResponse(message || 'Failed to create GitHub issue', 502);
  }
});

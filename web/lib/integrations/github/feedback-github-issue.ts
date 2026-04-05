/**
 * Build GitHub issue content and call the GitHub REST API from admin feedback triage.
 * Configure with GITHUB_ISSUES_TOKEN + GITHUB_ISSUES_REPOSITORY (owner/repo).
 */

import type { Database, Json } from '@/types/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

export type FeedbackGithubAnalysis = {
  intent: string;
  category: string;
  sentiment: number;
  urgency: number;
  complexity: number;
  keywords: string[];
  suggestedActions: string[];
  impact: number;
  estimatedEffort: string;
};

export type FeedbackRowForIssue = {
  id: string;
  title: string;
  description: string;
  type: string | null;
  feedback_type: string;
  priority: string | null;
  sentiment: string | null;
  status: string | null;
  created_at: string | null;
  user_id: string | null;
  ai_analysis: unknown;
  metadata: unknown;
};

function clampInt(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(n)));
}

function priorityToScores(priority: string | null | undefined): { urgency: number; impact: number } {
  const p = (priority ?? 'medium').toLowerCase();
  if (p === 'urgent') return { urgency: 9, impact: 8 };
  if (p === 'high') return { urgency: 7, impact: 7 };
  if (p === 'low') return { urgency: 3, impact: 4 };
  return { urgency: 5, impact: 5 };
}

function effortFromComplexity(complexity: number): string {
  if (complexity >= 8) return 'large';
  if (complexity >= 5) return 'medium';
  return 'small';
}

export function buildAnalysisFromRow(row: FeedbackRowForIssue): FeedbackGithubAnalysis {
  const ai = row.ai_analysis && typeof row.ai_analysis === 'object' && row.ai_analysis !== null
    ? (row.ai_analysis as Record<string, unknown>)
    : {};

  const keywords = Array.isArray(ai.keywords)
    ? (ai.keywords as unknown[]).map((k) => String(k)).filter(Boolean)
    : [];

  const suggestedActions = Array.isArray(ai.suggestedActions)
    ? (ai.suggestedActions as unknown[]).map((k) => String(k)).filter(Boolean)
    : [];

  const sentimentScore =
    typeof ai.sentiment === 'number' && !Number.isNaN(ai.sentiment)
      ? clampInt(ai.sentiment, 1, 10)
      : 5;

  const complexityScore =
    typeof ai.complexity === 'number' && !Number.isNaN(ai.complexity)
      ? clampInt(ai.complexity, 1, 10)
      : 5;

  const urgencyFromAi =
    typeof ai.urgency === 'number' && !Number.isNaN(ai.urgency)
      ? clampInt(ai.urgency, 1, 10)
      : undefined;

  const { urgency: urgencyFromPriority, impact: impactFromPriority } = priorityToScores(row.priority);
  const urgency = urgencyFromAi ?? urgencyFromPriority;

  return {
    intent: typeof ai.intent === 'string' ? ai.intent : 'User feedback triage',
    category: typeof ai.category === 'string' ? ai.category : (row.type ?? row.feedback_type ?? 'general'),
    sentiment: sentimentScore,
    urgency,
    complexity: complexityScore,
    keywords: keywords.length > 0 ? keywords : [row.feedback_type, row.type].filter(Boolean) as string[],
    suggestedActions:
      suggestedActions.length > 0
        ? suggestedActions
        : ['Review in admin feedback console', 'Reproduce if bug report', 'Close loop with reporter if contact exists'],
    impact: impactFromPriority,
    estimatedEffort: effortFromComplexity(complexityScore),
  };
}

export function buildIssueMarkdownBody(row: FeedbackRowForIssue, analysis: FeedbackGithubAnalysis): string {
  const lines = [
    row.description.trim() || '_No description provided._',
    '',
    '---',
    '',
    '### Triage metadata',
    '',
    `- **Feedback ID:** \`${row.id}\``,
    `- **Type:** ${row.type ?? row.feedback_type}`,
    `- **Priority:** ${row.priority ?? '—'}`,
    `- **Sentiment (label):** ${row.sentiment ?? '—'}`,
    `- **Status:** ${row.status ?? '—'}`,
    `- **Submitted:** ${row.created_at ?? '—'}`,
    `- **User-attributed:** ${row.user_id ? 'yes' : 'anonymous / no user id'}`,
    '',
    '### Automated analysis',
    '',
    `- **Intent:** ${analysis.intent}`,
    `- **Category:** ${analysis.category}`,
    `- **Scores (1–10):** sentiment ${analysis.sentiment}, urgency ${analysis.urgency}, complexity ${analysis.complexity}, impact ${analysis.impact}`,
    `- **Estimated effort:** ${analysis.estimatedEffort}`,
    '',
    analysis.keywords.length > 0 ? `**Keywords:** ${analysis.keywords.join(', ')}` : '',
    '',
    analysis.suggestedActions.length > 0
      ? `**Suggested actions:**\n${analysis.suggestedActions.map((a) => `- ${a}`).join('\n')}`
      : '',
    '',
    '_Issue opened from Choices admin feedback triage._',
  ];

  return lines.filter((l) => l !== '').join('\n');
}

export function parseGithubRepository(raw: string | undefined): { owner: string; repo: string } | null {
  if (!raw || typeof raw !== 'string') return null;
  const s = raw.trim();
  const m = /^([\w.-]+)\/([\w.-]+)$/.exec(s);
  if (!m?.[1] || !m[2]) return null;
  return { owner: m[1], repo: m[2] };
}

export async function createGithubIssue(input: {
  token: string;
  owner: string;
  repo: string;
  title: string;
  body: string;
}): Promise<{ number: number; html_url: string }> {
  const res = await fetch(`https://api.github.com/repos/${input.owner}/${input.repo}/issues`, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      Authorization: `Bearer ${input.token}`,
      'User-Agent': 'Choices-Admin-Feedback',
    },
    body: JSON.stringify({
      title: input.title.slice(0, 256),
      body: input.body.slice(0, 65000),
    }),
  });

  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;

  if (!res.ok) {
    const msg =
      typeof json.message === 'string'
        ? json.message
        : `GitHub API error (${res.status})`;
    throw new Error(msg);
  }

  const number = typeof json.number === 'number' ? json.number : Number(json.number);
  const html_url = typeof json.html_url === 'string' ? json.html_url : '';

  if (!Number.isFinite(number) || !html_url) {
    throw new Error('GitHub API returned an unexpected issue payload');
  }

  return { number, html_url };
}

export function issueTitleFromFeedback(row: FeedbackRowForIssue): string {
  const base = (row.title || 'User feedback').trim().slice(0, 200);
  return `[feedback] ${base}`;
}

/** Response shape expected by `IssueGenerationPanel` after `successResponse`. */
export type IssueGenerationClientPayload = {
  issueNumber: number;
  generatedIssue: { title: string; description: string };
  issueUrl: string;
  feedbackId: string;
  analysis: FeedbackGithubAnalysis;
};

function existingGithubIssue(metadata: unknown): { number: number } | null {
  if (!metadata || typeof metadata !== 'object') return null;
  const gh = (metadata as Record<string, unknown>).githubIssue;
  if (!gh || typeof gh !== 'object') return null;
  const num = (gh as Record<string, unknown>).number;
  return typeof num === 'number' && Number.isFinite(num) ? { number: num } : null;
}

export function feedbackAlreadyHasGithubIssue(row: FeedbackRowForIssue): boolean {
  return existingGithubIssue(row.metadata) !== null;
}

export async function createGithubIssueAndPersistMetadata(
  adminClient: SupabaseClient<Database>,
  row: FeedbackRowForIssue,
  opts: { token: string; owner: string; repo: string },
): Promise<IssueGenerationClientPayload> {
  if (feedbackAlreadyHasGithubIssue(row)) {
    throw new Error('Feedback already has a linked GitHub issue');
  }

  const analysis = buildAnalysisFromRow(row);
  const title = issueTitleFromFeedback(row);
  const body = buildIssueMarkdownBody(row, analysis);
  const gh = await createGithubIssue({
    token: opts.token,
    owner: opts.owner,
    repo: opts.repo,
    title,
    body,
  });

  const prevMeta =
    row.metadata && typeof row.metadata === 'object' && row.metadata !== null
      ? { ...(row.metadata as Record<string, unknown>) }
      : {};

  const createdAt = new Date().toISOString();
  const githubIssue = {
    number: gh.number,
    url: gh.html_url,
    analysis: {
      intent: analysis.intent,
      category: analysis.category,
      sentiment: analysis.sentiment,
      urgency: analysis.urgency,
      complexity: analysis.complexity,
      keywords: analysis.keywords,
      suggestedActions: analysis.suggestedActions,
    },
    createdAt,
  };

  const { error: updateError } = await adminClient
    .from('feedback')
    .update({
      metadata: { ...prevMeta, githubIssue } as Json,
      updated_at: createdAt,
    })
    .eq('id', row.id);

  if (updateError) {
    throw new Error(`Failed to save GitHub issue link: ${updateError.message}`);
  }

  return {
    issueNumber: gh.number,
    generatedIssue: {
      title,
      description: row.description.trim().slice(0, 400) || '(no description)',
    },
    issueUrl: gh.html_url,
    feedbackId: row.id,
    analysis,
  };
}

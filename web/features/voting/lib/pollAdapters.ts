import type { Ballot, BallotCandidate, BallotContest, VotingRecord } from '@/lib/stores/votingStore';

import type { VoteSubmission } from '../components/VotingInterface';

export type PollOptionInput =
  | string
  | {
      id?: string;
      text?: string;
      description?: string | null;
    };

export type PollDetailsForBallot = {
  id: string;
  title: string;
  description?: string | null;
  options: PollOptionInput[];
  votingMethod?: string | null;
  totalVotes?: number | null;
  endtime?: string | null;
  status?: string | null;
  category?: string | null;
  createdAt?: string | null;
};

export type PollBallotContext = {
  optionVoteCounts?: Record<string, number>;
  totalVotes?: number;
};

const toCandidate = (
  option: PollOptionInput,
  index: number,
  category: string | null | undefined,
  voteLookup: Record<string, number> | undefined
): BallotCandidate => {
  const id = typeof option === 'string' ? String(index) : option.id ?? String(index);
  const name =
    typeof option === 'string'
      ? option
      : option.text ?? option.description ?? `Option ${index + 1}`;

  const voteCount =
    voteLookup?.[id] ?? voteLookup?.[String(index)] ?? undefined;

  const candidate: BallotCandidate = {
    id,
    name,
    incumbent: false,
    endorsements: [],
    positions: [],
  };

  if (typeof category === 'string' && category.length > 0) {
    candidate.party = category;
  }
  if (voteCount !== undefined) {
    candidate.voteCount = voteCount;
  }

  return candidate;
};

const toContest = (
  poll: PollDetailsForBallot,
  context?: PollBallotContext
): BallotContest => {
  const optionsLength = poll.options.length;
  const method = (poll.votingMethod ?? 'single').toLowerCase();

  const maxSelections =
    method === 'single' ? 1 : optionsLength > 0 ? optionsLength : 1;
  const minSelections = method === 'single' ? 1 : 0;

  const instructionsByMethod: Record<string, string> = {
    single: 'Select the one option you support.',
    multiple: 'Select all options that apply. You may choose more than one.',
    approval: 'Approve every option you are comfortable supporting.',
    ranked: 'Rank the options in order of your preference.',
    range: 'Score every option based on how strongly you support it.',
    quadratic: 'Distribute your credits to indicate support intensity.',
  };

  const voteCounts =
    context?.optionVoteCounts && Object.keys(context.optionVoteCounts).length > 0
      ? context.optionVoteCounts
      : undefined;

  const contest: BallotContest = {
    id: `${poll.id}-primary`,
    title: poll.title,
    description: poll.description ?? '',
    type:
      method === 'ranked' || method === 'single' || method === 'multiple'
        ? 'candidate'
        : 'measure',
    candidates: poll.options.map((option, index) =>
      toCandidate(option, index, poll.category, voteCounts)
    ),
    instructions:
      instructionsByMethod[method] ??
      'Review the options and cast your vote according to the poll instructions.',
    maxSelections,
    minSelections,
  };

  if (context?.totalVotes !== undefined) {
    contest.totalVotes = context.totalVotes;
  }

  return contest;
};

export const createBallotFromPoll = (
  poll: PollDetailsForBallot,
  context?: PollBallotContext
): Ballot => {
  const nowIso = new Date().toISOString();
  const status = (poll.status ?? 'active').toLowerCase();

  const statusMap: Record<string, Ballot['status']> = {
    active: 'active',
    closed: 'closed',
    draft: 'upcoming',
    scheduled: 'upcoming',
    upcoming: 'upcoming',
    cancelled: 'cancelled',
  };

  const normalizedStatus =
    statusMap[status] ?? (status === 'completed' ? 'closed' : 'active');

  const totalVotes =
    context?.totalVotes ??
    (typeof poll.totalVotes === 'number' ? poll.totalVotes : undefined);

  return {
    id: poll.id,
    electionId: `poll-${poll.id}`,
    title: poll.title,
    description: poll.description ?? '',
    type: 'special',
    date: poll.createdAt ?? nowIso,
    deadline: poll.endtime ?? nowIso,
    status: normalizedStatus,
    contests: [toContest(poll, context)],
    metadata: {
      jurisdiction: 'digital-platform',
      district: poll.category ?? 'general',
    },
  };
};

export const createVotingRecordFromPollSubmission = ({
  poll,
  submission,
  voteId,
}: {
  poll: PollDetailsForBallot;
  submission: VoteSubmission;
  voteId?: string;
}): VotingRecord => {
  const method =
    submission.method ??
    (poll.votingMethod?.toLowerCase() as VoteSubmission['method']);

  let selections: string[];

  switch (method) {
    case 'single':
      selections =
        'choice' in submission && typeof submission.choice === 'number'
          ? [String(submission.choice)]
          : [];
      break;
    case 'multiple':
      selections =
        'selections' in submission && Array.isArray(submission.selections)
          ? submission.selections.map((value) => String(value))
          : [];
      break;
    case 'approval':
      selections =
        'approvals' in submission && Array.isArray(submission.approvals)
          ? submission.approvals.map((value) => String(value))
          : [];
      break;
    case 'ranked':
      selections =
        'rankings' in submission && Array.isArray(submission.rankings)
          ? submission.rankings.map((value) => String(value))
          : [];
      break;
    case 'range':
      selections =
        'ratings' in submission
          ? Object.entries(submission.ratings).map(
              ([key, score]) => `${key}:${score}`
            )
          : [];
      break;
    case 'quadratic':
      selections =
        'allocations' in submission
          ? Object.entries(submission.allocations).map(
              ([key, credits]) => `${key}:${credits}`
            )
          : [];
      break;
    default:
      selections = [];
  }

  const recordId =
    voteId ?? `${poll.id}-${method}-${Date.now().toString(36)}`;

  return {
    id: recordId,
    ballotId: poll.id,
    contestId: `${poll.id}-primary`,
    selections,
    votedAt: new Date().toISOString(),
    method: 'digital',
    verified: true,
    receipt: recordId,
  };
};


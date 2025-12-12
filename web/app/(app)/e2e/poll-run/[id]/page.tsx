import { notFound } from 'next/navigation';

import PollRunHarnessClient from './PollRunHarnessClient';

import type { Metadata } from 'next';

const isProduction = process.env.NODE_ENV === 'production';
const allowHarness = process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1';

export const metadata: Metadata = {
  title: 'Poll Run E2E Harness - Choices',
};

type PollClientProps = Parameters<typeof PollRunHarnessClient>[0]['poll'];

const BASE_POLL: PollClientProps = {
  id: 'harness-poll',
  title: 'Harness Voting Insights',
  description: 'A sample poll rendered in the e2e harness to validate analytics, voting, and sharing flows.',
  options: ['Increase research funding', 'Invest in community programs', 'Expand customer success'],
  votingMethod: 'single',
  totalvotes: 42,
  endtime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  status: 'active',
  category: 'community',
  privacyLevel: 'public',
  createdAt: new Date().toISOString(),
};

export default function PollRunHarnessPage({ params }: { params: { id: string } }) {
  if (isProduction && !allowHarness) {
    notFound();
  }

  const pollId = params.id ?? BASE_POLL.id;

  const poll = {
    ...BASE_POLL,
    id: pollId,
    title: `Harness: ${pollId}`,
  } satisfies PollClientProps;

  return <PollRunHarnessClient poll={poll} />;
}


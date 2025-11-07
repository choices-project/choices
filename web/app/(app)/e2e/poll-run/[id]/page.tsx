import { notFound } from 'next/navigation';

import PollRunHarnessClient from './PollRunHarnessClient';

const isProduction = process.env.NODE_ENV === 'production';

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
  if (isProduction) {
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


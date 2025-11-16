export type MockPollOption = {
  id: string;
  text: string;
};

export type MockPollRecord = {
  id: string;
  title: string;
  description: string;
  category: string;
  options: MockPollOption[];
  createdAt: string;
  closesAt: string;
};

const createOption = (pollId: string, index: number, text: string): MockPollOption => ({
  id: `${pollId}-option-${index}`,
  text,
});

export const createPollRecord = (overrides: Partial<MockPollRecord> = {}): MockPollRecord => {
  const pollId = overrides.id ?? `poll-${Math.random().toString(36).slice(2, 8)}`;
  const options =
    overrides.options ??
    [
      createOption(pollId, 1, 'Option 1'),
      createOption(pollId, 2, 'Option 2'),
    ];

  return {
    id: pollId,
    title: overrides.title ?? 'Mock Poll',
    description: overrides.description ?? 'Mock poll description used by fixtures.',
    category: overrides.category ?? 'general',
    options,
    createdAt: overrides.createdAt ?? new Date('2025-01-01T00:00:00.000Z').toISOString(),
    closesAt: overrides.closesAt ?? new Date('2025-02-01T00:00:00.000Z').toISOString(),
  };
};

export const POLL_FIXTURES: MockPollRecord[] = [
  createPollRecord({
    id: 'poll-1',
    title: 'Community Broadband Expansion',
    description: 'Should the city invest in municipal broadband infrastructure?',
    category: 'infrastructure',
    options: [
      createOption('poll-1', 1, 'Yes'),
      createOption('poll-1', 2, 'No'),
    ],
  }),
  createPollRecord({
    id: 'poll-2',
    title: 'Downtown Car-Free Weekend',
    description: 'Pilot a car-free downtown weekend to improve air quality.',
    category: 'environment',
    options: [
      createOption('poll-2', 1, 'Support'),
      createOption('poll-2', 2, 'Oppose'),
    ],
  }),
];


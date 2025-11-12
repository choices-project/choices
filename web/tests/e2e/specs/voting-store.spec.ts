import { expect, test, type Page } from '@playwright/test';

import type { VotingStoreHarness } from '@/app/(app)/e2e/voting-store/page';
import type { Ballot, Election, VotingRecord } from '@/lib/stores/votingStore';

import { waitForPageReady } from '../helpers/e2e-setup';

declare global {
  var __votingStoreHarness: VotingStoreHarness | undefined;
}

const createHarnessBallot = (): Ballot => ({
  id: 'ballot-harness',
  electionId: 'election-harness',
  title: 'Harness Ballot',
  description: 'Harness ballot description',
  type: 'general',
  date: new Date('2025-01-01T00:00:00Z').toISOString(),
  deadline: new Date('2025-01-02T00:00:00Z').toISOString(),
  status: 'active',
  contests: [],
  metadata: {
    jurisdiction: 'Harness',
    district: 'Test',
    turnout: 0,
    totalVoters: 0,
  },
} satisfies Ballot);

const createHarnessElection = (): Election => ({
  id: 'election-harness',
  name: 'Harness Election',
  date: new Date('2025-02-01T00:00:00Z').toISOString(),
  type: 'general',
  status: 'upcoming',
  description: 'Harness election description',
  ballots: ['ballot-harness'],
  metadata: {
    jurisdiction: 'Harness',
    district: 'Test',
    turnout: 0,
    totalVoters: 0,
  },
} satisfies Election);

const createHarnessVotingRecord = (): VotingRecord => ({
  id: 'record-harness',
  ballotId: 'ballot-harness',
  contestId: 'contest-harness',
  selections: ['candidate-1'],
  votedAt: new Date('2025-01-01T12:00:00Z').toISOString(),
  method: 'digital' as const,
  verified: true,
} satisfies VotingRecord);

const gotoHarness = async (page: Page) => {
  await page.goto('/e2e/voting-store', { waitUntil: 'domcontentloaded' });
  await waitForPageReady(page);
  await page.waitForFunction(() => Boolean(window.__votingStoreHarness));
};

test.describe('Voting store harness', () => {
  test('manipulates store state via window harness', async ({ page }) => {
    await gotoHarness(page);

    await page.evaluate(
      (payload) => {
        const harness = window.__votingStoreHarness;
        if (!harness) {
          throw new Error('Voting store harness not registered');
        }
        harness.reset();
        harness.setBallots([payload.ballot]);
        harness.setElections([payload.election]);
        harness.setVotingRecords([payload.record]);
      },
      {
        ballot: createHarnessBallot(),
        election: createHarnessElection(),
        record: createHarnessVotingRecord(),
      },
    );

    await expect(page.getByTestId('voting-total-ballots')).toHaveText('1');
    await expect(page.getByTestId('voting-total-elections')).toHaveText('1');
    await expect(page.getByTestId('voting-total-records')).toHaveText('1');

    await page.evaluate(() => {
      const harness = window.__votingStoreHarness;
      if (!harness) {
        throw new Error('Voting store harness missing during reset');
      }
      harness.reset();
    });

    await expect(page.getByTestId('voting-total-ballots')).toHaveText('0');
    await expect(page.getByTestId('voting-total-elections')).toHaveText('0');
    await expect(page.getByTestId('voting-total-records')).toHaveText('0');
  });
});


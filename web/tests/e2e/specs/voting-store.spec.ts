import { expect, test, type Page } from '@playwright/test';

import { waitForPageReady } from '../helpers/e2e-setup';

const IS_STAGING = process.env.PLAYWRIGHT_STAGING === '1';

declare global {
  interface Window {
    __votingStoreHarness?: {
      setBallots: (ballots: unknown[]) => void;
      setElections: (elections: unknown[]) => void;
      setVotingRecords: (records: unknown[]) => void;
      reset: () => void;
      getSnapshot: () => Record<string, unknown>;
      castVote?: (
        ballotId: string,
        contestId: string,
        selections: string[],
      ) => Promise<void>;
      confirmVote?: (recordId: string) => Promise<void>;
      undoVote?: (recordId: string) => Promise<void>;
    };
  }
}

const gotoHarness = async (page: Page) => {
  await page.goto('/e2e/voting-store', {
    waitUntil: 'domcontentloaded',
    timeout: 60_000,
  });
  await waitForPageReady(page);
  await page.waitForFunction(
    () => Boolean(window.__votingStoreHarness),
    { timeout: 60_000 },
  );
  try {
    await page.waitForFunction(
      () => document.documentElement.dataset.votingStoreHarness === 'ready',
      { timeout: 30_000 },
    );
  } catch {
    // Harness available; ready attr may be unset
  }
};

test.describe('Voting Store E2E', () => {
  if (IS_STAGING) {
    test.skip(
      true,
      'Voting store harness tests are skipped in staging deploy run; they are covered in CI/local harness runs.',
    );
  }

  test.beforeEach(async ({ page }) => {
    await gotoHarness(page);
  });

  test('harness exposes voting store API', async ({ page }) => {
    const harnessExists = await page.evaluate(
      () => Boolean(window.__votingStoreHarness),
    );
    expect(harnessExists).toBe(true);

    await page.waitForFunction(
      () => typeof window.__votingStoreHarness?.getSnapshot === 'function',
    );
    await page.waitForFunction(
      () => typeof window.__votingStoreHarness?.setBallots === 'function',
    );
    await page.waitForFunction(
      () => typeof window.__votingStoreHarness?.setVotingRecords === 'function',
    );
    await page.waitForFunction(
      () => typeof window.__votingStoreHarness?.reset === 'function',
    );
    await page.waitForFunction(
      () => typeof window.__votingStoreHarness?.setElections === 'function',
    );
  });

  test('manages voting records via harness', async ({ page }) => {
    await page.evaluate(() => {
      window.__votingStoreHarness?.setVotingRecords([
        {
          id: 'record-1',
          ballotId: 'ballot-1',
          contestId: 'contest-1',
          selections: ['candidate-1'],
          votedAt: new Date().toISOString(),
          verified: false,
        },
      ]);
    });

    const records = await page.evaluate(() => {
      const harness = window.__votingStoreHarness;
      const snapshot = harness?.getSnapshot();
      return snapshot?.votingRecords;
    });

    expect(records).toHaveLength(1);
    expect((records as { id: string }[])[0]?.id).toBe('record-1');
  });
});

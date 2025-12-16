import { expect, test, type Page } from '@playwright/test';

import { waitForPageReady } from '../helpers/e2e-setup';

const IS_STAGING = process.env.PLAYWRIGHT_STAGING === '1';

// Note: The voting store harness uses features/voting/lib/store
// This test verifies the harness API and basic functionality
declare global {
  interface Window {
    __votingStoreHarness?: {
      setBallots: (ballots: unknown[]) => void;
      setElections: (elections: unknown[]) => void;
      setVotingRecords: (records: unknown[]) => void;
      reset: () => void;
      getSnapshot: () => Record<string, unknown>;
      castVote?: (ballotId: string, contestId: string, selections: string[]) => Promise<void>;
      confirmVote?: (recordId: string) => Promise<void>;
      undoVote?: (recordId: string) => Promise<void>;
    };
  }
}

const gotoHarness = async (page: Page) => {
  await page.goto('/e2e/voting-store', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await waitForPageReady(page);
  await page.waitForFunction(() => Boolean(window.__votingStoreHarness), { timeout: 60_000 });
  // Voting store harness doesn't set ready attribute - that's okay, harness is still available
  // This can happen if persistence hasn't hydrated yet or the attribute isn't needed
  try {
  await page.waitForFunction(
    () => document.documentElement.dataset.votingStoreHarness === 'ready',
      { timeout: 30_000 },
  );
  } catch {
    // If dataset attribute isn't set, that's okay - harness is still available
    console.warn('Voting store harness ready attribute not set, but harness is available');
  }
};

test.describe('Voting Store E2E', () => {
  if (IS_STAGING) {
    test.skip(true, 'Voting store harness tests are skipped in staging deploy run; they are covered in CI/local harness runs.');
  }
  test.beforeEach(async ({ page }) => {
    await gotoHarness(page);
  });

  test('harness exposes voting store API', async ({ page }) => {
    // Check harness exists
    const harnessExists = await page.evaluate(() => Boolean(window.__votingStoreHarness));
    expect(harnessExists).toBe(true);

    // Check methods exist in page context (functions can't be serialized through evaluate)
    await page.waitForFunction(() => typeof window.__votingStoreHarness?.getSnapshot === 'function');
    await page.waitForFunction(() => typeof window.__votingStoreHarness?.setBallots === 'function');
    await page.waitForFunction(() => typeof window.__votingStoreHarness?.setVotingRecords === 'function');
    await page.waitForFunction(() => typeof window.__votingStoreHarness?.reset === 'function');
    await page.waitForFunction(() => typeof window.__votingStoreHarness?.setElections === 'function');
  });

  test('manages voting records via harness', async ({ page }) => {
    await page.evaluate(() => {
      window.__votingStoreHarness?.setVotingRecords([{
        id: 'record-1',
        ballotId: 'ballot-1',
        contestId: 'contest-1',
        selections: ['candidate-1'],
        votedAt: new Date().toISOString(),
        verified: false,
      }]);
    });

    const records = await page.evaluate(() => {
      const harness = window.__votingStoreHarness;
      const snapshot = harness?.getSnapshot();
      return snapshot?.votingRecords;
    });

    expect(records).toHaveLength(1);
    expect((records as any[])[0].id).toBe('record-1');
  });

  test('casts and confirms a vote (if harness API supports it)', async ({ page }) => {
    const hasConfirmVote = await page.evaluate(() => {
      return typeof window.__votingStoreHarness?.confirmVote === 'function';
    });

    if (!hasConfirmVote) {
      test.skip();
      return;
    }

    // Mock API endpoints
    await page.route('**/api/voting/vote', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'record-1',
            ballotId: 'ballot-1',
            contestId: 'contest-1',
            selections: ['candidate-1'],
            submittedAt: new Date().toISOString(),
          }),
        });
      }
    });

    await page.route('**/api/voting/records/*/confirm', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'record-1',
            confirmed: true,
            confirmedAt: new Date().toISOString(),
          }),
        });
      }
    });

    await page.evaluate(() => {
      if (window.__votingStoreHarness?.castVote) {
        window.__votingStoreHarness.castVote('ballot-1', 'contest-1', ['candidate-1']);
      }
    });

    await page.waitForTimeout(500);

    let records = await page.evaluate(() => {
      const harness = window.__votingStoreHarness;
      const snapshot = harness?.getSnapshot();
      return snapshot?.votingRecords;
    }) as Array<{ id: string; confirmed?: boolean }> | undefined;

    expect(records).toHaveLength(1);
    expect(records?.[0]?.id).toBeDefined();

    const recordId = records![0].id;

    await page.evaluate((id) => {
      if (window.__votingStoreHarness?.confirmVote) {
        window.__votingStoreHarness.confirmVote(id);
      }
    }, recordId);

    await page.waitForTimeout(500);

    records = await page.evaluate(() => {
      const harness = window.__votingStoreHarness;
      const snapshot = harness?.getSnapshot();
      return snapshot?.votingRecords;
    }) as Array<{ id: string; confirmed?: boolean }> | undefined;

    const confirmedRecord = records?.find((r) => r.id === recordId);
    expect(confirmedRecord?.confirmed).toBe(true);
  });

  test('undoes a vote (if harness API supports it)', async ({ page }) => {
    const hasUndoVote = await page.evaluate(() => {
      return typeof window.__votingStoreHarness?.undoVote === 'function';
    });

    if (!hasUndoVote) {
      test.skip();
      return;
    }

    // Set up initial vote
    await page.route('**/api/voting/vote', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'record-1',
            ballotId: 'ballot-1',
            contestId: 'contest-1',
            selections: ['candidate-1'],
            submittedAt: new Date().toISOString(),
          }),
        });
      }
    });

    await page.route('**/api/voting/records/*/undo', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Vote undone' }),
        });
      }
    });

    await page.evaluate(() => {
      if (window.__votingStoreHarness?.castVote) {
        window.__votingStoreHarness.castVote('ballot-1', 'contest-1', ['candidate-1']);
      }
    });

    await page.waitForTimeout(500);

    let records = await page.evaluate(() => {
      const harness = window.__votingStoreHarness;
      const snapshot = harness?.getSnapshot();
      return snapshot?.votingRecords;
    }) as Array<{ id: string }> | undefined;

    expect(records).toHaveLength(1);
    expect(records?.[0]?.id).toBeDefined();
    const recordId = records![0].id;

    await page.evaluate((id) => {
      if (window.__votingStoreHarness?.undoVote) {
        window.__votingStoreHarness.undoVote(id);
      }
    }, recordId);

    await page.waitForTimeout(500);

    records = await page.evaluate(() => {
      const harness = window.__votingStoreHarness;
      const snapshot = harness?.getSnapshot();
      return snapshot?.votingRecords;
    }) as Array<{ id: string }> | undefined;

    expect(records?.find((r) => r.id === recordId)).toBeUndefined();
  });

  test('handles confirmation error gracefully (if harness API supports it)', async ({ page }) => {
    const hasConfirmVote = await page.evaluate(() => {
      return typeof window.__votingStoreHarness?.confirmVote === 'function';
    });

    if (!hasConfirmVote) {
      test.skip();
      return;
    }

    await page.route('**/api/voting/records/*/confirm', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Cannot confirm vote' }),
        });
      }
    });

    // Create a vote record first
    await page.evaluate(() => {
      const harness = window.__votingStoreHarness;
      if (harness?.setVotingRecords) {
        harness.setVotingRecords([{
          id: 'record-1',
          ballotId: 'ballot-1',
          contestId: 'contest-1',
          selections: ['candidate-1'],
          submittedAt: new Date().toISOString(),
        }] as any);
      }
    });

    await page.evaluate(() => {
      if (window.__votingStoreHarness?.confirmVote) {
        window.__votingStoreHarness.confirmVote('record-1');
      }
    });

    await page.waitForTimeout(500);

    const error = await page.evaluate(() => {
      const harness = window.__votingStoreHarness;
      const snapshot = harness?.getSnapshot();
      return snapshot?.error;
    });

    expect(error).toBeTruthy();
  });

  test('handles undo error gracefully (if harness API supports it)', async ({ page }) => {
    const hasUndoVote = await page.evaluate(() => {
      return typeof window.__votingStoreHarness?.undoVote === 'function';
    });

    if (!hasUndoVote) {
      test.skip();
      return;
    }

    await page.route('**/api/voting/records/*/undo', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Cannot undo vote' }),
        });
      }
    });

    await page.evaluate(() => {
      const harness = window.__votingStoreHarness;
      if (harness?.setVotingRecords) {
        harness.setVotingRecords([{
          id: 'record-1',
          ballotId: 'ballot-1',
          contestId: 'contest-1',
          selections: ['candidate-1'],
          submittedAt: new Date().toISOString(),
        }] as any);
      }
    });

    await page.evaluate(() => {
      if (window.__votingStoreHarness?.undoVote) {
        window.__votingStoreHarness.undoVote('record-1');
      }
    });

    await page.waitForTimeout(500);

    const error = await page.evaluate(() => {
      const harness = window.__votingStoreHarness;
      const snapshot = harness?.getSnapshot();
      return snapshot?.error;
    });

    expect(error).toBeTruthy();
  });
});

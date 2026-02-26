/**
 * Unit tests for checkpoint save/load/delete.
 */
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';

const TEST_OP = 'test-checkpoint-op';

describe('checkpoint', () => {
  let dir: string;
  let origCheckpointDir: string | undefined;

  before(() => {
    dir = mkdtempSync(join(tmpdir(), 'checkpoint-test-'));
    origCheckpointDir = process.env.CHECKPOINT_DIR;
    process.env.CHECKPOINT_DIR = dir;
  });

  after(() => {
    process.env.CHECKPOINT_DIR = origCheckpointDir;
    rmSync(dir, { recursive: true, force: true });
  });

  test('save and load checkpoint', async () => {
    const { saveCheckpoint, loadCheckpoint } = await import('../utils/checkpoint.js');
    await saveCheckpoint(TEST_OP, {
      total: 100,
      processed: 50,
      failed: 2,
      lastProcessedId: 12345,
    });
    const loaded = await loadCheckpoint(TEST_OP);
    assert.ok(loaded);
    assert.strictEqual(loaded.total, 100);
    assert.strictEqual(loaded.processed, 50);
    assert.strictEqual(loaded.failed, 2);
    assert.strictEqual(loaded.lastProcessedId, 12345);
  });

  test('load returns null for missing checkpoint', async () => {
    const { loadCheckpoint } = await import('../utils/checkpoint.js');
    const loaded = await loadCheckpoint('nonexistent-checkpoint-xyz');
    assert.strictEqual(loaded, null);
  });

  test('delete checkpoint removes file', async () => {
    const { saveCheckpoint, loadCheckpoint, deleteCheckpoint } = await import('../utils/checkpoint.js');
    await saveCheckpoint(TEST_OP, { total: 1, processed: 1, failed: 0 });
    assert.ok(await loadCheckpoint(TEST_OP));
    await deleteCheckpoint(TEST_OP);
    assert.strictEqual(await loadCheckpoint(TEST_OP), null);
  });
});

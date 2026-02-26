/**
 * Unit tests for load-env.
 */
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test, describe } from 'node:test';
import assert from 'node:assert';

// Load env from a custom path by temporarily changing cwd
async function runInDir(dir: string, fn: () => void): Promise<void> {
  const orig = process.cwd();
  try {
    process.chdir(dir);
    fn();
  } finally {
    process.chdir(orig);
  }
}

describe('loadEnv', () => {
  test('loads .env from cwd', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'load-env-test-'));
    try {
      writeFileSync(join(dir, '.env'), 'LOAD_ENV_TEST=from-dotenv\n');
      const { loadEnv } = await import('../utils/load-env.js');
      await runInDir(dir, () => {
        delete process.env.LOAD_ENV_TEST;
        loadEnv();
        assert.strictEqual(process.env.LOAD_ENV_TEST, 'from-dotenv');
      });
    } finally {
      rmSync(dir, { recursive: true });
    }
  });

  test('.env.local overrides .env', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'load-env-test-'));
    try {
      writeFileSync(join(dir, '.env'), 'LOAD_ENV_OVERRIDE=original\n');
      writeFileSync(join(dir, '.env.local'), 'LOAD_ENV_OVERRIDE=overridden\n');
      const { loadEnv } = await import('../utils/load-env.js');
      await runInDir(dir, () => {
        delete process.env.LOAD_ENV_OVERRIDE;
        loadEnv();
        assert.strictEqual(process.env.LOAD_ENV_OVERRIDE, 'overridden');
      });
    } finally {
      rmSync(dir, { recursive: true });
    }
  });
});

/**
 * Staging validation harness (Phase 2).
 * Loads staging/merge fixtures and validates shape without live Supabase.
 * Run: npm run test (from services/civics-backend).
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, describe } from 'node:test';
import assert from 'node:assert';
import yaml from 'js-yaml';

// Resolve fixtures from source tree (tests run from build/__tests__/; fixtures are not copied to build)
const __dirname = fileURLToPath(new URL('.', import.meta.url));
const FIXTURES_DIR =
  __dirname.includes('/build/')
    ? join(__dirname, '..', '..', 'NEW_civics_ingest', '__tests__', 'fixtures', 'staging')
    : join(__dirname, 'fixtures', 'staging');

interface RawPerson {
  id: string;
  name: string;
  given_name?: string;
  family_name?: string;
  roles?: Array<{ jurisdiction?: string; type?: string }>;
  identifiers?: Array<{ scheme?: string; identifier?: string }>;
  contact_details?: Array<{ type?: string; value?: string }>;
  sources?: Array<{ url?: string }>;
  [key: string]: unknown;
}

describe('staging validation (fixtures, no Supabase)', () => {
  test('one-person.yaml parses and has required RawPerson fields', async () => {
    const yamlPath = join(FIXTURES_DIR, 'one-person.yaml');
    const content = await readFile(yamlPath, 'utf-8');
    const raw = yaml.load(content) as RawPerson;
    assert.ok(raw, 'YAML should parse to an object');
    assert.strictEqual(typeof raw.id, 'string', 'id required');
    assert.strictEqual(typeof raw.name, 'string', 'name required');
    assert.ok(raw.id.length > 0, 'id non-empty');
    assert.ok(raw.name.length > 0, 'name non-empty');
    assert.ok(Array.isArray(raw.roles), 'roles array');
    assert.ok(raw.roles!.length >= 1, 'at least one role');
    assert.strictEqual(raw.roles![0].jurisdiction, 'state:ca', 'jurisdiction preserved');
  });

  test('fixture produces StagedPerson-like structure when transformed', async () => {
    const yamlPath = join(FIXTURES_DIR, 'one-person.yaml');
    const content = await readFile(yamlPath, 'utf-8');
    const raw = yaml.load(content) as RawPerson;
    const openstatesId = raw.id;
    const staged = {
      openstatesId,
      person: {
        openstates_id: openstatesId,
        name: raw.name,
        given_name: raw.given_name ?? null,
        family_name: raw.family_name ?? null,
      },
      roles: Array.isArray(raw.roles)
        ? raw.roles.filter((r) => r?.jurisdiction).map((r) => ({ jurisdiction: r.jurisdiction ?? '' }))
        : [],
    };
    assert.strictEqual(staged.openstatesId, 'ocd-person/abc123');
    assert.strictEqual(staged.person.name, 'Jane Doe');
    assert.ok(staged.roles.length >= 1);
  });
});

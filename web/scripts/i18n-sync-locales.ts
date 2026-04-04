#!/usr/bin/env tsx
/**
 * Syncs missing keys from source locale (en) to target locale (es).
 * Copies English values as placeholders — replace with proper translations.
 *
 * Usage: npx tsx scripts/i18n-sync-locales.ts
 * Or: npm run i18n:sync
 */

import * as fs from 'fs';
import * as path from 'path';

const MESSAGES_DIR = path.join(process.cwd(), 'messages');
const SOURCE_LOCALE = 'en';
const TARGET_LOCALE = 'es';

function loadLocale(locale: string): Record<string, unknown> {
  const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
  if (!fs.existsSync(filePath)) {
    console.error(`Locale file not found: ${filePath}`);
    process.exit(1);
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch (e) {
    console.error(`Invalid JSON in ${filePath}:`, e);
    process.exit(1);
  }
}

function setAtPath(
  obj: Record<string, unknown>,
  dotKey: string,
  value: unknown
): void {
  const parts = dotKey.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    const next = current[part];
    if (next === null || typeof next !== 'object' || Array.isArray(next)) {
      current[part] = {};
      current = current[part] as Record<string, unknown>;
    } else {
      current = next as Record<string, unknown>;
    }
  }
  current[parts[parts.length - 1]] = value;
}

function getAtPath(obj: Record<string, unknown>, dotKey: string): unknown {
  const parts = dotKey.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || typeof current !== 'object' || Array.isArray(current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function flattenKeys(
  obj: Record<string, unknown>,
  prefix = ''
): Array<{ key: string; value: unknown }> {
  const result: Array<{ key: string; value: unknown }> = [];
  for (const [k, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      result.push(...flattenKeys(value as Record<string, unknown>, fullKey));
    } else {
      result.push({ key: fullKey, value });
    }
  }
  return result;
}

function main(): void {
  const source = loadLocale(SOURCE_LOCALE);
  const target = loadLocale(TARGET_LOCALE);
  const sourceEntries = flattenKeys(source);

  let added = 0;
  for (const { key, value } of sourceEntries) {
    if (getAtPath(target, key) === undefined) {
      setAtPath(target, key, value);
      added++;
    }
  }

  if (added === 0) {
    console.log(`✅ ${TARGET_LOCALE}.json already has all keys. Nothing to sync.`);
    return;
  }

  const filePath = path.join(MESSAGES_DIR, `${TARGET_LOCALE}.json`);
  fs.writeFileSync(
    filePath,
    JSON.stringify(target, null, 2) + '\n',
    'utf-8'
  );
  console.log(`✅ Added ${added} missing key(s) to ${TARGET_LOCALE}.json (English placeholders).`);
  console.log(`   Run i18n:validate to confirm. Replace placeholders with proper translations.`);
}

main();

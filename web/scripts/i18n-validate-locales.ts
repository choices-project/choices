#!/usr/bin/env tsx
/**
 * Validates that all keys from the source locale (en) exist in other locale files.
 * Fails with exit code 1 if any key is missing, so CI can block PRs with incomplete translations.
 *
 * Usage: npx tsx scripts/i18n-validate-locales.ts
 * Or: npm run i18n:validate
 */

import * as fs from 'fs';
import * as path from 'path';

const MESSAGES_DIR = path.join(process.cwd(), 'messages');
const SOURCE_LOCALE = 'en';
const LOCALES_TO_VALIDATE = ['es'];

function flattenKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...flattenKeys(value as Record<string, unknown>, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

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

function getKeysAtPath(obj: Record<string, unknown>, dotKey: string): unknown {
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

function main(): void {
  const source = loadLocale(SOURCE_LOCALE);
  const sourceKeys = flattenKeys(source);

  let hasErrors = false;

  for (const locale of LOCALES_TO_VALIDATE) {
    const target = loadLocale(locale);
    const missing: string[] = [];
    for (const key of sourceKeys) {
      const value = getKeysAtPath(target, key);
      if (value === undefined) {
        missing.push(key);
      }
    }
    if (missing.length > 0) {
      hasErrors = true;
      console.error(`\n❌ Locale "${locale}" is missing ${missing.length} key(s) from ${SOURCE_LOCALE}.json:`);
      for (const k of missing.slice(0, 20)) {
        console.error(`   - ${k}`);
      }
      if (missing.length > 20) {
        console.error(`   ... and ${missing.length - 20} more`);
      }
    } else {
      console.log(`✅ ${locale}.json has all ${sourceKeys.length} keys from ${SOURCE_LOCALE}.json`);
    }
  }

  if (hasErrors) {
    console.error('\nRun i18n:extract, add missing keys to locale files, then re-run i18n:validate.');
    process.exit(1);
  }
}

main();

#!/usr/bin/env tsx
/**
 * Secret Rotation Checker
 *
 * Checks secret rotation dates and alerts if rotation is due or overdue.
 * Run this script weekly via cron or CI to monitor secret age.
 *
 * Usage:
 *   tsx scripts/operations/check-secret-rotation.ts
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROTATION_SCHEDULE = {
  ADMIN_MONITORING_KEY: 90, // days
  CRON_SECRET: 90,
  RESEND_API_KEY: 180,
  RESEND_WEBHOOK_SECRET: 180,
  UPSTASH_REDIS_REST_TOKEN: 180,
  GOOGLE_CIVIC_API_KEY: 365,
  SUPABASE_SERVICE_ROLE_KEY: 90,
} as const;

const SECRETS_FILE = join(process.cwd(), '.secrets-rotation.json');

interface SecretRotationRecord {
  secretName: string;
  lastRotation: string; // ISO date string
  nextRotation: string; // ISO date string
  maxAgeDays: number;
}

function loadRotationRecords(): Record<string, SecretRotationRecord> {
  if (!existsSync(SECRETS_FILE)) {
    return {};
  }

  try {
    const content = readFileSync(SECRETS_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Failed to load rotation records:', error);
    return {};
  }
}

function saveRotationRecords(records: Record<string, SecretRotationRecord>): void {
  try {
    writeFileSync(SECRETS_FILE, JSON.stringify(records, null, 2) + '\n', 'utf-8');
  } catch (error) {
    console.error('Failed to save rotation records:', error);
  }
}

function calculateNextRotation(lastRotation: Date, maxAgeDays: number): Date {
  const nextRotation = new Date(lastRotation);
  nextRotation.setDate(nextRotation.getDate() + maxAgeDays);
  return nextRotation;
}

function checkSecretAge(_secretName: string, record: SecretRotationRecord): {
  ageDays: number;
  status: 'ok' | 'due_soon' | 'overdue';
  daysUntilDue: number;
} {
  const lastRotation = new Date(record.lastRotation);
  const now = new Date();
  const ageDays = Math.floor((now.getTime() - lastRotation.getTime()) / (1000 * 60 * 60 * 24));
  const daysUntilDue = record.maxAgeDays - ageDays;

  let status: 'ok' | 'due_soon' | 'overdue';
  if (ageDays >= record.maxAgeDays) {
    status = 'overdue';
  } else if (daysUntilDue <= 7) {
    status = 'due_soon';
  } else {
    status = 'ok';
  }

  return { ageDays, status, daysUntilDue };
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function main(): void {
  console.log('🔐 Secret Rotation Checker\n');

  const records = loadRotationRecords();
  const alerts: Array<{ secret: string; status: string; message: string }> = [];
  const updates: Record<string, SecretRotationRecord> = { ...records };

  // Check each secret in rotation schedule
  for (const [secretName, maxAgeDays] of Object.entries(ROTATION_SCHEDULE)) {
    let record = records[secretName];

    // Initialize record if it doesn't exist
    if (!record) {
      const now = new Date();
      const nextRotation = calculateNextRotation(now, maxAgeDays);
      record = {
        secretName,
        lastRotation: now.toISOString(),
        nextRotation: nextRotation.toISOString(),
        maxAgeDays,
      };
      updates[secretName] = record;
      console.log(`📝 Initialized tracking for ${secretName}`);
      continue;
    }

    // Ensure secretName is set (for backwards compatibility)
    if (!record.secretName) {
      record.secretName = secretName;
      updates[secretName] = record;
    }

    // Check age
    const { ageDays, status, daysUntilDue } = checkSecretAge(secretName, record);

    // Update next rotation date if needed
    const lastRotationDate = new Date(record.lastRotation);
    const calculatedNext = calculateNextRotation(lastRotationDate, maxAgeDays);
    if (record.nextRotation !== calculatedNext.toISOString()) {
      record.nextRotation = calculatedNext.toISOString();
      updates[secretName] = record;
    }

    // Generate status message
    const statusEmoji = status === 'overdue' ? '🔴' : status === 'due_soon' ? '🟡' : '🟢';
    const statusText = status === 'overdue' ? 'OVERDUE' : status === 'due_soon' ? 'DUE SOON' : 'OK';

    console.log(`${statusEmoji} ${secretName}:`);
    console.log(`   Age: ${ageDays} days (max: ${maxAgeDays} days)`);
    console.log(`   Last rotation: ${formatDate(new Date(record.lastRotation))}`);
    console.log(`   Next rotation: ${formatDate(new Date(record.nextRotation))}`);
    console.log(`   Status: ${statusText}`);

    if (status === 'overdue') {
      alerts.push({
        secret: secretName,
        status: 'overdue',
        message: `${secretName} is ${ageDays} days old (${ageDays - maxAgeDays} days overdue). Rotation required immediately.`,
      });
      console.log(`   ⚠️  ACTION REQUIRED: Rotation is overdue!`);
    } else if (status === 'due_soon') {
      alerts.push({
        secret: secretName,
        status: 'due_soon',
        message: `${secretName} will be due for rotation in ${daysUntilDue} days.`,
      });
      console.log(`   ⚠️  Rotation due in ${daysUntilDue} days`);
    }

    console.log('');
  }

  // Save updates
  saveRotationRecords(updates);

  // Summary
  console.log('📊 Summary:');
  const overdueCount = alerts.filter((a) => a.status === 'overdue').length;
  const dueSoonCount = alerts.filter((a) => a.status === 'due_soon').length;

  if (overdueCount > 0) {
    console.log(`🔴 ${overdueCount} secret(s) OVERDUE for rotation`);
  }
  if (dueSoonCount > 0) {
    console.log(`🟡 ${dueSoonCount} secret(s) due for rotation soon`);
  }
  if (overdueCount === 0 && dueSoonCount === 0) {
    console.log('🟢 All secrets are within rotation schedule');
  }

  // Exit with error code if any secrets are overdue
  if (overdueCount > 0) {
    console.error('\n❌ Rotation check failed: Some secrets are overdue');
    process.exit(1);
  }

  // Exit with warning code if any secrets are due soon
  if (dueSoonCount > 0) {
    console.warn('\n⚠️  Rotation check warning: Some secrets are due soon');
    process.exit(0);
  }

  console.log('\n✅ All secrets are within rotation schedule');
  process.exit(0);
}

// Run if called directly
if (require.main === module) {
  main();
}

export { main as checkSecretRotation, ROTATION_SCHEDULE };

